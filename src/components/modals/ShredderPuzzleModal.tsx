import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import ShredderPuzzle from '../tools/ShredderPuzzle';
import './ShredderPuzzleModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imgSrc: string;
  rows: number;
  cols: number;
  isGameMaster: boolean;
  investigationId: string;
  cardId: string;
  evidenceTitle?: string;
  onPuzzleSolved?: () => void;
}

export default function ShredderPuzzleModal({
  isOpen,
  onClose,
  imgSrc,
  rows,
  cols,
  isGameMaster,
  investigationId,
  cardId,
  evidenceTitle = 'DOCUMENTO TRITURADO',
  onPuzzleSolved
}: Props) {
  const [puzzleSolved, setPuzzleSolved] = useState(false);

  const handleSolved = () => {
    setPuzzleSolved(true);
    if (onPuzzleSolved) {
      onPuzzleSolved();
    }
  };

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="shredder-modal-backdrop" onClick={handleBackdropClick}>
      <div className="shredder-modal">
        {/* Header */}
        <div className="shredder-modal-header">
          <div className="shredder-modal-title">
            <span className="shredder-icon">🗂️</span>
            <div>
              <h2>{evidenceTitle}</h2>
              <p className="shredder-format">Formato: {rows}×{cols} {rows === 1 ? 'tiras horizontais' : cols === 1 ? 'tiras verticais' : 'grade'}</p>
            </div>
          </div>
          <button className="shredder-close-btn" onClick={onClose} title="Fechar (Esc)">
            ✕
          </button>
        </div>

        {/* GM Instructions */}
        {isGameMaster && (
          <div className="shredder-gm-banner">
            <span className="gm-badge">🎮 GM</span>
            <div className="gm-instructions">
              <strong>Controles:</strong> Botões para revelar peças | <strong>Ctrl+Click</strong> em peças individuais | <strong>Ver Jogador</strong> para testar visão dos players
            </div>
          </div>
        )}

        {/* Puzzle Area */}
        <div className="shredder-puzzle-container">
          <ShredderPuzzle
            imgSrc={imgSrc}
            rows={rows}
            cols={cols}
            onSolved={handleSolved}
            isGameMaster={isGameMaster}
            investigationId={investigationId}
            cardId={cardId}
          />
        </div>

        {/* Solved Celebration */}
        {puzzleSolved && (
          <div className="shredder-solved-overlay">
            <div className="solved-card">
              <div className="solved-icon">✅</div>
              <h3>DOCUMENTO RECONSTRUÍDO!</h3>
              <p>O puzzle foi resolvido com sucesso.</p>
              <button className="solved-ok-btn" onClick={onClose}>
                Continuar Investigação
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
