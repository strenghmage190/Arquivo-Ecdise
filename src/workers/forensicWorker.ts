self.addEventListener('message', async (ev: MessageEvent) => {
  try {
    const { canvas, src, channel, maxDim } = ev.data as { canvas: OffscreenCanvas; src: string; channel: string; maxDim: number };
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // load image via fetch + createImageBitmap (works inside worker)
    let response: Response | null = null;
    try {
      response = await fetch(src, { mode: 'cors' });
      const blob = await response.blob();
      const imgBitmap = await createImageBitmap(blob);
      const naturalW = imgBitmap.width || 1024;
      const naturalH = imgBitmap.height || 768;
      const MAX_DIM = typeof maxDim === 'number' ? maxDim : 800;
      const scale = Math.min(1, MAX_DIM / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgBitmap, 0, 0, canvas.width, canvas.height);
      try { imgBitmap.close?.(); } catch (e) {}

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;
      for (let i = 0, len = data.length; i < len; i += 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2];
        let intensity = 0, cr = 0, cg = 0, cb = 0;
        if (channel === 'r') { intensity = r; cr = 255; }
        else if (channel === 'g') { intensity = g; cg = 255; }
        else if (channel === 'b') { intensity = b; cb = 255; }
        data[i] = cr; data[i + 1] = cg; data[i + 2] = cb;
        data[i + 3] = Math.max(0, Math.min(255, Math.round(intensity)));
      }
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      // best effort: cannot do much in worker context other than swallow
      try { (self as any).console && (self as any).console.debug('forensicWorker failed', e); } catch (err) {}
    } finally {
      if (response) try { response.body?.cancel(); } catch (e) {}
    }
  } catch (err) {
    try { (self as any).console && (self as any).console.debug('worker general error', err); } catch (e) {}
  }
});
