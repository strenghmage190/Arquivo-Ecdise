export async function generateGlitchPlaceholder(file: File): Promise<File | null> {
  try {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = dataUrl;
    });

    const maxSize = 900;
    const ratio = Math.min(1, Math.min(maxSize / img.naturalWidth, maxSize / img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * ratio));
    const h = Math.max(1, Math.round(img.naturalHeight * ratio));

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0, w, h);

    // Quick glitch overlay: slice shifts + noise
    const sliceCount = 16;
    for (let idx = 0; idx < sliceCount; idx += 1) {
      const sliceH = Math.max(8, (h / sliceCount) * (0.5 + Math.random()));
      const y = Math.min(h - sliceH, Math.floor(Math.random() * (h - sliceH)));
      const shift = (Math.random() * 0.18 + 0.02) * w * (Math.random() > 0.5 ? 1 : -1);
      ctx.drawImage(canvas, 0, y, w, sliceH, shift, y, w, sliceH);
    }

    const noise = ctx.getImageData(0, 0, w, h);
    const data = noise.data;
    const jitter = 26;
    for (let i = 0; i < data.length; i += 4) {
      const n = (Math.random() * jitter) - jitter / 2;
      data[i] = Math.max(0, Math.min(255, data[i] + n));
      data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + n * 0.9));
      data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + n * 1.1));
    }
    ctx.putImageData(noise, 0, 0);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.78));
    if (!blob) return null;

    return new File([blob], `glitch_${Date.now()}.jpg`, { type: 'image/jpeg' });
  } catch (e) {
    console.error('generateGlitchPlaceholder failed', e);
    return null;
  }
}

export default { generateGlitchPlaceholder };
