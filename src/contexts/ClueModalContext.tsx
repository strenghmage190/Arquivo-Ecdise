import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  FieldVisibilityConfig,
  defaultFieldVisibility,
} from '../config/fieldVisibilityConfig';
import {
  DisplayConfig,
  defaultDisplayConfig,
} from '../config/displayConfig';
import { InvestigationCardInsight } from '../api/investigations';
import { fetchClueSecretForGM, PaceMode } from '../api/clueSecurity';
import {
  FilterTransformRect,
  hydrateClueStateFromCard,
  mergeDisplayConfig,
  mergeFieldVisibilityConfig,
  normalizePersonStatus,
} from '../utils/cluePayloadBuilder';
import type { UVAuthoringState } from '../components/tools/uveditor/types';
import type { ThermalElement, ThermalPalette } from '../components/tools/ThermalEditor';
import type {
  AudioStudioMetadata,
  DeviceExtractionMetadata,
  PhysicalDocumentMetadata,
} from '../types/forensicPillars';

export type { DisplayConfig, FilterTransformRect };
export { defaultDisplayConfig };

export interface CoreState {
  title: string;
  descPublic: string;
  descHidden: string;
  tags: string;
  discoveryCode: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  isHidden: boolean;
}

export interface FilterConfig {
  brightness: number;
  contrast: number;
  saturate: number;
  transform: FilterTransformRect | null;
}

export interface ThermalConfig {
  enabled: boolean;
  secretText: string;
  keyword: string;
  fontSize: number;
  positionY: number;
  palette?: ThermalPalette;
  elements?: ThermalElement[];
}

export interface ChatEntry {
  id?: string;
  sender: 'me' | 'them' | 'system';
  type: 'text' | 'image';
  text: string;
  image_url?: string;
  time?: string;
}

export interface PhoneState {
  hasKeypad: boolean;
  password: string;
  lockType: 'pin' | 'pattern';
  contactName: string;
  chatList: ChatEntry[];
}

export interface PersonState {
  isPerson: boolean;
  name: string;
  age: string;
  profession: string;
  status: string;
  details: string;
}

export interface MetadataState {
  fakeDate: string;
  fakeLocation: string;
  technicalNote: string;
  fakeMetaCam: string;
  fakeMetaGps: string;
  fakeMetaOwner: string;
  stamp: string;
  externalLink: string;
}

export interface EditorState {
  editorMode: 'uv' | 'filter' | 'rgb' | null;
  uvEditorBaseUrl: string | null;
  uvEditorPurpose: 'forensic' | null;
  filterInitialImage: File | null;
  showAudioForgeFor: 'hidden' | 'base' | null;
  showGlitchDesigner: boolean;
  showKeypadEditor: boolean;
  showForensicEditor: boolean;
  showThermalEditor: boolean;
}

export interface SecurityState {
  isLocked: boolean;
  lockPass: string;
  lockPasses: string[];
  paceMode: PaceMode;
  rewardCardIds: string[];
  assistHint: string;
  securityLayerEnabled: boolean;
  revealLogicMode: 'always_visible' | 'aligned_only' | 'aligned_keyword';
  signalTargets: { visual: boolean; audio: boolean };
  hidePreviewOnBoard: boolean;
  audioStaticSync: boolean;
  narrativeLinks: { audioHintsVisual: boolean; visualHintsCode: boolean; hintNote: string };
}

export interface MediaState {
  imgFile: File | null;
  videoFile: File | null;
  uvFile: File | null;
  filterFile: File | null;
  audioBase: File | null;
  audioHidden: File | null;
  megaImageFile: File | null;
  thermalFile: File | null;
  forensicFile: File | null;
  forensicPreviewUrl: string | null;
  forensicTargetChannel: 'R' | 'G' | 'B' | null;
  uvAuthoringState?: UVAuthoringState | null;
  previewUrl: string | null;
  videoPreviewUrl: string | null;
  uvPreviewUrl: string | null;
  filterPreviewUrl: string | null;
  audioBasePreview: string | null;
  audioHiddenPreview: string | null;
  megaImagePreview: string | null;
  thermalPreviewUrl: string | null;
  videoUrl: string | null;
  videoUrlInput: string;
  audioHiddenUploadedUrl: string | null;
  audioTargetFreq: number;
  removedImage: boolean;
  removedVideo: boolean;
  removedUv: boolean;
  removedFilter: boolean;
  removedThermal: boolean;
  removedForensic: boolean;
  removedAudioBase: boolean;
  removedAudioHidden: boolean;
  removedGlitchFocused: boolean;
  removedMegaImage: boolean;
}

export interface CipherState {
  isShredded: boolean;
  shredRows: number;
  shredCols: number;
  realText: string;
  cipherText: string;
  hexCode: string;
  hexEncodingMethod: 'plain' | 'utf8hex' | 'xor' | 'enigma';
  hexEncodingKey: string;
}

export interface GlitchState {
  glitchCorrectFrequency: number;
  glitchCorrectShift: number;
  glitchCorrectChromatic: number;
  glitchRewardCode: string;
  glitchKeyword: string;
  glitchRequireKeyword: boolean;
  glitchUnlockMode: 'code' | 'code_plus_keyword' | 'media' | 'media_and_code';
  glitchDifficulty: 'easy' | 'normal' | 'hard' | 'custom';
  glitchToleranceFreq: number;
  glitchToleranceShift: number;
  glitchToleranceChroma: number;
  glitchFocusedImageFile: File | null;
  glitchFocusedImagePreview: string | null;
  showGlitchDesigner: boolean;
  glitchHiddenAudioUrl: string;
  glitchHiddenVideoUrl: string;
  glitchHint: string;
  glitchAccessInstructions: string;
  glitchStartFrequency: number;
  glitchStartShift: number;
  glitchStartChromatic: number;
}

export interface MegaClueState {
  megaFinalTruthText: string;
  megaImageFile: File | null;
  megaImagePreview: string | null;
  megaRequiredPuzzleIds: string[];
}

export interface MediaVisibility {
  audioBase: 'always' | 'glitch_only' | 'post_solve';
  audioHidden: 'post_solve' | 'post_keyword' | 'always';
  visual: 'glitch_active' | 'post_keyword' | 'always';
  uvLayer: 'post_keyword' | 'always' | 'post_solve';
}

export const defaultMediaVisibility: MediaVisibility = {
  audioBase: 'always',
  audioHidden: 'post_solve',
  visual: 'glitch_active',
  uvLayer: 'post_keyword',
};

export type ClueArchetype =
  | 'quick'
  | 'forensic_doc'
  | 'secret_audio'
  | 'puzzle_lock'
  | 'fake_phone'
  | 'mega_clue'
  | 'complete';

export type CreatorMode = 'quick' | 'complete';

export interface ClueModalContextType {
  investigationId: string;
  activeTab: string;
  setActiveTab: (tabId: string) => void;
  creatorMode: CreatorMode;
  setCreatorMode: React.Dispatch<React.SetStateAction<CreatorMode>>;
  isDuplicateMode: boolean;
  setIsDuplicateMode: React.Dispatch<React.SetStateAction<boolean>>;
  duplicateSourceCard: any | null;
  setDuplicateSourceCard: React.Dispatch<React.SetStateAction<any | null>>;

  coreState: CoreState;
  setCoreState: React.Dispatch<React.SetStateAction<CoreState>>;

  securityState: SecurityState;
  setSecurityState: React.Dispatch<React.SetStateAction<SecurityState>>;

  mediaState: MediaState;
  setMediaState: React.Dispatch<React.SetStateAction<MediaState>>;

  cipherState: CipherState;
  setCipherState: React.Dispatch<React.SetStateAction<CipherState>>;

  glitchState: GlitchState;
  setGlitchState: React.Dispatch<React.SetStateAction<GlitchState>>;

  megaClueState: MegaClueState;
  setMegaClueState: React.Dispatch<React.SetStateAction<MegaClueState>>;

  editorState: EditorState;
  setEditorState: React.Dispatch<React.SetStateAction<EditorState>>;

  filterConfig: FilterConfig;
  setFilterConfig: React.Dispatch<React.SetStateAction<FilterConfig>>;

  thermalConfig: ThermalConfig;
  setThermalConfig: React.Dispatch<React.SetStateAction<ThermalConfig>>;

  phoneState: PhoneState;
  setPhoneState: React.Dispatch<React.SetStateAction<PhoneState>>;

  deviceExtraction: DeviceExtractionMetadata | null;
  setDeviceExtraction: React.Dispatch<React.SetStateAction<DeviceExtractionMetadata | null>>;

  audioStudioMeta: AudioStudioMetadata | null;
  setAudioStudioMeta: React.Dispatch<React.SetStateAction<AudioStudioMetadata | null>>;

  physicalDocument: PhysicalDocumentMetadata | null;
  setPhysicalDocument: React.Dispatch<React.SetStateAction<PhysicalDocumentMetadata | null>>;

  personState: PersonState;
  setPersonState: React.Dispatch<React.SetStateAction<PersonState>>;

  metadataState: MetadataState;
  setMetadataState: React.Dispatch<React.SetStateAction<MetadataState>>;

  fieldVisibilityConfig: FieldVisibilityConfig;
  setFieldVisibilityConfig: React.Dispatch<React.SetStateAction<FieldVisibilityConfig>>;

  displayConfig: DisplayConfig;
  setDisplayConfig: React.Dispatch<React.SetStateAction<DisplayConfig>>;

  mediaVisibility: MediaVisibility;
  setMediaVisibility: React.Dispatch<React.SetStateAction<MediaVisibility>>;

  insights: InvestigationCardInsight[];
  setInsights: React.Dispatch<React.SetStateAction<InvestigationCardInsight[]>>;

  cardStatus: string | null;
  setCardStatus: React.Dispatch<React.SetStateAction<string | null>>;

  registerUrl: (url: string | null | undefined) => void;
  revokeUrl: (url: string | null | undefined) => void;

  resetForm: (options?: { defaultHidden?: boolean }) => void;
  loadExistingCard: (card: any) => void;
  loadCardAsDuplicate: (card: any) => void;
  applyArchetype: (archetype: ClueArchetype) => void;
  getTemplateSnapshot: () => Record<string, any>;
  applyTemplateData: (data: any) => void;
}

// Persist the Context object on globalThis so Vite HMR module reloads
// (?t=... cache-busted instances) never create a mismatched Context reference.
const CLUE_MODAL_CONTEXT_KEY = '__ECDISE_CLUE_MODAL_CONTEXT__';
const ClueModalContext: React.Context<ClueModalContextType | undefined> =
  ((globalThis as Record<string, any>)[CLUE_MODAL_CONTEXT_KEY] ??=
    createContext<ClueModalContextType | undefined>(undefined));

const createInitialMediaState = (): MediaState => ({
  imgFile: null,
  videoFile: null,
  uvFile: null,
  filterFile: null,
  audioBase: null,
  audioHidden: null,
  megaImageFile: null,
  thermalFile: null,
  forensicFile: null,
  forensicPreviewUrl: null,
  forensicTargetChannel: null,
  uvAuthoringState: null,
  previewUrl: null,
  videoPreviewUrl: null,
  uvPreviewUrl: null,
  filterPreviewUrl: null,
  audioBasePreview: null,
  audioHiddenPreview: null,
  megaImagePreview: null,
  thermalPreviewUrl: null,
  videoUrl: null,
  videoUrlInput: '',
  audioHiddenUploadedUrl: null,
  audioTargetFreq: 50,
  removedImage: false,
  removedVideo: false,
  removedUv: false,
  removedFilter: false,
  removedThermal: false,
  removedForensic: false,
  removedAudioBase: false,
  removedAudioHidden: false,
  removedGlitchFocused: false,
  removedMegaImage: false,
});

export const ClueModalProvider: React.FC<{
  children: React.ReactNode;
  investigationId?: string;
}> = ({ children, investigationId = '' }) => {
  const [activeTab, setActiveTab] = useState<string>('geral');
  const [creatorMode, setCreatorMode] = useState<CreatorMode>('complete');
  const [isDuplicateMode, setIsDuplicateMode] = useState<boolean>(false);
  const [duplicateSourceCard, setDuplicateSourceCard] = useState<any | null>(null);

  const [coreState, setCoreState] = useState<CoreState>({
    title: '',
    descPublic: '',
    descHidden: '',
    tags: '',
    discoveryCode: '',
    evidenceType: 'document',
    isHidden: false,
  });

  const [securityState, setSecurityState] = useState<SecurityState>({
    isLocked: false,
    lockPass: '',
    lockPasses: [],
    paceMode: 'in_session',
    rewardCardIds: [],
    assistHint: '',
    securityLayerEnabled: false,
    revealLogicMode: 'aligned_only',
    signalTargets: { visual: true, audio: false },
    hidePreviewOnBoard: false,
    audioStaticSync: false,
    narrativeLinks: { audioHintsVisual: false, visualHintsCode: false, hintNote: '' },
  });

  const [mediaState, setMediaState] = useState<MediaState>(createInitialMediaState);

  const [cipherState, setCipherState] = useState<CipherState>({
    isShredded: false,
    shredRows: 1,
    shredCols: 8,
    realText: '',
    cipherText: '',
    hexCode: '',
    hexEncodingMethod: 'plain',
    hexEncodingKey: '',
  });

  const [glitchState, setGlitchState] = useState<GlitchState>({
    glitchCorrectFrequency: 17,
    glitchCorrectShift: 33,
    glitchCorrectChromatic: 12,
    glitchRewardCode: 'ALPHA-01',
    glitchKeyword: '',
    glitchRequireKeyword: false,
    glitchUnlockMode: 'code',
    glitchDifficulty: 'hard',
    glitchToleranceFreq: 1,
    glitchToleranceShift: 2,
    glitchToleranceChroma: 2,
    glitchFocusedImageFile: null,
    glitchFocusedImagePreview: null,
    showGlitchDesigner: false,
    glitchHiddenAudioUrl: '',
    glitchHiddenVideoUrl: '',
    glitchHint: '',
    glitchAccessInstructions: '',
    glitchStartFrequency: 12,
    glitchStartShift: 20,
    glitchStartChromatic: 8,
  });

  const [megaClueState, setMegaClueState] = useState<MegaClueState>({
    megaFinalTruthText: '',
    megaImageFile: null,
    megaImagePreview: null,
    megaRequiredPuzzleIds: [],
  });

  const [editorState, setEditorState] = useState<EditorState>({
    editorMode: null,
    uvEditorBaseUrl: null,
    uvEditorPurpose: null,
    filterInitialImage: null,
    showAudioForgeFor: null,
    showGlitchDesigner: false,
    showKeypadEditor: false,
    showForensicEditor: false,
    showThermalEditor: false,
  });

  const [filterConfig, setFilterConfig] = useState<FilterConfig>({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    transform: null,
  });

  const [thermalConfig, setThermalConfig] = useState<ThermalConfig>({
    enabled: false,
    secretText: '',
    keyword: '',
    fontSize: 24,
    positionY: 50,
    palette: 'ironbow',
    elements: undefined,
  });

  const [phoneState, setPhoneState] = useState<PhoneState>({
    hasKeypad: false,
    password: '',
    lockType: 'pin',
    contactName: 'Desconhecido',
    chatList: [],
  });
  const [deviceExtraction, setDeviceExtraction] = useState<DeviceExtractionMetadata | null>(null);
  const [audioStudioMeta, setAudioStudioMeta] = useState<AudioStudioMetadata | null>(null);
  const [physicalDocument, setPhysicalDocument] = useState<PhysicalDocumentMetadata | null>(null);

  const [personState, setPersonState] = useState<PersonState>({
    isPerson: false,
    name: '',
    age: '',
    profession: '',
    status: 'UNKNOWN',
    details: '',
  });

  const [metadataState, setMetadataState] = useState<MetadataState>({
    fakeDate: '',
    fakeLocation: '',
    technicalNote: '',
    fakeMetaCam: '',
    fakeMetaGps: '',
    fakeMetaOwner: '',
    stamp: '',
    externalLink: '',
  });

  const [fieldVisibilityConfig, setFieldVisibilityConfig] =
    useState<FieldVisibilityConfig>(() => mergeFieldVisibilityConfig(defaultFieldVisibility));
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig>(() =>
    mergeDisplayConfig(defaultDisplayConfig)
  );
  const [mediaVisibility, setMediaVisibility] =
    useState<MediaVisibility>(defaultMediaVisibility);
  const [insights, setInsights] = useState<InvestigationCardInsight[]>([]);
  const [cardStatus, setCardStatus] = useState<string | null>(null);

  // Blob URL lifecycle management
  const urlsRef = React.useRef<Set<string>>(new Set());

  const registerUrl = (url: string | null | undefined) => {
    if (url && url.startsWith('blob:')) {
      urlsRef.current.add(url);
    }
  };

  const revokeUrl = (url: string | null | undefined) => {
    if (url && urlsRef.current.has(url)) {
      try {
        URL.revokeObjectURL(url);
      } catch {
        // ignore revoke errors
      }
      urlsRef.current.delete(url);
    }
  };

  useEffect(() => {
    return () => {
      urlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {
          // ignore
        }
      });
      urlsRef.current.clear();
    };
  }, []);

  const resetForm = (options?: { defaultHidden?: boolean }) => {
    setCoreState({
      title: '',
      descPublic: '',
      descHidden: '',
      tags: '',
      discoveryCode: '',
      evidenceType: 'document',
      isHidden: Boolean(options?.defaultHidden),
    });
    setSecurityState({
      isLocked: false,
      lockPass: '',
      lockPasses: [],
      paceMode: 'in_session',
      rewardCardIds: [],
      assistHint: '',
      securityLayerEnabled: false,
      revealLogicMode: 'aligned_only',
      signalTargets: { visual: true, audio: false },
      hidePreviewOnBoard: false,
      audioStaticSync: false,
      narrativeLinks: { audioHintsVisual: false, visualHintsCode: false, hintNote: '' },
    });
    setMediaState(createInitialMediaState());
    setCipherState({
      isShredded: false,
      shredRows: 1,
      shredCols: 8,
      realText: '',
      cipherText: '',
      hexCode: '',
      hexEncodingMethod: 'plain',
      hexEncodingKey: '',
    });
    setGlitchState({
      glitchCorrectFrequency: 17,
      glitchCorrectShift: 33,
      glitchCorrectChromatic: 12,
      glitchRewardCode: 'ALPHA-01',
      glitchKeyword: '',
      glitchRequireKeyword: false,
      glitchUnlockMode: 'code',
      glitchDifficulty: 'hard',
      glitchToleranceFreq: 1,
      glitchToleranceShift: 2,
      glitchToleranceChroma: 2,
      glitchFocusedImageFile: null,
      glitchFocusedImagePreview: null,
      showGlitchDesigner: false,
      glitchHiddenAudioUrl: '',
      glitchHiddenVideoUrl: '',
      glitchHint: '',
      glitchAccessInstructions: '',
      glitchStartFrequency: 12,
      glitchStartShift: 20,
      glitchStartChromatic: 8,
    });
    setMegaClueState({
      megaFinalTruthText: '',
      megaImageFile: null,
      megaImagePreview: null,
      megaRequiredPuzzleIds: [],
    });
    setPersonState({
      isPerson: false,
      name: '',
      age: '',
      profession: '',
      status: 'UNKNOWN',
      details: '',
    });
    setMetadataState({
      fakeDate: '',
      fakeLocation: '',
      technicalNote: '',
      fakeMetaCam: '',
      fakeMetaGps: '',
      fakeMetaOwner: '',
      stamp: '',
      externalLink: '',
    });
    setPhoneState({
      hasKeypad: false,
      password: '',
      lockType: 'pin',
      contactName: 'Desconhecido',
      chatList: [],
    });
    setThermalConfig({
      enabled: false,
      secretText: '',
      keyword: '',
      fontSize: 24,
      positionY: 50,
      palette: 'ironbow',
      elements: undefined,
    });
    setFilterConfig({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      transform: null,
    });
    setEditorState({
      editorMode: null,
      uvEditorBaseUrl: null,
      uvEditorPurpose: null,
      filterInitialImage: null,
      showAudioForgeFor: null,
      showGlitchDesigner: false,
      showKeypadEditor: false,
      showForensicEditor: false,
      showThermalEditor: false,
    });
    setFieldVisibilityConfig(mergeFieldVisibilityConfig(defaultFieldVisibility));
    setDisplayConfig(mergeDisplayConfig(defaultDisplayConfig));
    setMediaVisibility(defaultMediaVisibility);
    setInsights([]);
    setCardStatus(null);
    setDeviceExtraction(null);
    setAudioStudioMeta(null);
    setPhysicalDocument(null);
    setIsDuplicateMode(false);
    setDuplicateSourceCard(null);
  };

  const loadExistingCard = (card: any) => {
    const hydrated = hydrateClueStateFromCard(card);
    setCoreState(hydrated.coreState);
    setSecurityState(hydrated.securityState);
    if (card?.id && card?.is_locked && !card?.lock_password) {
      fetchClueSecretForGM(String(card.id)).then((secret) => {
        if (secret) {
          setSecurityState((prev) => ({
            ...prev,
            lockPass: secret.secret_value || prev.lockPass,
            assistHint: secret.assist_hint || prev.assistHint,
          }));
        }
      });
    }
    setMediaState(hydrated.mediaState);
    setCipherState(hydrated.cipherState);
    setGlitchState(hydrated.glitchState);
    setMegaClueState(hydrated.megaClueState);
    setFilterConfig(hydrated.filterConfig);
    setThermalConfig(hydrated.thermalConfig);
    setPhoneState(hydrated.phoneState as PhoneState);
    setPersonState(hydrated.personState);
    setMetadataState(hydrated.metadataState);
    setDisplayConfig(hydrated.displayConfig);
    setFieldVisibilityConfig(hydrated.fieldVisibilityConfig);
    setMediaVisibility(hydrated.mediaVisibility);
    setInsights(hydrated.insights);
    setCardStatus(hydrated.cardStatus);
    setDeviceExtraction(hydrated.deviceExtraction || null);
    setAudioStudioMeta(hydrated.audioStudioMeta || null);
    setPhysicalDocument(hydrated.physicalDocument || null);
    setIsDuplicateMode(false);
    setDuplicateSourceCard(null);
  };

  const loadCardAsDuplicate = (card: any) => {
    if (!card) return;
    loadExistingCard(card);
    setCoreState((prev) => ({
      ...prev,
      title: `${card.title || prev.title || 'Evidência'} (Cópia)`,
    }));
    setCardStatus(null);
    setIsDuplicateMode(true);
    setDuplicateSourceCard(card);
  };

  const applyArchetype = (archetype: ClueArchetype) => {
    switch (archetype) {
      case 'quick':
        setCreatorMode('quick');
        setActiveTab('geral');
        break;
      case 'forensic_doc':
        setCreatorMode('complete');
        setCoreState((prev) => ({ ...prev, evidenceType: 'document' }));
        setActiveTab('visual');
        break;
      case 'secret_audio':
        setCreatorMode('complete');
        setCoreState((prev) => ({ ...prev, evidenceType: 'document' }));
        setActiveTab('audio');
        break;
      case 'puzzle_lock':
        setCreatorMode('complete');
        setCoreState((prev) => ({ ...prev, evidenceType: 'glitch_puzzle' }));
        setSecurityState((prev) => ({ ...prev, securityLayerEnabled: true }));
        setActiveTab('glitch');
        break;
      case 'fake_phone':
        setCreatorMode('complete');
        setCoreState((prev) => ({ ...prev, evidenceType: 'document' }));
        setActiveTab('seguranca');
        break;
      case 'mega_clue':
        setCreatorMode('complete');
        setCoreState((prev) => ({ ...prev, evidenceType: 'mega_clue' }));
        setActiveTab('mega');
        break;
      case 'complete':
      default:
        setCreatorMode('complete');
        setActiveTab('geral');
        break;
    }
  };

  const getTemplateSnapshot = (): Record<string, any> => ({
    coreState,
    securityState,
    mediaState: {
      audioTargetFreq: mediaState.audioTargetFreq,
      forensicTargetChannel: mediaState.forensicTargetChannel,
      videoUrlInput: mediaState.videoUrlInput,
    },
    cipherState,
    glitchState: {
      ...glitchState,
      glitchFocusedImageFile: null,
      glitchFocusedImagePreview: null,
    },
    megaClueState: {
      ...megaClueState,
      megaImageFile: null,
      megaImagePreview: null,
    },
    filterConfig,
    thermalConfig,
    phoneState,
    deviceExtraction,
    audioStudioMeta,
    physicalDocument,
    personState,
    metadataState,
    fieldVisibilityConfig,
    displayConfig,
    mediaVisibility,
    insights,
    cardStatus,
  });

  const applyTemplateData = (data: any) => {
    if (!data || typeof data !== 'object') return;

    // Structured snapshot format (Unified / Onda A+)
    if (data.coreState || data.securityState || data.cipherState || data.glitchState) {
      if (data.coreState) setCoreState((prev) => ({ ...prev, ...data.coreState }));
      if (data.securityState) {
        setSecurityState((prev) => ({ ...prev, ...data.securityState }));
      }
      if (data.mediaState) {
        setMediaState((prev) => ({
          ...prev,
          audioTargetFreq: data.mediaState.audioTargetFreq ?? prev.audioTargetFreq,
          forensicTargetChannel:
            data.mediaState.forensicTargetChannel ?? prev.forensicTargetChannel,
          videoUrlInput: data.mediaState.videoUrlInput ?? prev.videoUrlInput,
        }));
      }
      if (data.cipherState) setCipherState((prev) => ({ ...prev, ...data.cipherState }));
      if (data.glitchState) {
        setGlitchState((prev) => ({
          ...prev,
          ...data.glitchState,
          glitchFocusedImageFile: null,
          glitchFocusedImagePreview: prev.glitchFocusedImagePreview,
        }));
      }
      if (data.megaClueState) {
        setMegaClueState((prev) => ({
          ...prev,
          ...data.megaClueState,
          megaImageFile: null,
          megaImagePreview: prev.megaImagePreview,
        }));
      }
      if (data.filterConfig) {
        setFilterConfig((prev) => ({ ...prev, ...data.filterConfig }));
      }
      if (data.thermalConfig) {
        setThermalConfig((prev) => ({ ...prev, ...data.thermalConfig }));
      }
      if (data.phoneState) setPhoneState((prev) => ({ ...prev, ...data.phoneState }));
      if (data.deviceExtraction !== undefined) setDeviceExtraction(data.deviceExtraction);
      if (data.audioStudioMeta !== undefined) setAudioStudioMeta(data.audioStudioMeta);
      if (data.physicalDocument !== undefined) setPhysicalDocument(data.physicalDocument);
      if (data.personState) {
        setPersonState((prev) => ({
          ...prev,
          ...data.personState,
          status: data.personState.status
            ? normalizePersonStatus(data.personState.status)
            : prev.status,
        }));
      }
      if (data.metadataState) {
        setMetadataState((prev) => ({ ...prev, ...data.metadataState }));
      }
      if (data.fieldVisibilityConfig) {
        setFieldVisibilityConfig(mergeFieldVisibilityConfig(data.fieldVisibilityConfig));
      }
      if (data.displayConfig) {
        setDisplayConfig(mergeDisplayConfig(data.displayConfig));
      }
      if (data.mediaVisibility) {
        setMediaVisibility((prev) => ({ ...prev, ...data.mediaVisibility }));
      }
      if (Array.isArray(data.insights)) setInsights(data.insights);
      if (data.cardStatus !== undefined) setCardStatus(data.cardStatus);
      return;
    }

    // Legacy flat template_data compatibility
    setCoreState((prev) => ({
      ...prev,
      ...(data.title !== undefined && { title: data.title }),
      ...(data.descPublic !== undefined && { descPublic: data.descPublic }),
      ...(data.descHidden !== undefined && { descHidden: data.descHidden }),
      ...(data.tags !== undefined && {
        tags: Array.isArray(data.tags) ? data.tags.join(', ') : data.tags,
      }),
      ...(data.discoveryCode !== undefined && { discoveryCode: data.discoveryCode }),
      ...(data.evidenceType !== undefined && { evidenceType: data.evidenceType }),
      ...(data.isHidden !== undefined && { isHidden: Boolean(data.isHidden) }),
    }));

    setSecurityState((prev) => ({
      ...prev,
      ...(data.isLocked !== undefined && { isLocked: Boolean(data.isLocked) }),
      ...(data.lockPass !== undefined && { lockPass: data.lockPass }),
      ...(data.lockPasses !== undefined && { lockPasses: data.lockPasses }),
      ...(data.securityLayerEnabled !== undefined && {
        securityLayerEnabled: Boolean(data.securityLayerEnabled),
      }),
      ...(data.revealLogicMode !== undefined && { revealLogicMode: data.revealLogicMode }),
      ...(data.signalTargets !== undefined && { signalTargets: data.signalTargets }),
      ...(data.hidePreviewOnBoard !== undefined && {
        hidePreviewOnBoard: Boolean(data.hidePreviewOnBoard),
      }),
      ...(data.audioStaticSync !== undefined && {
        audioStaticSync: Boolean(data.audioStaticSync),
      }),
      ...(data.narrativeLinks !== undefined && { narrativeLinks: data.narrativeLinks }),
    }));

    setMediaState((prev) => ({
      ...prev,
      ...(data.freq !== undefined && { audioTargetFreq: Number(data.freq) || 50 }),
      ...(data.audioTargetFreq !== undefined && {
        audioTargetFreq: Number(data.audioTargetFreq) || 50,
      }),
      ...(data.forensicTargetChannel !== undefined && {
        forensicTargetChannel: data.forensicTargetChannel,
      }),
    }));

    setCipherState((prev) => ({
      ...prev,
      ...(data.isShredded !== undefined && { isShredded: Boolean(data.isShredded) }),
      ...(data.shredRows !== undefined && { shredRows: Number(data.shredRows) || 1 }),
      ...(data.shredCols !== undefined && { shredCols: Number(data.shredCols) || 8 }),
      ...(data.realText !== undefined && { realText: data.realText }),
      ...(data.cipherText !== undefined && { cipherText: data.cipherText }),
      ...(data.hexCode !== undefined && { hexCode: data.hexCode }),
      ...(data.hexEncodingMethod !== undefined && {
        hexEncodingMethod: data.hexEncodingMethod,
      }),
      ...(data.hexEncodingKey !== undefined && { hexEncodingKey: data.hexEncodingKey }),
    }));

    setGlitchState((prev) => ({
      ...prev,
      ...(data.glitchStartFrequency !== undefined && {
        glitchStartFrequency: data.glitchStartFrequency,
      }),
      ...(data.glitchStartShift !== undefined && {
        glitchStartShift: data.glitchStartShift,
      }),
      ...(data.glitchStartChromatic !== undefined && {
        glitchStartChromatic: data.glitchStartChromatic,
      }),
      ...(data.glitchCorrectFrequency !== undefined && {
        glitchCorrectFrequency: data.glitchCorrectFrequency,
      }),
      ...(data.glitchCorrectShift !== undefined && {
        glitchCorrectShift: data.glitchCorrectShift,
      }),
      ...(data.glitchCorrectChromatic !== undefined && {
        glitchCorrectChromatic: data.glitchCorrectChromatic,
      }),
      ...(data.glitchDifficulty !== undefined && {
        glitchDifficulty: data.glitchDifficulty,
      }),
      ...(data.glitchToleranceFreq !== undefined && {
        glitchToleranceFreq: data.glitchToleranceFreq,
      }),
      ...(data.glitchToleranceShift !== undefined && {
        glitchToleranceShift: data.glitchToleranceShift,
      }),
      ...(data.glitchToleranceChroma !== undefined && {
        glitchToleranceChroma: data.glitchToleranceChroma,
      }),
      ...(data.glitchAccessInstructions !== undefined && {
        glitchAccessInstructions: data.glitchAccessInstructions,
      }),
      ...(data.glitchHint !== undefined && { glitchHint: data.glitchHint }),
      ...(data.glitchKeyword !== undefined && { glitchKeyword: data.glitchKeyword }),
      ...(data.glitchUnlockMode !== undefined && {
        glitchUnlockMode: data.glitchUnlockMode,
      }),
      ...(data.glitchRequireKeyword !== undefined && {
        glitchRequireKeyword: Boolean(data.glitchRequireKeyword),
      }),
      ...(data.glitchRewardCode !== undefined && {
        glitchRewardCode: data.glitchRewardCode,
      }),
      ...(data.glitchHiddenAudioUrl !== undefined && {
        glitchHiddenAudioUrl: data.glitchHiddenAudioUrl,
      }),
      ...(data.glitchHiddenVideoUrl !== undefined && {
        glitchHiddenVideoUrl: data.glitchHiddenVideoUrl,
      }),
    }));

    setMegaClueState((prev) => ({
      ...prev,
      ...(data.megaFinalTruthText !== undefined && {
        megaFinalTruthText: data.megaFinalTruthText,
      }),
      ...(data.megaRequiredPuzzleIds !== undefined && {
        megaRequiredPuzzleIds: data.megaRequiredPuzzleIds,
      }),
    }));

    setFilterConfig((prev) => ({
      ...prev,
      ...(data.filterRevealBrightness !== undefined && {
        brightness: data.filterRevealBrightness,
      }),
      ...(data.filterRevealContrast !== undefined && {
        contrast: data.filterRevealContrast,
      }),
      ...(data.filterRevealSaturate !== undefined && {
        saturate: data.filterRevealSaturate,
      }),
      // transform da camada de tratamento é ignorado: sempre 100% alinhada à base
      transform: null,
    }));

    setThermalConfig((prev) => ({
      ...prev,
      ...(data.thermalEnabled !== undefined && { enabled: Boolean(data.thermalEnabled) }),
      ...(data.thermalSecretText !== undefined && { secretText: data.thermalSecretText }),
      ...(data.thermalFontSize !== undefined && { fontSize: data.thermalFontSize }),
      ...(data.thermalPositionY !== undefined && { positionY: data.thermalPositionY }),
      ...(data.thermalKeyword !== undefined && { keyword: data.thermalKeyword }),
    }));

    setPhoneState((prev) => ({
      ...prev,
      ...(data.phoneHasKeypad !== undefined && {
        hasKeypad: Boolean(data.phoneHasKeypad),
      }),
      ...(data.phonePassword !== undefined && { password: data.phonePassword }),
      ...(data.phoneLockType !== undefined && { lockType: data.phoneLockType }),
      ...(data.chatContactName !== undefined && { contactName: data.chatContactName }),
      ...(Array.isArray(data.editingChatList || data.chatData) && {
        chatList: data.editingChatList || data.chatData,
      }),
    }));

    setPersonState((prev) => ({
      ...prev,
      ...(data.isPerson !== undefined && { isPerson: Boolean(data.isPerson) }),
      ...(data.personName !== undefined && { name: data.personName }),
      ...(data.personDob !== undefined && { age: data.personDob }),
      ...(data.personStatus !== undefined && {
        status: normalizePersonStatus(data.personStatus),
      }),
      ...(data.personOccupation !== undefined && { profession: data.personOccupation }),
    }));

    setMetadataState((prev) => ({
      ...prev,
      ...(data.fakeDate !== undefined && { fakeDate: data.fakeDate }),
      ...(data.fakeLocation !== undefined && { fakeLocation: data.fakeLocation }),
      ...(data.technicalNote !== undefined && { technicalNote: data.technicalNote }),
      ...(data.fakeMeta?.date !== undefined && { fakeDate: data.fakeMeta.date }),
      ...(data.fakeMeta?.gps !== undefined && {
        fakeMetaGps: data.fakeMeta.gps,
        fakeLocation: data.fakeLocation || data.fakeMeta.gps,
      }),
      ...(data.fakeMeta?.owner !== undefined && { fakeMetaOwner: data.fakeMeta.owner }),
      ...(data.stamp !== undefined && { stamp: data.stamp }),
      ...(data.externalLink !== undefined && { externalLink: data.externalLink }),
    }));

    if (data.fieldVisibilityConfig) {
      setFieldVisibilityConfig(mergeFieldVisibilityConfig(data.fieldVisibilityConfig));
    }
    if (data.displayConfig) {
      setDisplayConfig(mergeDisplayConfig(data.displayConfig));
    }
    if (data.mediaVisibility) {
      setMediaVisibility((prev) => ({ ...prev, ...data.mediaVisibility }));
    }
  };

  return (
    <ClueModalContext.Provider
      value={{
        investigationId,
        activeTab,
        setActiveTab,
        creatorMode,
        setCreatorMode,
        isDuplicateMode,
        setIsDuplicateMode,
        duplicateSourceCard,
        setDuplicateSourceCard,
        coreState,
        setCoreState,
        securityState,
        setSecurityState,
        mediaState,
        setMediaState,
        deviceExtraction,
        setDeviceExtraction,
        audioStudioMeta,
        setAudioStudioMeta,
        physicalDocument,
        setPhysicalDocument,
        cipherState,
        setCipherState,
        glitchState,
        setGlitchState,
        megaClueState,
        setMegaClueState,
        editorState,
        setEditorState,
        filterConfig,
        setFilterConfig,
        thermalConfig,
        setThermalConfig,
        phoneState,
        setPhoneState,
        personState,
        setPersonState,
        metadataState,
        setMetadataState,
        fieldVisibilityConfig,
        setFieldVisibilityConfig,
        displayConfig,
        setDisplayConfig,
        mediaVisibility,
        setMediaVisibility,
        insights,
        setInsights,
        cardStatus,
        setCardStatus,
        registerUrl,
        revokeUrl,
        resetForm,
        loadExistingCard,
        loadCardAsDuplicate,
        applyArchetype,
        getTemplateSnapshot,
        applyTemplateData,
      }}
    >
      {children}
    </ClueModalContext.Provider>
  );
};

export const useClueModal = () => {
  const context = useContext(ClueModalContext);
  if (context === undefined) {
    throw new Error('useClueModal must be used within a ClueModalProvider');
  }
  return context;
};
