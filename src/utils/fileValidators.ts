export function validateImageFile(file: File | null, maxSizeBytes = 5 * 1024 * 1024) {
  if (!file) return { ok: false, reason: 'No file' };
  if (!file.type.startsWith('image/')) return { ok: false, reason: 'Tipo de arquivo inválido. Apenas imagens são permitidas.' };
  if (file.size > maxSizeBytes) return { ok: false, reason: `Arquivo muito grande. Máx ${Math.round(maxSizeBytes / 1024 / 1024)}MB.` };
  return { ok: true };
}

export default { validateImageFile };
