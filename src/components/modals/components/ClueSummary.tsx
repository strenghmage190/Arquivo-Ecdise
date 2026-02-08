/**
 * 📊 ClueSummary.tsx
 * Componente de resumo e validação da pista antes de salvar
 */

import React from 'react';

interface ClueSummaryProps {
  title: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  hasImage: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
  isHidden: boolean;
  isLocked: boolean;
  validationErrors: string[];
  warnings: string[];
}

export default function ClueSummary({
  title,
  evidenceType,
  hasImage,
  hasVideo,
  hasAudio,
  isHidden,
  isLocked,
  validationErrors,
  warnings,
}: ClueSummaryProps) {
  const isValid = validationErrors.length === 0;
  const hasMedia = hasImage || hasVideo || hasAudio;

  const getTypeLabel = () => {
    switch (evidenceType) {
      case 'glitch_puzzle': return '🎮 Glitch Puzzle';
      case 'mega_clue': return '💎 Mega-Pista';
      default: return '📄 Documento';
    }
  };

  return (
    <div className="clue-summary">
      {/* Status Badge */}
      <div
        className="clue-summary__status"
        style={{
          padding: '12px',
          background: isValid ? '#27ae60' : '#e74c3c',
          color: '#fff',
          borderRadius: '6px',
          marginBottom: '16px',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        {isValid ? '✅ PRONTO PARA SALVAR' : '⚠️ CORREÇÕES NECESSÁRIAS'}
      </div>

      {/* Info Grid */}
      <div
        className="clue-summary__grid"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          marginBottom: '16px',
        }}
      >
        <div className="clue-summary__item">
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Título</div>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
            {title || '(não definido)'}
          </div>
        </div>

        <div className="clue-summary__item">
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Tipo</div>
          <div style={{ fontSize: '12px', color: '#fff', fontWeight: 'bold' }}>
            {getTypeLabel()}
          </div>
        </div>

        <div className="clue-summary__item">
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Mídia</div>
          <div style={{ fontSize: '12px', color: hasMedia ? '#27ae60' : '#e74c3c' }}>
            {hasImage && '📷 '}
            {hasVideo && '🎥 '}
            {hasAudio && '🔊 '}
            {!hasMedia && '❌ Nenhuma'}
          </div>
        </div>

        <div className="clue-summary__item">
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Segurança</div>
          <div style={{ fontSize: '12px', color: '#fff' }}>
            {isHidden && '👁️‍🗨️ Oculta '}
            {isLocked && '🔒 Bloqueada '}
            {!isHidden && !isLocked && '🔓 Pública'}
          </div>
        </div>
      </div>

      {/* Errors */}
      {validationErrors.length > 0 && (
        <div
          className="clue-summary__errors"
          style={{
            padding: '12px',
            background: 'rgba(231,76,60,0.1)',
            border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: '6px',
            marginBottom: '12px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#e74c3c', marginBottom: '8px' }}>
            ❌ Erros:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {validationErrors.map((error, idx) => (
              <div key={idx} style={{ fontSize: '11px', color: '#aaa' }}>
                • {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div
          className="clue-summary__warnings"
          style={{
            padding: '12px',
            background: 'rgba(243,156,18,0.1)',
            border: '1px solid rgba(243,156,18,0.3)',
            borderRadius: '6px',
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#f39c12', marginBottom: '8px' }}>
            ⚠️ Avisos:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {warnings.map((warning, idx) => (
              <div key={idx} style={{ fontSize: '11px', color: '#aaa' }}>
                • {warning}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Checklist */}
      <div
        className="clue-summary__checklist"
        style={{
          marginTop: '16px',
          padding: '12px',
          background: 'rgba(52,152,219,0.05)',
          borderRadius: '6px',
        }}
      >
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>Checklist:</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{title ? '✅' : '❌'}</span>
            <span>Título definido</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{hasMedia ? '✅' : '❌'}</span>
            <span>Mídia anexada</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span>{validationErrors.length === 0 ? '✅' : '❌'}</span>
            <span>Sem erros</span>
          </div>
        </div>
      </div>
    </div>
  );
}
