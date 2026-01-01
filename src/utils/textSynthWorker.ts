/*
  textSynthWorker.ts
  WebWorker that receives ImageData bytes and synthesizes a Float32 mono buffer
  mapping Y -> frequency and X -> time. Processes columns in chunks and reports progress.
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

    const threshold = 80; // brightness threshold
    const twoPi = 2 * Math.PI;

    // Hann window for each column
    const windowFunc = (n: number) => {
      const w = new Float32Array(n);
      for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos((twoPi * i) / (n - 1)));
      return w;
    };
    const win = windowFunc(samplesPerColumn);

    const chunkColumns = 16;
    const tmp = new Float32Array(samplesPerColumn);

    for (let cx = 0; cx < width; cx += chunkColumns) {
      const endX = Math.min(width, cx + chunkColumns);
      for (let x = cx; x < endX; x++) {
        // zero tmp
        tmp.fill(0);
        // for each y (row) check pixel brightness
        for (let y = 0; y < height; y++) {
          const idx = (y * width + x) * 4;
          const r = pixels[idx];
          const g = pixels[idx + 1];
          const b = pixels[idx + 2];
          const a = pixels[idx + 3];
          const brightness = a === 0 ? 0 : (r + g + b) / 3;
          if (brightness <= threshold) continue;
          const amp = (brightness / 255) * 0.9; // amplitude scaling
          // map y->freq (top=high)
          const freqNorm = 1 - (y / (height - 1));
          const freq = MIN_FREQ + freqNorm * (MAX_FREQ - MIN_FREQ);
          const phaseInc = twoPi * freq / SAMPLE_RATE;
          // add sine into tmp for the duration of column
          let phase = 0;
          for (let s = 0; s < samplesPerColumn; s++) {
            tmp[s] += Math.sin(phase) * amp;
            phase += phaseInc;
          }
        }

        // apply window and add to output at offset
        const offset = x * samplesPerColumn;
        for (let s = 0; s < samplesPerColumn; s++) {
          output[offset + s] += tmp[s] * win[s];
        }
      }

      // report progress
      const percent = Math.min(100, Math.round((endX / width) * 100));
      (self as any).postMessage({ cmd: 'progress', percent });
    }

    // Normalize to avoid clipping
    let max = 0;
    for (let i = 0; i < output.length; i++) {
      max = Math.max(max, Math.abs(output[i]));
    }
    if (max > 1) {
      for (let i = 0; i < output.length; i++) output[i] = output[i] / max;
    }

    // send back as transferable
    (self as any).postMessage({ cmd: 'result', samples: output.buffer, sampleRate: SAMPLE_RATE }, [output.buffer]);
  } catch (err) {
    (self as any).postMessage({ cmd: 'error', error: String(err) });
  }
});

export {};
