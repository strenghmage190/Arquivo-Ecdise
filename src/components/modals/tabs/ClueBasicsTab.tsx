/**
 * 📋 ClueBasicsTab.tsx
 * Tab para configuração básica da pista
 * - Tipo de evidência
 * - Título/Código
 * - Descrição pública e oculta
 * - Tags
 * - Template
 */

import React, { useReducer } from 'react';
import {
  basicReducer,
  initialBasicState,
} from '../../../reducers/clueFormReducer';
import { ClueTemplate } from 'src/api/templates';

interface ClueBasicsTabProps {
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  onEvidenceTypeChange: (type: 'document' | 'glitch_puzzle' | 'mega_clue') => void;
  templates: ClueTemplate[];
  loadingTemplates: boolean;
  showTemplateDropdown: boolean;
  onShowTemplateDropdown: (show: boolean) => void;
  onApplyTemplate: (template: ClueTemplate) => void;
  onSaveTemplate: (name: string) => void;
  loading: boolean;
}

export default function ClueBasicsTab({
  evidenceType,
  onEvidenceTypeChange,
  templates,
  loadingTemplates,
  showTemplateDropdown,
  onShowTemplateDropdown,
  onApplyTemplate,
  onSaveTemplate,
  loading,
}: ClueBasicsTabProps) {
  const [basicState, dispatchBasic] = useReducer(basicReducer, initialBasicState);

  const handleInputChange = (field: keyof typeof initialBasicState, value: string) => {
    const actionMap: Record<keyof typeof initialBasicState, string> = {
      title: 'SET_TITLE',
      descPublic: 'SET_DESC_PUBLIC',
      descHidden: 'SET_DESC_HIDDEN',
      tags: 'SET_TAGS',
      evidenceType: '',
      isHidden: '',
      discoveryCode: '',
      imgFile: ''
    };
    dispatchBasic({ type: actionMap[field] as any, payload: value });
  };

  return (
    <div className="field-block createclue-basics createclue-tab-section">
      <span className="field-title">📌 TIPO DE EVIDÊNCIA</span>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {['document', 'glitch_puzzle', 'mega_clue'].map((type) => (
          <button
            key={type}
            onClick={() => onEvidenceTypeChange(type as 'document' | 'glitch_puzzle' | 'mega_clue')}
            disabled={loading}
            style={{
              flex: 1,
              padding: '10px',
              background: evidenceType === type ? '#3498db' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'default' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {type === 'document' ? '📄 Documento' : type === 'glitch_puzzle' ? '🎮 Glitch Puzzle' : '💎 Mega-Pista'}
          </button>
        ))}
      </div>

      {/* TEMPLATE SYSTEM */}
      <div className="field-block createclue-basics__templates" style={{ marginBottom: 20, padding: 12, background: 'rgba(100,200,255,0.05)', borderRadius: 6, border: '1px solid rgba(100,200,255,0.1)' }}>
        <span className="field-title">📚 TEMPLATES</span>
        <div className="createclue-basics__template-controls" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => onShowTemplateDropdown(!showTemplateDropdown)}
            disabled={loading || loadingTemplates}
            style={{
              flex: 1,
              padding: '10px',
              background: '#333',
              color: '#fff',
              border: '1px solid #555',
              borderRadius: 6,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            {loadingTemplates ? '⏳ Carregando...' : '📂 Aplicar Template'}
          </button>
          <button
            onClick={() => {
              const name = prompt('Nome do template:');
              if (name) onSaveTemplate(name);
            }}
            disabled={loading || !basicState.title}
            title={!basicState.title ? 'Adicione um título primeiro' : ''}
            style={{
              flex: 1,
              padding: '10px',
              background: '#27ae60',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: loading ? 'default' : 'pointer',
            }}
          >
            💾 Salvar como Template
          </button>
        </div>

        {showTemplateDropdown && templates.length > 0 && (
          <div className="createclue-basics__template-list" style={{ background: '#1a1a1a', border: '1px solid #444', borderRadius: 6, padding: 10, maxHeight: 200, overflowY: 'auto' }}>
            {templates.map((template) => (
              <div
                key={template.id}
                className="createclue-basics__template-item"
                style={{
                  padding: 8,
                  cursor: 'pointer',
                  borderBottom: '1px solid #333',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(100,200,255,0.1)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <span
                  onClick={() => onApplyTemplate(template)}
                  style={{ flex: 1, fontSize: 13, color: '#aaa' }}
                >
                  {template.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TITLE / CODE */}
      <div className="field-block">
        <label>🔤 TÍTULO / CÓDIGO</label>
        <input
          className="input"
          type="text"
          value={basicState.title}
          onChange={(e) => handleInputChange('title', e.target.value)}
          disabled={loading}
          placeholder="Ex: EVIDENCE-001"
        />
      </div>

      {/* DESCRIPTION - PUBLIC */}
      <div className="field-block">
        <label>📖 DESCRIÇÃO (Visível ao Jogador)</label>
        <textarea
          className="textarea"
          value={basicState.descPublic}
          onChange={(e) => handleInputChange('descPublic', e.target.value)}
          disabled={loading}
          placeholder="O que o jogador vê quando clica nesta pista"
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>
          {basicState.descPublic.length} caracteres
        </div>
      </div>

      {/* DESCRIPTION - HIDDEN */}
      <div className="field-block">
        <label>🔐 DESCRIÇÃO (Oculta - Notas do GM)</label>
        <textarea
          className="textarea"
          value={basicState.descHidden}
          onChange={(e) => handleInputChange('descHidden', e.target.value)}
          disabled={loading}
          placeholder="Notas privadas - não será mostrado ao jogador"
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>
          {basicState.descHidden.length} caracteres
        </div>
      </div>

      {/* TAGS */}
      <div className="field-block">
        <label>🏷️ TAGS (separadas por vírgula)</label>
        <input
          type="text"
          value={basicState.tags}
          onChange={(e) => handleInputChange('tags', e.target.value)}
          disabled={loading}
          placeholder="Ex: importante, criptografia, audio"
          style={{
            width: '100%',
            padding: 10,
            background: '#1a1a1a',
            border: '1px solid #444',
            color: '#fff',
            borderRadius: 6,
            fontSize: 13,
          }}
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>
          {basicState.tags.split(',').filter((t) => t.trim()).length} tags
        </div>
      </div>
    </div>
  );
}
