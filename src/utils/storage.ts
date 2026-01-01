import { supabase } from '../supabaseClient';

// Validação de arquivo antes do upload
export interface FileValidation {
  valid: boolean;
  error?: string;
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];

export function validateFile(file: File, type: 'image' | 'video' | 'audio' | 'any'): FileValidation {
  if (!file) return { valid: false, error: 'Nenhum arquivo selecionado' };

  // Check size
  const maxSize = type === 'image' ? MAX_IMAGE_SIZE : type === 'video' ? MAX_VIDEO_SIZE : type === 'audio' ? MAX_AUDIO_SIZE : MAX_VIDEO_SIZE;
  if (file.size > maxSize) {
    const sizeMB = (maxSize / 1024 / 1024).toFixed(0);
    return { valid: false, error: `Arquivo muito grande. Tamanho máximo: ${sizeMB}MB` };
  }

  // Check type
  if (type !== 'any') {
    const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : type === 'video' ? ALLOWED_VIDEO_TYPES : ALLOWED_AUDIO_TYPES;
    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: `Tipo de arquivo não suportado: ${file.type}` };
    }
  }

  return { valid: true };
}

// Retry helper com backoff exponencial
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  initialDelay = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        const delay = initialDelay * Math.pow(2, i);
        console.warn(`Tentativa ${i + 1} falhou, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
}

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
  
  // Melhor qualidade de renderização para compressão
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  
  // Compressão agressiva para arquivos grandes (>5MB)
  const fileSizeMB = file.size / (1024 * 1024);
  let adjustedQuality = quality;
  if (fileSizeMB > 5) {
    adjustedQuality = Math.max(0.6, quality - 0.2); // Reduz qualidade para arquivos grandes
  } else if (fileSizeMB > 2) {
    adjustedQuality = Math.max(0.7, quality - 0.1);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), outputType, adjustedQuality));
  if (!blob) return file;
  
  // Se ainda estiver muito grande, comprimir novamente com qualidade menor
  if (blob.size > file.size && blob.size > 3 * 1024 * 1024) {
    const secondPass = await new Promise<Blob | null>((resolve) => 
      canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.6)
    );
    if (secondPass && secondPass.size < blob.size) {
      try {
        return new File([secondPass], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
      } catch (e) {
        return secondPass;
      }
    }
  }

  // Prefer File when available so Supabase Storage preserves filename metadata
  try {
    return new File([blob], file.name, { type: blob.type });
  } catch (e) {
    return blob;
  }
}

// Envia imagem (redimensionando/comprimindo) e retorna URL pública
export async function uploadInvestigationImage(
  file: File, 
  investigationId: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    // Validar arquivo antes de processar
    const validation = validateFile(file, 'image');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.(10);
    const resized = await resizeImageFile(file);
    onProgress?.(30);

    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${investigationId}/${fileName}`;

    // Upload com retry automático
    const uploadResult = await retryWithBackoff(async () => {
      onProgress?.(50);
      return await supabase.storage.from('investigation-assets').upload(
        filePath, 
        resized as File | Blob, 
        { cacheControl: '3600', upsert: false }
      );
    });
    
    if (uploadResult.error) throw uploadResult.error;
    onProgress?.(90);

    const { data } = supabase.storage.from('investigation-assets').getPublicUrl(filePath);
    onProgress?.(100);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload falhou:', error);
    throw error; // Propagar erro em vez de retornar null
  }
}

// Upload arbitrary file (JSON, etc.) to the investigation bucket and return public URL
export async function uploadInvestigationFile(
  file: File | Blob, 
  investigationId: string, 
  extHint?: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
    // Validar arquivo se for File
    if (file instanceof File) {
      const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : 'any';
      const validation = validateFile(file, type);
      if (!validation.valid) {
        throw new Error(validation.error);
      }
    }

    onProgress?.(10);
    const fileExt = extHint || (file instanceof File ? file.name.split('.').pop() : 'bin');
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${investigationId}/${fileName}`;

    onProgress?.(30);
    
    // Upload com retry automático
    const uploadResult = await retryWithBackoff(async () => {
      onProgress?.(60);
      return await supabase.storage.from('investigation-assets').upload(
        filePath, 
        file as File | Blob, 
        { 
          cacheControl: '3600', 
          upsert: false, 
          contentType: (file instanceof File ? file.type : undefined) 
        }
      );
    });
    
    if (uploadResult.error) throw uploadResult.error;
    onProgress?.(90);

    const { data } = supabase.storage.from('investigation-assets').getPublicUrl(filePath);
    onProgress?.(100);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload file falhou:', error);
    throw error; // Propagar erro em vez de retornar null
  }
}

export default { uploadInvestigationImage, uploadInvestigationFile };
