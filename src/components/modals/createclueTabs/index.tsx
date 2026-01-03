// Placeholder tab components - to be imported by CreateClueModal_Refactored
// These will be properly implemented in separate files

import React from 'react';

export const ClueGeneralTab = (props: any) => {
  const {
    title, setTitle,
    descPublic, setDescPublic,
    descHidden, setDescHidden,
    tags, setTags,
    evidenceType, setEvidenceType,
    isHidden, setIsHidden,
    discoveryCode, setDiscoveryCode,
    templates, loadingTemplates, showTemplateDropdown, setShowTemplateDropdown
  } = props;

  return (
    <div className="clue-tab-content">
      <div className="form-group">
        <label>Título da Evidência *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Relatório de Autópsia"
        />
      </div>

      <div className="form-group">
        <label>Descrição Pública</label>
        <textarea
          value={descPublic}
          onChange={(e) => setDescPublic(e.target.value)}
          placeholder="Texto visível para jogadores..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Descrição Oculta (GM Only)</label>
        <textarea
          value={descHidden}
          onChange={(e) => setDescHidden(e.target.value)}
          placeholder="Informações confidenciais..."
          rows={3}
        />
      </div>

      <div className="form-group">
        <label>Tags (separadas por vírgula)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Ex: suspeito, arma, local"
        />
      </div>

      <div className="form-group">
        <label>Tipo de Evidência</label>
        <select value={evidenceType} onChange={(e) => setEvidenceType(e.target.value as any)}>
          <option value="document">📄 Documento</option>
          <option value="glitch_puzzle">🎮 Puzzle Glitch</option>
          <option value="mega_clue">🔐 Mega Pista</option>
        </select>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => setIsHidden(e.target.checked)}
          />
          🔒 Iniciar como Oculto
        </label>
        <small style={{ color: '#888', fontSize: '12px' }}>
          A pista será invisível até descoberta via busca por código
        </small>
      </div>

      {isHidden && (
        <div className="form-group">
          <label>Código de Descoberta *</label>
          <input
            type="text"
            value={discoveryCode}
            onChange={(e) => setDiscoveryCode(e.target.value.toUpperCase())}
            placeholder="Ex: PROJ-99"
            style={{ textTransform: 'uppercase' }}
          />
          <small style={{ color: '#888', fontSize: '12px' }}>
            Jogadores digitarão isso no terminal para revelar a pista
          </small>
        </div>
      )}
    </div>
  );
};
export const ClueVisualTab = (props: any) => <div>Visual Tab - TODO</div>;
export const ClueAudioTab = (props: any) => <div>Audio Tab - TODO</div>;
export const ClueCipherTab = (props: any) => <div>Cipher Tab - TODO</div>;
export const ClueForensicTab = (props: any) => <div>Forensic Tab - TODO</div>;
export const ClueFieldsTab = (props: any) => <div>Fields Tab - TODO</div>;
export const ClueDisplayTab = (props: any) => <div>Display Tab - TODO</div>;
export const ClueGlitchTab = (props: any) => <div>Glitch Tab - TODO</div>;
export const ClueMegaTab = (props: any) => <div>Mega Tab - TODO</div>;
