import { useCallback, useMemo, useState } from 'react';
import { z } from 'zod';

export type EvidenceType = 'document' | 'glitch_puzzle' | 'mega_clue';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationItem = {
  field: string;
  message: string;
  severity: ValidationSeverity;
};

export type DisplayConfig = {
  puzzle: Record<string, boolean>;
  fileProperties: Record<string, boolean>;
  media: Record<string, boolean>;
  cipher: Record<string, boolean>;
  megaClue: Record<string, boolean>;
};

export type UseCreateClueStateReturn = {
  formState: {
    title: string;
    descPublic: string;
    descHidden: string;
    tags: string;
    evidenceType: EvidenceType;

    imgFile: File | null;
    previewUrl: string | null;
    uvFile: File | null;
    previewUrl2: string | null;
    thermalEnabled: boolean;
    thermalSecretText: string;
    filterFile: File | null;
    filterPreviewUrl: string | null;

    audioBase: File | null;
    audioBasePreview: string | null;
    audioHidden: File | null;
    audioHiddenPreview: string | null;
    showMixer: boolean;

    videoFile: File | null;
    videoPreviewUrl: string | null;
    videoUrlInput: string;
    videoUploading: boolean;
    uploadProgress: Record<string, number>;

    megaFinalTruthText: string;
    megaRequiredPuzzleIds: string[];

    glitchAccessInstructions: string;
    glitchHint: string;
    glitchKeyword: string;
    glitchFocusedImageFile: File | null;

    isLocked: boolean;
    lockPass: string;

    isPerson: boolean;
    personName: string;

    displayConfig: DisplayConfig;
    fieldVisibilityConfig: Record<string, boolean>;

    export default useCreateClueState;
  const [loading, setLoading] = useState(false);

  // VALIDATION ERRORS
  const [errors, setErrors] = useState<ValidationItem[]>([]);

  // ZOD schema
  const schema = useMemo(() => z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    descPublic: z.string().optional(),
    evidenceType: z.enum(['document', 'glitch_puzzle', 'mega_clue']),
  }), []);

  // Handlers
  const handleFileSelect = useCallback((fileSetter: (f: File | null) => void, urlSetter: (u: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    fileSetter(file);
    urlSetter(url);
  }, []);

  const handleImageSelect = handleFileSelect(setImgFile, setPreviewUrl);
  const handleUVSelect = handleFileSelect(setUvFile, setPreviewUrl2);
  const handleFilterSelect = handleFileSelect(setFilterFile, setFilterPreviewUrl);
  const handleAudioBaseSelect = handleFileSelect(setAudioBase, setAudioBasePreview);
  const handleAudioHiddenSelect = handleFileSelect(setAudioHidden, setAudioHiddenPreview);
  const handleVideoSelect = handleFileSelect(setVideoFile, setVideoPreviewUrl);

  const validate = useCallback((): ValidationItem[] => {
    const items: ValidationItem[] = [];

    const parsed = schema.safeParse({ title, descPublic, evidenceType });
    if (!parsed.success) {
      const fieldErrors = parsed.error.errors;
      fieldErrors.forEach((fe) => {
        items.push({ field: fe.path.join('.') || 'title', message: fe.message, severity: 'error' });
      });
    }

    if (evidenceType === 'glitch_puzzle' && !glitchAccessInstructions) {
      items.push({ field: 'glitchAccessInstructions', message: 'Instruções de Glitch são obrigatórias', severity: 'error' });
    }

    if (evidenceType === 'mega_clue') {
      if (!megaFinalTruthText) {
        items.push({ field: 'megaFinalTruthText', message: 'Verdade final é obrigatória', severity: 'error' });
      }
      if (megaRequiredPuzzleIds.length === 0) {
        items.push({ field: 'megaRequiredPuzzleIds', message: 'Selecione ao menos um puzzle', severity: 'error' });
      }
    }

    // gentle warning for descPublic
    if (!descPublic) {
      items.push({ field: 'descPublic', message: 'Descrição é recomendada', severity: 'warning' });
    }

    setErrors(items);
    return items;
  }, [schema, title, descPublic, evidenceType, glitchAccessInstructions, megaFinalTruthText, megaRequiredPuzzleIds]);

  const formState = useMemo(() => ({
    title,
    descPublic,
    descHidden,
    tags,
    evidenceType,

    imgFile,
    previewUrl,
    uvFile,
    previewUrl2,
    thermalEnabled,
    thermalSecretText,
    filterFile,
    filterPreviewUrl,

    audioBase,
    audioBasePreview,
    audioHidden,
    audioHiddenPreview,
    showMixer,

    videoFile,
    videoPreviewUrl,
    videoUrlInput,
    videoUploading,
    uploadProgress,

    megaFinalTruthText,
    megaRequiredPuzzleIds,

    glitchAccessInstructions,
    glitchHint,
    glitchKeyword,
    glitchFocusedImageFile,

    isLocked,
    lockPass,

    isPerson,
    personName,

    displayConfig,
    fieldVisibilityConfig,

    templates,
    loadingTemplates,
    showTemplateDropdown,
    loading,
  }), [
    title,
    descPublic,
    descHidden,
    tags,
    evidenceType,
    imgFile,
    previewUrl,
    uvFile,
    previewUrl2,
    thermalEnabled,
    thermalSecretText,
    filterFile,
    filterPreviewUrl,
    audioBase,
    audioBasePreview,
    audioHidden,
    audioHiddenPreview,
    showMixer,
    videoFile,
    videoPreviewUrl,
    videoUrlInput,
    videoUploading,
    uploadProgress,
    megaFinalTruthText,
    megaRequiredPuzzleIds,
    glitchAccessInstructions,
    glitchHint,
    glitchKeyword,
    glitchFocusedImageFile,
    isLocked,
    lockPass,
    isPerson,
    personName,
    displayConfig,
    fieldVisibilityConfig,
    templates,
    loadingTemplates,
    showTemplateDropdown,
    loading,
  ]);

  const actions = useMemo(() => ({
    setTitle,
    setDescPublic,
    setDescHidden,
    setTags,
    setEvidenceType,

    handleImageSelect,
    handleUVSelect,
    handleFilterSelect,
    handleAudioBaseSelect,
    handleAudioHiddenSelect,
    handleVideoSelect,

    setThermalEnabled,
    setThermalSecretText,
    setShowMixer,
    setVideoUrlInput,
    setVideoUploading,
    setUploadProgress,
    setMegaFinalTruthText,
    setMegaRequiredPuzzleIds,
    setGlitchAccessInstructions,
    setGlitchHint,
    setGlitchKeyword,
    setGlitchFocusedImageFile,
    setIsLocked,
    setLockPass,
    setIsPerson,
    setPersonName,
    setDisplayConfig,
    setFieldVisibilityConfig,
    setTemplates,
    setLoadingTemplates,
    setShowTemplateDropdown,
    setLoading,
  }), [
    handleImageSelect,
    handleUVSelect,
    handleFilterSelect,
    handleAudioBaseSelect,
    handleAudioHiddenSelect,
    handleVideoSelect,
  ]);

  return {
    formState,
    actions,
    validation: {
      validate,
      errors,
      schema,
    },
  };
}

export default useCreateClueState;
/**
 * 🎣 useCreateClueState Hook
 * 
 * Centraliza todo o estado de criação de pistas
 * para uso com CreateClueModal_Refactored
 * 
 * Uso:
 * const state = useCreateClueState(investigationId);
 * <CreateClueModal_Refactored {...state} />
 */

import { useState } from 'react';
import { ClueTemplate } from '../api/templates';

export interface CreateClueState {
  // ==================== BASIC ====================
  title: string;
  descPublic: string;
  descHidden: string;
  tags: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';

  // ==================== IMAGE ====================
  imgFile: File | null;
  previewUrl: string | null;

  // ==================== UV LAYER ====================
  uvFile: File | null;
  previewUrl2: string | null;

  // ==================== THERMAL ====================
  thermalEnabled: boolean;
  thermalSecretText: string;

  // ==================== FILTER ====================
  filterFile: File | null;
  filterPreviewUrl: string | null;

  // ==================== AUDIO ====================
  audioBase: File | null;
  audioBasePreview: string | null;
  audioHidden: File | null;
  audioHiddenPreview: string | null;
  showMixer: boolean;

  // ==================== VIDEO ====================
  videoFile: File | null;
  videoPreviewUrl: string | null;
  videoUrlInput: string;
  videoUploading: boolean;
  uploadProgress: Record<string, number>;

  // ==================== MEGA CLUE ====================
  megaFinalTruthText: string;
  megaRequiredPuzzleIds: string[];

  // ==================== GLITCH PUZZLE ====================
  glitchAccessInstructions: string;
  glitchHint: string;
  glitchKeyword: string;
  glitchFocusedImageFile: File | null;

  // ==================== LOCK ====================
  isLocked: boolean;
  lockPass: string;

  // ==================== PERSON ====================
  isPerson: boolean;
  personName: string;

  // ==================== CONFIG ====================
  displayConfig: Record<string, any>;
  fieldVisibilityConfig: Record<string, any>;

  // ==================== TEMPLATES ====================
  templates: ClueTemplate[];
  loadingTemplates: boolean;
  showTemplateDropdown: boolean;

  // ==================== LOADING ====================
  loading: boolean;
}

export interface CreateClueStateActions {
  // Setters
  setTitle: (value: string) => void;
  setDescPublic: (value: string) => void;
  setDescHidden: (value: string) => void;
  setTags: (value: string) => void;
  setEvidenceType: (type: 'document' | 'glitch_puzzle' | 'mega_clue') => void;
  setImgFile: (file: File | null) => void;
  setPreviewUrl: (url: string | null) => void;
  setUvFile: (file: File | null) => void;
  setPreviewUrl2: (url: string | null) => void;
  setThermalEnabled: (enabled: boolean) => void;
  setThermalSecretText: (text: string) => void;
  setFilterFile: (file: File | null) => void;
  setFilterPreviewUrl: (url: string | null) => void;
  setAudioBase: (file: File | null) => void;
  setAudioBasePreview: (url: string | null) => void;
  setAudioHidden: (file: File | null) => void;
  setAudioHiddenPreview: (url: string | null) => void;
  setShowMixer: (show: boolean) => void;
  setVideoFile: (file: File | null) => void;
  setVideoPreviewUrl: (url: string | null) => void;
  setVideoUrlInput: (url: string) => void;
  setVideoUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: Record<string, number>) => void;
  setMegaFinalTruthText: (text: string) => void;
  setMegaRequiredPuzzleIds: (ids: string[]) => void;
  setGlitchAccessInstructions: (text: string) => void;
  setGlitchHint: (text: string) => void;
  setGlitchKeyword: (text: string) => void;
  setGlitchFocusedImageFile: (file: File | null) => void;
  setIsLocked: (locked: boolean) => void;
  setLockPass: (pass: string) => void;
  setIsPerson: (person: boolean) => void;
  setPersonName: (name: string) => void;
  setDisplayConfig: (config: Record<string, any>) => void;
  setFieldVisibilityConfig: (config: Record<string, any>) => void;
  setTemplates: (templates: ClueTemplate[]) => void;
  setLoadingTemplates: (loading: boolean) => void;
  setShowTemplateDropdown: (show: boolean) => void;
  setLoading: (loading: boolean) => void;

  // Handlers
  handleImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUVSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleFilterSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAudioBaseSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleAudioHiddenSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleVideoSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleValidate: () => Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }>;
}

export function useCreateClueState(investigationId: string): CreateClueState & CreateClueStateActions {
  // ==================== BASIC ====================
  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');
  const [evidenceType, setEvidenceType] = useState<'document' | 'glitch_puzzle' | 'mega_clue'>('document');

  // ==================== IMAGE ====================
  const [imgFile, setImgFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // ==================== UV LAYER ====================
  const [uvFile, setUvFile] = useState<File | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);

  // ==================== THERMAL ====================
  const [thermalEnabled, setThermalEnabled] = useState(false);
  const [thermalSecretText, setThermalSecretText] = useState('');

  // ==================== FILTER ====================
  const [filterFile, setFilterFile] = useState<File | null>(null);
  const [filterPreviewUrl, setFilterPreviewUrl] = useState<string | null>(null);

  // ==================== AUDIO ====================
  const [audioBase, setAudioBase] = useState<File | null>(null);
  const [audioBasePreview, setAudioBasePreview] = useState<string | null>(null);
  const [audioHidden, setAudioHidden] = useState<File | null>(null);
  const [audioHiddenPreview, setAudioHiddenPreview] = useState<string | null>(null);
  const [showMixer, setShowMixer] = useState(false);

  // ==================== VIDEO ====================
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');
  const [videoUploading, setVideoUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  // ==================== MEGA CLUE ====================
  const [megaFinalTruthText, setMegaFinalTruthText] = useState('');
  const [megaRequiredPuzzleIds, setMegaRequiredPuzzleIds] = useState<string[]>([]);

  // ==================== GLITCH PUZZLE ====================
  const [glitchAccessInstructions, setGlitchAccessInstructions] = useState('');
  const [glitchHint, setGlitchHint] = useState('');
  const [glitchKeyword, setGlitchKeyword] = useState('');
  const [glitchFocusedImageFile, setGlitchFocusedImageFile] = useState<File | null>(null);

  // ==================== LOCK ====================
  const [isLocked, setIsLocked] = useState(false);
  const [lockPass, setLockPass] = useState('');

  // ==================== PERSON ====================
  const [isPerson, setIsPerson] = useState(false);
  const [personName, setPersonName] = useState('');

  // ==================== CONFIG ====================
  const [displayConfig, setDisplayConfig] = useState({
    puzzle: {
      showAccessInstructions: true,
      showHint: true,
      showCorrectAnswerWhenSolved: false,
      showRewardCode: true,
      showLogs: true,
    },
    fileProperties: {
      showFileType: true,
      showSize: true,
      showCameraModel: true,
      showDate: true,
      showGPS: true,
      showOwner: true,
      showHexComment: false,
      showStamp: true,
      showExternalLink: true,
      showLockStatus: true,
      showPersonInfo: true,
    },
    media: {
      showThermalData: false,
      showUVLayer: false,
      showFilterOverlay: true,
      showVideoPlayer: true,
      showAudioPlayer: true,
      showHiddenAudio: false,
      showChatData: true,
    },
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
  });

  const [fieldVisibilityConfig, setFieldVisibilityConfig] = useState({});

  // ==================== TEMPLATES ====================
  const [templates, setTemplates] = useState<ClueTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  // ==================== LOADING ====================
  const [loading, setLoading] = useState(false);

  // ==================== HANDLERS ====================

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setImgFile(file);
    setPreviewUrl(url);
  };

  const handleUVSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setUvFile(file);
    setPreviewUrl2(url);
  };

  const handleFilterSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setFilterFile(file);
    setFilterPreviewUrl(url);
  };

  const handleAudioBaseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioBase(file);
    setAudioBasePreview(url);
  };

  const handleAudioHiddenSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setAudioHidden(file);
    setAudioHiddenPreview(url);
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreviewUrl(url);
  };

  const handleValidate = () => {
    const errors: Array<{ field: string; message: string; severity: 'error' | 'warning' | 'info' }> = [];

    if (!title) {
      errors.push({
        field: 'title',
        message: 'Título/Código é obrigatório',
        severity: 'error',
      });
    }

    if (!descPublic) {
      errors.push({
        field: 'descPublic',
        message: 'Descrição pública é recomendada',
        severity: 'warning',
      });
    }

    if (evidenceType === 'glitch_puzzle' && !glitchAccessInstructions) {
      errors.push({
        field: 'glitchAccessInstructions',
        message: 'Instruções de Glitch Puzzle são obrigatórias',
        severity: 'error',
      });
    }

    if (evidenceType === 'mega_clue' && !megaFinalTruthText) {
      errors.push({
        field: 'megaFinalTruthText',
        message: 'Verdade final da Mega-Pista é obrigatória',
        severity: 'error',
      });
    }

    if (evidenceType === 'mega_clue' && megaRequiredPuzzleIds.length === 0) {
      errors.push({
        field: 'megaRequiredPuzzleIds',
        message: 'Selecione ao menos um puzzle obrigatório',
        severity: 'error',
      });
    }

    if (!imgFile && !videoFile && !videoUrlInput) {
      errors.push({
        field: 'media',
        message: 'Anexe ao menos uma imagem ou vídeo',
        severity: 'error',
      });
    }

    return errors;
  };

  // ==================== RETURN ====================

  return {
    // State
    title,
    descPublic,
    descHidden,
    tags,
    evidenceType,
    imgFile,
    previewUrl,
    uvFile,
    previewUrl2,
    thermalEnabled,
    thermalSecretText,
    filterFile,
    filterPreviewUrl,
    audioBase,
    audioBasePreview,
    audioHidden,
    audioHiddenPreview,
    showMixer,
    videoFile,
    videoPreviewUrl,
    videoUrlInput,
    videoUploading,
    uploadProgress,
    megaFinalTruthText,
    megaRequiredPuzzleIds,
    glitchAccessInstructions,
    glitchHint,
    glitchKeyword,
    glitchFocusedImageFile,
    isLocked,
    lockPass,
    isPerson,
    personName,
    displayConfig,
    fieldVisibilityConfig,
    templates,
    loadingTemplates,
    showTemplateDropdown,
    loading,

    // Setters
    setTitle,
    setDescPublic,
    setDescHidden,
    setTags,
    setEvidenceType,
    setImgFile,
    setPreviewUrl,
    setUvFile,
    setPreviewUrl2,
    setThermalEnabled,
    setThermalSecretText,
    setFilterFile,
    setFilterPreviewUrl,
    setAudioBase,
    setAudioBasePreview,
    setAudioHidden,
    setAudioHiddenPreview,
    setShowMixer,
    setVideoFile,
    setVideoPreviewUrl,
    setVideoUrlInput,
    setVideoUploading,
    setUploadProgress,
    setMegaFinalTruthText,
    setMegaRequiredPuzzleIds,
    setGlitchAccessInstructions,
    setGlitchHint,
    setGlitchKeyword,
    setGlitchFocusedImageFile,
    setIsLocked,
    setLockPass,
    setIsPerson,
    setPersonName,
    setDisplayConfig,
    setFieldVisibilityConfig,
    setTemplates,
    setLoadingTemplates,
    setShowTemplateDropdown,
    setLoading,

    // Handlers
    handleImageSelect,
    handleUVSelect,
    handleFilterSelect,
    handleAudioBaseSelect,
    handleAudioHiddenSelect,
    handleVideoSelect,
    handleValidate,
  };
}
