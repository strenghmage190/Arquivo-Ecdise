import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Tooltip } from 'react-tooltip';
import { Info } from 'lucide-react';

export default function TabGeneral() {
  const { coreState, setCoreState } = useClueModal();

  return (
    <div className="field-block">
      <span className="field-title">
        INFORMAÇÕES BÁSICAS
        <Info size={16} color="#666" style={{ marginLeft: 8 }} />
      </span>

      <label>Título da Pista:</label>
      <input
        type="text"
        value={coreState.title}
        onChange={(e) => setCoreState(s => ({ ...s, title: e.target.value }))}
        maxLength={100}
        placeholder="Ex: Documento Secreto, Mensagem de Áudio..."
      />

      <label>Descrição Pública (Visível na lousa):</label>
      <textarea
        value={coreState.descPublic}
        onChange={(e) => setCoreState(s => ({ ...s, descPublic: e.target.value }))}
        rows={3}
        maxLength={300}
      />

      <label>Texto Oculto (Frente e verso do card):</label>
      <textarea
        value={coreState.descHidden}
        onChange={(e) => setCoreState(s => ({ ...s, descHidden: e.target.value }))}
        rows={5}
        maxLength={1000}
      />

      <label>
        Tags (separadas por vírgula):
      </label>
      <input
        type="text"
        value={coreState.tags}
        onChange={(e) => setCoreState(s => ({ ...s, tags: e.target.value }))}
        maxLength={100}
        placeholder="Ex: documento, suspeito, áudio"
      />

      <div style={{ marginTop: 16 }}>
        <label>
          <input
            type="checkbox"
            checked={coreState.isHidden}
            onChange={(e) => setCoreState(s => ({ ...s, isHidden: e.target.checked }))}
          />
          Pista Oculta (Não aparece na lousa até ser descoberta)
        </label>
      </div>

      {coreState.isHidden && (
        <div style={{ marginTop: 10 }}>
          <label>Código de Descoberta (Opcional):</label>
          <input
            type="text"
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
