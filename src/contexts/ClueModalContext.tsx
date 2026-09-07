import React, { createContext, useContext, useState, useEffect } from 'react';
import { FieldVisibilityConfig, defaultFieldVisibility } from '../config/fieldVisibilityConfig';

// Define the shape of our state groupings
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
}

export interface ThermalConfig {
  enabled: boolean;
  secretText: string;
  keyword: string;
  fontSize: number;
  positionY: number;
}

export interface ChatEntry {
  sender: 'me' | 'them' | 'system';
  type: 'text' | 'image';
  text: string;
  image_url?: string;
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
  previewUrl: string | null;
  videoPreviewUrl: string | null;
  uvPreviewUrl: string | null;
  filterPreviewUrl: string | null;
  audioBasePreview: string | null;
  audioHiddenPreview: string | null;
  megaImagePreview: string | null;
  videoUrl: string | null;
  videoUrlInput: string;
  audioHiddenUploadedUrl: string | null;
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

export interface DisplayConfig {
  cipher: {
    showShredded: boolean;
    showCipherText: boolean;
    showRealText: boolean;
    showShredConfig: boolean;
  };
  megaClue: {
    showHints: boolean;
    showAnswer: boolean;
    showProgress: boolean;
  };
}

export interface MediaVisibility {
  audioBase: 'always' | 'glitch_only' | 'post_solve';
  audioHidden: 'post_solve' | 'post_keyword' | 'always';
  visual: 'glitch_active' | 'post_keyword' | 'always';
  uvLayer: 'post_keyword' | 'always' | 'post_solve';
}

export const defaultDisplayConfig: DisplayConfig = {
  cipher: {
    showShredded: true,
    showCipherText: true,
    showRealText: false,
    showShredConfig: false,
  },
  megaClue: {
    showHints: true,
    showAnswer: false,
    showProgress: true,
  },
};

export const defaultMediaVisibility: MediaVisibility = {
  audioBase: 'always',
  audioHidden: 'post_solve',
  visual: 'glitch_active',
  uvLayer: 'post_keyword',
};

export interface ClueModalContextType {
  // States
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
  
  // URL management
  registerUrl: (url: string | null | undefined) => void;
  revokeUrl: (url: string | null | undefined) => void;
  
  // Reset function
  resetForm: () => void;
  
  // Existing card load
  loadExistingCard: (card: any) => void;
}

const ClueModalContext = createContext<ClueModalContextType | undefined>(undefined);

export const ClueModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    securityLayerEnabled: false,
    revealLogicMode: 'aligned_only',
    signalTargets: { visual: true, audio: false },
    hidePreviewOnBoard: false,
    audioStaticSync: false,
    narrativeLinks: { audioHintsVisual: false, visualHintsCode: false, hintNote: '' },
  });

  const [mediaState, setMediaState] = useState<MediaState>({
    imgFile: null, videoFile: null, uvFile: null, filterFile: null, audioBase: null, audioHidden: null, megaImageFile: null,
    previewUrl: null, videoPreviewUrl: null, uvPreviewUrl: null, filterPreviewUrl: null, audioBasePreview: null,    audioHiddenPreview: null,
    megaImagePreview: null,
    videoUrl: null,
    videoUrlInput: '',
    audioHiddenUploadedUrl: null,
  });

  const [cipherState, setCipherState] = useState<CipherState>({
    isShredded: false,
    shredRows: 1,
    shredCols: 8,
    realText: '',
    cipherText: '',
    hexCode: '',
    hexEncodingMethod: 'plain',
    hexEncodingKey: ''
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
  });

  const [thermalConfig, setThermalConfig] = useState<ThermalConfig>({
    enabled: false,
    secretText: '',
    keyword: '',
    fontSize: 24,
    positionY: 50,
  });

  const [phoneState, setPhoneState] = useState<PhoneState>({
    hasKeypad: false,
    password: '',
    lockType: 'pin',
    contactName: 'Desconhecido',
    chatList: [],
  });

  const [personState, setPersonState] = useState<PersonState>({
    isPerson: false,
    name: '',
    age: '',
    profession: '',
    status: '',
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

  const [fieldVisibilityConfig, setFieldVisibilityConfig] = useState<FieldVisibilityConfig>(defaultFieldVisibility);
  const [displayConfig, setDisplayConfig] = useState<DisplayConfig>(defaultDisplayConfig);
  const [mediaVisibility, setMediaVisibility] = useState<MediaVisibility>(defaultMediaVisibility);

  // URL management for cleanup
  const urlsRef = React.useRef<Set<string>>(new Set());

  const registerUrl = (url: string | null | undefined) => {
    if (url) urlsRef.current.add(url);
  };

  const revokeUrl = (url: string | null | undefined) => {
    if (url && urlsRef.current.has(url)) {
      try { URL.revokeObjectURL(url); } catch (err) {}
      urlsRef.current.delete(url);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup all registered URLs on unmount
      urlsRef.current.forEach((u) => {
        try { URL.revokeObjectURL(u); } catch (err) {}
      });
      urlsRef.current.clear();
    };
  }, []);

  const resetForm = () => {
    setCoreState({ title: '', descPublic: '', descHidden: '', tags: '', discoveryCode: '', evidenceType: 'document', isHidden: false });
    setSecurityState({ isLocked: false, lockPass: '', lockPasses: [], securityLayerEnabled: false, revealLogicMode: 'aligned_only', signalTargets: { visual: true, audio: false }, hidePreviewOnBoard: false, audioStaticSync: false, narrativeLinks: { audioHintsVisual: false, visualHintsCode: false, hintNote: '' } });
    setMediaState({
      imgFile: null, videoFile: null, uvFile: null, filterFile: null, audioBase: null, audioHidden: null, megaImageFile: null,
      previewUrl: null, videoPreviewUrl: null, uvPreviewUrl: null, filterPreviewUrl: null, audioBasePreview: null, audioHiddenPreview: null, megaImagePreview: null,
      videoUrl: null, videoUrlInput: '', audioHiddenUploadedUrl: null
    });
    setCipherState({ isShredded: false, shredRows: 1, shredCols: 8, realText: '', cipherText: '', hexCode: '', hexEncodingMethod: 'plain', hexEncodingKey: '' });
    setGlitchState({ glitchCorrectFrequency: 17, glitchCorrectShift: 33, glitchCorrectChromatic: 12, glitchRewardCode: 'ALPHA-01', glitchKeyword: '', glitchRequireKeyword: false, glitchUnlockMode: 'code', glitchDifficulty: 'hard', glitchToleranceFreq: 1, glitchToleranceShift: 2, glitchToleranceChroma: 2, glitchFocusedImageFile: null, glitchFocusedImagePreview: null, showGlitchDesigner: false, glitchHiddenAudioUrl: '', glitchHiddenVideoUrl: '', glitchHint: '', glitchAccessInstructions: '', glitchStartFrequency: 12, glitchStartShift: 20, glitchStartChromatic: 8 });
    setMegaClueState({ megaFinalTruthText: '', megaImageFile: null, megaImagePreview: null, megaRequiredPuzzleIds: [] });
    setPersonState({ isPerson: false, name: '', age: '', profession: '', status: '', details: '' });
    setMetadataState({ fakeDate: '', fakeLocation: '', technicalNote: '', fakeMetaCam: '', fakeMetaGps: '', fakeMetaOwner: '', stamp: '', externalLink: '' });
    setPhoneState({ hasKeypad: false, password: '', lockType: 'pin', contactName: 'Desconhecido', chatList: [] });
    setThermalConfig({ enabled: false, secretText: '', keyword: '', fontSize: 24, positionY: 50 });
    setFilterConfig({ brightness: 100, contrast: 100, saturate: 100 });
    setEditorState({ editorMode: null, uvEditorBaseUrl: null, uvEditorPurpose: null, filterInitialImage: null, showAudioForgeFor: null, showGlitchDesigner: false, showKeypadEditor: false, showForensicEditor: false, showThermalEditor: false });
    setFieldVisibilityConfig(defaultFieldVisibility);
    setDisplayConfig(defaultDisplayConfig);
    setMediaVisibility(defaultMediaVisibility);
  };

  const loadExistingCard = (card: any) => {
    let m: any = {};
    try {
      m = typeof card.metadata === 'object' ? card.metadata : (typeof card.metadata === 'string' ? JSON.parse(card.metadata) : {});
    } catch (e) { m = {}; }

    // Core
    setCoreState({
      title: card.title || '',
      descPublic: card.description_public || '',
      descHidden: card.description_hidden || '',
      tags: Array.isArray(card.tags) ? card.tags.join(', ') : (card.tags || ''),
      discoveryCode: card.discovery_code || '',
      isHidden: card.is_hidden || false,
      evidenceType: card.type || 'document'
    });

    // Security
    const sl = m.security_layer || {};
    setSecurityState({
      isLocked: card.is_locked || false,
      lockPass: card.lock_password || '',
      lockPasses: m.mega_clue?.required_codes || [],
      securityLayerEnabled: !!m.security_layer || !!m.glitch_puzzle,
      revealLogicMode: sl.reveal_logic || 'aligned_only',
      signalTargets: sl.signal_targets || { visual: true, audio: false },
      hidePreviewOnBoard: !!m.masked_preview,
      audioStaticSync: !!m.audio_static_sync,
      narrativeLinks: {
        audioHintsVisual: m.narrative_hints?.audio_guides_visual || false,
        visualHintsCode: m.narrative_hints?.visual_guides_code || false,
        hintNote: m.narrative_hints?.hint_note || ''
      }
    });

    // Media URLs (no Files when loading existing)
    const imgUrl = card.image_url || m.original_image_url || m.base_media_url;
    const vidUrl = card.video_url || m.videoUrl;
    const audUrl = card.audio_url;
    const audHidUrl = m.audio_hidden_url;
    setMediaState(prev => ({
      ...prev,
      previewUrl: imgUrl || null,
      videoUrl: vidUrl || null,
      videoUrlInput: vidUrl || '',
      videoPreviewUrl: vidUrl || null,
      audioBasePreview: audUrl || null,
      audioHiddenPreview: audHidUrl || null,
      audioHiddenUploadedUrl: audHidUrl || null,
      uvPreviewUrl: card.image_uv_url || m.uv_layer_url || m.hidden_uv_url || null,
    }));
    if (imgUrl) registerUrl(imgUrl);
    if (vidUrl) registerUrl(vidUrl);
    if (audUrl) registerUrl(audUrl);

    // Cipher
    const isShredded = card.is_shredded || m.is_shredded || (m.shred_rows && m.shred_cols);
    setCipherState({
      isShredded: !!isShredded,
      shredRows: m.shred_rows || 1,
      shredCols: m.shred_cols || 8,
      realText: card.real_text || m.real_text || '',
      cipherText: card.cipher_text || m.cipher_text || '',
      hexCode: m.hex_code || m.hexCode || '',
      hexEncodingMethod: m.hexEncodingMethod || 'plain',
      hexEncodingKey: m.hexEncodingKey || ''
    });

    // Glitch
    if (m.glitch_puzzle) {
      const gp = m.glitch_puzzle;
      setGlitchState(prev => ({
        ...prev,
        glitchCorrectFrequency: gp.correct_frequency ?? prev.glitchCorrectFrequency,
        glitchCorrectShift: gp.correct_shift ?? prev.glitchCorrectShift,
        glitchCorrectChromatic: gp.correct_chromatic ?? prev.glitchCorrectChromatic,
        glitchDifficulty: gp.difficulty ?? prev.glitchDifficulty,
        glitchToleranceFreq: gp.tolerance_frequency ?? prev.glitchToleranceFreq,
        glitchToleranceShift: gp.tolerance_shift ?? prev.glitchToleranceShift,
        glitchToleranceChroma: gp.tolerance_chromatic ?? prev.glitchToleranceChroma,
        glitchStartFrequency: gp.start_frequency ?? prev.glitchStartFrequency,
        glitchStartShift: gp.start_shift ?? prev.glitchStartShift,
        glitchStartChromatic: gp.start_chromatic ?? prev.glitchStartChromatic,
        glitchAccessInstructions: gp.access_instructions || '',
        glitchHint: gp.hint || '',
        glitchKeyword: gp.correct_keyword || sl.keyword || '',
        glitchRequireKeyword: !!gp.require_keyword_validation,
        glitchUnlockMode: gp.unlock_mode || 'code',
        glitchRewardCode: gp.reward_code || 'ALPHA-01',
        glitchHiddenAudioUrl: gp.hidden_audio_url || '',
        glitchHiddenVideoUrl: gp.hidden_video_url || '',
        glitchFocusedImagePreview: gp.focused_image_url || null,
      }));
    }

    // Mega Clue
    if (m.mega_clue) {
      setMegaClueState(prev => ({
        ...prev,
        megaFinalTruthText: m.mega_clue.final_truth_text || '',
        megaRequiredPuzzleIds: m.mega_clue.required_puzzle_ids || [],
      }));
    }

    // Thermal
    if (m.thermal) {
      setThermalConfig({
        enabled: true,
        secretText: m.thermal_secret_text || '',
        keyword: m.thermal_keyword || '',
        fontSize: m.thermal_font_size || 24,
        positionY: m.thermal_position_y || 50
      });
    }

    // Filter
    if (m.image_filter_reveal) {
      setFilterConfig({
        brightness: m.image_filter_reveal.brightness || 100,
        contrast: m.image_filter_reveal.contrast || 100,
        saturate: m.image_filter_reveal.saturate || 100
      });
    }

    // Phone
    if (m.phone_locked || m.phone_has_keypad || m.chat_data) {
      setPhoneState({
        hasKeypad: !!m.phone_locked || !!m.phone_has_keypad,
        password: m.phone_password || '',
        lockType: m.phone_lock_type || 'pin',
        contactName: m.chat_contact_name || 'Desconhecido',
        chatList: m.chat_data || []
      });
    }

    // Person
    if (m.person || m.is_person) {
      const p = m.person || m.person_info || {};
      setPersonState({
        isPerson: true,
        name: p.name || '',
        age: p.dob || p.age || '',
        profession: p.occupation || p.profession || '',
        status: p.status || '',
        details: p.details || ''
      });
    }

    // Fake EXIF metadata
    const fv = m.field_values || {};
    setMetadataState({
      fakeDate: fv.date_created || m.fakeDate || '',
      fakeLocation: fv.gps_coords || m.fakeLocation || '',
      technicalNote: fv.technical_note || m.technicalNote || '',
      fakeMetaCam: fv.camera_model || '',
      fakeMetaGps: fv.gps_coords || '',
      fakeMetaOwner: fv.device_owner || '',
      stamp: fv.stamp || m.stamp || '',
      externalLink: fv.external_link || m.externalLink || m.external_link || ''
    });

    // Display config
    if (m.display_config) setDisplayConfig(m.display_config);
    if (m.field_visibility) setFieldVisibilityConfig(m.field_visibility);
    if (m.media_visibility) {
      const mv = m.media_visibility;
      setMediaVisibility({
        audioBase: mv.audio_base || 'always',
        audioHidden: mv.audio_hidden || 'post_solve',
        visual: mv.visual || 'glitch_active',
        uvLayer: mv.uv_layer || 'post_keyword'
      });
    }
  };

  return (
    <ClueModalContext.Provider value={{
      coreState, setCoreState,
      securityState, setSecurityState,
      mediaState, setMediaState,
      cipherState, setCipherState,
      glitchState, setGlitchState,
      megaClueState, setMegaClueState,
      editorState, setEditorState,
      filterConfig, setFilterConfig,
      thermalConfig, setThermalConfig,
      phoneState, setPhoneState,
      personState, setPersonState,
      metadataState, setMetadataState,
      fieldVisibilityConfig, setFieldVisibilityConfig,
      displayConfig, setDisplayConfig,
      mediaVisibility, setMediaVisibility,
      registerUrl, revokeUrl, resetForm, loadExistingCard
    }}>
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
