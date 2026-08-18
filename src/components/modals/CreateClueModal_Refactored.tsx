import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Eye, EyeOff, Shield, Image as ImageIcon, Music, Lock, Zap, Settings, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import DiegeticWindow from '../ui/DiegeticWindow';
import { ClueModalProvider, useClueModal } from '../../contexts/ClueModalContext';
import { useCyberpunkUI } from '../../hooks/useCyberpunkUI';
import './CreateClueModal_Refactored.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: (card: Record<string, any>) => void;
  existingCard?: any;
}

const TABS = [
  { id: 'geral', label: 'Geral', icon: BookOpen },
  { id: 'visual', label: 'Visual', icon: ImageIcon },
  { id: 'audio', label: 'Áudio', icon: Music },
  { id: 'cifra', label: 'Cifra & Hex', icon: Lock },
  { id: 'glitch', label: 'Glitch Puzzle', icon: Zap },
  { id: 'mega', label: 'Mega Clue', icon: Shield },
  { id: 'campos', label: 'Campos', icon: Eye },
  { id: 'display', label: 'Display', icon: Settings },
];

function CreateClueModalContent({ isOpen, onClose, existingCard, onSaved, initialX, initialY }: Props) {
  const { playBoot, playClick, playHover, playClose, playProcess, playSuccess } = useCyberpunkUI();
  const { resetForm, loadExistingCard, coreState } = useClueModal();
  const [activeTab, setActiveTab] = useState('geral');
  const [direction, setDirection] = useState(0);

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

  if (!isOpen) return null;

  const handleTabChange = (tabId: string) => {
    const currentIndex = TABS.findIndex(t => t.id === activeTab);
    const nextIndex = TABS.findIndex(t => t.id === tabId);
    setDirection(nextIndex > currentIndex ? 1 : -1);
    setActiveTab(tabId);
    playClick();
  };

  const handleSave = () => {
    playProcess();
    toast.success('[ SISTEMA ] Evidência processada com sucesso.', {
      style: { background: 'var(--nexus-bg)', color: 'var(--nexus-neon)', border: '1px solid var(--nexus-neon)' }
    });
    onSaved({});
    playSuccess();
    onClose();
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
      transition: { type: 'spring', stiffness: 300, damping: 30 }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    })
  };

  return (
    <DiegeticWindow
      title={existingCard ? 'EDITAR EVIDÊNCIA' : 'NOVA EVIDÊNCIA'}
      subtitle={coreState.title || 'Sistema de Catalogação'}
      onClose={() => { playClose(); onClose(); }}
      initialX={initialX || 50}
      initialY={initialY || 50}
      width={1100}
      height={800}
      className="create-clue-refactored-modal"
    >
      <div className="cc-refactored-layout">
        <aside className="cc-refactored-sidebar">
          <nav className="cc-tabs-nav">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
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
                <div className="cc-tab-placeholder">
                  <h2>{TABS.find(t => t.id === activeTab)?.label}</h2>
                  <p>Área reservada para os campos da aba {activeTab}.</p>
                  <p className="cc-cyber-note">Status: Conectado ao ClueModalContext</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <footer className="cc-refactored-footer">
            <div className="cc-footer-info">
              <span className="cc-status-badge">PRONTO</span>
            </div>
            <div className="cc-footer-buttons">
              <button 
                className="cc-btn cc-btn-cancel" 
                onClick={() => { playClose(); onClose(); }}
                onMouseEnter={() => playHover()}
              >
                <X size={16} /> CANCELAR
              </button>
              <button 
                className="cc-btn cc-btn-save" 
                onClick={handleSave}
                onMouseEnter={() => playHover()}
              >
                <Save size={16} /> SALVAR EVIDÊNCIA
              </button>
            </div>
          </footer>
        </main>
      </div>
    </DiegeticWindow>
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
