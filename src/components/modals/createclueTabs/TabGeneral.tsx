import React, { useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Tooltip } from 'react-tooltip';
import { Info, FileText, Zap, Shield, Check, X, Lightbulb, Plus, Trash2, ChevronDown, ChevronUp, HelpCircle, Circle } from 'lucide-react';
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
    <div className="ccm-tab-stack">
      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">
            <FileText size={16} /> SUBTIPO DE EVIDÊNCIA
            <span data-tooltip-id="basic-info-tip" className="ccm-help-icon">
              <Info size={15} />
            </span>
          </h3>
          <Tooltip id="basic-info-tip" className="cyber-tooltip ccm-tooltip">
            Campos principais que identificam a evidência na lousa de investigação.
          </Tooltip>
        </div>

        <div className="ccm-segmented" role="radiogroup" aria-label="Subtipo de Evidência">
          <button
            type="button"
            className={`ccm-segmented-btn ${coreState.evidenceType === 'document' || !coreState.evidenceType ? 'active' : ''}`}
            onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'document' }))}
          >
            <FileText size={14} /> Documento Padrão
          </button>
          <button
            type="button"
            className={`ccm-segmented-btn ${coreState.evidenceType === 'glitch_puzzle' ? 'active' : ''}`}
            onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'glitch_puzzle' }))}
          >
            <Zap size={14} /> Quebra-cabeça Glitch
          </button>
          <button
            type="button"
            className={`ccm-segmented-btn ${coreState.evidenceType === 'mega_clue' ? 'active' : ''}`}
            onClick={() => setCoreState((s) => ({ ...s, evidenceType: 'mega_clue' }))}
          >
            <Shield size={14} /> Mega-Pista Final
          </button>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">INFORMAÇÕES BÁSICAS</h3>
        </div>

        <div className="ccm-grid-2">
          <div className="ccm-field">
            <label className="ccm-label">Título da Pista *</label>
            <input
              type="text"
              className="ccm-input"
              value={coreState.title}
              onChange={(e) => setCoreState((s) => ({ ...s, title: e.target.value }))}
              maxLength={100}
              placeholder="Ex: Documento Secreto, Mensagem de Áudio..."
            />
          </div>

          <div className="ccm-field">
            <label className="ccm-label">Tags (separadas por vírgula)</label>
            <input
              type="text"
              className="ccm-input"
              value={coreState.tags}
              onChange={(e) => setCoreState((s) => ({ ...s, tags: e.target.value }))}
              maxLength={150}
              placeholder="Ex: documento, suspeito, áudio"
            />
          </div>

          <div className="ccm-field ccm-col-full">
            <label className="ccm-label">Descrição Pública (Visível na lousa)</label>
            <textarea
              className="ccm-input"
              value={coreState.descPublic}
              onChange={(e) => setCoreState((s) => ({ ...s, descPublic: e.target.value }))}
              rows={3}
              maxLength={1000}
            />
          </div>

          <div className="ccm-field ccm-col-full">
            <label className="ccm-label">Texto Oculto / Notas do Mestre (Visível apenas para o GM)</label>
            <textarea
              className="ccm-input"
              value={coreState.descHidden}
              onChange={(e) => setCoreState((s) => ({ ...s, descHidden: e.target.value }))}
              rows={4}
              maxLength={2000}
            />
          </div>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">VISIBILIDADE INICIAL</h3>
        </div>

        <label className="ccm-toggle-row">
          <span className="ccm-toggle-text">
            <span className="ccm-toggle-title">Pista Oculta</span>
            <span className="ccm-toggle-desc">
              Não aparece na lousa até ser descoberta no Terminal
            </span>
          </span>
          <input
            type="checkbox"
            className="ccm-checkbox-input"
            checked={coreState.isHidden}
            onChange={(e) => setCoreState((s) => ({ ...s, isHidden: e.target.checked }))}
          />
        </label>

        {coreState.isHidden && (
          <div className="ccm-field">
            <label className="ccm-label ccm-label-accent">
              Código de Descoberta * (Obrigatório para pista oculta)
            </label>
            <input
              type="text"
              className="ccm-input ccm-input-mono"
              value={coreState.discoveryCode}
              onChange={(e) => setCoreState((s) => ({ ...s, discoveryCode: e.target.value.toUpperCase() }))}
              maxLength={30}
              placeholder="Ex: ACHOU123"
            />
          </div>
        )}
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <h3 className="ccm-section-title">STATUS DA INVESTIGAÇÃO</h3>
        </div>

        <div className="ccm-segmented" role="group" aria-label="Status da Investigação">
          <button
            type="button"
            className={`ccm-segmented-btn ccm-status-btn is-verified ${cardStatus === 'verified' ? 'active' : ''}`}
            onClick={() => setCardStatus(cardStatus === 'verified' ? null : 'verified')}
          >
            <Check size={14} /> Confirmado
          </button>
          <button
            type="button"
            className={`ccm-segmented-btn ccm-status-btn is-theory ${cardStatus === 'theory' ? 'active' : ''}`}
            onClick={() => setCardStatus(cardStatus === 'theory' ? null : 'theory')}
          >
            <HelpCircle size={14} /> Teoria
          </button>
          <button
            type="button"
            className={`ccm-segmented-btn ccm-status-btn is-false ${cardStatus === 'false' ? 'active' : ''}`}
            onClick={() => setCardStatus(cardStatus === 'false' ? null : 'false')}
          >
            <X size={14} /> Falso
          </button>
          <button
            type="button"
            className="ccm-segmented-btn"
            disabled={cardStatus === null}
            onClick={() => setCardStatus(null)}
          >
            <Circle size={13} /> Sem status
          </button>
        </div>
      </section>

      <section className="ccm-section">
        <div className="ccm-section-head">
          <button
            type="button"
            className="ccm-btn ccm-btn-sm"
            onClick={() => setInsightsExpanded((v) => !v)}
          >
            <Lightbulb size={15} color="var(--ccm-accent)" />
            <span>INSIGHTS / PERÍCIAS ({insights.length})</span>
            {insightsExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
          <button
            type="button"
            className="ccm-btn ccm-btn-sm ccm-btn-primary"
            onClick={addInsight}
          >
            <Plus size={14} /> Adicionar
          </button>
        </div>

        {insightsExpanded && (
          <div className="ccm-list-stack">
            {insights.length === 0 ? (
              <div className="ccm-callout ccm-note">
                Nenhum insight de perícia adicionado.
              </div>
            ) : (
              insights.map((ins, idx) => (
                <div key={ins.id || idx} className="ccm-list-card">
                  <div className="ccm-insight-row">
                    <input
                      type="text"
                      className="ccm-input"
                      placeholder="Perícia / Habilidade (ex: Percepção, Tecnologia)"
                      value={ins.skill}
                      onChange={(e) => updateInsight(idx, { skill: e.target.value })}
                    />
                    <input
                      type="number"
                      className="ccm-input"
                      min={0}
                      placeholder="Custo"
                      value={ins.cost}
                      onChange={(e) => updateInsight(idx, { cost: Number(e.target.value) || 0 })}
                    />
                    <button
                      type="button"
                      className="ccm-btn ccm-btn-danger"
                      onClick={() => removeInsight(idx)}
                      title="Remover insight"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <textarea
                    className="ccm-input"
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
      </section>
    </div>
  );
}
