/**
 * 📋 ClueBasicsTab.tsx
 * Tab para configuração básica da pista
 * - Tipo de evidência
 * - Título/Código
 * - Descrição pública e oculta
 * - Tags
 * - Template
 */

import React from 'react';
import { ClueTemplate } from '../../../api/templates';

interface ClueBasicsTabProps {
  // Evidence Type
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue';
  onEvidenceTypeChange: (type: 'document' | 'glitch_puzzle' | 'mega_clue') => void;

  // Basic Fields
  title: string;
  onTitleChange: (value: string) => void;
  descPublic: string;
  onDescPublicChange: (value: string) => void;
  descHidden: string;
  onDescHiddenChange: (value: string) => void;
  tags: string;
  onTagsChange: (value: string) => void;

  // Template System
  templates: ClueTemplate[];
  loadingTemplates: boolean;
  showTemplateDropdown: boolean;
  onShowTemplateDropdown: (show: boolean) => void;
  onApplyTemplate: (template: ClueTemplate) => void;
  onSaveTemplate: (name: string) => void;

  // Loading state
  loading: boolean;
}

export default function ClueBasicsTab({
  evidenceType,
  onEvidenceTypeChange,
  title,
  onTitleChange,
  descPublic,
  onDescPublicChange,
  descHidden,
  onDescHiddenChange,
  tags,
  onTagsChange,
  templates,
  loadingTemplates,
  showTemplateDropdown,
  onShowTemplateDropdown,
  onApplyTemplate,
  onSaveTemplate,
  loading,
}: ClueBasicsTabProps) {
  const [savingTemplateName, setSavingTemplateName] = React.useState('');

  return (
    <div className="field-block createclue-basics createclue-tab-section">
      <span className="field-title">📌 TIPO DE EVIDÊNCIA</span>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => onEvidenceTypeChange('document')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            background: evidenceType === 'document' ? '#3498db' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          📄 Documento
        </button>
        <button
          onClick={() => onEvidenceTypeChange('glitch_puzzle')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            background: evidenceType === 'glitch_puzzle' ? '#e74c3c' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          🎮 Glitch Puzzle
        </button>
        <button
          onClick={() => onEvidenceTypeChange('mega_clue')}
          disabled={loading}
          style={{
            flex: 1,
            padding: '10px',
            background: evidenceType === 'mega_clue' ? '#f39c12' : '#333',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            cursor: loading ? 'default' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          💎 Mega-Pista
        </button>
      </div>

      {/* TEMPLATE SYSTEM */}
      <div className="field-block createclue-basics__templates" style={{ marginBottom: 20, padding: 12, background: 'rgba(100,200,255,0.05)', borderRadius: 6, border: '1px solid rgba(100,200,255,0.1)' }}>
        <span className="field-title">📚 TEMPLATES</span>
        <div className="createclue-basics__template-controls" style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <button className="createclue-basics__template-apply"
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
          <button className="createclue-basics__template-save"
            onClick={() => {
              const name = prompt('Nome do template:');
              if (name) onSaveTemplate(name);
            }}
            disabled={loading || !title}
            title={!title ? 'Adicione um título primeiro' : ''}
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
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          disabled={loading}
          placeholder="Ex: EVIDENCE-001"
        />
      </div>

      {/* DESCRIPTION - PUBLIC */}
      <div className="field-block">
        <label>📖 DESCRIÇÃO (Visível ao Jogador)</label>
        <textarea
          className="textarea"
          value={descPublic}
          onChange={(e) => onDescPublicChange(e.target.value)}
          disabled={loading}
          placeholder="O que o jogador vê quando clica nesta pista"
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>
          {descPublic.length} caracteres
        </div>
      </div>

      {/* DESCRIPTION - HIDDEN */}
      <div className="field-block">
        <label>🔐 DESCRIÇÃO (Oculta - Notas do GM)</label>
        <textarea
          className="textarea"
          value={descHidden}
          onChange={(e) => onDescHiddenChange(e.target.value)}
          disabled={loading}
          placeholder="Notas privadas - não será mostrado ao jogador"
        />
        <div style={{ fontSize: 11, color: '#888', marginTop: 5 }}>
          {descHidden.length} caracteres
        </div>
      </div>

      {/* TAGS */}
      <div className="field-block">
        <label>🏷️ TAGS (separadas por vírgula)</label>
        <input
          type="text"
          value={tags}
          onChange={(e) => onTagsChange(e.target.value)}
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
          {tags.split(',').filter((t) => t.trim()).length} tags
        </div>
      </div>
    </div>
  );
}
