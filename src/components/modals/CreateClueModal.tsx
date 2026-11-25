import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Save,
  Eye,
  Image as ImageIcon,
  Music,
  Lock,
  Settings,
  BookOpen,
  Cpu,
  Network,
  ShieldAlert,
  Fingerprint,
  FolderOpen,
  Trash2,
  BookmarkPlus,
  Zap,
  Copy,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  FileText,
  KeyRound,
  Smartphone,
  Sparkles,
  SlidersHorizontal,
  LucideIcon,
} from 'lucide-react';
import UVEditor from '../tools/UVEditor';
import ThermalEditor from '../tools/ThermalEditor';
import ForensicChannelEditor from '../tools/ForensicChannelEditor';
import AudioLab from '../tools/audiolab/AudioLab';
import { toast } from 'sonner';
import {
  ClueModalProvider,
  useClueModal,
  ClueArchetype,
} from '../../contexts/ClueModalContext';
import { useCyberpunkUI } from '../../hooks/useCyberpunkUI';
import { useClueTour } from '../../hooks/useClueTour';
import { useClueDraft } from '../../hooks/useClueDraft';
import { useDirtyGuard } from '../../hooks/useDirtyGuard';
import { createInvestigationCard, updateInvestigationCard } from '../../api/investigations';
import {
  ClueTemplate,
  fetchClueTemplates,
  createClueTemplate,
  deleteClueTemplate,
  sanitizeTemplateData,
} from '../../api/templates';
import { validateClueDetailed } from '../../utils/validateClue';
import { buildClueDbPayload, UploadedClueUrls } from '../../utils/cluePayloadBuilder';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import 'react-tooltip/dist/react-tooltip.css';
import './CreateClueModal.css';
import './createclueTabs/createclueTabs.css';
import TabGeneral from './createclueTabs/TabGeneral';
import TabVisual from './createclueTabs/TabVisual';
import TabAudio from './createclueTabs/TabAudio';
import TabCipher from './createclueTabs/TabCipher';
import TabGlitch from './createclueTabs/TabGlitch';
import TabMegaClue from './createclueTabs/TabMegaClue';
import TabFieldsVisibility from './createclueTabs/TabFieldsVisibility';
import TabDisplayConfig from './createclueTabs/TabDisplayConfig';
import TabSecurity from './createclueTabs/TabSecurity';
import TabMetadata from './createclueTabs/TabMetadata';
import QuickClueMode from './createclueTabs/QuickClueMode';
import PlayerViewSimulatorModal from './PlayerViewSimulatorModal';

export type { ClueArchetype };

export interface CreateClueModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: (card: Record<string, any>) => void;
  existingCard?: any;
  defaultHidden?: boolean;
  initialArchetype?: ClueArchetype;
  duplicateFromCard?: any;
}

const ARCHETYPES: { id: ClueArchetype; label: string; icon: LucideIcon }[] = [
  { id: 'quick', label: 'Pista Rápida', icon: Zap },
  { id: 'forensic_doc', label: 'Doc Forense', icon: FileText },
  { id: 'secret_audio', label: 'Áudio', icon: Music },
  { id: 'puzzle_lock', label: 'Enigma / Senha', icon: KeyRound },
  { id: 'fake_phone', label: 'Celular Falso', icon: Smartphone },
  { id: 'mega_clue', label: 'Mega-Pista', icon: Sparkles },
  { id: 'complete', label: 'Avançado (10 Abas)', icon: SlidersHorizontal },
];

const TABS: { id: string; label: string; icon: LucideIcon; group: 'content' | 'config' }[] = [
  { id: 'geral', label: 'Geral', icon: BookOpen, group: 'content' },
  { id: 'visual', label: 'Visual', icon: ImageIcon, group: 'content' },
  { id: 'audio', label: 'Áudio', icon: Music, group: 'content' },
  { id: 'cifra', label: 'Cifra & Hex', icon: Lock, group: 'content' },
  { id: 'glitch', label: 'Glitch', icon: Cpu, group: 'content' },
  { id: 'mega', label: 'Tipos Especiais', icon: Network, group: 'content' },
  { id: 'seguranca', label: 'Segurança', icon: ShieldAlert, group: 'config' },
  { id: 'metadata', label: 'Metadados', icon: Fingerprint, group: 'config' },
  { id: 'campos', label: 'Campos', icon: Eye, group: 'config' },
  { id: 'display', label: 'Display', icon: Settings, group: 'config' },
];

function CreateClueModalContent({
  isOpen,
  onClose,
  existingCard,
  onSaved,
  initialX,
  initialY,
  investigationId,
  defaultHidden,
  initialArchetype,
  duplicateFromCard,
}: CreateClueModalProps) {
  const { playBoot, playClick, playHover, playClose, playProcess, playSuccess } = useCyberpunkUI();
  const { startTour, shouldShowTour } = useClueTour();
  const {
    activeTab,
    setActiveTab,
    creatorMode,
    setCreatorMode,
    isDuplicateMode,
    setIsDuplicateMode,
    duplicateSourceCard,
    setDuplicateSourceCard,
    resetForm,
    loadExistingCard,
    loadCardAsDuplicate,
    applyArchetype,
    getTemplateSnapshot,
    applyTemplateData,
    registerUrl,
    revokeUrl,
    coreState,
    setCoreState,
    securityState,
    mediaState,
    setMediaState,
    cipherState,
    glitchState,
    setGlitchState,
    megaClueState,
    displayConfig,
    mediaVisibility,
    fieldVisibilityConfig,
    editorState,
    setEditorState,
    filterConfig,
    setFilterConfig,
    thermalConfig,
    setThermalConfig,
    phoneState,
    deviceExtraction,
    audioStudioMeta,
    personState,
    metadataState,
    insights,
    cardStatus,
    setCardStatus,
  } = useClueModal();

  const [direction, setDirection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ label: string; pct: number } | null>(null);
  const [showPlayerSimulator, setShowPlayerSimulator] = useState(false);
  const [showChecklistPopover, setShowChecklistPopover] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<ClueTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  const draftWatchValue = useMemo(
    () =>
      JSON.stringify({
        coreState,
        securityState,
        cipherState,
        glitchCorrectFrequency: glitchState.glitchCorrectFrequency,
        glitchCorrectShift: glitchState.glitchCorrectShift,
        glitchCorrectChromatic: glitchState.glitchCorrectChromatic,
        glitchKeyword: glitchState.glitchKeyword,
        megaFinalTruthText: megaClueState.megaFinalTruthText,
        megaRequiredPuzzleIds: megaClueState.megaRequiredPuzzleIds,
        thermalConfig,
        phoneState,
        deviceExtraction,
        audioStudioMeta,
        personState,
        metadataState,
        displayConfig,
        fieldVisibilityConfig,
        mediaVisibility,
        insights,
        videoUrlInput: mediaState.videoUrlInput,
      }),
    [
      coreState,
      securityState,
      cipherState,
      glitchState.glitchCorrectFrequency,
      glitchState.glitchCorrectShift,
      glitchState.glitchCorrectChromatic,
      glitchState.glitchKeyword,
      megaClueState.megaFinalTruthText,
      megaClueState.megaRequiredPuzzleIds,
      thermalConfig,
      phoneState,
      personState,
      metadataState,
      displayConfig,
      fieldVisibilityConfig,
      mediaVisibility,
      insights,
      mediaState.videoUrlInput,
    ]
  );

  const { hasDraft, draftTimestamp, restoreDraft, discardDraft, clearDraft } = useClueDraft({
    isOpen,
    investigationId,
    cardId: duplicateFromCard ? 'new' : existingCard?.id || 'new',
    getSnapshot: getTemplateSnapshot,
    applySnapshot: applyTemplateData,
    watchValue: draftWatchValue,
  });

  const dirtySnapshot = useMemo(
    () =>
      JSON.stringify({
        draftWatchValue,
        hasImg: Boolean(mediaState.imgFile),
        hasUv: Boolean(mediaState.uvFile),
        hasFilter: Boolean(mediaState.filterFile),
        hasThermal: Boolean(mediaState.thermalFile),
        hasForensic: Boolean(mediaState.forensicFile),
        hasAudioBase: Boolean(mediaState.audioBase),
        hasAudioHidden: Boolean(mediaState.audioHidden),
        removedImage: mediaState.removedImage,
        removedUv: mediaState.removedUv,
        removedFilter: mediaState.removedFilter,
        removedThermal: mediaState.removedThermal,
        removedForensic: mediaState.removedForensic,
        removedAudioBase: mediaState.removedAudioBase,
        removedAudioHidden: mediaState.removedAudioHidden,
        removedGlitchFocused: mediaState.removedGlitchFocused,
        removedMegaImage: mediaState.removedMegaImage,
        audioTargetFreq: mediaState.audioTargetFreq,
      }),
    [
      draftWatchValue,
      mediaState.imgFile,
      mediaState.uvFile,
      mediaState.filterFile,
      mediaState.thermalFile,
      mediaState.forensicFile,
      mediaState.audioBase,
      mediaState.audioHidden,
      mediaState.removedImage,
      mediaState.removedUv,
      mediaState.removedFilter,
      mediaState.removedThermal,
      mediaState.removedForensic,
      mediaState.removedAudioBase,
      mediaState.removedAudioHidden,
      mediaState.removedGlitchFocused,
      mediaState.removedMegaImage,
      mediaState.audioTargetFreq,
    ]
  );

  const baselineSnapshotRef = useRef<string | null>(null);
  const latestDirtySnapshotRef = useRef<string>(dirtySnapshot);
  latestDirtySnapshotRef.current = dirtySnapshot;
  const [baselineReady, setBaselineReady] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      baselineSnapshotRef.current = null;
      setBaselineReady(false);
      return;
    }
    const timer = window.setTimeout(() => {
      baselineSnapshotRef.current = latestDirtySnapshotRef.current;
      setBaselineReady(true);
    }, 60);
    return () => window.clearTimeout(timer);
  }, [isOpen, existingCard?.id, duplicateFromCard?.id, initialArchetype]);

  const isDirty =
    isOpen &&
    baselineReady &&
    baselineSnapshotRef.current !== null &&
    dirtySnapshot !== baselineSnapshotRef.current;

  const hasChildEditorOpen = Boolean(
    editorState.editorMode ||
    editorState.showForensicEditor ||
    editorState.showThermalEditor ||
    editorState.showGlitchDesigner ||
    editorState.showAudioForgeFor ||
    showPlayerSimulator
  );

  const { guardClose, handleBackdropClick } = useDirtyGuard({
    isDirty,
    enabled: isOpen && !hasChildEditorOpen,
    onClose: () => {
      playClose();
      onClose();
    },
    message: 'Você tem alterações não salvas nesta pista. Deseja descartar e fechar?',
  });

  const loadTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const list = await fetchClueTemplates();
      setTemplates(list);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      playBoot();
      setActiveTab('geral');
      if (duplicateFromCard) {
        loadCardAsDuplicate(duplicateFromCard);
      } else if (existingCard) {
        loadExistingCard(existingCard);
      } else {
        resetForm({ defaultHidden });
      }
      if (initialArchetype) {
        applyArchetype(initialArchetype);
      } else {
        setCreatorMode('complete');
      }
      loadTemplates();
    } else {
      playClose();
      setShowTemplateDropdown(false);
      setShowChecklistPopover(false);
      setShowPlayerSimulator(false);
    }
  }, [isOpen, existingCard, duplicateFromCard, defaultHidden, initialArchetype]);

  useEffect(() => {
    if (isOpen && shouldShowTour()) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const visibleTabs = TABS.filter((tab) => {
    if (tab.id === 'glitch') return coreState.evidenceType === 'glitch_puzzle';
    if (tab.id === 'mega') return coreState.evidenceType === 'mega_clue';
    return true;
  });

  const handleTabChange = (tabId: string) => {
    const currentIndex = visibleTabs.findIndex((t) => t.id === activeTab);
    const nextIndex = visibleTabs.findIndex((t) => t.id === tabId);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(tabId);
    playClick();
  };

  const handleSaveAsTemplate = async () => {
    const name = window.prompt('Digite um nome para este template:');
    if (!name || !name.trim()) return;
    const description = window.prompt('(Opcional) Digite uma descrição:');

    try {
      const snapshot = getTemplateSnapshot();
      const sanitizedData = sanitizeTemplateData(snapshot);
      await createClueTemplate({
        name: name.trim(),
        description: description?.trim() || undefined,
        template_data: sanitizedData,
        is_public: false,
      });
      await loadTemplates();
      toast.success(`Template "${name.trim()}" salvo com sucesso!`);
    } catch (err) {
      console.error('Error saving template:', err);
      toast.error('Erro ao salvar template.');
    }
  };

  const handleLoadTemplate = (template: ClueTemplate) => {
    const confirmed = window.confirm(
      `Carregar o template "${template.name}" substituirá os campos atuais do formulário.\n\nDeseja continuar?`
    );
    if (!confirmed) return;
    applyTemplateData(template.template_data);
    setShowTemplateDropdown(false);
    toast.success(`Template "${template.name}" aplicado!`);
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    const confirmed = window.confirm(`Deseja excluir o template "${name}"?`);
    if (!confirmed) return;
    try {
      await deleteClueTemplate(id);
      await loadTemplates();
      toast.success(`Template "${name}" excluído.`);
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error('Erro ao excluir template.');
    }
  };

  const validationIssues = useMemo(
    () =>
      validateClueDetailed({
        title: coreState.title,
        isHidden: coreState.isHidden,
        discoveryCode: coreState.discoveryCode,
        securityLayerEnabled: securityState.securityLayerEnabled,
        evidenceType: coreState.evidenceType,
        megaFinalTruthText: megaClueState.megaFinalTruthText,
        megaRequiredPuzzleIds: megaClueState.megaRequiredPuzzleIds,
        imgFile: mediaState.imgFile,
        videoFile: mediaState.videoFile,
        videoUrlInput: mediaState.videoUrlInput,
        videoUrl: mediaState.videoUrl,
        audioBase: mediaState.audioBase,
        audioBasePreview: mediaState.audioBasePreview,
        audioHidden: mediaState.audioHidden,
        audioHiddenPreview: mediaState.audioHiddenPreview,
        previewUrl: mediaState.previewUrl,
        isLocked: securityState.isLocked,
        lockPass: securityState.lockPass,
        lockPasses: securityState.lockPasses,
        phoneHasKeypad: phoneState.hasKeypad,
        phonePassword: phoneState.password,
        isShredded: cipherState.isShredded,
        hexEncodingMethod: cipherState.hexEncodingMethod,
        hexEncodingKey: cipherState.hexEncodingKey,
        thermalEnabled: thermalConfig.enabled,
        thermalSecretText: thermalConfig.secretText,
        thermalPreviewUrl: mediaState.thermalPreviewUrl,
        thermalFile: mediaState.thermalFile,
        glitchRequireKeyword: glitchState.glitchRequireKeyword,
        revealLogicMode: securityState.revealLogicMode,
        glitchKeyword: glitchState.glitchKeyword,
        glitchRewardCode: glitchState.glitchRewardCode,
        hidePreviewOnBoard: securityState.hidePreviewOnBoard,
        mediaVisibilityAudioHidden: mediaVisibility.audioHidden,
        mediaVisibilityUvLayer: mediaVisibility.uvLayer,
        uvFile: mediaState.uvFile,
        uvPreviewUrl: mediaState.uvPreviewUrl,
        glitchStartFrequency: glitchState.glitchStartFrequency,
        glitchStartShift: glitchState.glitchStartShift,
        glitchStartChromatic: glitchState.glitchStartChromatic,
        glitchCorrectFrequency: glitchState.glitchCorrectFrequency,
        glitchCorrectShift: glitchState.glitchCorrectShift,
        glitchCorrectChromatic: glitchState.glitchCorrectChromatic,
        glitchToleranceFreq: glitchState.glitchToleranceFreq,
        glitchToleranceShift: glitchState.glitchToleranceShift,
        glitchToleranceChroma: glitchState.glitchToleranceChroma,
        chatListLength: phoneState.chatList.length,
        displayConfig,
      }),
    [
      coreState,
      securityState,
      mediaState,
      cipherState,
      glitchState,
      megaClueState,
      thermalConfig,
      phoneState,
      mediaVisibility,
      displayConfig,
    ]
  );

  const errorIssues = useMemo(
    () => validationIssues.filter((i) => i.severity === 'error'),
    [validationIssues]
  );
  const warningIssues = useMemo(
    () => validationIssues.filter((i) => i.severity === 'warning'),
    [validationIssues]
  );

  const tabContentMap = useMemo<Record<string, boolean>>(() => ({
    geral: Boolean(coreState.title.trim() || coreState.descPublic.trim() || coreState.descHidden.trim() || insights.length > 0),
    visual: Boolean(mediaState.previewUrl || mediaState.uvPreviewUrl || mediaState.filterPreviewUrl || mediaState.thermalPreviewUrl || mediaState.forensicPreviewUrl || mediaState.videoPreviewUrl || mediaState.videoUrlInput.trim() || mediaState.videoUrl),
    audio: Boolean(mediaState.audioBasePreview || mediaState.audioHiddenPreview),
    cifra: Boolean(cipherState.cipherText.trim() || cipherState.hexCode.trim() || cipherState.isShredded),
    glitch: Boolean(coreState.evidenceType === 'glitch_puzzle' && (glitchState.glitchKeyword.trim() || glitchState.glitchFocusedImagePreview)),
    mega: Boolean(coreState.evidenceType === 'mega_clue' && (megaClueState.megaFinalTruthText.trim() || megaClueState.megaRequiredPuzzleIds.length > 0)),
    seguranca: Boolean(securityState.isLocked || securityState.securityLayerEnabled || phoneState.hasKeypad || phoneState.chatList.length > 0),
    metadata: Boolean(personState.isPerson || metadataState.stamp || metadataState.externalLink || metadataState.technicalNote),
    campos: false,
    display: false,
  }), [coreState, insights.length, mediaState, cipherState, glitchState, megaClueState, securityState, phoneState, personState, metadataState]);

  const tabErrorSet = useMemo(() => {
    const s = new Set<string>();
    errorIssues.forEach((i) => { if (i.tab) s.add(i.tab); });
    return s;
  }, [errorIssues]);

  const navigateToIssueTab = (tabId: string) => {
    if (creatorMode === 'quick') {
      setCreatorMode('complete');
    }
    if (tabId && visibleTabs.some((t) => t.id === tabId)) {
      handleTabChange(tabId);
    } else if (tabId === 'glitch' || tabId === 'mega') {
      setActiveTab(tabId);
    } else {
      setActiveTab('geral');
    }
    setShowChecklistPopover(false);
  };

  const handleDuplicateAsNew = () => {
    const source = duplicateSourceCard || existingCard;
    if (!source) return;
    setDuplicateSourceCard(source);
    setIsDuplicateMode(true);
    setCardStatus(null);
    setCoreState((prev) => ({
      ...prev,
      title: prev.title.endsWith('(Cópia)') ? prev.title : `${prev.title || 'Evidência'} (Cópia)`,
    }));
    toast.info('Modo cópia ativado: ao salvar será criada uma nova pista.');
  };

  const handleSave = async () => {
    // 1. Validate with centralized detailed validator
    if (errorIssues.length > 0) {
      toast.error(errorIssues[0].message, { duration: 5000 });
      navigateToIssueTab(errorIssues[0].tab);
      return;
    }

    if (warningIssues.length > 0) {
      toast.warning(warningIssues[0].message, { duration: 4000 });
    }

    setIsSaving(true);
    playProcess();

    try {
      const uploadedUrls: UploadedClueUrls = {};

      if (mediaState.imgFile) {
        setUploadProgress({ label: 'Enviando imagem base...', pct: 10 });
        uploadedUrls.imgUrl = await uploadInvestigationImage(
          mediaState.imgFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando imagem base...', pct })
        );
      }

      if (mediaState.uvFile) {
        setUploadProgress({ label: 'Enviando camada UV...', pct: 10 });
        uploadedUrls.uvUrl = await uploadInvestigationImage(
          mediaState.uvFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando camada UV...', pct })
        );
      }

      if (mediaState.filterFile) {
        setUploadProgress({ label: 'Enviando camada de filtro...', pct: 10 });
        uploadedUrls.filterUrl = await uploadInvestigationImage(
          mediaState.filterFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando camada de filtro...', pct })
        );
      }

      if (mediaState.thermalFile) {
        setUploadProgress({ label: 'Enviando camada térmica...', pct: 10 });
        uploadedUrls.thermalUrl = await uploadInvestigationImage(
          mediaState.thermalFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando camada térmica...', pct })
        );
      }

      if (mediaState.forensicFile) {
        setUploadProgress({ label: 'Enviando camada forense RGB...', pct: 10 });
        uploadedUrls.forensicUrl = await uploadInvestigationImage(
          mediaState.forensicFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando camada forense RGB...', pct })
        );
      }

      if (mediaState.videoFile && !mediaState.videoUrlInput.trim()) {
        setUploadProgress({ label: 'Enviando vídeo...', pct: 10 });
        const ext = mediaState.videoFile.name.split('.').pop() || 'mp4';
        uploadedUrls.videoUrl = await uploadInvestigationFile(
          mediaState.videoFile,
          investigationId,
          ext,
          (pct) => setUploadProgress({ label: 'Enviando vídeo...', pct })
        );
      }

      if (mediaState.audioBase) {
        setUploadProgress({ label: 'Enviando áudio base...', pct: 10 });
        const ext = mediaState.audioBase.name.split('.').pop() || 'mp3';
        uploadedUrls.audUrl = await uploadInvestigationFile(
          mediaState.audioBase,
          investigationId,
          ext,
          (pct) => setUploadProgress({ label: 'Enviando áudio base...', pct })
        );
      }

      if (mediaState.audioHidden && !mediaState.audioHiddenUploadedUrl) {
        setUploadProgress({ label: 'Enviando áudio oculto...', pct: 10 });
        const ext = mediaState.audioHidden.name.split('.').pop() || 'mp3';
        uploadedUrls.audHidUrl = await uploadInvestigationFile(
          mediaState.audioHidden,
          investigationId,
          ext,
          (pct) => setUploadProgress({ label: 'Enviando áudio oculto...', pct })
        );
      }

      if (glitchState.glitchFocusedImageFile) {
        setUploadProgress({ label: 'Enviando imagem focada do Glitch...', pct: 10 });
        uploadedUrls.glitchFocusedUrl = await uploadInvestigationImage(
          glitchState.glitchFocusedImageFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando imagem focada do Glitch...', pct })
        );
      }

      if (coreState.evidenceType === 'mega_clue' && megaClueState.megaImageFile) {
        setUploadProgress({ label: 'Enviando imagem da Mega-Pista...', pct: 10 });
        uploadedUrls.megaImageUrl = await uploadInvestigationImage(
          megaClueState.megaImageFile,
          investigationId,
          (pct) => setUploadProgress({ label: 'Enviando imagem da Mega-Pista...', pct })
        );
      }

      setUploadProgress({ label: 'Salvando no banco de dados...', pct: 95 });

      const effectiveSourceCard = isDuplicateMode
        ? duplicateSourceCard || duplicateFromCard || existingCard
        : existingCard;

      const payload = buildClueDbPayload({
        investigationId,
        existingCard: effectiveSourceCard,
        initialX: isDuplicateMode && effectiveSourceCard ? (effectiveSourceCard.x ?? 0) + 40 : initialX,
        initialY: isDuplicateMode && effectiveSourceCard ? (effectiveSourceCard.y ?? 0) + 40 : initialY,
        isDuplicate: isDuplicateMode,
        uploadedUrls,
        coreState,
        securityState,
        mediaState,
        cipherState,
        glitchState,
        megaClueState,
        filterConfig,
        thermalConfig,
        phoneState,
        deviceExtraction,
        audioStudioMeta,
        personState,
        metadataState,
        fieldVisibilityConfig,
        displayConfig,
        mediaVisibility,
        insights,
        cardStatus: isDuplicateMode ? null : cardStatus,
      });

      let resultCard: Record<string, any>;
      if (existingCard?.id && !isDuplicateMode) {
        resultCard = await updateInvestigationCard(existingCard.id, payload);
      } else {
        resultCard = await createInvestigationCard(payload as any);
      }

      clearDraft();
      baselineSnapshotRef.current = dirtySnapshot;
      toast.success(
        isDuplicateMode
          ? '[ SISTEMA ] Cópia criada como nova evidência!'
          : '[ SISTEMA ] Evidência salva com sucesso.',
        { duration: 4000 }
      );
      playSuccess();
      onSaved(resultCard);
      onClose();
    } catch (err) {
      console.error('handleSave error:', err);
      toast.error('[ ERRO ] Falha ao salvar evidência.', { duration: 5000 });
      playClose();
    } finally {
      setIsSaving(false);
      setUploadProgress(null);
    }
  };

  const variants = {
    enter: (dir: number) => ({
      rotateY: dir > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20, mass: 0.8 },
    },
    exit: (dir: number) => ({
      zIndex: 0,
      rotateY: dir < 0 ? 90 : -90,
      opacity: 0,
      transition: { duration: 0.2 },
    }),
  };

  return createPortal(
    <div className="ccm-overlay" onClick={(e) => handleBackdropClick(e)}>
      <div className="ccm-modal">
        <header className="ccm-header">
          <div className="ccm-header-left">
            <div className="ccm-title-wrap">
              <span
                className={`ccm-mode-pill ${isDuplicateMode ? 'is-duplicate' : existingCard?.id ? 'is-edit' : ''
                  }`}
              >
                {isDuplicateMode ? 'Duplicar' : existingCard?.id ? 'Editar' : 'Criar'}
              </span>
              <h2 className="ccm-title">
                {isDuplicateMode
                  ? coreState.title || 'Evidência'
                  : existingCard?.id
                    ? existingCard.title || 'Evidência'
                    : coreState.isHidden
                      ? 'Nova Evidência Oculta'
                      : 'Nova Evidência'}
              </h2>
            </div>
          </div>

          <div className="ccm-header-actions">
            {existingCard?.id && !isDuplicateMode && (
              <button
                type="button"
                className="ccm-btn ccm-btn-sm"
                onClick={handleDuplicateAsNew}
                title="Converter edição atual em uma nova cópia"
              >
                <Copy size={14} />
                <span>Duplicar</span>
              </button>
            )}

            <button
              type="button"
              className="ccm-btn ccm-btn-sm"
              onClick={() => setShowTemplateDropdown((v) => !v)}
              title="Abrir templates salvos"
            >
              <FolderOpen size={15} />
              <span>Templates ({templates.length})</span>
            </button>

            <button
              type="button"
              className="ccm-btn ccm-btn-sm ccm-btn-primary"
              onClick={handleSaveAsTemplate}
              title="Salvar configuração atual como Template"
            >
              <BookmarkPlus size={15} />
              <span>+ Template</span>
            </button>

            {showTemplateDropdown && (
              <div className="ccm-template-dropdown">
                <div className="ccm-template-head">
                  <strong>TEMPLATES SALVOS</strong>
                  <button
                    type="button"
                    className="ccm-btn ccm-btn-sm ccm-btn-ghost"
                    onClick={() => setShowTemplateDropdown(false)}
                    aria-label="Fechar templates"
                  >
                    <X size={14} />
                  </button>
                </div>

                {loadingTemplates ? (
                  <div className="ccm-template-empty">Carregando...</div>
                ) : templates.length === 0 ? (
                  <div className="ccm-template-empty">Nenhum template salvo ainda.</div>
                ) : (
                  templates.map((tpl) => (
                    <div key={tpl.id} className="ccm-template-item">
                      <div className="ccm-template-info">
                        <div className="ccm-template-name">{tpl.name}</div>
                        {tpl.description && (
                          <div className="ccm-template-desc">{tpl.description}</div>
                        )}
                      </div>
                      <button
                        type="button"
                        className="ccm-btn ccm-btn-sm ccm-btn-primary"
                        onClick={() => handleLoadTemplate(tpl)}
                      >
                        Usar
                      </button>
                      <button
                        type="button"
                        className="ccm-btn ccm-btn-sm ccm-btn-danger"
                        onClick={() => handleDeleteTemplate(tpl.id, tpl.name)}
                        title="Excluir template"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <button
              type="button"
              className="ccm-close-btn"
              onClick={() => guardClose()}
              onMouseEnter={() => playHover()}
              title="Fechar"
              aria-label="Fechar modal"
            >
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="ccm-archetype-bar" role="toolbar" aria-label="Modo e predefinições">
          <span className="ccm-archetype-label">PREDEFINIÇÃO</span>
          <div className="ccm-archetype-track">
            {ARCHETYPES.map((arch) => {
              const ArchIcon = arch.icon;
              const isModeActive =
                (arch.id === 'quick' && creatorMode === 'quick') ||
                (arch.id === 'complete' && creatorMode === 'complete');
              return (
                <button
                  key={arch.id}
                  type="button"
                  className={`ccm-archetype-pill ${isModeActive ? 'is-active' : ''}`}
                  onClick={() => {
                    playClick();
                    applyArchetype(arch.id);
                  }}
                >
                  <ArchIcon size={14} />
                  <span>{arch.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {hasDraft && (
          <div className="ccm-draft-banner">
            <div className="ccm-draft-msg">
              <RotateCcw size={15} color="#f2b775" />
              <span>
                Rascunho não salvo encontrado
                {draftTimestamp
                  ? ` (${new Date(draftTimestamp).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })})`
                  : ''}
                .
              </span>
            </div>
            <div className="ccm-draft-actions">
              <button
                type="button"
                className="ccm-btn ccm-btn-sm ccm-btn-primary"
                onClick={restoreDraft}
              >
                Restaurar Rascunho
              </button>
              <button
                type="button"
                className="ccm-btn ccm-btn-sm"
                onClick={discardDraft}
              >
                Descartar
              </button>
            </div>
          </div>
        )}

        <div className={`ccm-body ${creatorMode === 'quick' ? 'is-quick' : ''}`}>
          {creatorMode === 'complete' && (
            <aside className="ccm-sidebar">
              <nav className="ccm-tabs-nav cc-tabs-nav" aria-label="Seções da evidência">
                {(['content', 'config'] as const).map((groupKey) => {
                  const groupTabs = visibleTabs.filter((t) => t.group === groupKey);
                  if (groupTabs.length === 0) return null;
                  return (
                    <div key={groupKey} className="ccm-tab-group">
                      <div className="ccm-tab-group-label">
                        {groupKey === 'content' ? 'Conteúdo' : 'Configuração'}
                      </div>
                      {groupTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        const hasError = tabErrorSet.has(tab.id);
                        const hasContent = tabContentMap[tab.id];
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            data-tab={tab.id}
                            className={`ccm-tab-btn ${isActive ? 'active' : ''}`}
                            onClick={() => handleTabChange(tab.id)}
                            onMouseEnter={() => playHover()}
                          >
                            <Icon size={15} />
                            <span className="ccm-tab-label">{tab.label}</span>
                            {hasError ? (
                              <span className="ccm-tab-dot is-error" title="Erro de validação" />
                            ) : hasContent ? (
                              <span className="ccm-tab-dot is-filled" title="Preenchido" />
                            ) : null}
                            {isActive && (
                              <motion.div
                                layoutId="activeTabIndicator"
                                className="ccm-tab-indicator"
                                transition={{ type: 'spring', stiffness: 360, damping: 32 }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </nav>
            </aside>
          )}

          <div className="ccm-content">
            {creatorMode === 'quick' ? (
              <QuickClueMode />
            ) : (
              <AnimatePresence custom={direction} mode="wait">
                <motion.div
                  key={activeTab}
                  custom={direction}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  className="ccm-motion-wrap"
                >
                  {activeTab === 'geral' && <TabGeneral />}
                  {activeTab === 'visual' && <TabVisual />}
                  {activeTab === 'audio' && <TabAudio />}
                  {activeTab === 'cifra' && <TabCipher />}
                  {activeTab === 'glitch' && <TabGlitch />}
                  {activeTab === 'mega' && <TabMegaClue investigationId={investigationId} />}
                  {activeTab === 'seguranca' && <TabSecurity />}
                  {activeTab === 'metadata' && <TabMetadata />}
                  {activeTab === 'campos' && <TabFieldsVisibility />}
                  {activeTab === 'display' && <TabDisplayConfig />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        <footer className="ccm-footer">
          <div className="ccm-footer-info">
            <span className={`ccm-status-indicator ${isSaving ? 'is-saving' : ''}`}>
              <span className="ccm-status-dot" />
              <span>{isSaving ? 'Processando...' : 'Pronto'}</span>
            </span>

            <button
              type="button"
              className={`ccm-checklist-badge ${errorIssues.length > 0
                ? 'has-errors'
                : warningIssues.length > 0
                  ? 'has-warnings'
                  : 'is-clean'
                }`}
              onClick={() => setShowChecklistPopover((v) => !v)}
              title="Abrir Checklist Anti-Erro"
            >
              {errorIssues.length > 0 ? (
                <AlertCircle size={13} />
              ) : warningIssues.length > 0 ? (
                <AlertTriangle size={13} />
              ) : (
                <CheckCircle2 size={13} />
              )}
              <span>
                {errorIssues.length === 0 && warningIssues.length === 0
                  ? 'Checklist OK'
                  : `${errorIssues.length} Erro${errorIssues.length === 1 ? '' : 's'} • ${warningIssues.length
                  } Aviso${warningIssues.length === 1 ? '' : 's'}`}
              </span>
            </button>

            {showChecklistPopover && (
              <div className="ccm-checklist-popover">
                <div className="ccm-checklist-popover-head">
                  <strong>CHECKLIST ANTI-ERRO</strong>
                  <button
                    type="button"
                    className="ccm-btn ccm-btn-sm ccm-btn-ghost"
                    onClick={() => setShowChecklistPopover(false)}
                    aria-label="Fechar checklist"
                  >
                    <X size={14} />
                  </button>
                </div>
                {validationIssues.length === 0 ? (
                  <div className="ccm-checklist-clean">
                    Nenhum problema ou aviso detectado. Tudo pronto para salvar!
                  </div>
                ) : (
                  <div className="ccm-checklist-items">
                    {validationIssues.map((issue, idx) => (
                      <button
                        key={`${issue.field}-${idx}`}
                        type="button"
                        className={`ccm-checklist-item ${issue.severity}`}
                        onClick={() => navigateToIssueTab(issue.tab)}
                      >
                        <span className="ccm-checklist-item-icon">
                          {issue.severity === 'error' ? (
                            <AlertCircle size={14} color="#ff6b6b" />
                          ) : (
                            <AlertTriangle size={14} color="#f2b775" />
                          )}
                        </span>
                        <span className="ccm-checklist-item-text">{issue.message}</span>
                        <span className="ccm-checklist-item-tab">Ir para {issue.tab} →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {uploadProgress && (
              <div className="ccm-upload-progress">
                <span className="ccm-upload-label">{uploadProgress.label}</span>
                <div className="ccm-upload-bar">
                  <div
                    className="ccm-upload-fill"
                    style={{ width: `${Math.min(100, Math.max(5, uploadProgress.pct))}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="ccm-footer-actions">
            <button
              type="button"
              className="ccm-btn ccm-btn-sim"
              onClick={() => {
                playClick();
                setShowPlayerSimulator(true);
              }}
              disabled={isSaving}
            >
              <Eye size={15} /> Simular Jogador
            </button>
            <button
              type="button"
              className="ccm-btn ccm-btn-ghost"
              onClick={() => guardClose()}
              onMouseEnter={() => playHover()}
              disabled={isSaving}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="ccm-btn ccm-btn-primary cc-btn-save"
              onClick={handleSave}
              onMouseEnter={() => playHover()}
              disabled={isSaving}
            >
              <Save size={15} /> {isSaving ? 'Salvando...' : isDuplicateMode ? 'Criar Cópia' : 'Salvar Evidência'}
            </button>
          </div>
        </footer>
      </div>

      <PlayerViewSimulatorModal
        isOpen={showPlayerSimulator}
        onClose={() => setShowPlayerSimulator(false)}
        investigationId={investigationId}
        existingCard={isDuplicateMode ? duplicateSourceCard : existingCard}
        initialX={initialX}
        initialY={initialY}
      />

      {editorState.editorMode &&
        (mediaState.previewUrl || editorState.uvEditorBaseUrl) &&
        createPortal(
          <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <UVEditor
                baseImageUrl={editorState.uvEditorBaseUrl || mediaState.previewUrl}
                mode={editorState.editorMode || 'uv'}
                initialImageFile={editorState.editorMode === 'filter' ? editorState.filterInitialImage : undefined}
                initialAuthoringState={editorState.editorMode === 'uv' ? mediaState.uvAuthoringState : undefined}
                showForensicControls={editorState.uvEditorPurpose === 'forensic'}
                onSave={(file, meta) => {
                  if (editorState.uvEditorPurpose === 'forensic') {
                    const newUrl = URL.createObjectURL(file);
                    registerUrl(newUrl);
                    revokeUrl(mediaState.previewUrl);
                    setMediaState((prev) => ({
                      ...prev,
                      imgFile: file,
                      previewUrl: newUrl,
                      removedImage: false,
                    }));
                    toast.success('Camada forense aplicada na imagem principal!');
                  } else if (editorState.editorMode === 'uv') {
                    const newUvUrl = URL.createObjectURL(file);
                    registerUrl(newUvUrl);
                    revokeUrl(mediaState.uvPreviewUrl);
                    setMediaState((prev) => ({
                      ...prev,
                      uvFile: file,
                      uvPreviewUrl: newUvUrl,
                      uvAuthoringState: meta?.uvAuthoringState ?? prev.uvAuthoringState,
                      removedUv: false,
                    }));
                  } else if (editorState.editorMode === 'filter') {
                    const newFilterUrl = URL.createObjectURL(file);
                    registerUrl(newFilterUrl);
                    revokeUrl(mediaState.filterPreviewUrl);
                    setMediaState((prev) => ({
                      ...prev,
                      filterFile: file,
                      filterPreviewUrl: newFilterUrl,
                      removedFilter: false,
                    }));
                    setFilterConfig((fc) => ({
                      brightness: fc.brightness === 100 && fc.contrast === 100 ? 150 : fc.brightness,
                      contrast: fc.contrast === 100 && fc.brightness === 100 ? 150 : fc.contrast,
                      saturate: fc.saturate,
                      transform: fc.transform || { left: 25, top: 25, width: 50, height: 50 },
                    }));
                  }
                  setEditorState((prev) => ({
                    ...prev,
                    editorMode: null,
                    filterInitialImage: null,
                    uvEditorBaseUrl: null,
                    uvEditorPurpose: null,
                  }));
                }}
                onClose={() => {
                  setEditorState((prev) => ({
                    ...prev,
                    editorMode: null,
                    filterInitialImage: null,
                    uvEditorBaseUrl: null,
                    uvEditorPurpose: null,
                  }));
                }}
              />
            </div>
          </div>,
          document.body
        )}

      {editorState.showForensicEditor &&
        mediaState.previewUrl &&
        createPortal(
          <ForensicChannelEditor
            baseImageUrl={mediaState.previewUrl}
            initialConfig={{
              targetChannel: mediaState.forensicTargetChannel || 'R',
            }}
            onSave={(blob, config) => {
              const file = new File([blob], `forensic-rgb-${Date.now()}.png`, {
                type: 'image/png',
              });
              const newUrl = URL.createObjectURL(file);
              registerUrl(newUrl);

              if (config.applyMode === 'composite') {
                revokeUrl(mediaState.previewUrl);
                setMediaState((prev) => ({
                  ...prev,
                  imgFile: file,
                  previewUrl: newUrl,
                  forensicTargetChannel: config.targetChannel,
                  removedImage: false,
                }));
                toast.success(
                  `Imagem composta RGB (Canal ${config.targetChannel}) aplicada como imagem base!`
                );
              } else {
                revokeUrl(mediaState.forensicPreviewUrl);
                setMediaState((prev) => ({
                  ...prev,
                  forensicFile: file,
                  forensicPreviewUrl: newUrl,
                  forensicTargetChannel: config.targetChannel,
                  removedForensic: false,
                }));
                toast.success(
                  `Camada Forense RGB (Canal ${config.targetChannel}) aplicada na pista!`
                );
              }
              setEditorState((prev) => ({ ...prev, showForensicEditor: false }));
            }}
            onClose={() => setEditorState((prev) => ({ ...prev, showForensicEditor: false }))}
          />,
          document.body
        )}

      {editorState.showThermalEditor &&
        mediaState.previewUrl &&
        createPortal(
          <ThermalEditor
            baseImageUrl={mediaState.previewUrl}
            thermalText={thermalConfig.secretText}
            initialFontSize={thermalConfig.fontSize}
            initialPositionY={thermalConfig.positionY}
            initialPalette={thermalConfig.palette}
            initialElements={thermalConfig.elements}
            onSave={(file, config) => {
              const newUrl = URL.createObjectURL(file);
              registerUrl(newUrl);
              revokeUrl(mediaState.thermalPreviewUrl);
              setMediaState((prev) => ({
                ...prev,
                thermalFile: file,
                thermalPreviewUrl: newUrl,
                removedThermal: false,
              }));
              setThermalConfig((prev) => ({
                ...prev,
                enabled: true,
                secretText: config.text,
                fontSize: config.fontSize,
                positionY: config.positionY,
                palette: config.palette,
                elements: config.elements,
              }));
              toast.success('Camada Térmica aplicada diretamente na pista!');
              setEditorState((prev) => ({ ...prev, showThermalEditor: false }));
            }}
            onClose={() => setEditorState((prev) => ({ ...prev, showThermalEditor: false }))}
          />,
          document.body
        )}

      {editorState.showGlitchDesigner &&
        mediaState.previewUrl &&
        createPortal(
          <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <UVEditor
                baseImageUrl={mediaState.previewUrl}
                mode="uv"
                showForensicControls={false}
                onSave={(file) => {
                  const newUrl = URL.createObjectURL(file);
                  registerUrl(newUrl);
                  revokeUrl(glitchState.glitchFocusedImagePreview);
                  setGlitchState((prev) => ({
                    ...prev,
                    glitchFocusedImageFile: file,
                    glitchFocusedImagePreview: newUrl,
                  }));
                  setMediaState((prev) => ({ ...prev, removedGlitchFocused: false }));
                  setEditorState((prev) => ({ ...prev, showGlitchDesigner: false }));
                }}
                onClose={() => setEditorState((prev) => ({ ...prev, showGlitchDesigner: false }))}
              />
            </div>
          </div>,
          document.body
        )}

      {editorState.showAudioForgeFor &&
        createPortal(
          <AudioLab
            isOpen={!!editorState.showAudioForgeFor}
            onClose={() => setEditorState((prev) => ({ ...prev, showAudioForgeFor: null }))}
            initialBaseAudio={mediaState.audioBase}
            onSave={async (file) => {
              const currentForgeFor = editorState.showAudioForgeFor;
              setEditorState((prev) => ({ ...prev, showAudioForgeFor: null }));

              if (currentForgeFor === 'hidden') {
                revokeUrl(mediaState.audioHiddenPreview);
                const newUrl = URL.createObjectURL(file);
                registerUrl(newUrl);
                setMediaState((prev) => ({
                  ...prev,
                  audioHidden: file,
                  audioHiddenPreview: newUrl,
                  audioHiddenUploadedUrl: null,
                  removedAudioHidden: false,
                }));

                try {
                  const ext = file.name.split('.').pop() || 'mp3';
                  const publicUrl = await uploadInvestigationFile(file, investigationId, ext);
                  if (publicUrl) {
                    setMediaState((prev) => ({
                      ...prev,
                      audioHiddenUploadedUrl: publicUrl,
                      audioHiddenPreview: publicUrl,
                    }));
                  }
                } catch (e) {
                  console.error('AudioLab upload failed', e);
                }
              } else {
                revokeUrl(mediaState.audioBasePreview);
                const newUrl = URL.createObjectURL(file);
                registerUrl(newUrl);
                setMediaState((prev) => ({
                  ...prev,
                  audioBase: file,
                  audioBasePreview: newUrl,
                  removedAudioBase: false,
                }));
              }
            }}
          />,
          document.body
        )}
    </div>,
    document.body
  );
}

export default function CreateClueModal(props: CreateClueModalProps) {
  if (!props.isOpen) return null;
  return (
    <ClueModalProvider investigationId={props.investigationId}>
      <CreateClueModalContent {...props} />
    </ClueModalProvider>
  );
}
