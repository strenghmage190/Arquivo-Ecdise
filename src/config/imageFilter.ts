/**
 * Limites e padrões únicos para o puzzle de tratamento de imagem.
 *
 * A criação da pista (TabVisual) e a investigação (InspectionModal) precisam
 * usar exatamente os mesmos intervalos, caso contrário o GM pode configurar um
 * alvo que o jogador não consegue alcançar.
 */
export const IMAGE_FILTER_LIMITS = {
  brightness: { min: 0, max: 300 },
  contrast: { min: 0, max: 300 },
  saturate: { min: 0, max: 300 },
} as const;

export type ImageFilterKey = keyof typeof IMAGE_FILTER_LIMITS;

export const DEFAULT_IMAGE_FILTERS = {
  brightness: 100,
  contrast: 100,
  saturate: 100,
} as const;

/**
 * Tolerância (em pontos percentuais) para a camada oculta aparecer.
 * Usamos a maior diferença entre os três canais: em 0 o alvo é exato e a
 * camada fica 100% visível; a partir da tolerância ela desaparece.
 */
export const IMAGE_FILTER_REVEAL_TOLERANCE = 24;

export function clampImageFilterValue(
  key: ImageFilterKey,
  value: number | string | null | undefined
): number {
  const { min, max } = IMAGE_FILTER_LIMITS[key];
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric)) return DEFAULT_IMAGE_FILTERS[key];
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

export function normalizeImageFilterValues(values: {
  brightness?: number;
  contrast?: number;
  saturate?: number;
}) {
  return {
    brightness: clampImageFilterValue('brightness', values.brightness ?? DEFAULT_IMAGE_FILTERS.brightness),
    contrast: clampImageFilterValue('contrast', values.contrast ?? DEFAULT_IMAGE_FILTERS.contrast),
    saturate: clampImageFilterValue('saturate', values.saturate ?? DEFAULT_IMAGE_FILTERS.saturate),
  };
}
