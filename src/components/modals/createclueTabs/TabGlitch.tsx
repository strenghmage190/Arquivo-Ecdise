import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { TriangleAlert, Info, Image as ImageIcon, Trash2, FolderOpen, Brush, Check } from 'lucide-react';
import { Tooltip } from 'react-tooltip';
import GlitchImageEngine from '../../tools/GlitchImageEngine';

export default function TabGlitch() {
  const {
    glitchState,
    setGlitchState,
    securityState,
    setSecurityState,
    mediaState,
    setMediaState,
    setEditorState,
    registerUrl,
    revokeUrl,
  } = useClueModal();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUpdate = (updates: Partial<typeof glitchState>) => {
    setGlitchState((s) => ({ ...s, ...updates }));
  };

  const applyGlitchDifficulty = (level: 'easy' | 'normal' | 'hard' | 'custom') => {
    if (level === 'easy') {
      handleUpdate({
        glitchDifficulty: 'easy',
        glitchToleranceFreq: 5,
        glitchToleranceShift: 5,
        glitchToleranceChroma: 5,
      });
    } else if (level === 'normal') {
      handleUpdate({
        glitchDifficulty: 'normal',
        glitchToleranceFreq: 3,
        glitchToleranceShift: 3,
        glitchToleranceChroma: 3,
      });
    } else if (level === 'hard') {
      handleUpdate({
        glitchDifficulty: 'hard',
        glitchToleranceFreq: 1,
        glitchToleranceShift: 2,
        glitchToleranceChroma: 2,
      });
    } else {
      handleUpdate({ glitchDifficulty: 'custom' });
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      if (glitchState.glitchFocusedImagePreview) revokeUrl(glitchState.glitchFocusedImagePreview);
      registerUrl(url);
      setGlitchState((s) => ({
        ...s,
        glitchFocusedImageFile: file,
        glitchFocusedImagePreview: url,
      }));
      setMediaState((s) => ({ ...s, removedGlitchFocused: false }));
    }
    e.target.value = '';
  };

  const handleRemoveFocusedImage = () => {
    revokeUrl(glitchState.glitchFocusedImagePreview);
    setGlitchState((s) => ({
      ...s,
      glitchFocusedImageFile: null,
      glitchFocusedImagePreview: null,
    }));
    setMediaState((s) => ({ ...s, removedGlitchFocused: true }));
  };

  const hasMediaHiding = Boolean(glitchState.glitchHiddenAudioUrl || glitchState.glitchHiddenVideoUrl);

  return (
    <div className="ccm-tab-stack">
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            CONFIGURAÇÃO DO GLITCH
            <span data-tooltip-id="glitch-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="glitch-tip" className="cyber-tooltip ccm-tooltip">
            <span className="cyber-tooltip-title">[ GLITCH PUZZLE ]</span>
            O usuário deve sintonizar a frequência, shift e chromatic para revelar a pista escondida.
          </Tooltip>
        </div>

        {hasMediaHiding && (
          <div className="ccm-callout ccm-callout-warn">
            <div className="ccm-callout-left">
              <TriangleAlert size={18} />
              <div>
                <strong>Mídia Oculta Configurada:</strong> as URLs ocultas só serão reveladas quando o Glitch for resolvido.
              </div>
            </div>
          </div>
        )}

        {mediaState.previewUrl && (
          <div className="ccm-preview-box">
            <div className="ccm-preview-head">
              <span>PREVIEW AO VIVO (ESTADO INICIAL DO JOGADOR)</span>
            </div>
            <GlitchImageEngine
              imageUrl={mediaState.previewUrl}
              targetFrequency={glitchState.glitchCorrectFrequency}
              targetShift={glitchState.glitchCorrectShift}
              targetChromatic={glitchState.glitchCorrectChromatic}
              playerFrequency={glitchState.glitchStartFrequency}
              playerShift={glitchState.glitchStartShift}
              playerChromatic={glitchState.glitchStartChromatic}
              height={220}
            />
          </div>
        )}

        <div className="ccm-grid-3">
          <div className="ccm-field">
            <label className="ccm-label">Frequência Alvo (1–50)</label>
            <input
              type="number"
              className="ccm-input"
              min={1}
              max={50}
              value={glitchState.glitchCorrectFrequency}
              onChange={(e) => handleUpdate({ glitchCorrectFrequency: Number(e.target.value) })}
            />
          </div>
          <div className="ccm-field">
            <label className="ccm-label">Shift Alvo (0–100)</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={100}
              value={glitchState.glitchCorrectShift}
              onChange={(e) => handleUpdate({ glitchCorrectShift: Number(e.target.value) })}
            />
          </div>
          <div className="ccm-field">
            <label className="ccm-label">Chroma Alvo (0–100)</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={100}
              value={glitchState.glitchCorrectChromatic}
              onChange={(e) => handleUpdate({ glitchCorrectChromatic: Number(e.target.value) })}
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Frequência Inicial</label>
            <input
              type="number"
              className="ccm-input"
              min={1}
              max={50}
              value={glitchState.glitchStartFrequency}
              onChange={(e) => handleUpdate({ glitchStartFrequency: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="ccm-field">
            <label className="ccm-label">Shift Inicial (%)</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={100}
              value={glitchState.glitchStartShift}
              onChange={(e) => handleUpdate({ glitchStartShift: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
          <div className="ccm-field">
            <label className="ccm-label">Chroma Inicial (%)</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={100}
              value={glitchState.glitchStartChromatic}
              onChange={(e) => handleUpdate({ glitchStartChromatic: parseInt(e.target.value, 10) || 0 })}
            />
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">DIFICULDADE & TOLERÂNCIA DE ACERTO</h3>
        </div>

        <div className="ccm-preset-grid">
          <button
            type="button"
            className={`ccm-preset-btn ${glitchState.glitchDifficulty === 'easy' ? 'active' : ''}`}
            onClick={() => applyGlitchDifficulty('easy')}
          >
            Fácil (±5/5/5)
          </button>
          <button
            type="button"
            className={`ccm-preset-btn ${glitchState.glitchDifficulty === 'normal' ? 'active' : ''}`}
            onClick={() => applyGlitchDifficulty('normal')}
          >
            Normal (±3/3/3)
          </button>
          <button
            type="button"
            className={`ccm-preset-btn ${glitchState.glitchDifficulty === 'hard' ? 'active' : ''}`}
            onClick={() => applyGlitchDifficulty('hard')}
          >
            Difícil (±1/2/2)
          </button>
          <button
            type="button"
            className={`ccm-preset-btn ${glitchState.glitchDifficulty === 'custom' ? 'active' : ''}`}
            onClick={() => applyGlitchDifficulty('custom')}
          >
            Personalizado
          </button>
        </div>

        <div className="ccm-grid-3">
          <div className="ccm-field">
            <label className="ccm-label">Tolerância ±Freq</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={15}
              value={glitchState.glitchToleranceFreq}
              onChange={(e) =>
                handleUpdate({
                  glitchDifficulty: 'custom',
                  glitchToleranceFreq: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
            />
          </div>
          <div className="ccm-field">
            <label className="ccm-label">Tolerância ±Shift</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={25}
              value={glitchState.glitchToleranceShift}
              onChange={(e) =>
                handleUpdate({
                  glitchDifficulty: 'custom',
                  glitchToleranceShift: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
            />
          </div>
          <div className="ccm-field">
            <label className="ccm-label">Tolerância ±Chroma</label>
            <input
              type="number"
              className="ccm-input"
              min={0}
              max={25}
              value={glitchState.glitchToleranceChroma}
              onChange={(e) =>
                handleUpdate({
                  glitchDifficulty: 'custom',
                  glitchToleranceChroma: Math.max(0, parseInt(e.target.value, 10) || 0),
                })
              }
            />
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">RECOMPENSA, INSTRUÇÕES & MÍDIA OCULTA</h3>
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Código de Recompensa</label>
            <input
              type="text"
              className="ccm-input ccm-input-mono"
              value={glitchState.glitchRewardCode}
              onChange={(e) => handleUpdate({ glitchRewardCode: e.target.value.toUpperCase() })}
              placeholder="Ex: ALPHA-01"
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Modo de Desbloqueio</label>
            <select
              className="ccm-input"
              value={glitchState.glitchUnlockMode}
              onChange={(e) => handleUpdate({ glitchUnlockMode: e.target.value as any })}
            >
              <option value="code">Apenas Código</option>
              <option value="code_plus_keyword">Código + Palavra-chave</option>
              <option value="media">Apenas Revelar Mídia</option>
              <option value="media_and_code">Mídia + Código</option>
            </select>
          </div>
        </div>

        <label className="ccm-toggle-row">
          <span className="ccm-toggle-text">
            <span className="ccm-toggle-title">Exigir Palavra-chave / Assinatura para validar</span>
          </span>
          <input
            type="checkbox"
            className="ccm-checkbox-input"
            checked={glitchState.glitchRequireKeyword}
            onChange={(e) => handleUpdate({ glitchRequireKeyword: e.target.checked })}
          />
        </label>

        {(glitchState.glitchRequireKeyword || glitchState.glitchUnlockMode === 'code_plus_keyword') && (
          <div className="ccm-field">
            <label className="ccm-label">Palavra-chave Correta (Keyword)</label>
            <input
              type="text"
              className="ccm-input ccm-input-mono"
              value={glitchState.glitchKeyword}
              onChange={(e) => handleUpdate({ glitchKeyword: e.target.value.toUpperCase() })}
              placeholder="Ex: ECDISE"
            />
          </div>
        )}

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Instruções de Acesso</label>
            <textarea
              className="ccm-input"
              rows={2}
              value={glitchState.glitchAccessInstructions}
              onChange={(e) => handleUpdate({ glitchAccessInstructions: e.target.value })}
              placeholder="Ex: Sintonize os canais até estabilizar a imagem..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Dica para o Glitch</label>
            <textarea
              className="ccm-input"
              rows={2}
              value={glitchState.glitchHint}
              onChange={(e) => handleUpdate({ glitchHint: e.target.value })}
              placeholder="Dica que aparecerá na UI de sintonia..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">URL Áudio Oculto (Glitch)</label>
            <input
              type="text"
              className="ccm-input"
              value={glitchState.glitchHiddenAudioUrl}
              onChange={(e) => handleUpdate({ glitchHiddenAudioUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">URL Vídeo Oculto (Glitch)</label>
            <input
              type="text"
              className="ccm-input"
              value={glitchState.glitchHiddenVideoUrl}
              onChange={(e) => handleUpdate({ glitchHiddenVideoUrl: e.target.value })}
              placeholder="https://..."
            />
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">VÍNCULOS NARRATIVOS & SINCRONIA</h3>
        </div>

        <div className="ccm-list-stack">
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Sincronizar estática do áudio com o desalinhamento do Glitch</span>
            </span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={securityState.audioStaticSync}
              onChange={(e) => setSecurityState((s) => ({ ...s, audioStaticSync: e.target.checked }))}
            />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Áudio contém pistas sobre o alinhamento visual</span>
            </span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={securityState.narrativeLinks.audioHintsVisual}
              onChange={(e) =>
                setSecurityState((s) => ({
                  ...s,
                  narrativeLinks: { ...s.narrativeLinks, audioHintsVisual: e.target.checked },
                }))
              }
            />
          </label>
          <label className="ccm-toggle-row">
            <span className="ccm-toggle-text">
              <span className="ccm-toggle-title">Imagem alinhada revela o código / keyword</span>
            </span>
            <input
              type="checkbox"
              className="ccm-checkbox-input"
              checked={securityState.narrativeLinks.visualHintsCode}
              onChange={(e) =>
                setSecurityState((s) => ({
                  ...s,
                  narrativeLinks: { ...s.narrativeLinks, visualHintsCode: e.target.checked },
                }))
              }
            />
          </label>
        </div>

        <div className="ccm-field">
          <label className="ccm-label">Nota de vínculo narrativo (opcional)</label>
          <input
            type="text"
            className="ccm-input"
            placeholder="Nota de vínculo narrativo (opcional)"
            value={securityState.narrativeLinks.hintNote}
            onChange={(e) =>
              setSecurityState((s) => ({
                ...s,
                narrativeLinks: { ...s.narrativeLinks, hintNote: e.target.value },
              }))
            }
          />
        </div>
      </section>

      <section className="ccm-section ccm-section-accent">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <ImageIcon size={16} /> IMAGEM FOCADA (GLITCH REVELADO)
          </h3>
        </div>
        <p className="ccm-section-subtitle">
          Esta imagem aparecerá quando o puzzle for resolvido. Você pode selecioná-la do computador ou desenhá-la sobre a imagem base.
        </p>

        <div className="ccm-btn-row">
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageSelect} />
          <button
            type="button"
            className="ccm-btn ccm-btn-primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <FolderOpen size={14} /> Selecionar Imagem
          </button>
          <button
            type="button"
            className="ccm-btn"
            disabled={!mediaState.previewUrl}
            onClick={() => setEditorState((s) => ({ ...s, showGlitchDesigner: true }))}
          >
            <Brush size={14} /> Desenhar no Editor
          </button>
          {glitchState.glitchFocusedImagePreview && (
            <button
              type="button"
              className="ccm-btn ccm-btn-danger"
              onClick={handleRemoveFocusedImage}
            >
              <Trash2 size={15} /> Remover
            </button>
          )}
        </div>

        {glitchState.glitchFocusedImagePreview && (
          <div className="ccm-preview-box">
            <div className="ccm-preview-head">
              <span>
                <Check size={13} /> Imagem Focada{glitchState.glitchFocusedImageFile?.name ? `: ${glitchState.glitchFocusedImageFile.name}` : ' carregada'}
              </span>
            </div>
            <img src={glitchState.glitchFocusedImagePreview} alt="Glitch Focused" className="ccm-preview-media" />
          </div>
        )}
      </section>
    </div>
  );
}
