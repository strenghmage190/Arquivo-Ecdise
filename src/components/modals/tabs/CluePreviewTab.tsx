/**
 * 👁️ CluePreviewTab.tsx
 * Tab para preview ao vivo da pista
 * - Renderização de como o player vai ver
 * - Simulação de inspeção
 * - Avisos de configuração
 */

import React from 'react';

interface CluePreviewTabProps {
  title: string;
  descPublic: string;
  descHidden: string;
  previewUrl: string | null;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  glitchAccessInstructions: string;
  glitchHint: string;
  megaFinalTruthText: string;
  thermalEnabled: boolean;
  thermalSecretText: string;
  uvFile: File | null;
  isLocked: boolean;
  isPerson: boolean;
  personName: string;
  loading: boolean;
}

export default function CluePreviewTab({
  title,
  descPublic,
  descHidden,
  previewUrl,
  evidenceType,
  glitchAccessInstructions,
  glitchHint,
  megaFinalTruthText,
  thermalEnabled,
  thermalSecretText,
  uvFile,
  isLocked,
  isPerson,
  personName,
  loading,
}: CluePreviewTabProps) {
  return (
    <div className="field-block">
      <span className="field-title">👁️ PREVIEW</span>

      {/* WARNING: GM ONLY */}
      <div
        style={{
          padding: 12,
          background: 'rgba(155,89,182,0.1)',
          border: '1px solid rgba(155,89,182,0.3)',
          borderRadius: 6,
          marginBottom: 20,
          fontSize: 11,
          color: '#aaa',
        }}
      >
        <strong>⚠️ VISTA DO GM:</strong> Você está vendo informações ocultas que NÃO serão mostradas aos jogadores.
      </div>

      {/* PLAYER VIEW */}
      <div
        style={{
          padding: 16,
          background: '#0a0a0a',
          border: '2px solid #2c3e50',
          borderRadius: 8,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 12, color: '#ecf0f1' }}>
          🎮 COMO O JOGADOR VÊ:
        </div>

        {/* Card Wrapper */}
        <div
          style={{
            padding: 12,
            background: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: 6,
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>{title || '(Sem Título)'}</div>
            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
              {isPerson && personName && `👤 ${personName}`}
              {!isPerson && evidenceType === 'glitch_puzzle' && '🎮 Glitch Puzzle'}
              {!isPerson && evidenceType === 'mega_clue' && '💎 Mega-Pista'}
              {!isPerson && evidenceType === 'document' && '📄 Documento'}
            </div>
          </div>

          {/* Image Preview */}
          {previewUrl && (
            <div style={{ marginBottom: 12, maxHeight: 150, overflow: 'hidden', borderRadius: 6 }}>
              <img
                src={previewUrl}
                alt="preview"
                style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 6 }}
              />
            </div>
          )}

          {/* Lock Badge */}
          {isLocked && (
            <div
              style={{
                padding: 6,
                background: '#e74c3c',
                color: '#fff',
                fontSize: 10,
                borderRadius: 4,
                marginBottom: 8,
                textAlign: 'center',
              }}
            >
              🔒 BLOQUEADO
            </div>
          )}

          {/* Description (Public Only) */}
          <div
            style={{
              fontSize: 11,
              color: '#aaa',
              lineHeight: 1.4,
              marginBottom: 12,
              padding: 8,
              background: 'rgba(255,255,255,0.02)',
              borderRadius: 4,
            }}
          >
            {descPublic || '(Descrição não definida)'}
          </div>

          {/* Glitch Puzzle Info */}
          {evidenceType === 'glitch_puzzle' && (
            <div style={{ fontSize: 10, color: '#f39c12', marginBottom: 12 }}>
              <div style={{ marginBottom: 4 }}>
                📝 <strong>Instruções:</strong> {glitchAccessInstructions || '(Não definidas)'}
              </div>
              <div>
                💡 <strong>Dica:</strong> {glitchHint || '(Não definida)'}
              </div>
            </div>
          )}

          {/* Mega Clue Info */}
          {evidenceType === 'mega_clue' && (
            <div style={{ fontSize: 10, color: '#f39c12' }}>
              <div>💎 <strong>Verdade Final:</strong> {megaFinalTruthText || '(Não definida)'}</div>
            </div>
          )}
        </div>
      </div>

      {/* GM ONLY SECTION */}
      <div
        style={{
          padding: 12,
          background: 'rgba(155,89,182,0.05)',
          border: '1px solid rgba(155,89,182,0.2)',
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#9b59b6', marginBottom: 12 }}>
          🔐 APENAS GM (OCULTO DO PLAYER):
        </div>

        <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
          {descHidden && (
            <div style={{ marginBottom: 8 }}>
              <strong>Notas:</strong>
              <div style={{ paddingLeft: 12, marginTop: 4, color: '#888' }}>{descHidden}</div>
            </div>
          )}

          {thermalEnabled && thermalSecretText && (
            <div style={{ marginBottom: 8 }}>
              <strong>🌡️ Térmica:</strong>
              <div style={{ paddingLeft: 12, marginTop: 4, color: '#e74c3c' }}>{thermalSecretText}</div>
            </div>
          )}

          {uvFile && (
            <div style={{ marginBottom: 8 }}>
              <strong>🟣 UV:</strong>
              <div style={{ paddingLeft: 12, marginTop: 4 }}>✅ Camada UV anexada</div>
            </div>
          )}
        </div>
      </div>

      {/* WARNINGS */}
      <div
        style={{
          padding: 12,
          background: 'rgba(243,156,18,0.05)',
          border: '1px solid rgba(243,156,18,0.2)',
          borderRadius: 6,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#f39c12', marginBottom: 12 }}>
          ⚠️ AVISOS:
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: '#aaa' }}>
          {!title && <div>❌ Título/Código não definido</div>}
          {!previewUrl && <div>❌ Imagem/Vídeo não carregado</div>}
          {evidenceType === 'glitch_puzzle' && !glitchAccessInstructions && (
            <div>❌ Instruções de Glitch Puzzle não definidas</div>
          )}
          {evidenceType === 'mega_clue' && !megaFinalTruthText && (
            <div>❌ Verdade final da Mega-Pista não definida</div>
          )}
          {!descPublic && <div>⚠️ Descrição pública não definida (recomendado)</div>}
          {isLocked && <div>🔒 Pista está bloqueada - players não conseguem acessar</div>}

          {!title && !previewUrl && !descPublic && (
            <div style={{ color: '#e74c3c', fontWeight: 'bold', marginTop: 8 }}>
              ⚠️ Esta pista está incompleta. Preencha ao menos Título, Imagem e Descrição.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
