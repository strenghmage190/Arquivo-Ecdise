import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { TriangleAlert, Info, Image as ImageIcon, Trash2 } from 'lucide-react';
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
    <div className="field-block">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span className="field-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          CONFIGURAÇÃO DO GLITCH
          <span data-tooltip-id="glitch-tip" style={{ display: 'flex', cursor: 'help' }}>
            <Info size={16} color="#00ffff" />
          </span>
        </span>
      </div>
      <Tooltip id="glitch-tip" className="cyber-tooltip">
        <span className="cyber-tooltip-title">[ GLITCH PUZZLE ]</span>
        O usuário deve sintonizar a frequência, shift e chromatic para revelar a pista escondida.
      </Tooltip>

      {hasMediaHiding && (
        <div className="neon-warning-box" style={{ borderColor: '#ffaa00', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, color: '#ffaa00' }}>
            <TriangleAlert size={18} />
            <strong>Mídia Oculta Configurada</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--cc-text)', margin: 0 }}>
            As URLs ocultas só serão reveladas quando o Glitch for resolvido.
          </p>
        </div>
      )}

      {mediaState.previewUrl && (
        <div style={{ marginBottom: 20, padding: 12, borderRadius: 8, border: '1px solid rgba(100,150,255,0.25)', background: 'rgba(0,0,0,0.4)' }}>
          <div style={{ fontSize: 11, color: '#64b5ff', marginBottom: 8, fontWeight: 700, letterSpacing: 1 }}>
            PREVIEW AO VIVO (ESTADO INICIAL DO JOGADOR)
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

      <div style={{ marginTop: 12, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">Frequência Alvo (1–50)</label>
          <input
            type="number"
            className="cc-input"
            min={1}
            max={50}
            value={glitchState.glitchCorrectFrequency}
            onChange={(e) => handleUpdate({ glitchCorrectFrequency: Number(e.target.value) })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Shift Alvo (0–100)</label>
          <input
            type="number"
            className="cc-input"
            min={0}
            max={100}
            value={glitchState.glitchCorrectShift}
            onChange={(e) => handleUpdate({ glitchCorrectShift: Number(e.target.value) })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Chroma Alvo (0–100)</label>
          <input
            type="number"
            className="cc-input"
            min={0}
            max={100}
            value={glitchState.glitchCorrectChromatic}
            onChange={(e) => handleUpdate({ glitchCorrectChromatic: Number(e.target.value) })}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, background: 'rgba(100,150,255,0.06)', borderRadius: 6, border: '1px solid rgba(100,150,255,0.2)' }}>
        <label className="field-title" style={{ display: 'block', marginBottom: 8 }}>Dificuldade & Tolerância de Acerto</label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <button
            type="button"
            className={`cc-btn ${glitchState.glitchDifficulty === 'easy' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
            onClick={() => applyGlitchDifficulty('easy')}
          >
            Fácil (±5/5/5)
          </button>
          <button
            type="button"
            className={`cc-btn ${glitchState.glitchDifficulty === 'normal' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
            onClick={() => applyGlitchDifficulty('normal')}
          >
            Normal (±3/3/3)
          </button>
          <button
            type="button"
            className={`cc-btn ${glitchState.glitchDifficulty === 'hard' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
            onClick={() => applyGlitchDifficulty('hard')}
          >
            Difícil (±1/2/2)
          </button>
          <button
            type="button"
            className={`cc-btn ${glitchState.glitchDifficulty === 'custom' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
            onClick={() => applyGlitchDifficulty('custom')}
          >
            Personalizado
          </button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label className="cc-label">Tolerância ±Freq</label>
            <input
              type="number"
              className="cc-input"
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
          <div style={{ flex: 1 }}>
            <label className="cc-label">Tolerância ±Shift</label>
            <input
              type="number"
              className="cc-input"
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
          <div style={{ flex: 1 }}>
            <label className="cc-label">Tolerância ±Chroma</label>
            <input
              type="number"
              className="cc-input"
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
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">Frequência Inicial</label>
          <input
            type="number"
            className="cc-input"
            min={1}
            max={50}
            value={glitchState.glitchStartFrequency}
            onChange={(e) => handleUpdate({ glitchStartFrequency: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Shift Inicial (%)</label>
          <input
            type="number"
            className="cc-input"
            min={0}
            max={100}
            value={glitchState.glitchStartShift}
            onChange={(e) => handleUpdate({ glitchStartShift: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Chroma Inicial (%)</label>
          <input
            type="number"
            className="cc-input"
            min={0}
            max={100}
            value={glitchState.glitchStartChromatic}
            onChange={(e) => handleUpdate({ glitchStartChromatic: parseInt(e.target.value, 10) || 0 })}
          />
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">Código de Recompensa</label>
          <input
            type="text"
            className="cc-input"
            value={glitchState.glitchRewardCode}
            onChange={(e) => handleUpdate({ glitchRewardCode: e.target.value.toUpperCase() })}
            placeholder="Ex: ALPHA-01"
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Modo de Desbloqueio</label>
          <select
            className="cc-input"
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

      <div style={{ marginTop: 16, padding: 12, borderRadius: 6, border: '1px solid var(--cc-border)', background: 'rgba(0,0,0,0.25)' }}>
        <label className="cc-checkbox" style={{ marginBottom: 10 }}>
          <input
            type="checkbox"
            checked={glitchState.glitchRequireKeyword}
            onChange={(e) => handleUpdate({ glitchRequireKeyword: e.target.checked })}
          />
          <span className="cc-checkbox-label">Exigir Palavra-chave / Assinatura para validar</span>
        </label>
        {(glitchState.glitchRequireKeyword || glitchState.glitchUnlockMode === 'code_plus_keyword') && (
          <div className="cc-field" style={{ marginTop: 8 }}>
            <label className="cc-label">Palavra-chave Correta (Keyword)</label>
            <input
              type="text"
              className="cc-input"
              value={glitchState.glitchKeyword}
              onChange={(e) => handleUpdate({ glitchKeyword: e.target.value.toUpperCase() })}
              placeholder="Ex: ECDISE"
            />
          </div>
        )}
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Instruções de Acesso</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 55, resize: 'vertical' }}
          value={glitchState.glitchAccessInstructions}
          onChange={(e) => handleUpdate({ glitchAccessInstructions: e.target.value })}
          placeholder="Ex: Sintonize os canais até estabilizar a imagem..."
        />
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Dica para o Glitch</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 55, resize: 'vertical' }}
          value={glitchState.glitchHint}
          onChange={(e) => handleUpdate({ glitchHint: e.target.value })}
          placeholder="Dica que aparecerá na UI de sintonia..."
        />
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">URL Áudio Oculto (Glitch)</label>
          <input
            type="text"
            className="cc-input"
            value={glitchState.glitchHiddenAudioUrl}
            onChange={(e) => handleUpdate({ glitchHiddenAudioUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">URL Vídeo Oculto (Glitch)</label>
          <input
            type="text"
            className="cc-input"
            value={glitchState.glitchHiddenVideoUrl}
            onChange={(e) => handleUpdate({ glitchHiddenVideoUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 12, borderRadius: 6, border: '1px solid var(--cc-border)', background: 'rgba(0,0,0,0.25)', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={securityState.audioStaticSync}
            onChange={(e) => setSecurityState((s) => ({ ...s, audioStaticSync: e.target.checked }))}
          />
          <span className="cc-checkbox-label">Sincronizar estática do áudio com o desalinhamento do Glitch</span>
        </label>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={securityState.narrativeLinks.audioHintsVisual}
            onChange={(e) =>
              setSecurityState((s) => ({
                ...s,
                narrativeLinks: { ...s.narrativeLinks, audioHintsVisual: e.target.checked },
              }))
            }
          />
          <span className="cc-checkbox-label">Áudio contém pistas sobre o alinhamento visual</span>
        </label>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={securityState.narrativeLinks.visualHintsCode}
            onChange={(e) =>
              setSecurityState((s) => ({
                ...s,
                narrativeLinks: { ...s.narrativeLinks, visualHintsCode: e.target.checked },
              }))
            }
          />
          <span className="cc-checkbox-label">Imagem alinhada revela o código / keyword</span>
        </label>
        <input
          type="text"
          className="cc-input"
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

      <div style={{ marginTop: 20, padding: 16, border: '1px solid rgba(0,255,255,0.2)', borderRadius: 8, background: 'rgba(0,0,0,0.3)' }}>
        <h4 style={{ color: 'var(--nexus-neon)', marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ImageIcon size={16} /> IMAGEM FOCADA (GLITCH REVELADO)
        </h4>
        <p style={{ fontSize: 12, color: '#888', marginBottom: 12 }}>
          Esta imagem aparecerá quando o puzzle for resolvido. Você pode selecioná-la do computador ou desenhá-la sobre a imagem base.
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleImageSelect} />
          <button type="button" className="cc-btn cc-btn-save" style={{ flex: 1, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
            📂 Selecionar Imagem
          </button>
          <button
            type="button"
            className="cc-btn cc-btn-cancel"
            style={{ flex: 1, justifyContent: 'center' }}
            disabled={!mediaState.previewUrl}
            onClick={() => setEditorState((s) => ({ ...s, showGlitchDesigner: true }))}
          >
            🖌️ Desenhar no Editor
          </button>
          {glitchState.glitchFocusedImagePreview && (
            <button
              type="button"
              className="cc-btn cc-btn-cancel"
              style={{ borderColor: '#ff4444', color: '#ff6666' }}
              onClick={handleRemoveFocusedImage}
            >
              <Trash2 size={16} /> Remover
            </button>
          )}
        </div>

        {glitchState.glitchFocusedImagePreview && (
          <div style={{ marginTop: 16, padding: 10, background: 'rgba(0,0,0,0.5)', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)' }}>
            <div style={{ color: '#888', fontSize: 11, marginBottom: 8 }}>
              ✓ Imagem Focada{glitchState.glitchFocusedImageFile?.name ? `: ${glitchState.glitchFocusedImageFile.name}` : ' carregada'}
            </div>
            <img src={glitchState.glitchFocusedImagePreview} alt="Glitch Focused" style={{ maxWidth: '100%', maxHeight: 150, borderRadius: 4 }} />
          </div>
        )}
      </div>
    </div>
  );
}
