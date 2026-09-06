import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Tooltip } from 'react-tooltip';
import { Info } from 'lucide-react';

export default function TabGeneral() {
  const { coreState, setCoreState } = useClueModal();

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          INFORMAÇÕES BÁSICAS
          <span data-tooltip-id="basic-info-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-text-muted, #666)" />
          </span>
        </h3>
        <Tooltip id="basic-info-tip" className="cyber-tooltip">
          Campos principais que identificam a evidência na lousa de investigação.
        </Tooltip>
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label">Título da Pista</label>
        <input
          type="text"
          className="cc-input"
          value={coreState.title}
          onChange={(e) => setCoreState(s => ({ ...s, title: e.target.value }))}
          maxLength={100}
          placeholder="Ex: Documento Secreto, Mensagem de Áudio..."
        />
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label">Descrição Pública (Visível na lousa)</label>
        <textarea
          className="cc-input"
          value={coreState.descPublic}
          onChange={(e) => setCoreState(s => ({ ...s, descPublic: e.target.value }))}
          rows={3}
          maxLength={300}
        />
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label">Texto Oculto (Frente e verso do card)</label>
        <textarea
          className="cc-input"
          value={coreState.descHidden}
          onChange={(e) => setCoreState(s => ({ ...s, descHidden: e.target.value }))}
          rows={5}
          maxLength={1000}
        />
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-label">Tags (separadas por vírgula)</label>
        <input
          type="text"
          className="cc-input"
          value={coreState.tags}
          onChange={(e) => setCoreState(s => ({ ...s, tags: e.target.value }))}
          maxLength={100}
          placeholder="Ex: documento, suspeito, áudio"
        />
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title">VISIBILIDADE INICIAL</h3>
      </div>

      <div className="cc-field" style={{ marginTop: '1rem' }}>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={coreState.isHidden}
            onChange={(e) => setCoreState(s => ({ ...s, isHidden: e.target.checked }))}
          />
          <span className="cc-checkbox-label">Pista Oculta (Não aparece na lousa até ser descoberta)</span>
        </label>
      </div>

      {coreState.isHidden && (
        <div className="cc-field" style={{ marginTop: '1rem', marginLeft: '2rem' }}>
          <label className="cc-label">Código de Descoberta (Opcional)</label>
          <input
            type="text"
            className="cc-input"
            value={coreState.discoveryCode}
            onChange={(e) => setCoreState(s => ({ ...s, discoveryCode: e.target.value.toUpperCase() }))}
            maxLength={20}
            placeholder="Ex: ACHOU123"
          />
        </div>
      )}
    </div>
  );
}
