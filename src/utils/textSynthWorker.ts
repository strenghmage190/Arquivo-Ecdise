/*
  textSynthWorker.ts
  WebWorker: synthesizes a Float32 mono buffer from ImageData.
  Y -> frequency, X -> time (one sine per white pixel per column).

  DSP improvements for spectrogram sharpness:
  - Pixels are treated as BINARY (on/off) after threshold — no amplitude
    gradient from grey values, which caused frequency smearing.
  - Frequencies are QUANTIZED to exact FFT bin centers to eliminate
    spectral leakage. A frequency that doesn't land on a bin boundary
    spreads energy across adjacent bins (blur). Bin-aligned sines don't.
  - Window: rectangular (boxcar) instead of Hann. Hann reduces leakage
    for arbitrary frequencies, but since we quantize to bins we get zero
    leakage anyway, and rectangular gives sharper time-domain edges
    (harder on/off per column = sharper vertical edges in spectrogram).
*/

type MsgIn = {
  cmd: 'synthesize';
  width: number;
  height: number;
  imageData: ArrayBuffer; // Uint8ClampedArray RGBA
  params: {
    DURATION_PER_PIXEL: number;
    MIN_FREQ: number;
    MAX_FREQ: number;
    SAMPLE_RATE: number;
  };
};

self.addEventListener('message', (ev: MessageEvent) => {
  const data = ev.data as MsgIn;
  if (!data || data.cmd !== 'synthesize') return;
  const { width, height, imageData, params } = data;
  const { DURATION_PER_PIXEL, MIN_FREQ, MAX_FREQ, SAMPLE_RATE } = params;

  try {
    const pixels = new Uint8ClampedArray(imageData);
    const samplesPerColumn = Math.max(1, Math.floor(DURATION_PER_PIXEL * SAMPLE_RATE));
    const totalSamples = width * samplesPerColumn;
    const output = new Float32Array(totalSamples);

    // --- DSP: Pre-compute bin-quantized frequencies ---
    // An FFT of size N over SAMPLE_RATE has bin width = SAMPLE_RATE / N.
    // We use samplesPerColumn as our analysis frame size.
    // Any frequency F quantized to bin k = round(F * N / SR) * SR / N
    // will produce ZERO spectral leakage in a rectangular window.
    const N = samplesPerColumn;
    const binWidth = SAMPLE_RATE / N;

    // Pre-compute one quantized frequency per Y row (saves work inside loop)
    const rowFreqs = new Float32Array(height);
    for (let y = 0; y < height; y++) {
      const freqNorm = 1 - y / (height - 1); // top = high freq
      const rawFreq = MIN_FREQ + freqNorm * (MAX_FREQ - MIN_FREQ);
      // Snap to nearest FFT bin center
      const bin = Math.round(rawFreq / binWidth);
      rowFreqs[y] = bin * binWidth;
    }

    // --- Binary threshold: treat pixels as on/off ---
    const THRESHOLD = 80; // same as before
    const AMPLITUDE = 0.6; // fixed per active row (no grey gradient = no blur)
    const twoPi = 2 * Math.PI;

    const chunkColumns = 16;
    const tmp = new Float32Array(samplesPerColumn);

    for (let cx = 0; cx < width; cx += chunkColumns) {
      const endX = Math.min(width, cx + chunkColumns);
      for (let x = cx; x < endX; x++) {
        tmp.fill(0);

        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];
          const brightness = a === 0 ? 0 : (r + g + b) / 3;
          if (brightness <= THRESHOLD) continue;

          const freq = rowFreqs[y];
          const phaseInc = twoPi * freq / SAMPLE_RATE;

          // Rectangular window: no taper, sharp column boundaries
          let phase = 0;
          for (let s = 0; s < samplesPerColumn; s++) {
            tmp[s] += Math.sin(phase) * AMPLITUDE;
            phase += phaseInc;
          }
        }

        // Copy column to output (no windowing multiply — rectangular)
        const offset = x * samplesPerColumn;
        for (let s = 0; s < samplesPerColumn; s++) {
          output[offset + s] += tmp[s];
        }
      }

      const percent = Math.min(100, Math.round((endX / width) * 100));
      (self as any).postMessage({ cmd: 'progress', percent });
    }

    // Normalize to avoid clipping
    let max = 0;
    for (let i = 0; i < output.length; i++) {
      const abs = output[i] < 0 ? -output[i] : output[i];
      if (abs > max) max = abs;
    }
    if (max > 0.001) {
      const scale = 0.9 / max;
      for (let i = 0; i < output.length; i++) output[i] *= scale;
    }

    (self as any).postMessage(
      { cmd: 'result', samples: output.buffer, sampleRate: SAMPLE_RATE },
      [output.buffer]
    );
  } catch (err) {
    (self as any).postMessage({ cmd: 'error', error: String(err) });
  }
});

export {};
