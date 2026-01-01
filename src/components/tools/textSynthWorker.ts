// Web Worker: synthesize audio from pixel bitmap
self.addEventListener('message', (ev: MessageEvent) => {
  const data = ev.data;
  if (!data || data.cmd !== 'synthesize') return;
  try {
    const width: number = data.width;
    const height: number = data.height;
    const imageDataBuf: ArrayBuffer = data.imageData;
    const params = data.params || {};
    const DURATION_PER_PIXEL: number = params.DURATION_PER_PIXEL || 0.25;
    const MIN_FREQ: number = params.MIN_FREQ || 1000;
    const MAX_FREQ: number = params.MAX_FREQ || 12000;
    const SAMPLE_RATE: number = params.SAMPLE_RATE || 44100;

    const imageData = new Uint8ClampedArray(imageDataBuf);

    let samplesPerPixel = Math.max(1, Math.floor(SAMPLE_RATE * DURATION_PER_PIXEL));
    let totalSamples = samplesPerPixel * width;

    // Safety cap: avoid creating enormous arrays that freeze the main thread on transfer
    const MAX_SAMPLES = 5_000_000; // ~20 MB (Float32)
    let downsampleFactor = 1;
    if (totalSamples > MAX_SAMPLES) {
      downsampleFactor = Math.ceil(totalSamples / MAX_SAMPLES);
      samplesPerPixel = Math.max(1, Math.ceil(samplesPerPixel / downsampleFactor));
      totalSamples = samplesPerPixel * width;
      // notify main thread about downsampling (optional)
      // @ts-ignore
      self.postMessage({ cmd: 'progress', percent: 0, info: { downsampleFactor } });
    }
    const samples = new Float32Array(totalSamples);

    const threshold = 0.45; // binary threshold: include slightly softer pixels for visibility
    const twoPi = 2 * Math.PI;
    const freqStep = (MAX_FREQ - MIN_FREQ) / Math.max(1, height - 1);
    const thickness = Math.max(1, Math.floor((height / 128) * 2)); // expand strokes slightly for low res
    let lastProgress = -1;

    for (let x = 0; x < width; x++) {
      const active: number[] = [];
      for (let y = 0; y < height; y++) {
        const pixelIndex = ((height - 1 - y) * width + x) * 4;
        const amp = imageData[pixelIndex] / 255;
        if (amp > threshold) {
          // add this row and neighbors to thicken strokes
          for (let dy = -thickness; dy <= thickness; dy++) {
            const yy = y + dy;
            if (yy >= 0 && yy < height) {
              const freq = MIN_FREQ + yy * freqStep;
              active.push(freq);
            }
          }
        }
      }

      if (active.length > 0) {
        const startSample = x * samplesPerPixel;
        const volumePerFreq = 1.0 / Math.sqrt(active.length || 1);
        for (let i = 0; i < samplesPerPixel; i++) {
          const globalT = (startSample + i) / SAMPLE_RATE;
          // envelope: smooth fade-in/out per pixel column (sin window)
          const env = Math.sin(Math.PI * (i / samplesPerPixel));
          let v = 0;
          for (let k = 0; k < active.length; k++) {
            const freq = active[k];
            v += Math.sin(twoPi * freq * globalT);
          }
          samples[startSample + i] += v * env * volumePerFreq;
        }
      }

      // --- throttled progress report ---
      const currentProgress = Math.floor((x / width) * 100);
      // send progress only when at least 5% changed OR every 50 columns OR at the end
      if (x === width - 1 || currentProgress >= lastProgress + 5 || (x % 50) === 0) {
        lastProgress = currentProgress;
        // @ts-ignore
        self.postMessage({ cmd: 'progress', percent: currentProgress });
      }
    }

    // Normalize
    let max = 0;
    for (let i = 0; i < samples.length; i++) {
      const a = Math.abs(samples[i]);
      if (a > max) max = a;
    }
    if (max > 0) {
      const norm = 0.98 / max; // keep a bit more headroom but louder
      for (let i = 0; i < samples.length; i++) samples[i] = samples[i] * norm;
    }

    // Apply small attack/decay per pixel slice to avoid clicks
    const attackSamples = Math.max(1, Math.floor(samplesPerPixel * 0.02));
    const decaySamples = attackSamples;
    for (let x = 0; x < width; x++) {
      const startSample = x * samplesPerPixel;
      const endSample = Math.min(totalSamples, startSample + samplesPerPixel);
      // attack
      for (let i = 0; i < attackSamples && (startSample + i) < endSample; i++) {
        const f = i / attackSamples;
        samples[startSample + i] *= f;
      }
      // decay
      for (let i = 0; i < decaySamples && (endSample - 1 - i) >= startSample; i++) {
        const f = i / decaySamples;
        samples[endSample - 1 - i] *= f;
      }
    }

    // transfer result (zero-copy)
    // @ts-ignore
    self.postMessage({ cmd: 'result', samples: samples.buffer, sampleRate: SAMPLE_RATE }, [samples.buffer]);
  } catch (err: any) {
    // @ts-ignore
    self.postMessage({ cmd: 'error', error: String(err) });
  }
});
