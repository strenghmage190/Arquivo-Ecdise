import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { TriangleAlert, Info } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabGlitch() {
  const { glitchState, setGlitchState } = useClueModal();

  const handleUpdate = (updates: Partial<typeof glitchState>) => {
    setGlitchState(s => ({ ...s, ...updates }));
  };

  const hasMediaHiding = glitchState.glitchHiddenAudioUrl || glitchState.glitchHiddenVideoUrl;

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
        <div className="neon-warning-box" style={{ borderColor: '#ffaa00' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, color: '#ffaa00' }}>
            <TriangleAlert size={18} />
            <strong>Aviso de Ocultação</strong>
          </div>
          <p style={{ fontSize: 13, color: 'var(--cc-text)' }}>
            Mídias ocultas estão configuradas. Elas só serão reveladas quando o Glitch for resolvido.
          </p>
        </div>
      )}

      <div style={{ marginTop: 16, display: 'flex', gap: 16 }}>
        <div style={{ flex: 1 }}>
          <label className="field-title">Frequência Alvo</label>
          <input
            type="number"
            className="cc-input"
            value={glitchState.glitchCorrectFrequency}
            onChange={(e) => handleUpdate({ glitchCorrectFrequency: Number(e.target.value) })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Shift Alvo</label>
          <input
            type="number"
            className="cc-input"
            value={glitchState.glitchCorrectShift}
            onChange={(e) => handleUpdate({ glitchCorrectShift: Number(e.target.value) })}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label className="field-title">Chroma Alvo</label>
          <input
            type="number"
            className="cc-input"
            value={glitchState.glitchCorrectChromatic}
            onChange={(e) => handleUpdate({ glitchCorrectChromatic: Number(e.target.value) })}
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
            onChange={(e) => handleUpdate({ glitchRewardCode: e.target.value })}
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
            <option value="media">Apenas Revelar Mídia</option>
            <option value="media_and_code">Mídia + Código</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Dificuldade</label>
        <select
          className="cc-input"
          value={glitchState.glitchDifficulty}
          onChange={(e) => handleUpdate({ glitchDifficulty: e.target.value as any })}
        >
          <option value="easy">Fácil (Alta Tolerância)</option>
          <option value="normal">Normal</option>
          <option value="hard">Difícil (Baixa Tolerância)</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>

      <div style={{ marginTop: 16 }}>
        <label className="field-title">Dica para o Glitch</label>
        <textarea
          className="cc-input"
          style={{ minHeight: 60, resize: 'vertical' }}
          value={glitchState.glitchHint}
          onChange={(e) => handleUpdate({ glitchHint: e.target.value })}
          placeholder="Dica que aparecerá na UI de sintonia..."
        />
      </div>
    </div>
  );
}
