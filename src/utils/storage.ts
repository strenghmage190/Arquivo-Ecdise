import { supabase } from '../supabaseClient';

// Resize/compress image in browser using canvas, returns a File/Blob
async function resizeImageFile(file: File, maxWidth = 1600, maxHeight = 1200, quality = 0.8): Promise<File | Blob> {
  if (!file.type.startsWith('image/')) return file;

  const dataUrl = await new Promise<string>((res, rej) => {
    const reader = new FileReader();
    reader.onload = () => res(String(reader.result || ''));
    reader.onerror = rej;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });

  const ratio = Math.min(1, Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight));
  const w = Math.round(img.naturalWidth * ratio);
  const h = Math.round(img.naturalHeight * ratio);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), outputType, quality));
  if (!blob) return file;

  // Prefer File when available so Supabase Storage preserves filename metadata
  try {
    return new File([blob], file.name, { type: blob.type });
  } catch (e) {
    return blob;
  }
}

// Envia imagem (redimensionando/comprimindo) e retorna URL pública
export async function uploadInvestigationImage(file: File, investigationId: string): Promise<string | null> {
  try {
    const resized = await resizeImageFile(file);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${investigationId}/${fileName}`;

    const uploadResult = await supabase.storage.from('investigation-assets').upload(filePath, resized as File | Blob, { cacheControl: '3600', upsert: false });
    if (uploadResult.error) throw uploadResult.error;

    const { data } = supabase.storage.from('investigation-assets').getPublicUrl(filePath);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload falhou:', error);
    return null;
  }
}

export default { uploadInvestigationImage };
