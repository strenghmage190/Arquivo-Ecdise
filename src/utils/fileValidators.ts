export type AllowedMediaType = 'image' | 'video' | 'audio' | 'document' | 'any';

export interface FileValidationResult {
  ok: boolean;
  valid: boolean;
  reason?: string;
  error?: string;
}

export const MAX_IMAGE_SIZE = 15 * 1024 * 1024; // 15MB
export const MAX_AUDIO_SIZE = 25 * 1024 * 1024; // 25MB
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/bmp',
  'image/tiff'
];

export const ALLOWED_AUDIO_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
  'audio/aac',
  'audio/x-m4a'
];

export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/ogg'
];

export const ALLOWED_DOCUMENT_TYPES = [
  'application/json',
  'application/pdf',
  'text/plain',
  'application/octet-stream'
];

/**
 * Normaliza extensão caso MIME type venha em branco do navegador/OS
 */
export function inferMimeType(fileName: string): string | null {
  const ext = (fileName || '').split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'png': return 'image/png';
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'webp': return 'image/webp';
    case 'gif': return 'image/gif';
    case 'bmp': return 'image/bmp';
    case 'wav': return 'audio/wav';
    case 'mp3': return 'audio/mpeg';
    case 'ogg': return 'audio/ogg';
    case 'webm': return 'video/webm';
    case 'mp4': return 'video/mp4';
    case 'mov': return 'video/quicktime';
    case 'json': return 'application/json';
    case 'pdf': return 'application/pdf';
    case 'txt': return 'text/plain';
    default: return null;
  }
}

/**
 * Valida arquivos de imagem para uso em pistas, evidências e camadas forenses.
 */
export function validateImageFile(
  file: File | null,
  maxSizeBytes = MAX_IMAGE_SIZE,
  allowedTypes: string[] = ALLOWED_IMAGE_TYPES
): { ok: boolean; reason?: string } {
  if (!file) return { ok: false, reason: 'Nenhum arquivo selecionado.' };
  
  const typeToCheck = file.type || inferMimeType(file.name) || '';
  if (!allowedTypes.includes(typeToCheck)) {
    return {
      ok: false,
      reason: `Tipo de arquivo inválido (${typeToCheck || 'desconhecido'}). Formatos aceitos: ${allowedTypes.join(', ')}`
    };
  }
  
  if (file.size > maxSizeBytes) {
    const mbLimit = Math.round(maxSizeBytes / (1024 * 1024));
    return { ok: false, reason: `Arquivo excede o limite máximo de ${mbLimit}MB.` };
  }
  
  return { ok: true };
}

/**
 * Validação genérica para uploads de investigação (imagens, vídeos, áudios e dados forenses)
 */
export function validateInvestigationFile(
  file: File | null,
  expectedType: AllowedMediaType = 'any'
): FileValidationResult {
  if (!file) {
    return { ok: false, valid: false, reason: 'Nenhum arquivo selecionado.', error: 'Nenhum arquivo selecionado.' };
  }

  let maxSize = MAX_DOCUMENT_SIZE;
  let allowedTypes: string[] = [];

  switch (expectedType) {
    case 'image':
      maxSize = MAX_IMAGE_SIZE;
      allowedTypes = ALLOWED_IMAGE_TYPES;
      break;
    case 'audio':
      maxSize = MAX_AUDIO_SIZE;
      allowedTypes = ALLOWED_AUDIO_TYPES;
      break;
    case 'video':
      maxSize = MAX_VIDEO_SIZE;
      allowedTypes = ALLOWED_VIDEO_TYPES;
      break;
    case 'document':
      maxSize = MAX_DOCUMENT_SIZE;
      allowedTypes = ALLOWED_DOCUMENT_TYPES;
      break;
    case 'any':
    default:
      maxSize = MAX_VIDEO_SIZE;
      allowedTypes = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_AUDIO_TYPES, ...ALLOWED_VIDEO_TYPES, ...ALLOWED_DOCUMENT_TYPES];
      break;
  }

  if (file.size > maxSize) {
    const mb = Math.round(maxSize / (1024 * 1024));
    const msg = `Arquivo muito grande (${(file.size / (1024 * 1024)).toFixed(1)}MB). Limite: ${mb}MB.`;
    return { ok: false, valid: false, reason: msg, error: msg };
  }

  const effectiveType = file.type || inferMimeType(file.name) || '';
  if (allowedTypes.length > 0 && effectiveType && !allowedTypes.includes(effectiveType)) {
    const msg = `Formato de arquivo não suportado (${effectiveType}). Formatos aceitos: ${allowedTypes.join(', ')}`;
    return { ok: false, valid: false, reason: msg, error: msg };
  }

  return { ok: true, valid: true };
}

export default {
  validateImageFile,
  validateInvestigationFile,
  inferMimeType,
  MAX_IMAGE_SIZE,
  MAX_AUDIO_SIZE,
  MAX_VIDEO_SIZE
};
