import React from 'react';
import type { UseCreateClueStateReturn } from '../../../hooks/useCreateClueState';

type Props = {
  validation: UseCreateClueStateReturn['validation'];
};

export default function ClueValidationTab({ validation }: Props) {
  return (
    <div className="p-4">
      <h3 className="font-semibold mb-3">Validação</h3>
      <button onClick={() => validation.validate()} className="px-3 py-1 bg-blue-500 text-white rounded">Rodar Validação</button>

      <ul className="mt-4">
        {validation.errors.length === 0 ? <li className="text-sm text-gray-500">Sem erros</li> : null}
        {validation.errors.map((err, idx) => (
          <li key={idx} className={`text-sm ${err.severity === 'error' ? 'text-red-600' : 'text-yellow-600'}`}>{err.field}: {err.message}</li>
        ))}
      </ul>
    </div>
  );
}
/**
 * ✅ ClueValidationTab.tsx
 * Tab para validação de dados
 * - Schemas Zod
 * - Validação de campos obrigatórios
 * - Preview de erros
 */

import React from 'react';

interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ClueValidationTabProps {
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  title: string;
  imgFile: File | null;
  videoUrlInput: string;
  videoUrl: string | null;
  audioBase: File | null;
  securityLayerEnabled: boolean;
  megaFinalTruthText: string;
  megaRequiredPuzzleIds: string[];
  glitchFocusedImageFile: File | null;
  glitchAccessInstructions: string;
  glitchHint: string;
  glitchKeyword: string;
  isLocked: boolean;
  lockPass: string;

  onValidate: () => ValidationError[];
  loading: boolean;
}

export default function ClueValidationTab({
  evidenceType,
  title,
  imgFile,
  videoUrlInput,
  videoUrl,
  audioBase,
  securityLayerEnabled,
  megaFinalTruthText,
  megaRequiredPuzzleIds,
  glitchFocusedImageFile,
  glitchAccessInstructions,
  glitchHint,
  glitchKeyword,
  isLocked,
  lockPass,
  onValidate,
  loading,
}: ClueValidationTabProps) {
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [validationRun, setValidationRun] = React.useState(false);

  const handleValidate = () => {
    const newErrors = onValidate();
    setErrors(newErrors);
    setValidationRun(true);
  };

  const errorCount = errors.filter((e) => e.severity === 'error').length;
  const warningCount = errors.filter((e) => e.severity === 'warning').length;
  const isValid = errorCount === 0;

  return (
    <div className="field-block">
      <span className="field-title">✓ VALIDAÇÃO</span>

      <button
        onClick={handleValidate}
        disabled={loading}
        style={{
          width: '100%',
          padding: 12,
          background: isValid && validationRun ? '#27ae60' : '#3498db',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          cursor: loading ? 'default' : 'pointer',
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 20,
        }}
      >
        🔍 {validationRun ? 'Validar Novamente' : 'Executar Validação'}
      </button>

      {validationRun && (
        <>
          {/* SUMMARY */}
          <div
            style={{
              background: isValid ? 'rgba(39,174,96,0.1)' : 'rgba(231,76,60,0.1)',
              border: `1px solid ${isValid ? '#27ae60' : '#e74c3c'}`,
              padding: 12,
              borderRadius: 6,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', gap: 20, justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 'bold', color: isValid ? '#27ae60' : '#e74c3c' }}>
                  {isValid ? '✅ VALIDAÇÃO OK' : '❌ VALIDAÇÃO FALHOU'}
                </div>
                <div style={{ fontSize: 11, color: '#aaa', marginTop: 4 }}>
                  {errorCount > 0 && <span>{errorCount} erro(s) crítico(s)</span>}
                  {errorCount > 0 && warningCount > 0 && <span> • </span>}
                  {warningCount > 0 && <span>{warningCount} aviso(s)</span>}
                  {errorCount === 0 && warningCount === 0 && <span>Todos os campos validados!</span>}
                </div>
              </div>
              <div style={{ fontSize: 30 }}>{isValid ? '✅' : '⚠️'}</div>
            </div>
          </div>

          {/* ERROR LIST */}
          {errors.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <span className="field-title">📋 DETALHES</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {errors.map((error, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: 10,
                      borderRadius: 6,
                      border: `1px solid ${
                        error.severity === 'error'
                          ? '#e74c3c'
                          : error.severity === 'warning'
                            ? '#f39c12'
                            : '#3498db'
                      }`,
                      background:
                        error.severity === 'error'
                          ? 'rgba(231,76,60,0.1)'
                          : error.severity === 'warning'
                            ? 'rgba(243,156,18,0.1)'
                            : 'rgba(52,152,219,0.1)',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>
                      {error.severity === 'error' && '❌'} {error.severity === 'warning' && '⚠️'}{' '}
                      {error.severity === 'info' && 'ℹ️'} {error.field}
                    </div>
                    <div style={{ fontSize: 11, color: '#aaa' }}>{error.message}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CHECKLIST */}
          <div style={{ marginTop: 20 }}>
            <span className="field-title">📝 CHECKLIST</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span>{title ? '✅' : '❌'}</span>
                <span>Título/Código definido</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span>{imgFile || videoUrlInput || videoUrl ? '✅' : '⚠️'}</span>
                <span>Mídia anexada (imagem/vídeo)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span>
                  {evidenceType !== 'glitch_puzzle' || glitchAccessInstructions ? '✅' : '❌'}
                </span>
                <span>Glitch Puzzle: instruções definidas</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span>
                  {evidenceType !== 'mega_clue' || megaRequiredPuzzleIds.length > 0 ? '✅' : '❌'}
                </span>
                <span>Mega-Pista: puzzle(s) obrigatório(s) definido(s)</span>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
                <span>{isLocked && !lockPass ? '⚠️' : '✅'}</span>
                <span>Senha de bloqueio (se aplicável)</span>
              </div>
            </div>
          </div>
        </>
      )}

      {!validationRun && (
        <div
          style={{
            padding: 20,
            background: 'rgba(52,152,219,0.05)',
            borderRadius: 6,
            border: '1px solid rgba(52,152,219,0.1)',
            textAlign: 'center',
            color: '#888',
            fontSize: 12,
          }}
        >
          Clique em "Executar Validação" para verificar todos os campos
        </div>
      )}
    </div>
  );
}
