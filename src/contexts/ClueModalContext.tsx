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

export interface SecurityState {
  isLocked: boolean;
  lockPass: string;
  lockPasses: string[];
  securityLayerEnabled: boolean;
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
  audioHiddenUploadedUrl: string | null;
}

export interface CipherState {
  isShredded: boolean;
  shredRows: number;
  shredCols: number;
  realText: string;
  cipherText: string;
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
  
  fieldVisibilityConfig: FieldVisibilityConfig;
  setFieldVisibilityConfig: React.Dispatch<React.SetStateAction<FieldVisibilityConfig>>;
  
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
  });

  const [mediaState, setMediaState] = useState<MediaState>({
    imgFile: null, videoFile: null, uvFile: null, filterFile: null, audioBase: null, audioHidden: null, megaImageFile: null,
    previewUrl: null, videoPreviewUrl: null, uvPreviewUrl: null, filterPreviewUrl: null, audioBasePreview: null, audioHiddenPreview: null, megaImagePreview: null,
    videoUrl: null, audioHiddenUploadedUrl: null
  });

  const [cipherState, setCipherState] = useState<CipherState>({
    isShredded: false,
    shredRows: 1,
    shredCols: 8,
    realText: '',
    cipherText: '',
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

  const [fieldVisibilityConfig, setFieldVisibilityConfig] = useState<FieldVisibilityConfig>(defaultFieldVisibility);

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
    setSecurityState({ isLocked: false, lockPass: '', lockPasses: [], securityLayerEnabled: false });
    setMediaState({ imgFile: null, videoFile: null, uvFile: null, filterFile: null, audioBase: null, audioHidden: null, megaImageFile: null, previewUrl: null, videoPreviewUrl: null, uvPreviewUrl: null, filterPreviewUrl: null, audioBasePreview: null, audioHiddenPreview: null, megaImagePreview: null, videoUrl: null, audioHiddenUploadedUrl: null });
    setCipherState({ isShredded: false, shredRows: 1, shredCols: 8, realText: '', cipherText: '' });
    setGlitchState({ glitchCorrectFrequency: 17, glitchCorrectShift: 33, glitchCorrectChromatic: 12, glitchRewardCode: 'ALPHA-01', glitchKeyword: '', glitchRequireKeyword: false, glitchUnlockMode: 'code', glitchDifficulty: 'hard', glitchToleranceFreq: 1, glitchToleranceShift: 2, glitchToleranceChroma: 2, glitchFocusedImageFile: null, glitchFocusedImagePreview: null, showGlitchDesigner: false, glitchHiddenAudioUrl: '', glitchHiddenVideoUrl: '', glitchHint: '', glitchAccessInstructions: '', glitchStartFrequency: 12, glitchStartShift: 20, glitchStartChromatic: 8 });
    setMegaClueState({ megaFinalTruthText: '', megaImageFile: null, megaImagePreview: null, megaRequiredPuzzleIds: [] });
    setFieldVisibilityConfig(defaultFieldVisibility);
  };

  const loadExistingCard = (card: any) => {
    // Basic loading logic based on existingCard
    setCoreState(prev => ({
      ...prev,
      title: card.title || '',
      descPublic: card.description_public || '',
      descHidden: card.description_hidden || '',
      tags: card.tags || '',
      discoveryCode: card.discovery_code || '',
      isHidden: card.is_hidden || false,
      evidenceType: card.type || 'document'
    }));
    
    setSecurityState(prev => ({
      ...prev,
      isLocked: card.is_locked || false,
      lockPass: card.lock_password || ''
    }));

    let parsedMeta: any = {};
    try {
      parsedMeta = typeof card.metadata === 'object' 
        ? card.metadata 
        : (typeof card.metadata === 'string' ? JSON.parse(card.metadata) : {});
    } catch (e) {
      parsedMeta = {};
    }

    const cardIsShredded = card.is_shredded || parsedMeta?.is_shredded || (parsedMeta?.shred_rows && parsedMeta?.shred_cols);
    setCipherState(prev => ({
      ...prev,
      isShredded: !!cardIsShredded,
      shredRows: parsedMeta?.shred_rows || 1,
      shredCols: parsedMeta?.shred_cols || 8,
    }));

    if (parsedMeta.glitch_puzzle) {
      setGlitchState(prev => ({
        ...prev,
        ...parsedMeta.glitch_puzzle,
        glitchKeyword: parsedMeta.glitch_puzzle.unlock_keyword || prev.glitchKeyword
      }));
    }

    // For URLs, we register them so they don't leak, but we don't revoke existing ones
    const imgUrl = card.image_url;
    if (imgUrl) {
      setMediaState(prev => ({ ...prev, previewUrl: imgUrl }));
      registerUrl(imgUrl);
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
      fieldVisibilityConfig, setFieldVisibilityConfig,
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
