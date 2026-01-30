self.addEventListener('message', async (ev: MessageEvent) => {
  const data = ev.data as any;
  if (!data) return;

  if (data.type === 'run') {
    const { src, channel = 'all', runs = 5, maxDim = 800 } = data;
    if (!src) {
      self.postMessage({ type: 'error', message: 'no-src' });
      return;
    }

    try {
      // fetch once and create ImageBitmap once for repeated runs
      const resp = await fetch(src, { mode: 'cors' });
      const blob = await resp.blob();
      const bmp = await createImageBitmap(blob);

      const naturalW = bmp.width || 1024;
      const naturalH = bmp.height || 768;
      const scale = Math.min(1, maxDim / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));

      const off = new OffscreenCanvas(targetW, targetH);
      const ctx = off.getContext('2d');
      if (!ctx) {
        self.postMessage({ type: 'error', message: 'no-ctx' });
        try { bmp.close?.(); } catch (e) {}
        return;
      }

      const times: number[] = [];
      for (let i = 0; i < runs; i++) {
        const t0 = performance.now();
        ctx.clearRect(0, 0, off.width, off.height);
        ctx.drawImage(bmp, 0, 0, off.width, off.height);
        const imageData = ctx.getImageData(0, 0, off.width, off.height);
        const dataArr = imageData.data;
        for (let p = 0, len = dataArr.length; p < len; p += 4) {
          const r = dataArr[p], g = dataArr[p + 1], b = dataArr[p + 2];
          let intensity = 0, cr = 0, cg = 0, cb = 0;
          if (channel === 'r') { intensity = r; cr = 255; }
          else if (channel === 'g') { intensity = g; cg = 255; }
          else if (channel === 'b') { intensity = b; cb = 255; }
          dataArr[p] = cr; dataArr[p + 1] = cg; dataArr[p + 2] = cb;
          dataArr[p + 3] = Math.max(0, Math.min(255, Math.round(intensity)));
        }
        ctx.putImageData(imageData, 0, 0);
        const t1 = performance.now();
        times.push(t1 - t0);
      }

      try { bmp.close?.(); } catch (e) {}
      self.postMessage({ type: 'result', times, channel, runs });
    } catch (e) {
      try { (self as any).console && (self as any).console.debug('benchmarkWorker error', e); } catch (err) {}
      self.postMessage({ type: 'error', message: String(e) });
    }
  }
});
