/*
  spectrogramSynthesizerWorker.ts  —  Coagula-style spectrogram steganography
  ============================================================================
  DSP improvements over previous version:

  1. PHASE RANDOMIZATION  — each frequency gets a random initial phase in [0, 2π].
     Without this, all sines start at 0, creating a huge constructive-interference
     spike at t=0 that causes severe clipping and wastes headroom. Random phases
     spread energy uniformly over time → no spikes → more headroom for actual signal.

  2. LINEAR FREQUENCY SCALE  — y=0 (top) maps to maxFreqHz, y=height-1 maps to
     minFreqHz. Frequencies quantized to the nearest FFT bin boundary so that each
     sine occupies exactly ONE bin with ZERO spectral leakage.

  3. dB AMPLITUDE CURVE  — pixel brightness is mapped through an exponential curve:
       amp = intensity * 10^((brightness_normalized - 1) * dynamic_range_dB / 20)
     This compresses soft pixels and boosts loud ones, exactly like Coagula.
     Pure black (0) → 0 (absolute silence). Pure white (255) → intensity (maximum).

  4. mixRatio DUCKING  — the base audio is attenuated by (1 - mixRatio), so when
     mixRatio is high the base "opens space" for the steg signal to be audible.
     steg gain  = intensity * mixRatio
     base gain  = 1 - mixRatio
     This avoids both signals fighting for the same headroom.
*/

type SynthParams = {
  sampleRate: number;
  durationSec: number;
  minFreqHz: number;
  maxFreqHz: number;
  intensity: number;       // 0–1
  mixRatio: number;        // 0 = base only, 1 = steg only
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

// ---------------------------------------------------------------------------
// Pink noise — Voss-McCartney 16-stage
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// dB amplitude curve  — maps brightness [0,255] → amplitude [0, intensity]
// Using a 40 dB dynamic range: black=-40 dB (≈0), white=0 dB (=intensity)
// ---------------------------------------------------------------------------
const DB_RANGE = 40; // dB below full scale for darkest non-zero pixel

function brightnessToAmp(brightness: number, intensity: number): number {
  if (brightness <= 0) return 0;
  const norm = brightness / 255; // 0..1
  // Exponential mapping: amp = 10^((norm - 1) * DB_RANGE / 20)
  const amp = Math.pow(10, (norm - 1) * DB_RANGE / 20);
  return amp * intensity;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
self.addEventListener('message', (ev: MessageEvent) => {
  const data = ev.data as MsgIn;
  if (!data || data.cmd !== 'synthesize') return;

  const { width, height, imageData: imageDataBuffer, params } = data;
  const {
    sampleRate,
    durationSec,
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
    const totalSamples = Math.max(1, Math.floor(sampleRate * durationSec));
    const samplesPerColumn = Math.max(1, Math.floor(totalSamples / width));
    const actualTotal = samplesPerColumn * width;
    const twoPi = 2 * Math.PI;

    // --- Frequency quantization to nearest FFT bin ---
    // Bin width = sampleRate / samplesPerColumn
    // Snapping to bin boundaries eliminates spectral leakage.
    const binWidth = sampleRate / samplesPerColumn;

    // Pre-compute quantized freq and phase increment per row
    const rowFreqs = new Float32Array(height);
    const rowPhaseIncs = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      const freqNorm = 1 - y / Math.max(1, height - 1); // top=high, bottom=low
      const rawFreq = minFreqHz + freqNorm * (maxFreqHz - minFreqHz);
      const quantized = Math.round(rawFreq / binWidth) * binWidth;
      rowFreqs[y] = quantized;
      rowPhaseIncs[y] = twoPi * quantized / sampleRate;
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
          // prevents constructive interference spike at t=0 → no clipping.
          let phase = Math.random() * twoPi;

          // Rectangular window: zero-leakage sines + sharp column edges
          for (let s = 0; s < samplesPerColumn; s++) {
            tmp[s] += Math.sin(phase) * amp;
            phase += phaseInc;
            if (phase > twoPi) phase -= twoPi; // keep phase bounded
          }
        }

        const offset = x * samplesPerColumn;
        for (let s = 0; s < samplesPerColumn; s++) {
          stegSignal[offset + s] = tmp[s];
        }
      }

      const percent = Math.round((endX / width) * 75);
      (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent });
    }

    // --- Base audio / noise bed ---
    let base: Float32Array;
    if (baseAudioBuffer && baseAudioLength > 0) {
      const imported = new Float32Array(baseAudioBuffer);
      if (imported.length >= actualTotal) {
        base = imported.subarray(0, actualTotal);
      } else {
        base = new Float32Array(actualTotal);
        for (let i = 0; i < actualTotal; i++) {
          base[i] = imported[i % imported.length];
        }
      }
    } else if (usePinkNoiseBed) {
      base = generatePinkNoise(actualTotal, 0.25);
    } else {
      base = new Float32Array(actualTotal);
    }

    (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent: 80 });

    // --- Mix with ducking ---
    // steg gain  = mixRatio          (more mix = more steg signal)
    // base gain  = 1 - mixRatio      (high mixRatio ducks base → opens space)
    // intensity acts as master gain on the steg layer.
    const stegGain = Math.max(0, Math.min(1, mixRatio));
    const baseGain = 1 - stegGain;

    const output = new Float32Array(actualTotal);
    for (let i = 0; i < actualTotal; i++) {
      output[i] = stegSignal[i] * stegGain + base[i] * baseGain;
    }

    // --- Normalize: prevent clipping, target peak at -1 dBFS (≈0.891) ---
    let peak = 0;
    for (let i = 0; i < actualTotal; i++) {
      const abs = output[i] < 0 ? -output[i] : output[i];
      if (abs > peak) peak = abs;
    }
    if (peak > 0.001) {
      const scale = 0.891 / peak;
      for (let i = 0; i < actualTotal; i++) {
        output[i] *= scale;
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
