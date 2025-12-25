export function validateImageFile(file: File | null, maxSizeBytes = 5 * 1024 * 1024, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']) {
  if (!file) return { ok: false, reason: 'Nenhum arquivo selecionado.' };
  if (!allowedTypes.includes(file.type)) return { ok: false, reason: 'Tipo de arquivo inválido. Formatos válidos: ' + allowedTypes.join(', ') };
  if (file.size > maxSizeBytes) return { ok: false, reason: `Arquivo muito grande. Máx ${Math.round(maxSizeBytes / 1024 / 1024)}MB.` };
  return { ok: true };
}

export default { validateImageFile };
