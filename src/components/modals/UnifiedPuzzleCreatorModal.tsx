import React, { useState, useEffect } from 'react';
import GlitchPuzzleForm from './forms/GlitchPuzzleForm';
import MegaClueForm from './forms/MegaClueForm';
import { modalManager } from '../../utils/ModalManager';
import './UnifiedPuzzleCreatorModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: () => void;
}

type PuzzleType = '' | 'glitch_puzzle' | 'mega_clue';

export default function UnifiedPuzzleCreatorModal({ 
  isOpen, 
  onClose, 
  investigationId, 
  initialX, 
  initialY, 
  onSaved 
}: Props) {
  const [selectedType, setSelectedType] = useState<PuzzleType>('');

  // ✅ Registra modal no ModalManager
  useEffect(() => {
    modalManager.register('unified-puzzle-creator-modal', 6);
  }, []);

  // ✅ Usa ModalManager para controle de abertura/fechamento
  useEffect(() => {
    if (isOpen) {
      modalManager.open('unified-puzzle-creator-modal', () => {
        setSelectedType('');
      });
    } else {
      modalManager.close('unified-puzzle-creator-modal');
    }
  }, [isOpen]);

  const handleTypeSelect = (type: PuzzleType) => {
    setSelectedType(type);
  };

  const handleBack = () => {
    setSelectedType('');
  };

  const handleSuccess = () => {
    onSaved();
    onClose();
    setSelectedType('');
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Só fechar se clicar diretamente no overlay (fundo escuro)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="unified-creator-overlay" onClick={handleOverlayClick}>
      <div className="unified-creator-modal" onClick={e => e.stopPropagation()}>
        {selectedType === '' ? (
          // TELA DE SELEÇÃO DE TIPO
          <>
            <div className="unified-creator-header">
              <h2>🎯 ESCOLHA O TIPO DE PISTA</h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="unified-creator-body">
              <p className="type-selection-intro">
                Selecione o tipo de pista que você deseja criar para esta investigação:
              </p>

              <div className="type-options">
                <button 
                  className="type-option"
                  onClick={() => handleTypeSelect('glitch_puzzle')}
                >
                  <div className="type-icon">🧩</div>
                  <div className="type-content">
                    <h3>Quebra-cabeça de Glitch</h3>
                    <p>Uma imagem corrompida que requer decodificação para revelar a verdade. Fornece um código de recompensa quando resolvida.</p>
                  </div>
                  <div className="type-arrow">→</div>
                </button>

                <button 
                  className="type-option"
                  onClick={() => handleTypeSelect('mega_clue')}
                >
                  <div className="type-icon">🔐</div>
                  <div className="type-content">
                    <h3>Mega-Pista (Verdade Final)</h3>
                    <p>A revelação final que requer múltiplos códigos de recompensa para ser desbloqueada. O objetivo final da investigação.</p>
                  </div>
                  <div className="type-arrow">→</div>
                </button>

                {/* Opções futuras (comentadas para referência) */}
                {/* 
                <button 
                  className="type-option type-option-disabled"
                  disabled
                >
                  <div className="type-icon">📹</div>
                  <div className="type-content">
                    <h3>Pista de Vídeo CCTV</h3>
                    <p>Em breve...</p>
                  </div>
                </button>

                <button 
                  className="type-option type-option-disabled"
                  disabled
                >
                  <div className="type-icon">📄</div>
                  <div className="type-content">
                    <h3>Pista de Texto Cifrado</h3>
                    <p>Em breve...</p>
                  </div>
                </button>
                */}
              </div>

              <div className="type-selection-hint">
                💡 <strong>Dica:</strong> Crie primeiro os Quebra-cabeças de Glitch e anote os códigos de recompensa. Depois, crie a Mega-Pista que exigirá esses códigos.
              </div>
            </div>
          </>
        ) : (
          // TELA DE FORMULÁRIO ESPECÍFICO DO TIPO
          <>
            <div className="unified-creator-header">
              <button className="back-btn" onClick={handleBack}>
                ← Voltar
              </button>
              <h2>
                {selectedType === 'glitch_puzzle' && '🧩 CRIAR QUEBRA-CABEÇA DE GLITCH'}
                {selectedType === 'mega_clue' && '🔐 CRIAR MEGA-PISTA'}
              </h2>
              <button className="close-btn" onClick={onClose}>×</button>
            </div>

            <div className="unified-creator-body">
              {selectedType === 'glitch_puzzle' && (
                <GlitchPuzzleForm
                  investigationId={investigationId}
                  initialX={initialX}
                  initialY={initialY}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                />
              )}

              {selectedType === 'mega_clue' && (
                <MegaClueForm
                  investigationId={investigationId}
                  initialX={initialX}
                  initialY={initialY}
                  onSuccess={handleSuccess}
                  onCancel={onClose}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
