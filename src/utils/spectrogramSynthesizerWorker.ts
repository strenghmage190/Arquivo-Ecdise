// spectrogramSynthesizerWorker.ts

type SynthParams = {
  sampleRate: number;
  durationSec: number;
  offsetSec: number;
  minFreqHz: number;
  maxFreqHz: number;
  intensity: number;
  mixRatio: number;
  usePinkNoiseBed: boolean;
  baseAudioBuffer: ArrayBuffer | null;
  baseAudioLength: number;
};

type MsgIn = {
  cmd: 'synthesize';
  width: number;
  height: number;
  imageData: ArrayBuffer;
  params: SynthParams;
};

type MsgOut =
  | { cmd: 'progress'; percent: number }
  | { cmd: 'result'; samples: ArrayBuffer; sampleRate: number }
  | { cmd: 'error'; error: string };

function generatePinkNoise(length: number, amplitude = 0.25): Float32Array {
  const buf = new Float32Array(length);
  const stages = 16;
  const runners = new Float32Array(stages);
  let key = 0;
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const lastKey = key;
    key = (key + 1) & 0xffff;
    const diff = lastKey ^ key;
    for (let j = 0; j < stages; j++) {
      if (diff & (1 << j)) {
        const prev = runners[j];
        runners[j] = Math.random() * 2 - 1;
        sum += runners[j] - prev;
      }
    }
    buf[i] = (sum / stages) * amplitude;
  }
  return buf;
}

const DB_RANGE = 40;
function brightnessToAmp(brightness: number, intensity: number): number {
  if (brightness <= 0) return 0;
  const norm = brightness / 255;
  const amp = Math.pow(10, (norm - 1) * DB_RANGE / 20);
  return amp * intensity;
}

self.addEventListener('message', (ev: MessageEvent) => {
  const data = ev.data as MsgIn;
  if (!data || data.cmd !== 'synthesize') return;

  const { width, height, imageData: imageDataBuffer, params } = data;
  
  // CORREÇÃO: Removido o 'const {' duplicado que estava gerando erro de sintaxe
  const {
    sampleRate,
    durationSec,
    offsetSec,
    minFreqHz,
    maxFreqHz,
    intensity,
    mixRatio,
    usePinkNoiseBed,
    baseAudioBuffer,
    baseAudioLength,
  } = params;

  try {
    const pixels = new Uint8ClampedArray(imageDataBuffer);
    const payloadSamples = Math.max(1, Math.floor(sampleRate * durationSec));
    const offsetSamples = Math.max(0, Math.floor(sampleRate * offsetSec));
    const samplesPerColumn = Math.max(1, Math.floor(payloadSamples / width));
    const actualPayloadLen = samplesPerColumn * width;

    const baseLength = baseAudioBuffer ? baseAudioLength : 0;
    const actualTotal = Math.max(baseLength, offsetSamples + actualPayloadLen);
    const twoPi = 2 * Math.PI;

    // --- Hann Window ---
    // Rectangular windows cause broadband clicks at column boundaries.
    // Hann window softens the edges, preventing vertical smearing in the spectrogram.
    const win = new Float32Array(samplesPerColumn);
    for (let i = 0; i < samplesPerColumn; i++) {
      win[i] = 0.5 * (1 - Math.cos((twoPi * i) / (samplesPerColumn - 1)));
    }

    // Pre-compute exact freq and phase increment per row
    const rowFreqs = new Float32Array(height);
    const rowPhaseIncs = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      const freqNorm = 1 - y / Math.max(1, height - 1); // top=high, bottom=low
      const rawFreq = minFreqHz + freqNorm * (maxFreqHz - minFreqHz);
      rowFreqs[y] = rawFreq;
      rowPhaseIncs[y] = twoPi * rawFreq / sampleRate;
    }

    // --- Steg signal synthesis ---
    const stegSignal = new Float32Array(actualTotal);
    const tmp = new Float32Array(samplesPerColumn);
    const BRIGHTNESS_THRESHOLD = 8; // ignore near-black noise pixels

    const chunkSize = 16;
    for (let cx = 0; cx < width; cx += chunkSize) {
      const endX = Math.min(width, cx + chunkSize);

      for (let x = cx; x < endX; x++) {
        tmp.fill(0);

        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          if (pixels[idx + 3] < 10) continue; // skip transparent
          const brightness = (pixels[idx] + pixels[idx + 1] + pixels[idx + 2]) / 3;
          if (brightness <= BRIGHTNESS_THRESHOLD) continue;

          const amp = brightnessToAmp(brightness, intensity);
          const phaseInc = rowPhaseIncs[y];

          // PHASE RANDOMIZATION — critical: random start phase per freq per column
          let phase = Math.random() * twoPi;

          for (let s = 0; s < samplesPerColumn; s++) {
            tmp[s] += Math.sin(phase) * amp;
            phase += phaseInc;
            if (phase > twoPi) phase -= twoPi; // keep phase bounded
          }
        }

        const offset = x * samplesPerColumn;
        for (let s = 0; s < samplesPerColumn; s++) {
          stegSignal[offsetSamples + offset + s] = tmp[s] * win[s]; // Apply Hann window
        }
      }

      const percent = Math.round((endX / width) * 75);
      (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent });
    }

    // CORREÇÃO: Normalizar o Sinal do Espectrograma ANTES de misturar!
    // Isso garante que o desenho tenha impacto visual sem esmagar o resto do áudio
    let stegPeak = 0;
    for (let i = 0; i < actualPayloadLen; i++) {
      const abs = Math.abs(stegSignal[i]);
      if (abs > stegPeak) stegPeak = abs;
    }

    if (stegPeak > 0) {
      const scale = 1.0 / stegPeak; // Traz o pico para 1.0 (Volume Máximo)
      for (let i = 0; i < actualPayloadLen; i++) {
        stegSignal[i] *= scale;
      }
    }

    // --- Base audio / noise bed ---
    let base: Float32Array;
    if (baseAudioBuffer && baseAudioLength > 0) {
      const imported = new Float32Array(baseAudioBuffer);
      if (imported.length >= actualTotal) {
        base = imported.subarray(0, actualTotal);
      } else {
        base = new Float32Array(actualTotal);
        base.set(imported, 0);
      }
    } else if (usePinkNoiseBed) {
      base = generatePinkNoise(actualTotal, 0.25);
    } else {
      base = new Float32Array(actualTotal);
    }

    (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent: 80 });

    // --- Mix ---
    const stegGain = Math.max(0, Math.min(1, mixRatio));
    const baseGain = 1 - stegGain;
    const output = new Float32Array(base);

    // Sobrescreve apenas a região injetada com a mistura
    for (let i = 0; i < actualPayloadLen; i++) {
      const outIdx = offsetSamples + i;
      if (outIdx < actualTotal) {
        // Como o stegSignal e a base já têm limite de 1.0, e (stegGain + baseGain = 1)
        // Isso aqui NUNCA vai passar de 1.0 (Não precisa mais daquela normalização destrutiva do final)
        output[outIdx] = stegSignal[i] * stegGain + base[outIdx] * baseGain;
      }
    }

    (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent: 100 });

    const transferable = output.buffer;
    (self.postMessage as (msg: MsgOut, transfer: Transferable[]) => void)(
      { cmd: 'result', samples: transferable, sampleRate },
      [transferable]
    );
  } catch (err) {
    (self.postMessage as (msg: MsgOut) => void)({
      cmd: 'error',
      error: err instanceof Error ? err.message : String(err),
    });
  }
});
