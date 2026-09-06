import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Eye, EyeOff, Shield, Image as ImageIcon, Music, Lock, Zap, Settings, BookOpen } from 'lucide-react';
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
  { id: 'glitch', label: 'Glitch Puzzle', icon: Zap },
  { id: 'mega', label: 'Mega Clue', icon: Shield },
  { id: 'seguranca', label: 'Segurança', icon: Lock },
  { id: 'campos', label: 'Campos', icon: Eye },
  { id: 'display', label: 'Display', icon: Settings },
];

function CreateClueModalContent({ isOpen, onClose, existingCard, onSaved, initialX, initialY, investigationId }: Props) {
  const { playBoot, playClick, playHover, playClose, playProcess, playSuccess } = useCyberpunkUI();
  const { startTour, shouldShowTour } = useClueTour();
  const {
    resetForm, loadExistingCard,
    coreState, securityState, mediaState,
    cipherState, glitchState, megaClueState,
    displayConfig, mediaVisibility, fieldVisibilityConfig,
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
    setIsSaving(true);
    playProcess();
    try {
      const metadata = {
        is_shredded: cipherState.isShredded,
        shred_rows: cipherState.shredRows,
        shred_cols: cipherState.shredCols,
        real_text: cipherState.realText,
        cipher_text: cipherState.cipherText,
        glitch_puzzle: { ...glitchState },
        mega_required_puzzle_ids: megaClueState.megaRequiredPuzzleIds,
        mega_final_truth_text: megaClueState.megaFinalTruthText,
        display_config: displayConfig,
        media_visibility: mediaVisibility,
        field_visibility: fieldVisibilityConfig,
      };

      const payload: Record<string, any> = {
        investigation_id: investigationId,
        title: coreState.title,
        type: coreState.evidenceType,
        description_public: coreState.descPublic || null,
        description_hidden: coreState.descHidden || null,
        tags: coreState.tags
          ? coreState.tags.split(',').map((t: string) => t.trim()).filter(Boolean)
          : [],
        discovery_code: coreState.discoveryCode || null,
        is_hidden: coreState.isHidden,
        is_locked: securityState.isLocked,
        lock_password: securityState.lockPass || null,
        image_url: mediaState.previewUrl || null,
        video_url: mediaState.videoUrl || null,
        audio_url: mediaState.audioBasePreview || null,
        audio_hidden_url: mediaState.audioHiddenUploadedUrl || null,
        metadata,
      };

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
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
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
