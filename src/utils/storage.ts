import { supabase } from '../supabaseClient';
import { validateInvestigationFile, inferMimeType } from './fileValidators';

// Validação de arquivo antes do upload
export interface FileValidation {
  valid: boolean;
  error?: string;
}

export interface UploadInvestigationOptions {
  onProgress?: (progress: number) => void;
  /**
   * Se true, pula qualquer redimensionamento e recompressão canvas.
   * ESSENCIAL para dados forenses, esteganografia LSB e arquivos onde a integridade bit-a-bit é obrigatória.
   */
  preserveLossless?: boolean;
}

export function validateFile(file: File, type: 'image' | 'video' | 'audio' | 'any'): FileValidation {
  const res = validateInvestigationFile(file, type);
  return {
    valid: res.valid,
    error: res.error || res.reason
  };
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

/**
 * Resize/compress image in browser using canvas, returns a File or Blob.
 * Used when preserveLossless is false and standard preview compression is safe.
 */
export async function resizeImageFile(file: File, maxWidth = 1600, maxHeight = 1200, quality = 0.8): Promise<File | Blob> {
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
  
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, w, h);

  const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
  
  const fileSizeMB = file.size / (1024 * 1024);
  let adjustedQuality = quality;
  if (fileSizeMB > 5) {
    adjustedQuality = Math.max(0.6, quality - 0.2);
  } else if (fileSizeMB > 2) {
    adjustedQuality = Math.max(0.7, quality - 0.1);
  }

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), outputType, adjustedQuality));
  if (!blob) return file;
  
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

  try {
    return new File([blob], file.name, { type: blob.type });
  } catch (e) {
    return blob;
  }
}

/**
 * Envia imagem para Supabase Storage.
 * Suporta opção preserveLossless para manter 100% dos pixels intactos (esteganografia LSB e análise forense).
 */
export async function uploadInvestigationImage(
  file: File, 
  investigationId: string,
  onProgressOrOptions?: ((progress: number) => void) | UploadInvestigationOptions
): Promise<string | null> {
  try {
    const options: UploadInvestigationOptions = typeof onProgressOrOptions === 'function'
      ? { onProgress: onProgressOrOptions }
      : (onProgressOrOptions || {});

    const onProgress = options.onProgress;
    const preserveLossless = options.preserveLossless ?? false;

    // Validar arquivo antes de processar
    const validation = validateFile(file, 'image');
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    onProgress?.(10);

    // Se a evidência precisa de integridade bit-a-bit (LSB / forense), NÃO comprima via Canvas
    let fileToUpload: File | Blob = file;
    if (!preserveLossless) {
      fileToUpload = await resizeImageFile(file);
    }
    
    onProgress?.(30);

    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
    const filePath = `${investigationId}/${fileName}`;

    // Upload com retry automático
    const uploadResult = await retryWithBackoff(async () => {
      onProgress?.(50);
      return await supabase.storage.from('investigation-assets').upload(
        filePath, 
        fileToUpload, 
        {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || inferMimeType(file.name) || 'application/octet-stream'
        }
      );
    });
    
    if (uploadResult.error) throw uploadResult.error;
    onProgress?.(90);

    const { data } = supabase.storage.from('investigation-assets').getPublicUrl(filePath);
    onProgress?.(100);
    return data.publicUrl;
  } catch (error) {
    console.error('Upload falhou:', error);
    throw error;
  }
}

/**
 * Upload de arquivos de áudio, vídeo, JSON e binários forenses sem conversão ou compressão com perda
 */
export async function uploadInvestigationFile(
  file: File | Blob, 
  investigationId: string, 
  extHint?: string,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  try {
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
          contentType: (file instanceof File ? (file.type || inferMimeType(file.name) || undefined) : undefined) 
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
    throw error;
  }
}

export default { uploadInvestigationImage, uploadInvestigationFile, resizeImageFile, validateFile };
