// spectrogramWorker.ts
// Worker that computes a simple spectrogram image from raw audio samples.
self.addEventListener('message', (ev: MessageEvent) => {
  const data = ev.data || {};
  if (data.cmd !== 'render') return;

  try {
    const audioBuf = new Float32Array(data.audioBuffer);
    const sampleRate = data.sampleRate || 44100;
    const width = data.width || 800;
    const height = data.height || 300;
    const fftSize = data.fftSize || 2048;

    const hop = Math.max(1, Math.floor((audioBuf.length - fftSize) / Math.max(1, width)));
    const numWindows = Math.max(1, Math.floor((audioBuf.length - fftSize) / hop));

    // Prepare output RGBA buffer
    const out = new Uint8ClampedArray(width * height * 4);

    // Helper: simple DFT (naive) - runs in worker so doesn't block UI
    const simpleFFT = (signal: Float32Array, n: number) => {
      const spectrum = new Float32Array(Math.floor(n / 2));
      for (let k = 0; k < n / 2; k++) {
        let real = 0;
        let imag = 0;
        for (let t = 0; t < n; t++) {
          const angle = (2 * Math.PI * k * t) / n;
          const s = signal[t] || 0;
          real += s * Math.cos(angle);
          imag -= s * Math.sin(angle);
        }
        spectrum[k] = Math.sqrt(real * real + imag * imag) / n;
      }
      return spectrum;
    };

    const twoPi = 2 * Math.PI;

    // For each horizontal pixel/window compute spectrum and write column
    for (let x = 0; x < width; x++) {
      const start = Math.min(audioBuf.length - fftSize, Math.floor(x * ((audioBuf.length - fftSize) / Math.max(1, width - 1))));
      const segment = new Float32Array(fftSize);
      for (let i = 0; i < fftSize; i++) segment[i] = audioBuf[start + i] || 0;

      // apply simple Hann window
      for (let i = 0; i < fftSize; i++) {
        const hann = 0.5 * (1 - Math.cos((twoPi * i) / fftSize));
        segment[i] *= hann;
      }

      const spectrum = simpleFFT(segment, fftSize);

      // map spectrum to image column
      for (let y = 0; y < height; y++) {
        // frequency normalized from top (high) to bottom (low)
        const freqIndex = Math.floor((1 - y / height) * spectrum.length);
        const mag = spectrum[Math.max(0, Math.min(spectrum.length - 1, freqIndex))] || 0;
        // simple contrast scaling
        let intensity = Math.min(1, mag * 5);
        // noise gate
        if (intensity < 0.02) intensity = 0;
        const c = Math.floor(intensity * 255);
        const idx = (y * width + x) * 4;
        // High-contrast mapping: bluish -> cyan-ish
        out[idx + 0] = Math.min(255, c * 1.2); // R
        out[idx + 1] = Math.min(255, c);       // G
        out[idx + 2] = Math.min(255, c * 0.6); // B
        out[idx + 3] = 255;
      }

      // occasionally send progress updates (throttled by main thread too)
      if (x % Math.max(1, Math.floor(width / 10)) === 0) {
        // @ts-ignore
        self.postMessage({ cmd: 'progress', percent: Math.floor((x / width) * 100) });
      }
    }

    // transfer image buffer back (zero-copy)
    // @ts-ignore
    self.postMessage({ cmd: 'image', width, height, imageBuffer: out.buffer }, [out.buffer]);
  } catch (err) {
    // @ts-ignore
    self.postMessage({ cmd: 'error', error: String(err) });
  }
});
