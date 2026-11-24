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
  Wrench,
  Copy,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
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

const ARCHETYPES: { id: ClueArchetype; label: string; icon: string }[] = [
  { id: 'quick', label: 'Pista Rápida', icon: '⚡' },
  { id: 'forensic_doc', label: 'Doc Forense', icon: '📄' },
  { id: 'secret_audio', label: 'Áudio / Espectrograma', icon: '🎵' },
  { id: 'puzzle_lock', label: 'Enigma / Senha', icon: '🔐' },
  { id: 'fake_phone', label: 'Celular Falso', icon: '📱' },
  { id: 'mega_clue', label: 'Mega-Pista', icon: '🌟' },
  { id: 'complete', label: 'Avançado: 10 Abas', icon: '🛠️' },
];

const TABS = [
  { id: 'geral', label: 'Geral', icon: BookOpen },
  { id: 'visual', label: 'Visual', icon: ImageIcon },
  { id: 'audio', label: 'Áudio', icon: Music },
  { id: 'cifra', label: 'Cifra & Hex', icon: Lock },
  { id: 'glitch', label: 'Glitch', icon: Cpu },
  { id: 'mega', label: 'Tipos Especiais', icon: Network },
  { id: 'seguranca', label: 'Segurança', icon: ShieldAlert },
  { id: 'metadata', label: 'Metadados', icon: Fingerprint },
  { id: 'campos', label: 'Campos', icon: Eye },
  { id: 'display', label: 'Display', icon: Settings },
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

  return (
    <div className="cc-fullscreen-overlay" onClick={(e) => handleBackdropClick(e)}>
      <div className="cc-refactored-layout">
        {creatorMode === 'complete' && (
          <aside className="cc-refactored-sidebar">
            <nav className="cc-tabs-nav">
              {visibleTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    data-tab={tab.id}
                    className={`cc-tab-button ${isActive ? 'active' : ''}`}
                    onClick={() => handleTabChange(tab.id)}
                    onMouseEnter={() => playHover()}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="cc-tab-indicator"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          </aside>
        )}

        <main className="cc-refactored-main">
          <header className="cc-modal-header">
            <div className="cc-modal-title-group">
              <h2 className="cc-modal-title">
                {isDuplicateMode
                  ? `DUPLICANDO: ${coreState.title || 'EVIDÊNCIA'}`
                  : existingCard?.id
                  ? `EDITANDO: ${existingCard.title || 'EVIDÊNCIA'}`
                  : coreState.isHidden
                  ? 'NOVA EVIDÊNCIA OCULTA'
                  : 'NOVA EVIDÊNCIA'}
              </h2>

              <div className="cc-mode-switcher" role="group" aria-label="Modo de criação">
                <button
                  type="button"
                  className={`cc-mode-btn ${creatorMode === 'quick' ? 'active' : ''}`}
                  onClick={() => {
                    playClick();
                    setCreatorMode('quick');
                  }}
                >
                  <Zap size={13} /> Modo Rápido
                </button>
                <button
                  type="button"
                  className={`cc-mode-btn ${creatorMode === 'complete' ? 'active' : ''}`}
                  onClick={() => {
                    playClick();
                    setCreatorMode('complete');
                  }}
                >
                  <Wrench size={13} /> Modo Completo (10 Abas)
                </button>
              </div>
            </div>

            <div className="cc-header-actions">
              <button
                type="button"
                className="cc-btn cc-btn-sim"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => {
                  playClick();
                  setShowPlayerSimulator(true);
                }}
                title="Pré-visualizar exatamente como o jogador verá esta pista"
              >
                <Eye size={15} /> Simular Visão do Jogador
              </button>

              {existingCard?.id && !isDuplicateMode && (
                <button
                  type="button"
                  className="cc-btn cc-btn-cancel"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                  onClick={handleDuplicateAsNew}
                  title="Converter edição atual em uma nova cópia"
                >
                  <Copy size={14} /> Duplicar como Nova
                </button>
              )}

              <button
                type="button"
                className="cc-btn cc-btn-cancel"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={() => setShowTemplateDropdown((v) => !v)}
              >
                <FolderOpen size={15} /> Templates ({templates.length})
              </button>

              <button
                type="button"
                className="cc-btn cc-btn-save"
                style={{ padding: '6px 12px', fontSize: 12 }}
                onClick={handleSaveAsTemplate}
                title="Salvar configuração atual como Template"
              >
                <BookmarkPlus size={15} /> Salvar Template
              </button>

              {showTemplateDropdown && (
                <div className="cc-template-dropdown">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: 12, color: 'var(--cc-neon)', letterSpacing: 1 }}>
                      TEMPLATES SALVOS
                    </strong>
                    <button
                      type="button"
                      className="cc-btn cc-btn-cancel"
                      style={{ padding: '2px 6px', fontSize: 11 }}
                      onClick={() => setShowTemplateDropdown(false)}
                    >
                      ✕
                    </button>
                  </div>

                  {loadingTemplates ? (
                    <div style={{ fontSize: 12, color: 'var(--cc-text-muted)' }}>Carregando...</div>
                  ) : templates.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--cc-text-muted)', padding: '8px 0' }}>
                      Nenhum template salvo ainda.
                    </div>
                  ) : (
                    templates.map((tpl) => (
                      <div key={tpl.id} className="cc-template-item">
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {tpl.name}
                          </div>
                          {tpl.description && (
                            <div style={{ fontSize: 11, color: 'var(--cc-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {tpl.description}
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="cc-btn cc-btn-save"
                          style={{ padding: '4px 8px', fontSize: 11 }}
                          onClick={() => handleLoadTemplate(tpl)}
                        >
                          Usar
                        </button>
                        <button
                          type="button"
                          className="cc-btn cc-btn-cancel"
                          style={{ padding: '4px 6px', borderColor: '#ff4444', color: '#ff6666' }}
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
                className="cc-fullscreen-close"
                onClick={() => guardClose()}
                onMouseEnter={() => playHover()}
                title="Fechar"
              >
                <X size={18} />
              </button>
            </div>
          </header>

          <div className="cc-archetype-bar">
            <span className="cc-archetype-label">ARQUÉTIPOS:</span>
            {ARCHETYPES.map((arch) => (
              <button
                key={arch.id}
                type="button"
                className="cc-archetype-pill"
                onClick={() => {
                  playClick();
                  applyArchetype(arch.id);
                }}
              >
                <span>{arch.icon}</span>
                <span>{arch.label}</span>
              </button>
            ))}
          </div>

          {hasDraft && (
            <div className="cc-draft-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
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
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  className="cc-btn cc-btn-save"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={restoreDraft}
                >
                  Restaurar Rascunho
                </button>
                <button
                  type="button"
                  className="cc-btn cc-btn-cancel"
                  style={{ padding: '4px 10px', fontSize: 11 }}
                  onClick={discardDraft}
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          <div className="cc-tab-content-wrapper">
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
                  className="cc-tab-motion-container"
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

          <footer className="cc-refactored-footer">
            <div className="cc-footer-info" style={{ position: 'relative' }}>
              <span className="cc-status-badge">{isSaving ? 'PROCESSANDO...' : 'PRONTO'}</span>

              <button
                type="button"
                className={`cc-checklist-badge ${
                  errorIssues.length > 0
                    ? 'has-errors'
                    : warningIssues.length > 0
                    ? 'has-warnings'
                    : 'is-clean'
                }`}
                onClick={() => setShowChecklistPopover((v) => !v)}
                title="Abrir Checklist Anti-Erro"
              >
                {errorIssues.length > 0 ? (
                  <AlertCircle size={14} />
                ) : warningIssues.length > 0 ? (
                  <AlertTriangle size={14} />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                <span>
                  {errorIssues.length === 0 && warningIssues.length === 0
                    ? 'Checklist: OK'
                    : `${errorIssues.length} Erro${errorIssues.length === 1 ? '' : 's'} • ${
                        warningIssues.length
                      } Aviso${warningIssues.length === 1 ? '' : 's'}`}
                </span>
              </button>

              {showChecklistPopover && (
                <div className="cc-checklist-popover">
                  <div className="cc-checklist-popover-header">
                    <strong>CHECKLIST ANTI-ERRO</strong>
                    <button
                      type="button"
                      className="cc-btn cc-btn-cancel"
                      style={{ padding: '2px 6px', fontSize: 11 }}
                      onClick={() => setShowChecklistPopover(false)}
                    >
                      ✕
                    </button>
                  </div>
                  {validationIssues.length === 0 ? (
                    <div style={{ fontSize: 12, color: '#4ade80', padding: '6px 0' }}>
                      Nenhum problema ou aviso detectado. Tudo pronto para salvar!
                    </div>
                  ) : (
                    <div className="cc-checklist-items">
                      {validationIssues.map((issue, idx) => (
                        <button
                          key={`${issue.field}-${idx}`}
                          type="button"
                          className={`cc-checklist-item ${issue.severity}`}
                          onClick={() => navigateToIssueTab(issue.tab)}
                        >
                          <span className="cc-checklist-item-icon">
                            {issue.severity === 'error' ? (
                              <AlertCircle size={14} color="#ff6b6b" />
                            ) : (
                              <AlertTriangle size={14} color="#f2b775" />
                            )}
                          </span>
                          <span className="cc-checklist-item-text">{issue.message}</span>
                          <span className="cc-checklist-item-tab">Ir para {issue.tab} →</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {uploadProgress && (
                <div className="cc-upload-progress">
                  <span style={{ fontSize: 11, color: 'var(--cc-neon)', whiteSpace: 'nowrap' }}>
                    {uploadProgress.label}
                  </span>
                  <div className="cc-upload-progress-bar">
                    <div
                      className="cc-upload-progress-fill"
                      style={{ width: `${Math.min(100, Math.max(5, uploadProgress.pct))}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="cc-footer-buttons">
              <button
                type="button"
                className="cc-btn cc-btn-sim"
                onClick={() => {
                  playClick();
                  setShowPlayerSimulator(true);
                }}
                disabled={isSaving}
              >
                <Eye size={16} /> SIMULAR JOGADOR
              </button>
              <button
                type="button"
                className="cc-btn cc-btn-cancel"
                onClick={() => guardClose()}
                onMouseEnter={() => playHover()}
                disabled={isSaving}
              >
                <X size={16} /> CANCELAR
              </button>
              <button
                type="button"
                className="cc-btn cc-btn-save"
                onClick={handleSave}
                onMouseEnter={() => playHover()}
                disabled={isSaving}
              >
                <Save size={16} /> {isSaving ? 'SALVANDO...' : isDuplicateMode ? 'CRIAR CÓPIA' : 'SALVAR EVIDÊNCIA'}
              </button>
            </div>
          </footer>
        </main>
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
    </div>
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
