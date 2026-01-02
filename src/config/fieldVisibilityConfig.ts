/**
 * 🎯 FIELD VISIBILITY CONFIG
 * 
 * Controle total sobre QUAIS CAMPOS aparecem em cada tipo de exibição.
 * Você escolhe exatamente o que mostrar.
 */

export interface FieldVisibilityConfig {
  // ============ FILE PROPERTIES (ARQUIVO) ============
  fileProperties: {
    // Lista de campos que APARECEM
    visibleFields: Array<
      | 'fileType'
      | 'size'
      | 'cameraModel'
      | 'dateCreated'
      | 'gpsCoords'
      | 'ownerName'
      | 'hexComment'
      | 'technicalNote'
      // Campos customizados do metadata
      | string // Aceita qualquer campo do metadata JSON
    >;
  };

  // ============ GLITCH PUZZLE ============
  glitchPuzzle: {
    // Controles que aparecem no puzzle
    visibleSections: Array<
      | 'accessInstructions'
      | 'hint'
      | 'calibrationControls'
      | 'logs'
      | 'rewardCode'
      | 'correctAnswerWhenSolved'
    >;
  };

  // ============ MEGA CLUE ============
  megaClue: {
    visibleSections: Array<
      | 'hints'
      | 'progress'
      | 'answer'
      | 'requiredPuzzles'
    >;
  };

  // ============ CUSTOM METADATA (qualquer JSON) ============
  customMetadata: {
    // Mostra campos JSON personalizados?
    enableCustomFields: boolean;
    // Quais campos customizados mostrar (por padrão)
    defaultVisibleCustomFields: string[];
    // Esconder campos sensíveis por padrão
    hiddenByDefault: string[];
  };
}

/**
 * ✅ CONFIGURAÇÃO PADRÃO - Mostra tudo que é importante
 */
export const defaultFieldVisibility: FieldVisibilityConfig = {
  fileProperties: {
    visibleFields: [
      'fileType',
      'size',
      'cameraModel',
      'dateCreated',
      'gpsCoords',
      'ownerName',
      // NÃO mostra hex por padrão
    ],
  },
  
  glitchPuzzle: {
    visibleSections: [
      'accessInstructions',
      'hint',
      'calibrationControls',
      'logs',
      'rewardCode',
      // NÃO mostra resposta correta
    ],
  },
  
  megaClue: {
    visibleSections: [
      'hints',
      'progress',
      // NÃO mostra resposta
      // NÃO mostra puzzles obrigatórios
    ],
  },

  customMetadata: {
    enableCustomFields: true,
    defaultVisibleCustomFields: [
      'audio_config',
      'thermal_keyword',
      'device_owner',
    ],
    hiddenByDefault: [
      'internal_id',
      'admin_notes',
      'system_flags',
    ],
  },
};

/**
 * 🎮 PRESETS - Configurações pré-feitas
 */
export const fieldVisibilityPresets = {
  // Modo SEGURO - Mostra o mínimo
  MINIMAL: {
    fileProperties: { visibleFields: ['fileType', 'dateCreated'] },
    glitchPuzzle: { visibleSections: ['calibrationControls', 'rewardCode'] },
    megaClue: { visibleSections: ['progress'] },
    customMetadata: { enableCustomFields: false, defaultVisibleCustomFields: [], hiddenByDefault: [] },
  } as FieldVisibilityConfig,

  // Modo PADRÃO - Informações normais
  DEFAULT: defaultFieldVisibility,

  // Modo COMPLETO - Mostra tudo
  FULL: {
    fileProperties: {
      visibleFields: [
        'fileType',
        'size',
        'cameraModel',
        'dateCreated',
        'gpsCoords',
        'ownerName',
        'hexComment',
        'technicalNote',
      ],
    },
    glitchPuzzle: {
      visibleSections: [
        'accessInstructions',
        'hint',
        'calibrationControls',
        'logs',
        'rewardCode',
        'correctAnswerWhenSolved', // ⚠️ Mostra resposta
      ],
    },
    megaClue: {
      visibleSections: [
        'hints',
        'progress',
        'answer', // ⚠️ Mostra resposta
        'requiredPuzzles',
      ],
    },
    customMetadata: {
      enableCustomFields: true,
      defaultVisibleCustomFields: [], // Todos que tiverem
      hiddenByDefault: [],
    },
  } as FieldVisibilityConfig,

  // Modo ENIGMÁTICO - Mostra dados estranhos
  MYSTERY: {
    fileProperties: {
      visibleFields: [
        'gpsCoords',
        'ownerName',
        'technicalNote',
      ],
    },
    glitchPuzzle: {
      visibleSections: [
        'hint',
        'logs',
      ],
    },
    megaClue: {
      visibleSections: ['hints'],
    },
    customMetadata: {
      enableCustomFields: true,
      defaultVisibleCustomFields: [
        'audio_config',
        'thermal_keyword',
        'thermal_secret_text',
        'device_owner',
      ],
      hiddenByDefault: [],
    },
  } as FieldVisibilityConfig,
};

/**
 * Hook para carregar configuração
 */
export function useFieldVisibility(): FieldVisibilityConfig {
  try {
    const stored = localStorage.getItem('fieldVisibilityConfig');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Erro ao carregar fieldVisibilityConfig:', e);
  }
  
  return defaultFieldVisibility;
}

/**
 * Salvar configuração
 */
export function saveFieldVisibility(config: FieldVisibilityConfig): void {
  try {
    localStorage.setItem('fieldVisibilityConfig', JSON.stringify(config));
    console.log('✅ Field visibility config salvo');
  } catch (e) {
    console.error('❌ Erro ao salvar fieldVisibilityConfig:', e);
  }
}

/**
 * Aplicar preset
 */
export function applyFieldVisibilityPreset(preset: 'MINIMAL' | 'DEFAULT' | 'FULL' | 'MYSTERY'): FieldVisibilityConfig {
  const config = fieldVisibilityPresets[preset];
  saveFieldVisibility(config);
  return config;
}

/**
 * Verificar se um campo deve aparecer
 */
/**
 * Check if a specific field is visible in a section based on the config
 */
export function isFieldVisible(
  config: FieldVisibilityConfig,
  section: 'fileProperties' | 'glitchPuzzle' | 'megaClue',
  field: string
): boolean {
  if (section === 'fileProperties') {
    return config.fileProperties.visibleFields.includes(field as any);
  }
  if (section === 'glitchPuzzle') {
    return config.glitchPuzzle.visibleSections.includes(field as any);
  }
  if (section === 'megaClue') {
    return config.megaClue.visibleSections.includes(field as any);
  }
  return false;
}
