/*
  spectrogramSynthesizerWorker.ts
  High-fidelity spectrogram steganography synthesis Web Worker.
  Accepts: ImageData (RGBA) + SynthParams → Float32 stereo PCM buffer.

  Algorithm:
  1. Parse ImageData RGBA → per-pixel brightness
  2. For each column x, for each row y:
     - Map y → frequency bin within [minFreqHz, maxFreqHz]
     - Map brightness → sine amplitude * intensity
     - Add sine wave to column buffer, apply Hann window
  3. Generate pink noise bed if usePinkNoiseBed === true
  4. Mix steg signal + base audio at mixRatio
  5. Normalize to prevent clipping
  6. Report progress every 16 columns
  7. Return { cmd: 'result', samples: ArrayBuffer, sampleRate }
*/

type SynthParams = {
  sampleRate: number;
  durationSec: number;
  minFreqHz: number;
  maxFreqHz: number;
  intensity: number;       // 0–1
  mixRatio: number;        // 0 = base only, 1 = steg only
  usePinkNoiseBed: boolean;
  baseAudioBuffer: ArrayBuffer | null; // Float32 PCM of base audio channel 0
  baseAudioLength: number;             // number of float32 samples in base
};

type MsgIn = {
  cmd: 'synthesize';
  width: number;
  height: number;
  imageData: ArrayBuffer; // RGBA Uint8ClampedArray bytes
  params: SynthParams;
};

type MsgOut =
  | { cmd: 'progress'; percent: number }
  | { cmd: 'result'; samples: ArrayBuffer; sampleRate: number }
  | { cmd: 'error'; error: string };

// ---------------------------------------------------------------------------
// Hann window factory
// ---------------------------------------------------------------------------
function makeHannWindow(n: number): Float32Array {
  const w = new Float32Array(n);
  const twoPi = 2 * Math.PI;
  for (let i = 0; i < n; i++) {
    w[i] = 0.5 * (1 - Math.cos((twoPi * i) / (n - 1)));
  }
  return w;
}

// ---------------------------------------------------------------------------
// Pink noise generator — Voss-McCartney algorithm (16-stage)
// ---------------------------------------------------------------------------
function generatePinkNoise(length: number, amplitude = 0.3): Float32Array {
  const buf = new Float32Array(length);
  const stages = 16;
  const runners = new Float32Array(stages);
  let maxKey = 0xffff;
  let key = 0;
  let sum = 0;

  for (let i = 0; i < length; i++) {
    const lastKey = key;
    key = (key + 1) & maxKey;
    const diff = lastKey ^ key;
    for (let j = 0; j < stages; j++) {
      if (diff & (1 << j)) {
        const prev = runners[j];
        runners[j] = (Math.random() * 2 - 1);
        sum += runners[j] - prev;
      }
    }
    buf[i] = (sum / stages) * amplitude;
  }
  return buf;
}

// ---------------------------------------------------------------------------
// Main message handler
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

    const stegSignal = new Float32Array(actualTotal);
    const twoPi = 2 * Math.PI;
    const win = makeHannWindow(samplesPerColumn);
    const tmp = new Float32Array(samplesPerColumn);
    const BRIGHTNESS_THRESHOLD = 20; // ignore near-black pixels

    // Synthesize steg signal
    const chunkSize = 16;
    for (let cx = 0; cx < width; cx += chunkSize) {
      const endX = Math.min(width, cx + chunkSize);

      for (let x = cx; x < endX; x++) {
        tmp.fill(0);

        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];
          if (a < 10) continue;
          const brightness = (r + g + b) / 3;
          if (brightness <= BRIGHTNESS_THRESHOLD) continue;

          const amp = (brightness / 255) * intensity * 0.9;
          const freqNorm = 1 - (y / Math.max(1, height - 1));
          const freq = minFreqHz + freqNorm * (maxFreqHz - minFreqHz);
          const phaseInc = (twoPi * freq) / sampleRate;

          let phase = 0;
          for (let s = 0; s < samplesPerColumn; s++) {
            tmp[s] += Math.sin(phase) * amp;
            phase += phaseInc;
          }
        }

        // Apply Hann window and write to steg buffer
        const offset = x * samplesPerColumn;
        for (let s = 0; s < samplesPerColumn; s++) {
          stegSignal[offset + s] = tmp[s] * win[s];
        }
      }

      // Report progress
      const percent = Math.round((endX / width) * 80); // 0–80% for synthesis
      (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent });
    }

    // Build base audio: either imported audio or pink noise fallback
    let base: Float32Array;
    if (baseAudioBuffer && baseAudioLength > 0) {
      const imported = new Float32Array(baseAudioBuffer);
      if (imported.length >= actualTotal) {
        base = imported.subarray(0, actualTotal);
      } else {
        // Loop imported audio to fill duration
        base = new Float32Array(actualTotal);
        for (let i = 0; i < actualTotal; i++) {
          base[i] = imported[i % imported.length];
        }
      }
    } else if (usePinkNoiseBed) {
      base = generatePinkNoise(actualTotal, 0.3);
    } else {
      base = new Float32Array(actualTotal); // silence
    }

    (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent: 85 });

    // Mix steg + base
    const output = new Float32Array(actualTotal);
    const stegWeight = Math.max(0, Math.min(1, mixRatio));
    const baseWeight = 1 - stegWeight;
    for (let i = 0; i < actualTotal; i++) {
      output[i] = stegSignal[i] * stegWeight + base[i] * baseWeight;
    }

    // Normalize to prevent clipping
    let peak = 0;
    for (let i = 0; i < actualTotal; i++) {
      const abs = Math.abs(output[i]);
      if (abs > peak) peak = abs;
    }
    if (peak > 0.999) {
      const scale = 0.95 / peak;
      for (let i = 0; i < actualTotal; i++) {
        output[i] *= scale;
      }
    }

    (self.postMessage as (msg: MsgOut) => void)({ cmd: 'progress', percent: 100 });

    // Transfer buffer ownership (zero-copy)
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
