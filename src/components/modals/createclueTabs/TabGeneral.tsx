import React, { useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Tooltip } from 'react-tooltip';
import { Info, FileText, Zap, Shield, Check, X, Lightbulb, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { InvestigationCardInsight } from '../../../api/investigations';

const emptyInsight = (): InvestigationCardInsight => ({
  id: `insight_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  skill: '',
  cost: 1,
  text: '',
  visibility: 'hidden',
  reveal_to: [],
});

export default function TabGeneral() {
  const { coreState, setCoreState, cardStatus, setCardStatus, insights, setInsights } = useClueModal();
  const [insightsExpanded, setInsightsExpanded] = useState(insights.length > 0);

  const addInsight = () => {
    setInsights((prev) => [...prev, emptyInsight()]);
    setInsightsExpanded(true);
  };

  const updateInsight = (idx: number, patch: Partial<InvestigationCardInsight>) => {
    setInsights((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeInsight = (idx: number) => {
    setInsights((prev) => prev.filter((_, i) => i !== idx));
  };

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

      <div className="cc-section-header" style={{ marginTop: '0.5rem' }}>
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText className="lucide-icon inline-icon" size={16} /> SUBTIPO DE EVIDÊNCIA
        </h3>
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '6px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <button
          type="button"
          className={`cc-btn ${coreState.evidenceType === 'document' || !coreState.evidenceType ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
          onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'document' }))}
        >
          <FileText size={16} /> DOCUMENTO PADRÃO
        </button>
        <button
          type="button"
          className={`cc-btn ${coreState.evidenceType === 'glitch_puzzle' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
          onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'glitch_puzzle' }))}
        >
          <Zap size={16} /> QUEBRA-CABEÇA DE GLITCH
        </button>
        <button
          type="button"
          className={`cc-btn ${coreState.evidenceType === 'mega_clue' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{ flex: 1, justifyContent: 'center', padding: '12px' }}
          onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'mega_clue' }))}
        >
          <Shield size={16} /> MEGA-PISTA FINAL
        </button>
      </div>

      <hr className="cc-divider" />

      <div className="cc-field" style={{ marginTop: '0.5rem' }}>
        <label className="cc-label">Título da Pista *</label>
        <input
          type="text"
          className="cc-input"
          value={coreState.title}
          onChange={(e) => setCoreState((s) => ({ ...s, title: e.target.value }))}
          maxLength={100}
          placeholder="Ex: Documento Secreto, Mensagem de Áudio..."
        />
      </div>

      <div className="cc-field" style={{ marginTop: '0.75rem' }}>
        <label className="cc-label">Descrição Pública (Visível na lousa)</label>
        <textarea
          className="cc-input"
          value={coreState.descPublic}
          onChange={(e) => setCoreState((s) => ({ ...s, descPublic: e.target.value }))}
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="cc-field" style={{ marginTop: '0.75rem' }}>
        <label className="cc-label">Texto Oculto / Notas do Mestre (Visível apenas para o GM)</label>
        <textarea
          className="cc-input"
          value={coreState.descHidden}
          onChange={(e) => setCoreState((s) => ({ ...s, descHidden: e.target.value }))}
          rows={4}
          maxLength={2000}
        />
      </div>

      <div className="cc-field" style={{ marginTop: '0.75rem' }}>
        <label className="cc-label">Tags (separadas por vírgula)</label>
        <input
          type="text"
          className="cc-input"
          value={coreState.tags}
          onChange={(e) => setCoreState((s) => ({ ...s, tags: e.target.value }))}
          maxLength={150}
          placeholder="Ex: documento, suspeito, áudio"
        />
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title">VISIBILIDADE INICIAL</h3>
      </div>

      <div className="cc-field" style={{ marginTop: '0.5rem' }}>
        <label className="cc-checkbox">
          <input
            type="checkbox"
            checked={coreState.isHidden}
            onChange={(e) => setCoreState((s) => ({ ...s, isHidden: e.target.checked }))}
          />
          <span className="cc-checkbox-label">Pista Oculta (Não aparece na lousa até ser descoberta no Terminal)</span>
        </label>
      </div>

      {coreState.isHidden && (
        <div className="cc-field" style={{ marginTop: '0.75rem', marginLeft: '1.5rem' }}>
          <label className="cc-label" style={{ color: 'var(--cc-neon)' }}>
            Código de Descoberta * (Obrigatório para pista oculta)
          </label>
          <input
            type="text"
            className="cc-input"
            value={coreState.discoveryCode}
            onChange={(e) => setCoreState((s) => ({ ...s, discoveryCode: e.target.value.toUpperCase() }))}
            maxLength={30}
            placeholder="Ex: ACHOU123"
          />
        </div>
      )}

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title">STATUS DA INVESTIGAÇÃO</h3>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.5rem' }}>
        <button
          type="button"
          className={`cc-btn ${cardStatus === 'verified' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{
            flex: 1,
            minWidth: 110,
            justifyContent: 'center',
            borderColor: cardStatus === 'verified' ? '#27ae60' : undefined,
            color: cardStatus === 'verified' ? '#2ecc71' : undefined,
          }}
          onClick={() => setCardStatus(cardStatus === 'verified' ? null : 'verified')}
        >
          <Check size={15} /> Confirmado
        </button>
        <button
          type="button"
          className={`cc-btn ${cardStatus === 'theory' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{
            flex: 1,
            minWidth: 110,
            justifyContent: 'center',
            borderColor: cardStatus === 'theory' ? '#f1c40f' : undefined,
            color: cardStatus === 'theory' ? '#f1c40f' : undefined,
          }}
          onClick={() => setCardStatus(cardStatus === 'theory' ? null : 'theory')}
        >
          ❓ Teoria
        </button>
        <button
          type="button"
          className={`cc-btn ${cardStatus === 'false' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{
            flex: 1,
            minWidth: 110,
            justifyContent: 'center',
            borderColor: cardStatus === 'false' ? '#e74c3c' : undefined,
            color: cardStatus === 'false' ? '#ff6b6b' : undefined,
          }}
          onClick={() => setCardStatus(cardStatus === 'false' ? null : 'false')}
        >
          <X size={15} /> Falso
        </button>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={{ minWidth: 100, justifyContent: 'center', opacity: cardStatus === null ? 0.5 : 1 }}
          disabled={cardStatus === null}
          onClick={() => setCardStatus(null)}
        >
          ○ Sem status
        </button>
      </div>

      <hr className="cc-divider" />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={{ flex: 1, justifyContent: 'space-between' }}
          onClick={() => setInsightsExpanded((v) => !v)}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Lightbulb size={16} color="var(--cc-neon)" />
            INSIGHTS / PERÍCIAS ({insights.length})
          </span>
          {insightsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <button
          type="button"
          className="cc-btn cc-btn-save"
          style={{ marginLeft: 10 }}
          onClick={addInsight}
        >
          <Plus size={15} /> Adicionar
        </button>
      </div>

      {insightsExpanded && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
          {insights.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--cc-text-muted)', padding: 12, border: '1px dashed var(--cc-border)', borderRadius: 6, textAlign: 'center' }}>
              Nenhum insight de perícia adicionado.
            </div>
          ) : (
            insights.map((ins, idx) => (
              <div
                key={ins.id || idx}
                style={{
                  padding: 12,
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid var(--cc-border)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    type="text"
                    className="cc-input"
                    style={{ flex: 2 }}
                    placeholder="Perícia / Habilidade (ex: Percepção, Tecnologia)"
                    value={ins.skill}
                    onChange={(e) => updateInsight(idx, { skill: e.target.value })}
                  />
                  <input
                    type="number"
                    className="cc-input"
                    style={{ width: 90 }}
                    min={0}
                    placeholder="Custo"
                    value={ins.cost}
                    onChange={(e) => updateInsight(idx, { cost: Number(e.target.value) || 0 })}
                  />
                  <button
                    type="button"
                    className="cc-btn cc-btn-cancel"
                    style={{ borderColor: '#ff4444', color: '#ff6666', padding: '8px 10px' }}
                    onClick={() => removeInsight(idx)}
                    title="Remover insight"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <textarea
                  className="cc-input"
                  rows={2}
                  placeholder="Texto revelado ao gastar o insight..."
                  value={ins.text}
                  onChange={(e) => updateInsight(idx, { text: e.target.value })}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
