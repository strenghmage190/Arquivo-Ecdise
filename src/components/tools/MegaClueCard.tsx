import React, { useState, useEffect } from 'react';
import './MegaClueCard.css';

interface Props {
  cardId: string;
  title: string;
  description: string;
  imageUrl?: string;
  requiredCodes: number;
  collectedCodes: string[];
  finalTruthText?: string;
  onClose?: () => void;
}

export default function MegaClueCard({
  cardId,
  title,
  description,
  imageUrl,
  requiredCodes,
  collectedCodes,
  finalTruthText,
  onClose
}: Props) {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    // Verificar se todos os códigos foram coletados
    if (collectedCodes.length >= requiredCodes) {
      setUnlocked(true);
    }
  }, [collectedCodes, requiredCodes]);

  const missingCodes = requiredCodes - collectedCodes.length;

  if (unlocked) {
    return (
      <div className="mega-clue-card">
        <div className="mega-header">
          <h2>{title}</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✖</button>
          )}
        </div>

        <div className="mega-content unlocked">
          <div className="unlock-banner">
            <div className="unlock-icon">🔓</div>
            <div className="unlock-text">MEGA-PISTA DESBLOQUEADA</div>
          </div>

          {imageUrl && (
            <div className="truth-image">
              <img src={imageUrl} alt="Verdade Final" />
              <div className="truth-label">A VERDADE REVELADA</div>
            </div>
          )}

          <div className="truth-box">
            <h3>📖 A VERDADE COMPLETA</h3>
            <div className="truth-content">
              {finalTruthText || description}
            </div>
          </div>

          <div className="codes-collected">
            <h4>🎯 CÓDIGOS DESBLOQUEADOS:</h4>
            <div className="codes-list">
              {collectedCodes.map((code, idx) => (
                <div key={idx} className="code-badge">
                  {code}
                </div>
              ))}
            </div>
          </div>

          {onClose && (
            <button className="btn btn-close" onClick={onClose}>
              FECHAR
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mega-clue-card">
      <div className="mega-header">
        <h2>{title}</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✖</button>
        )}
      </div>

      <div className="mega-content locked">
        <div className="lock-banner">
          <div className="lock-icon">🔐</div>
          <div className="lock-text">MEGA-PISTA PROTEGIDA</div>
        </div>

        <div className="locked-description">
          <p>{description}</p>
        </div>

        <div className="progress-section">
          <h3>DESBLOQUEIO REQUER TODOS OS CÓDIGOS:</h3>

          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(collectedCodes.length / requiredCodes) * 100}%` }}
            ></div>
          </div>

          <div className="progress-text">
            <strong>{collectedCodes.length}</strong> de <strong>{requiredCodes}</strong> códigos coletados
          </div>
        </div>

        <div className="codes-needed">
          <h4>CÓDIGOS COLETADOS:</h4>
          <div className="codes-grid">
            {Array.from({ length: requiredCodes }).map((_, idx) => {
              const code = collectedCodes[idx];
              return (
                <div key={idx} className={`code-slot ${code ? 'unlocked' : 'locked'}`}>
                  {code ? (
                    <>
                      <div className="slot-icon">✓</div>
                      <div className="slot-code">{code}</div>
                    </>
                  ) : (
                    <>
                      <div className="slot-icon">?</div>
                      <div className="slot-text">Falta</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {missingCodes > 0 && (
          <div className="missing-message">
            Você ainda precisa encontrar <strong>{missingCodes}</strong> código{missingCodes !== 1 ? 's' : ''} para desbloquear a verdade...
          </div>
        )}

        {onClose && (
          <button className="btn btn-close" onClick={onClose}>
            FECHAR
          </button>
        )}
      </div>
    </div>
  );
}
