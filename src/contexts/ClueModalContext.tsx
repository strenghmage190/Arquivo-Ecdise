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

export interface ClueModalContextType {
  // States
  coreState: CoreState;
  setCoreState: React.Dispatch<React.SetStateAction<CoreState>>;
  
  securityState: SecurityState;
  setSecurityState: React.Dispatch<React.SetStateAction<SecurityState>>;
  
  mediaState: MediaState;
  setMediaState: React.Dispatch<React.SetStateAction<MediaState>>;
  
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
