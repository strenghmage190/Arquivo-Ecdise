import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Eye, EyeOff, Shield, Image as ImageIcon, Music, Lock, Zap, Settings, BookOpen, Cpu, Network, ShieldAlert, Fingerprint } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import UVEditor from '../tools/UVEditor';
import AudioLab from '../tools/audiolab/AudioLab';
import ThermalEditor from '../tools/ThermalEditor';
import ForensicChannelEditor from '../tools/ForensicChannelEditor';
import PhoneViewer from '../tools/PhoneViewer';
import GlitchImageEngine from '../tools/GlitchImageEngine';
import { toast } from 'sonner';
import { ClueModalProvider, useClueModal } from '../../contexts/ClueModalContext';
import { useCyberpunkUI } from '../../hooks/useCyberpunkUI';
import { useClueTour } from '../../hooks/useClueTour';
import { createInvestigationCard, updateInvestigationCard } from '../../api/investigations';
import 'react-tooltip/dist/react-tooltip.css';
import './CreateClueModal_Refactored.css';
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

async function uploadAudio(file: File, investigationId: string): Promise<string | null> {
   const originalName = file.name || 'audio';
   const ext = originalName.split('.').pop() || '';
   const base = originalName.replace(/\.[^/.]+$/, '')
      .normalize('NFKD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 120);
   const safeName = `audio_${Date.now()}_${base}${ext ? '.' + ext : ''}`;
   const path = `${investigationId}/${safeName}`;
   const { data, error } = await supabase.storage.from('investigation-assets').upload(path, file);
  if (error) throw error;
  const { data: publicData } = await supabase.storage.from('investigation-assets').getPublicUrl(path);
  return (publicData as any)?.publicUrl || null;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: (card: Record<string, any>) => void;
  existingCard?: any;
  defaultHidden?: boolean;
}

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

function CreateClueModalContent({ isOpen, onClose, existingCard, onSaved, initialX, initialY, investigationId }: Props) {
  const { playBoot, playClick, playHover, playClose, playProcess, playSuccess } = useCyberpunkUI();
  const { startTour, shouldShowTour } = useClueTour();
  const {
    resetForm, loadExistingCard, registerUrl, revokeUrl,
    coreState, securityState, mediaState, setMediaState,
    cipherState, glitchState, megaClueState,
    displayConfig, mediaVisibility, fieldVisibilityConfig,
    editorState, setEditorState,
    filterConfig, thermalConfig, phoneState, personState, metadataState
  } = useClueModal();
  const [activeTab, setActiveTab] = useState('geral');
  const [direction, setDirection] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      playBoot();
      if (existingCard) {
        loadExistingCard(existingCard);
      } else {
        resetForm();
      }
    } else {
      playClose();
    }
  }, [isOpen, existingCard]);

  useEffect(() => {
    if (isOpen && shouldShowTour()) {
      const timer = setTimeout(() => startTour(), 800);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTabChange = (tabId: string) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    const nextIndex = TABS.findIndex(t => t.id === tabId);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(tabId);
    playClick();
  };

  const handleSave = async () => {
    // Validation
    if (!coreState.title.trim()) {
      toast.error('Título é obrigatório.');
      return;
    }

    setIsSaving(true);
    playProcess();
    try {
      // ====== UPLOADS ======
      let imgUrl: string | null = null;
      let uvUrl: string | null = null;
      let audUrl: string | null = null;
      let audHidUrl: string | null = null;
      let finalVideoUrl: string | null = null;
      let glitchFocusedUrl: string | null = null;
      let megaImageUrl: string | null = null;

      // Image upload
      if (mediaState.imgFile) {
        const { uploadInvestigationImage } = await import('../../utils/storage');
        imgUrl = await uploadInvestigationImage(mediaState.imgFile, investigationId);
      }
      // Preserve existing image when editing
      if (!imgUrl && existingCard) {
        imgUrl = existingCard.image_url || null;
      }

      // UV upload
      if (mediaState.uvFile) {
        const { uploadInvestigationImage } = await import('../../utils/storage');
        uvUrl = await uploadInvestigationImage(mediaState.uvFile, investigationId);
      }
      // Preserve existing UV
      if (!uvUrl && existingCard) {
        uvUrl = existingCard.image_uv_url || existingCard.metadata?.uv_layer_url || existingCard.metadata?.hidden_uv_url || null;
      }

      // Filter upload
      let filterUrl: string | null = null;
      if (mediaState.filterFile) {
        const { uploadInvestigationImage } = await import('../../utils/storage');
        filterUrl = await uploadInvestigationImage(mediaState.filterFile, investigationId);
      }

      // Video upload (prefer URL input, then file upload)
      finalVideoUrl = mediaState.videoUrlInput || mediaState.videoUrl || null;
      if (!finalVideoUrl && mediaState.videoFile) {
        const { uploadInvestigationFile } = await import('../../utils/storage');
        finalVideoUrl = await uploadInvestigationFile(mediaState.videoFile, investigationId, mediaState.videoFile.name.split('.').pop() || 'mp4');
      }

      // Audio uploads
      if (mediaState.audioBase) {
        audUrl = await uploadAudio(mediaState.audioBase, investigationId);
      }
      if (mediaState.audioHiddenUploadedUrl) {
        audHidUrl = mediaState.audioHiddenUploadedUrl;
      } else if (mediaState.audioHidden) {
        audHidUrl = await uploadAudio(mediaState.audioHidden, investigationId);
      }

      // Glitch focused image
      if (glitchState.glitchFocusedImageFile) {
        const { uploadInvestigationImage } = await import('../../utils/storage');
        glitchFocusedUrl = await uploadInvestigationImage(glitchState.glitchFocusedImageFile, investigationId);
      }

      // Mega image
      if (coreState.evidenceType === 'mega_clue' && megaClueState.megaImageFile) {
        const { uploadInvestigationImage } = await import('../../utils/storage');
        megaImageUrl = await uploadInvestigationImage(megaClueState.megaImageFile, investigationId);
      }

      // ====== HEX ENCODING HELPERS ======
      const textToUtf8Bytes = (s: string) => { try { return new TextEncoder().encode(s); } catch { return new Uint8Array([]); } };
      const bytesToHex = (bytes: Uint8Array) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
      const textToHex = (s: string) => bytesToHex(textToUtf8Bytes(s));
      const xorEncode = (text: string, key: string) => {
        const data = textToUtf8Bytes(text);
        const k = textToUtf8Bytes(key || 'key');
        const out = new Uint8Array(data.length);
        for (let i = 0; i < data.length; i++) out[i] = data[i] ^ k[i % k.length];
        return bytesToHex(out);
      };
      const encodeHex = (text: string, method: string, key: string) => {
        if (!text) return '';
        if (method === 'plain') return text;
        if (method === 'utf8hex') return textToHex(text);
        if (method === 'xor') return xorEncode(text, key);
        if (method === 'enigma') return textToHex(text); // simplified
        return text;
      };

      // ====== BUILD METADATA ======
      const wantsSecurityLayer = securityState.securityLayerEnabled || coreState.evidenceType === 'glitch_puzzle';
      const revealRequiresKeyword = securityState.revealLogicMode === 'aligned_keyword' || glitchState.glitchRequireKeyword;
      const baseMediaType = finalVideoUrl ? 'video' : audUrl ? 'audio' : imgUrl ? 'image' : 'unknown';
      const baseMediaUrl = finalVideoUrl || audUrl || imgUrl || null;

      const metadata: Record<string, any> = {
        display_config: displayConfig,
        media_visibility: {
          audio_base: mediaVisibility.audioBase,
          audio_hidden: mediaVisibility.audioHidden,
          uv_layer: mediaVisibility.uvLayer,
          visual: mediaVisibility.visual,
        },
        field_visibility: fieldVisibilityConfig,
        image_filter_reveal: {
          brightness: filterConfig.brightness,
          contrast: filterConfig.contrast,
          saturate: filterConfig.saturate,
        },
      };

      // Hex code
      if (cipherState.hexCode) {
        metadata.hex_code = encodeHex(cipherState.hexCode, cipherState.hexEncodingMethod, cipherState.hexEncodingKey);
      }

      // Thermal
      if (thermalConfig.enabled) {
        metadata.thermal = true;
        if (thermalConfig.secretText) metadata.thermal_secret_text = thermalConfig.secretText;
        if (thermalConfig.keyword) metadata.thermal_keyword = thermalConfig.keyword;
        metadata.thermal_font_size = thermalConfig.fontSize;
        metadata.thermal_position_y = thermalConfig.positionY;
      }

      // Chat/Phone
      if (phoneState.chatList.length > 0) {
        metadata.chat_data = phoneState.chatList;
        metadata.chat_contact_name = phoneState.contactName;
      }
      if (phoneState.hasKeypad && phoneState.password) {
        metadata.phone_locked = true;
        metadata.phone_password = phoneState.password;
        metadata.phone_lock_type = phoneState.lockType;
      }

      // Person
      if (personState.isPerson) {
        metadata.is_person = true;
        metadata.person = {
          name: personState.name || coreState.title,
          dob: personState.age || null,
          status: personState.status || 'UNKNOWN',
          occupation: personState.profession || null,
        };
      }

      // External link
      if (metadataState.externalLink) metadata.external_link = metadataState.externalLink;

      // Field values (EXIF, stamp, etc)
      metadata.field_values = {
        date_created: metadataState.fakeDate || null,
        gps_coords: metadataState.fakeLocation || metadataState.fakeMetaGps || null,
        device_owner: metadataState.fakeMetaOwner || null,
        camera_model: metadataState.fakeMetaCam || null,
        technical_note: metadataState.technicalNote || null,
        chat_contact_name: phoneState.contactName || null,
        stamp: metadataState.stamp || null,
        external_link: metadataState.externalLink || null,
      };

      // Security Layer + Glitch Puzzle
      if (wantsSecurityLayer) {
        const securityLayer = {
          enabled: true,
          reveal_logic: securityState.revealLogicMode,
          require_keyword: revealRequiresKeyword,
          keyword: revealRequiresKeyword ? (glitchState.glitchKeyword || null) : null,
          reward_code: glitchState.glitchRewardCode || null,
          signal_targets: securityState.signalTargets,
          slider_config: {
            target_frequency: glitchState.glitchCorrectFrequency,
            target_shift: glitchState.glitchCorrectShift,
            target_chromatic: glitchState.glitchCorrectChromatic,
            tolerance_frequency: glitchState.glitchToleranceFreq,
            tolerance_shift: glitchState.glitchToleranceShift,
            tolerance_chromatic: glitchState.glitchToleranceChroma,
          },
          start_values: {
            frequency: glitchState.glitchStartFrequency,
            shift: glitchState.glitchStartShift,
            chromatic: glitchState.glitchStartChromatic,
          },
        };

        const glitchPuzzleMeta = {
          original_image_url: baseMediaUrl || imgUrl || null,
          corrupted_image_url: imgUrl || null,
          correct_frequency: glitchState.glitchCorrectFrequency,
          correct_shift: glitchState.glitchCorrectShift,
          correct_chromatic: glitchState.glitchCorrectChromatic,
          difficulty: glitchState.glitchDifficulty,
          tolerance_frequency: glitchState.glitchToleranceFreq,
          tolerance_shift: glitchState.glitchToleranceShift,
          tolerance_chromatic: glitchState.glitchToleranceChroma,
          start_frequency: glitchState.glitchStartFrequency,
          start_shift: glitchState.glitchStartShift,
          start_chromatic: glitchState.glitchStartChromatic,
          access_instructions: glitchState.glitchAccessInstructions || undefined,
          hint: glitchState.glitchHint || undefined,
          reward_code: glitchState.glitchRewardCode,
          correct_keyword: revealRequiresKeyword ? (glitchState.glitchKeyword || null) : null,
          require_keyword_validation: revealRequiresKeyword,
          unlock_mode: glitchState.glitchUnlockMode,
          hidden_uv_url: uvUrl || null,
          hidden_audio_url: glitchState.glitchHiddenAudioUrl || null,
          hidden_video_url: glitchState.glitchHiddenVideoUrl || null,
          focused_image_url: glitchFocusedUrl || null,
          image_uv_url: uvUrl || null,
          media_visibility: metadata.media_visibility,
          audio_static_sync: securityState.audioStaticSync,
          narrative_hints: {
            audio_guides_visual: securityState.narrativeLinks.audioHintsVisual,
            visual_guides_code: securityState.narrativeLinks.visualHintsCode,
            hint_note: securityState.narrativeLinks.hintNote || null,
          },
          security_layer: securityLayer,
          solved: false,
        };

        metadata.unified_media = {
          base_media_type: baseMediaType,
          base_media_url: baseMediaUrl,
          uv_layer_url: uvUrl || null,
          filter_layer_url: filterUrl || null,
          hidden_layer_url: glitchFocusedUrl || null,
          video_url: finalVideoUrl || null,
          audio_base_url: audUrl || null,
          audio_hidden_url: audHidUrl || null,
          hide_preview_on_board: securityState.hidePreviewOnBoard,
        };
        metadata.masked_preview = securityState.hidePreviewOnBoard;
        metadata.security_layer = securityLayer;
        metadata.glitch_puzzle = glitchPuzzleMeta;
        metadata.audio_static_sync = securityState.audioStaticSync;
        metadata.narrative_hints = {
          audio_guides_visual: securityState.narrativeLinks.audioHintsVisual,
          visual_guides_code: securityState.narrativeLinks.visualHintsCode,
          hint_note: securityState.narrativeLinks.hintNote || null,
        };
      }

      // Mega Clue
      if (coreState.evidenceType === 'mega_clue') {
        metadata.mega_clue = {
          final_truth_text: megaClueState.megaFinalTruthText,
          required_puzzle_ids: megaClueState.megaRequiredPuzzleIds,
          required_code_count: megaClueState.megaRequiredPuzzleIds.length,
          solved_puzzle_ids: [],
          collected_codes: [],
          unlocked: false,
        };
      }

      // Audio metadata
      if (audHidUrl) metadata.audio_hidden_url = audHidUrl;

      // Filter transform
      if (filterUrl) metadata.image_filter_layer_transform = { left: 25, top: 25, width: 50, height: 50 };

      // ====== RESOLVE CARD TYPE ======
      const resolvedCardType = (() => {
        if (coreState.evidenceType === 'mega_clue') return 'mega_clue';
        if (coreState.evidenceType === 'glitch_puzzle') return 'glitch_puzzle';
        if (wantsSecurityLayer) {
          if (finalVideoUrl) return 'encrypted_video';
          if (audUrl || mediaState.audioBase) return 'locked_audio';
          if (imgUrl) return 'glitch_puzzle';
        }
        return coreState.evidenceType === 'document' ? null : coreState.evidenceType;
      })();

      // Board image (use placeholder for hidden puzzles)
      const LOCKED_PLACEHOLDER = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/xcAAwEB/aurbZkAAAAASUVORK5CYII=';
      const boardImageUrl = (wantsSecurityLayer || securityState.hidePreviewOnBoard) && coreState.evidenceType !== 'glitch_puzzle'
        ? LOCKED_PLACEHOLDER
        : (imgUrl || (existingCard ? existingCard.image_url : null));

      // ====== BUILD PAYLOAD ======
      const payload: Record<string, any> = {
        investigation_id: investigationId,
        title: coreState.title,
        type: resolvedCardType,
        description_public: coreState.descPublic || null,
        description_hidden: coreState.descHidden || null,
        x: existingCard ? existingCard.x : (initialX ?? 100),
        y: existingCard ? existingCard.y : (initialY ?? 100),
        image_url: boardImageUrl,
        image_uv_url: uvUrl,
        image_filter_layer: filterUrl,
        is_locked: securityState.isLocked,
        lock_password: (securityState.isLocked && coreState.evidenceType !== 'mega_clue') ? securityState.lockPass : null,
        is_hidden: coreState.isHidden,
        discovery_code: coreState.isHidden ? (coreState.discoveryCode || '').trim().toUpperCase() : null,
        metadata,
        audio_url: audUrl,
        video_url: finalVideoUrl,
      };

      // Shredder
      if (coreState.evidenceType === 'document' && cipherState.isShredded) {
        payload.is_shredded = true;
        payload.metadata.is_shredded = true;
        payload.metadata.shred_rows = cipherState.shredRows;
        payload.metadata.shred_cols = cipherState.shredCols;
      }
      if (coreState.evidenceType === 'document') {
        if (cipherState.realText) payload.real_text = cipherState.realText;
        if (cipherState.cipherText) payload.cipher_text = cipherState.cipherText;
      }

      // Stamp
      if (metadataState.stamp) payload.stamp_text = metadataState.stamp;

      // Mega clue lock passes
      if (coreState.evidenceType === 'mega_clue' && securityState.isLocked) {
        payload.metadata.mega_clue = payload.metadata.mega_clue || {};
        payload.metadata.mega_clue.required_codes = securityState.lockPasses || [];
      }

      // Clear glitch when not security layer
      if (existingCard?.id && !wantsSecurityLayer) {
        payload.metadata.glitch_puzzle = null;
        payload.metadata.security_layer = null;
      }

      // ====== SAVE ======
      let resultCard: Record<string, any>;
      if (existingCard?.id) {
        resultCard = await updateInvestigationCard(existingCard.id, payload);
      } else {
        resultCard = await createInvestigationCard(payload as any);
      }

      toast.success('[ SISTEMA ] Evidência salva com sucesso.', {
        duration: 4000,
        style: {
          background: 'var(--nexus-bg)',
          color: 'var(--nexus-neon)',
          border: '1px solid var(--nexus-neon)',
          fontFamily: 'Share Tech Mono, monospace',
        },
      });
      playSuccess();
      onSaved(resultCard);
      onClose();
    } catch (err) {
      console.error('handleSave error:', err);
      toast.error('[ ERRO ] Falha ao salvar evidência.', {
        duration: 5000,
        style: {
          background: 'var(--nexus-bg)',
          color: '#ff4444',
          border: '1px solid #ff4444',
        },
      });
      playClose();
    } finally {
      setIsSaving(false);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20, mass: 0.8 }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      rotateY: direction < 0 ? 90 : -90,
      opacity: 0,
      transition: { duration: 0.2 }
    })
  };

  const visibleTabs = TABS.filter(tab => {
    if (tab.id === 'glitch') return coreState.evidenceType === 'glitch_puzzle';
    if (tab.id === 'mega') return coreState.evidenceType === 'mega_clue';
    return true;
  });

  return (
    <div className="cc-fullscreen-overlay">
      <div className="cc-refactored-layout">
        <button 
          className="cc-fullscreen-close" 
          onClick={() => { playClose(); onClose(); }}
          onMouseEnter={() => playHover()}
        >
          <X size={20} />
        </button>
        <aside className="cc-refactored-sidebar">
          <nav className="cc-tabs-nav">
            {visibleTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  className={`cc-tab-button ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    const currentIndex = visibleTabs.findIndex(t => t.id === activeTab);
                    const nextIndex = visibleTabs.findIndex(t => t.id === tab.id);
                    setDirection(nextIndex > currentIndex ? 1 : -1);
                    setActiveTab(tab.id);
                    playClick();
                  }}
                  onMouseEnter={() => playHover()}
                >
                  <Icon size={18} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <motion.div
                      layoutId="activeTabIndicator"
                      className="cc-tab-indicator"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="cc-refactored-main">
          <div className="cc-tab-content-wrapper">
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
                
                {!['geral', 'visual', 'audio', 'cifra', 'glitch', 'mega', 'seguranca', 'campos', 'display'].includes(activeTab) && (
                  <div className="cc-tab-placeholder">
                    <h2>{TABS.find(t => t.id === activeTab)?.label}</h2>
                    <p>Área reservada para os campos da aba {activeTab}.</p>
                    <p className="cc-cyber-note">Status: Conectado ao ClueModalContext</p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="cc-refactored-footer">
            <div className="cc-footer-info">
              <span className="cc-status-badge">{isSaving ? 'PROCESSANDO...' : 'PRONTO'}</span>
            </div>
            <div className="cc-footer-buttons">
              <button 
                className="cc-btn cc-btn-cancel" 
                onClick={() => { playClose(); onClose(); }}
                onMouseEnter={() => playHover()}
                disabled={isSaving}
              >
                <X size={16} /> CANCELAR
              </button>
              <button 
                className="cc-btn cc-btn-save" 
                onClick={handleSave}
                onMouseEnter={() => playHover()}
                disabled={isSaving}
              >
                <Save size={16} /> {isSaving ? 'SALVANDO...' : 'SALVAR EVIDÊNCIA'}
              </button>
            </div>
          </footer>
        </main>
      </div>

      {editorState.editorMode && (mediaState.previewUrl || editorState.uvEditorBaseUrl) && createPortal(
         <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
              <UVEditor 
                 baseImageUrl={editorState.uvEditorBaseUrl || mediaState.previewUrl}
                 mode={editorState.editorMode || 'uv'}
                 initialImageFile={editorState.editorMode === 'filter' ? editorState.filterInitialImage : undefined}
                 showForensicControls={editorState.uvEditorPurpose === 'forensic'}
                 onSave={(file, meta) => { 
                    if (editorState.uvEditorPurpose === 'forensic') {
                       setMediaState(prev => ({ ...prev, imgFile: file }));
                       const newUrl = URL.createObjectURL(file);
                       registerUrl(newUrl);
                       revokeUrl(mediaState.previewUrl);
                       setMediaState(prev => ({ ...prev, previewUrl: newUrl }));
                       alert('✅ Camada forense aplicada na imagem principal!');
                    } else if (editorState.editorMode === 'uv') {
                       setMediaState(prev => ({ ...prev, uvFile: file }));
                       const newUvUrl = URL.createObjectURL(file);
                       registerUrl(newUvUrl);
                       revokeUrl(mediaState.uvPreviewUrl);
                       setMediaState(prev => ({ ...prev, uvPreviewUrl: newUvUrl }));
                    } else if (editorState.editorMode === 'filter') {
                       setMediaState(prev => ({ ...prev, filterFile: file }));
                    }
                    setEditorState(prev => ({ ...prev, editorMode: null, filterInitialImage: null, uvEditorPurpose: null }));
                 }}
                 onClose={() => { setEditorState(prev => ({ ...prev, editorMode: null, filterInitialImage: null, uvEditorBaseUrl: null, uvEditorPurpose: null })); }}
              />
            </div>
         </div>, document.body
      )}

      {editorState.showForensicEditor && mediaState.previewUrl && createPortal(
         <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
            <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
               <ForensicChannelEditor
                  baseImageUrl={mediaState.previewUrl}
                  onSave={(compositeImageBlob, config) => {
                     const timestamp = Date.now();
                     const newFile = new File([compositeImageBlob], `forensic_${config.targetChannel}_${timestamp}.png`, { type: 'image/png' });
                     setMediaState(prev => ({ ...prev, imgFile: newFile }));
                     const newUrl = URL.createObjectURL(newFile);
                     registerUrl(newUrl);
                     revokeUrl(mediaState.previewUrl);
                     setMediaState(prev => ({ ...prev, previewUrl: newUrl }));
                     setEditorState(prev => ({ ...prev, showForensicEditor: false }));
                     alert('✅ Imagem forense usada como imagem principal!');
                  }}
                  onClose={() => setEditorState(prev => ({ ...prev, showForensicEditor: false }))}
               />
            </div>
         </div>, document.body
      )}

      {editorState.showGlitchDesigner && mediaState.previewUrl && createPortal(
        <div style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', zIndex: 2147483647, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>
           <div style={{width:'100vw', height:'100vh', display:'flex', flexDirection:'column'}}>
             <UVEditor
               baseImageUrl={mediaState.previewUrl}
               mode="uv"
               showForensicControls={false}
               onSave={(file, meta) => {
                 const newUrl = URL.createObjectURL(file);
                 registerUrl(newUrl);
                 setEditorState(prev => ({ ...prev, showGlitchDesigner: false }));
               }}
               onClose={() => setEditorState(prev => ({ ...prev, showGlitchDesigner: false }))}
             />
           </div>
        </div>, document.body
      )}

      {editorState.showAudioForgeFor && createPortal(
        <AudioLab
           isOpen={!!editorState.showAudioForgeFor}
           onClose={() => setEditorState(prev => ({ ...prev, showAudioForgeFor: null }))}
           initialBaseAudio={mediaState.audioBase}
           onSave={async (file) => {
              const currentForgeFor = editorState.showAudioForgeFor;
              setEditorState(prev => ({ ...prev, showAudioForgeFor: null }));
              
              if (currentForgeFor === 'hidden') {
                 revokeUrl(mediaState.audioHiddenPreview);
                 const newUrl = URL.createObjectURL(file);
                 registerUrl(newUrl);
                 setMediaState(prev => ({ ...prev, audioHidden: file, audioHiddenPreview: newUrl }));
                 
                 // Lógica de upload direto do AudioLab oculto mantida
                 try {
                    const publicUrl = await uploadAudio(file, investigationId);
                    if (publicUrl) {
                      setMediaState(prev => ({ ...prev, audioHiddenUploadedUrl: publicUrl, audioHiddenPreview: publicUrl }));
                    }
                 } catch (e) { console.error('AudioLab upload failed', e); }
              } else {
                 revokeUrl(mediaState.audioBasePreview);
                 const newUrl = URL.createObjectURL(file);
                 registerUrl(newUrl);
                 setMediaState(prev => ({ ...prev, audioBase: file, audioBasePreview: newUrl }));
              }
           }}
        />, document.body
      )}

    </div>
  );
}

export default function CreateClueModal_Refactored(props: Props) {
  if (!props.isOpen) return null;
  return (
    <ClueModalProvider>
      <CreateClueModalContent {...props} />
    </ClueModalProvider>
  );
}
