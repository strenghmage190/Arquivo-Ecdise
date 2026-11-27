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

export interface FilterLayerTransform {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Camada de filtro ocupando toda a imagem (alinhada à base). */
export const FULL_FILTER_LAYER_TRANSFORM: FilterLayerTransform = {
  left: 0,
  top: 0,
  width: 100,
  height: 100,
};

// Valor gravado por versões antigas quando o GM apenas enviava a camada.
// Ele encolhia a imagem para 50% no centro, então tratamos como tela cheia.
const LEGACY_FILTER_LAYER_TRANSFORM: FilterLayerTransform = {
  left: 25,
  top: 25,
  width: 50,
  height: 50,
};

export function normalizeFilterLayerTransform(raw: unknown): FilterLayerTransform | null {
  let parsed: any = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;

  const toNumber = (value: unknown) =>
    typeof value === 'number' ? value : Number(value);
  const left = toNumber(parsed.left);
  const top = toNumber(parsed.top);
  const width = toNumber(parsed.width);
  const height = toNumber(parsed.height);
  if (![left, top, width, height].every((value) => Number.isFinite(value))) {
    return null;
  }

  const normalized: FilterLayerTransform = {
    left: Math.min(100, Math.max(0, left)),
    top: Math.min(100, Math.max(0, top)),
    width: Math.min(100, Math.max(1, width)),
    height: Math.min(100, Math.max(1, height)),
  };

  if (
    normalized.left === LEGACY_FILTER_LAYER_TRANSFORM.left &&
    normalized.top === LEGACY_FILTER_LAYER_TRANSFORM.top &&
    normalized.width === LEGACY_FILTER_LAYER_TRANSFORM.width &&
    normalized.height === LEGACY_FILTER_LAYER_TRANSFORM.height
  ) {
    return { ...FULL_FILTER_LAYER_TRANSFORM };
  }

  return normalized;
}

export function resolveFilterLayerTransform(raw: unknown): FilterLayerTransform {
  return normalizeFilterLayerTransform(raw) || { ...FULL_FILTER_LAYER_TRANSFORM };
}

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
