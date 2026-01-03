/**
 * 🚀 CluePublishTab.tsx
 * Tab para publicação final
 * - Resumo de tudo
 * - Botão de Salvar
 * - Confirmação
 */

import React from 'react';

interface CluePublishTabProps {
  title: string;
  descPublic: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  mediaCount: number;
  displayConfigsEnabled: number;
  totalDisplayConfigs: number;
  loading: boolean;
  onSave: () => void;
  errors: string[];
}

export default function CluePublishTab({
  title,
  descPublic,
  evidenceType,
  mediaCount,
  displayConfigsEnabled,
  totalDisplayConfigs,
  loading,
  onSave,
  errors,
}: CluePublishTabProps) {
  const isReadyToPublish = title && descPublic && mediaCount > 0 && errors.length === 0;

  return (
    <div className="field-block createclue-publish createclue-tab-section">
      <span className="field-title">🚀 PUBLICAÇÃO</span>

      {/* SUMMARY */}
      <div
        style={{
          padding: 16,
          background: 'rgba(46,204,113,0.05)',
          border: '1px solid rgba(46,204,113,0.2)',
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 'bold', marginBottom: 12, color: '#fff' }}>
          📋 RESUMO DA PISTA:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11, color: '#aaa' }}>
          <div>
            <div style={{ color: '#888', marginBottom: 4 }}>Título</div>
            <div style={{ fontSize: 12, color: '#fff' }}>{title || '(Sem título)'}</div>
          </div>

          <div>
            <div style={{ color: '#888', marginBottom: 4 }}>Tipo</div>
            <div style={{ fontSize: 12, color: '#fff' }}>
              {evidenceType === 'document' && '📄 Documento'}
              {evidenceType === 'glitch_puzzle' && '🎮 Glitch Puzzle'}
              {evidenceType === 'mega_clue' && '💎 Mega-Pista'}
            </div>
          </div>

          <div>
            <div style={{ color: '#888', marginBottom: 4 }}>Descrição</div>
            <div style={{ fontSize: 12, color: '#fff' }}>{descPublic?.length || 0} caracteres</div>
          </div>

          <div>
            <div style={{ color: '#888', marginBottom: 4 }}>Mídia</div>
            <div style={{ fontSize: 12, color: '#fff' }}>
              {mediaCount} arquivo(s) anexado(s)
            </div>
          </div>

          <div>
            <div style={{ color: '#888', marginBottom: 4 }}>Display Config</div>
            <div style={{ fontSize: 12, color: '#fff' }}>
              {displayConfigsEnabled}/{totalDisplayConfigs} habilitado(s)
            </div>
          </div>

          <div>
            <div style={{ color: '#888', marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 12, color: isReadyToPublish ? '#27ae60' : '#e74c3c' }}>
              {isReadyToPublish ? '✅ Pronto' : '❌ Incompleto'}
            </div>
          </div>
        </div>
      </div>

      {/* ERRORS */}
      {errors.length > 0 && (
        <div
          style={{
            padding: 12,
            background: 'rgba(231,76,60,0.1)',
            border: '1px solid rgba(231,76,60,0.3)',
            borderRadius: 6,
            marginBottom: 20,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 'bold', color: '#e74c3c', marginBottom: 8 }}>
            ❌ ERROS:
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {errors.map((error, idx) => (
              <div key={idx} style={{ fontSize: 11, color: '#aaa' }}>
                • {error}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CHECKLIST */}
      <div
        style={{
          padding: 12,
          background: 'rgba(52,152,219,0.05)',
          border: '1px solid rgba(52,152,219,0.2)',
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 'bold', color: '#3498db', marginBottom: 8 }}>
          ✓ CHECKLIST FINAL:
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11, color: '#aaa' }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{title ? '✅' : '❌'}</span>
            <span>Título/Código definido</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{descPublic ? '✅' : '❌'}</span>
            <span>Descrição pública definida</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{mediaCount > 0 ? '✅' : '❌'}</span>
            <span>Mídia anexada</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>{errors.length === 0 ? '✅' : '❌'}</span>
            <span>Sem erros críticos</span>
          </div>
        </div>
      </div>

      {/* SAVE BUTTON */}
      <button
        onClick={onSave}
        disabled={!isReadyToPublish || loading}
        style={{
          width: '100%',
          padding: 16,
          background: isReadyToPublish ? '#27ae60' : '#555',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: isReadyToPublish && !loading ? 'pointer' : 'not-allowed',
          fontSize: 16,
          fontWeight: 'bold',
          marginBottom: 12,
          opacity: loading ? 0.6 : 1,
          transition: 'all 0.3s ease',
        }}
        title={
          !isReadyToPublish
            ? 'Preencha todos os campos obrigatórios (Título, Descrição, Mídia)'
            : loading
              ? 'Salvando...'
              : 'Publicar pista'
        }
      >
        {loading ? '⏳ SALVANDO...' : '🚀 PUBLICAR PISTA'}
      </button>

      {/* INFO */}
      <div
        style={{
          padding: 12,
          background: 'rgba(243,156,18,0.05)',
          border: '1px solid rgba(243,156,18,0.2)',
          borderRadius: 6,
          fontSize: 11,
          color: '#aaa',
          lineHeight: 1.6,
        }}
      >
        <strong>ℹ️ Antes de Publicar:</strong>
        <div style={{ marginTop: 8 }}>
          ✓ Todas as abas foram preenchidas?
        </div>
        <div>✓ A pista faz sentido narrativo?</div>
        <div>✓ Os puzzles estão configurados corretamente?</div>
        <div>✓ Nenhuma informação crítica está faltando?</div>
      </div>
    </div>
  );
}
