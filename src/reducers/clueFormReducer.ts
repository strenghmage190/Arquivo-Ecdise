/**
 * 🔄 clueFormReducer.ts
 * Reducer para consolidar estados relacionados do formulário de pistas
 */

// ===== TYPES =====
export interface ClueBasicState {
  title: string;
  descPublic: string;
  descHidden: string;
  tags: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  isHidden: boolean;
  discoveryCode: string;
  imgFile: File | null;
}

export interface GlitchPuzzleState {
  enabled: boolean;
  focusedImageFile: File | null;
  startFrequency: number;
  startShift: number;
  startChromatic: number;
  correctFrequency: number;
  correctShift: number;
  correctChromatic: number;
  difficulty: 'easy' | 'normal' | 'hard' | 'custom';
  toleranceFreq: number;
  toleranceShift: number;
  toleranceChroma: number;
  accessInstructions: string;
  hint: string;
  keyword: string;
  rewardCode: string;
}

export interface MegaClueState {
  finalTruthText: string;
  imageFile: File | null;
  requiredPuzzleIds: string[];
  selectedPuzzle: string;
}

export interface ForensicState {
  baseImage: File | null;
  hiddenImage: File | null;
  targetChannel: 'R' | 'G' | 'B';
  processing: boolean;
  showEditor: boolean;
}

export interface MediaVisibilityState {
  audioBase: 'always' | 'glitch_only' | 'post_solve';
  audioHidden: 'post_solve' | 'post_keyword';
  visual: 'glitch_active' | 'post_keyword';
  uvLayer: 'post_keyword' | 'always' | 'post_solve';
}

// ===== ACTIONS =====
type BasicAction =
  | { type: 'SET_TITLE'; payload: string }
  | { type: 'SET_DESC_PUBLIC'; payload: string }
  | { type: 'SET_DESC_HIDDEN'; payload: string }
  | { type: 'SET_TAGS'; payload: string }
  | { type: 'SET_EVIDENCE_TYPE'; payload: 'document' | 'glitch_puzzle' | 'mega_clue' }
  | { type: 'SET_IS_HIDDEN'; payload: boolean }
  | { type: 'SET_DISCOVERY_CODE'; payload: string }
  | { type: 'LOAD_EXISTING_CARD'; payload: any }
  | { type: 'RESET_FORM' };

type GlitchAction =
  | { type: 'SET_GLITCH_ENABLED'; payload: boolean }
  | { type: 'SET_GLITCH_FIELD'; field: keyof GlitchPuzzleState; payload: any }
  | { type: 'SET_GLITCH_DIFFICULTY'; payload: 'easy' | 'normal' | 'hard' | 'custom' }
  | { type: 'RESET_GLITCH' };

type MegaAction =
  | { type: 'SET_MEGA_FIELD'; field: keyof MegaClueState; payload: any }
  | { type: 'ADD_REQUIRED_PUZZLE'; payload: string }
  | { type: 'REMOVE_REQUIRED_PUZZLE'; payload: string }
  | { type: 'RESET_MEGA' };

type ForensicAction =
  | { type: 'SET_FORENSIC_FIELD'; field: keyof ForensicState; payload: any }
  | { type: 'RESET_FORENSIC' };

export type ClueFormAction = BasicAction | GlitchAction | MegaAction | ForensicAction;

// ===== INITIAL STATES =====
export const initialBasicState: ClueBasicState = {
  title: '',
  descPublic: '',
  descHidden: '',
  tags: '',
  evidenceType: 'document',
  isHidden: false,
  discoveryCode: '',
  imgFile: null,
};

export const initialGlitchState: GlitchPuzzleState = {
  enabled: false,
  focusedImageFile: null,
  startFrequency: 60,
  startShift: 30,
  startChromatic: 15,
  correctFrequency: 60,
  correctShift: 30,
  correctChromatic: 15,
  difficulty: 'normal',
  toleranceFreq: 5,
  toleranceShift: 5,
  toleranceChroma: 5,
  accessInstructions: '',
  hint: '',
  keyword: '',
  rewardCode: '',
};

export const initialMegaState: MegaClueState = {
  finalTruthText: '',
  imageFile: null,
  requiredPuzzleIds: [],
  selectedPuzzle: '',
};

export const initialForensicState: ForensicState = {
  baseImage: null,
  hiddenImage: null,
  targetChannel: 'R',
  processing: false,
  showEditor: false,
};

export const initialMediaVisibility: MediaVisibilityState = {
  audioBase: 'always',
  audioHidden: 'post_solve',
  visual: 'glitch_active',
  uvLayer: 'post_keyword',
};

// ===== REDUCERS =====
export function basicReducer(state: ClueBasicState, action: BasicAction): ClueBasicState {
  switch (action.type) {
    case 'SET_TITLE':
      return { ...state, title: action.payload };
    case 'SET_DESC_PUBLIC':
      return { ...state, descPublic: action.payload };
    case 'SET_DESC_HIDDEN':
      return { ...state, descHidden: action.payload };
    case 'SET_TAGS':
      return { ...state, tags: action.payload };
    case 'SET_EVIDENCE_TYPE':
      return { ...state, evidenceType: action.payload };
    case 'SET_IS_HIDDEN':
      return { ...state, isHidden: action.payload };
    case 'SET_DISCOVERY_CODE':
      return { ...state, discoveryCode: action.payload };
    case 'LOAD_EXISTING_CARD':
      return {
        title: action.payload.title || '',
        descPublic: action.payload.description_public || '',
        descHidden: action.payload.description_hidden || '',
        tags: action.payload.tags || '',
        evidenceType: action.payload.type || 'document',
        isHidden: action.payload.is_hidden || false,
        discoveryCode: action.payload.discovery_code || '',
        imgFile: action.payload.img_file || null,
      };
    case 'RESET_FORM':
      return initialBasicState;
    default:
      return state;
  }
}

export function glitchReducer(state: GlitchPuzzleState, action: GlitchAction): GlitchPuzzleState {
  switch (action.type) {
    case 'SET_GLITCH_ENABLED':
      return { ...state, enabled: action.payload };
    case 'SET_GLITCH_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'SET_GLITCH_DIFFICULTY':
      const tolerances = {
        easy: { freq: 10, shift: 10, chroma: 10 },
        normal: { freq: 5, shift: 5, chroma: 5 },
        hard: { freq: 2, shift: 2, chroma: 2 },
        custom: { freq: state.toleranceFreq, shift: state.toleranceShift, chroma: state.toleranceChroma },
      };
      const t = tolerances[action.payload];
      return {
        ...state,
        difficulty: action.payload,
        toleranceFreq: t.freq,
        toleranceShift: t.shift,
        toleranceChroma: t.chroma,
      };
    case 'RESET_GLITCH':
      return initialGlitchState;
    default:
      return state;
  }
}

export function megaReducer(state: MegaClueState, action: MegaAction): MegaClueState {
  switch (action.type) {
    case 'SET_MEGA_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'ADD_REQUIRED_PUZZLE':
      return {
        ...state,
        requiredPuzzleIds: [...state.requiredPuzzleIds, action.payload],
      };
    case 'REMOVE_REQUIRED_PUZZLE':
      return {
        ...state,
        requiredPuzzleIds: state.requiredPuzzleIds.filter(id => id !== action.payload),
      };
    case 'RESET_MEGA':
      return initialMegaState;
    default:
      return state;
  }
}

export function forensicReducer(state: ForensicState, action: ForensicAction): ForensicState {
  switch (action.type) {
    case 'SET_FORENSIC_FIELD':
      return { ...state, [action.field]: action.payload };
    case 'RESET_FORENSIC':
      return initialForensicState;
    default:
      return state;
  }
}
