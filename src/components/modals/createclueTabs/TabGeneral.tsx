import React, { useState, useEffect } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Tooltip } from 'react-tooltip';
import { Info, FileText, Zap, Shield, Bookmark, Trash2, Globe, Lock } from 'lucide-react';
import { fetchClueTemplates, deleteClueTemplate, ClueTemplate } from '../../../api/templates';
import { toast } from 'sonner';

export default function TabGeneral() {
  const {
    coreState, setCoreState,
    setSecurityState, setCipherState, setGlitchState, setMegaClueState,
    setDisplayConfig, setMediaVisibility, setFieldVisibilityConfig,
    setFilterConfig, setThermalConfig, setPhoneState, setPersonState, setMetadataState
  } = useClueModal();

  const [templates, setTemplates] = useState<ClueTemplate[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const data = await fetchClueTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Erro ao carregar templates:', err);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const applyTemplate = (tmpl: ClueTemplate) => {
    const d = tmpl.template_data || {};
    if (d.coreState) setCoreState(prev => ({ ...prev, ...d.coreState }));
    if (d.securityState) setSecurityState(prev => ({ ...prev, ...d.securityState }));
    if (d.cipherState) setCipherState(prev => ({ ...prev, ...d.cipherState }));
    if (d.glitchState) setGlitchState(prev => ({ ...prev, ...d.glitchState }));
    if (d.megaClueState) setMegaClueState(prev => ({ ...prev, ...d.megaClueState }));
    if (d.displayConfig) setDisplayConfig(prev => ({ ...prev, ...d.displayConfig }));
    if (d.mediaVisibility) setMediaVisibility(prev => ({ ...prev, ...d.mediaVisibility }));
    if (d.fieldVisibilityConfig) setFieldVisibilityConfig(prev => ({ ...prev, ...d.fieldVisibilityConfig }));
    if (d.filterConfig) setFilterConfig(prev => ({ ...prev, ...d.filterConfig }));
    if (d.thermalConfig) setThermalConfig(prev => ({ ...prev, ...d.thermalConfig }));
    if (d.phoneState) setPhoneState(prev => ({ ...prev, ...d.phoneState }));
    if (d.personState) setPersonState(prev => ({ ...prev, ...d.personState }));
    if (d.metadataState) setMetadataState(prev => ({ ...prev, ...d.metadataState }));

    toast.success(`Template "${tmpl.name}" aplicado!`);
    setShowTemplateDropdown(false);
  };

  const handleDeleteTemplate = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (!window.confirm(`Deseja excluir o template "${name}"?`)) return;
    try {
      await deleteClueTemplate(id);
      setTemplates(prev => prev.filter(t => t.id !== id));
      toast.success('Template excluído com sucesso.');
    } catch (err: any) {
      toast.error('Erro ao excluir template: ' + (err.message || ''));
    }
  };

  return (
    <div className="cc-tab-content">
      {/* SEÇÃO TEMPLATES DE PISTAS */}
      <div className="cc-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bookmark size={16} /> MODELOS & TEMPLATES
        </h3>
        <button
          type="button"
          className="cc-btn cc-btn-cancel"
          style={{ fontSize: '11px', padding: '4px 10px', height: '32px' }}
          onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
        >
          {showTemplateDropdown ? 'Fechar Templates' : `Carregar Template (${templates.length})`}
        </button>
      </div>

      {showTemplateDropdown && (
        <div style={{ background: 'rgba(0,0,0,0.5)', border: '1px solid var(--cc-neon-dim)', borderRadius: '6px', padding: '12px', marginBottom: '16px' }}>
          {loadingTemplates ? (
            <div style={{ color: 'var(--cc-text-muted)', fontSize: '13px' }}>Carregando templates...</div>
          ) : templates.length === 0 ? (
            <div style={{ color: 'var(--cc-text-muted)', fontSize: '13px' }}>Nenhum template salvo encontrado. Use "Salvar como Template" no rodapé para criar um!</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
              {templates.map(tmpl => (
                <div
                  key={tmpl.id}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: '4px', cursor: 'pointer', border: '1px solid transparent' }}
                  onClick={() => applyTemplate(tmpl)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--cc-neon)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'transparent')}
                >
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#fff', fontSize: '13px', fontWeight: 600 }}>{tmpl.name}</span>
                    {tmpl.description && <span style={{ color: 'var(--cc-text-muted)', fontSize: '11px' }}>{tmpl.description}</span>}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tmpl.is_public ? (
                      <span title="Público"><Globe size={13} color="#22c55e" /></span>
                    ) : (
                      <span title="Privado"><Lock size={13} color="#888" /></span>
                    )}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteTemplate(e, tmpl.id, tmpl.name)}
                      style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', padding: '4px' }}
                      title="Excluir Template"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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

      <div className="cc-section-header" style={{ marginTop: '1rem' }}>
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileText className="lucide-icon inline-icon" size={16} /> SUBTIPO DE EVIDÊNCIA
        </h3>
      </div>
      
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px', marginBottom: '20px' }}>
        <button
          type="button"
          className={`cc-btn ${coreState.evidenceType === 'document' || !coreState.evidenceType ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{ flex: '1 1 200px', minHeight: '44px', justifyContent: 'center', padding: '12px' }}
          onClick={() => setCoreState(s => ({ ...s, evidenceType: 'document' }))}
        >
          <FileText size={16} /> DOCUMENTO PADRÃO
        </button>
        <button
          type="button"
          className={`cc-btn ${coreState.evidenceType === 'glitch_puzzle' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{ flex: '1 1 200px', minHeight: '44px', justifyContent: 'center', padding: '12px' }}
          onClick={() => setCoreState(s => ({ ...s, evidenceType: 'glitch_puzzle' }))}
        >
          <Zap size={16} /> QUEBRA-CABEÇA DE GLITCH
        </button>
        <button
          type="button"
          className={`cc-btn ${coreState.evidenceType === 'mega_clue' ? 'cc-btn-save' : 'cc-btn-cancel'}`}
          style={{ flex: '1 1 200px', minHeight: '44px', justifyContent: 'center', padding: '12px' }}
          onClick={() => setCoreState(s => ({ ...s, evidenceType: 'mega_clue' }))}
        >
          <Shield size={16} /> MEGA-PISTA FINAL
        </button>
      </div>

      <hr className="cc-divider" />

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
        <div className="cc-field" style={{ marginTop: '1rem', marginLeft: '1rem' }}>
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
