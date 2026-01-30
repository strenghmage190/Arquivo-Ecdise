const bitmapCache = new Map<string, ImageBitmap>();
const CACHE_LIMIT = 3;

function trimCache() {
  while (bitmapCache.size > CACHE_LIMIT) {
    const firstKey = bitmapCache.keys().next().value as string | undefined;
    if (!firstKey) break;
    const bmp = bitmapCache.get(firstKey);
    bitmapCache.delete(firstKey);
    try { bmp?.close?.(); } catch (e) {}
  }
}

self.addEventListener('message', async (ev: MessageEvent) => {
  try {
    const data = ev.data as any;
    // Warm cache request
    if (data && data.type === 'warm' && typeof data.src === 'string') {
      const src = data.src as string;
      if (bitmapCache.has(src)) return;
      try {
        const resp = await fetch(src, { mode: 'cors' });
        const blob = await resp.blob();
        const bmp = await createImageBitmap(blob);
        bitmapCache.set(src, bmp);
        trimCache();
      } catch (e) {
        try { (self as any).console && (self as any).console.debug('forensicWorker warm failed', e); } catch (err) {}
      }
      return;
    }

    // Main processing: expects canvas transfer and params
    const { canvas, src, channel, maxDim } = data as { canvas?: OffscreenCanvas; src?: string; channel?: string; maxDim?: number };
    if (!canvas || typeof src !== 'string') return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let imgBitmap: ImageBitmap | null = null;
    try {
      if (bitmapCache.has(src)) {
        imgBitmap = bitmapCache.get(src) as ImageBitmap;
      } else {
        const resp = await fetch(src, { mode: 'cors' });
        const blob = await resp.blob();
        imgBitmap = await createImageBitmap(blob);
        // keep a cached reference for future work
        try { bitmapCache.set(src, imgBitmap); trimCache(); } catch (e) {}
      }

      const naturalW = (imgBitmap as ImageBitmap).width || 1024;
      const naturalH = (imgBitmap as ImageBitmap).height || 768;
      const MAX_DIM = typeof maxDim === 'number' ? maxDim : 800;
      const scale = Math.min(1, MAX_DIM / Math.max(naturalW, naturalH));
      const targetW = Math.max(1, Math.round(naturalW * scale));
      const targetH = Math.max(1, Math.round(naturalH * scale));
      canvas.width = targetW;
      canvas.height = targetH;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(imgBitmap as ImageBitmap, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const dataArr = imageData.data;
      for (let i = 0, len = dataArr.length; i < len; i += 4) {
        const r = dataArr[i], g = dataArr[i + 1], b = dataArr[i + 2];
        let intensity = 0, cr = 0, cg = 0, cb = 0;
        if (channel === 'r') { intensity = r; cr = 255; }
        else if (channel === 'g') { intensity = g; cg = 255; }
        else if (channel === 'b') { intensity = b; cb = 255; }
        dataArr[i] = cr; dataArr[i + 1] = cg; dataArr[i + 2] = cb;
        dataArr[i + 3] = Math.max(0, Math.min(255, Math.round(intensity)));
      }
      ctx.putImageData(imageData, 0, 0);
    } catch (e) {
      try { (self as any).console && (self as any).console.debug('forensicWorker failed', e); } catch (err) {}
    }
  } catch (err) {
    try { (self as any).console && (self as any).console.debug('worker general error', err); } catch (e) {}
  }
});
