import React, { useMemo, useState } from 'react';
import { Archive, Check, Copy, ExternalLink, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import {
  CaseFinding,
  FINDING_CATEGORY_META,
  FindingCategory,
} from '../../types/collaboration';
import { FindingCategoryIcon } from './CollaborationIcons';
import './Collaboration.css';

interface FindingsDrawerProps {
  cardTitlesById?: Record<string, string>;
}

export default function FindingsDrawer({ cardTitlesById = {} }: FindingsDrawerProps) {
  const {
    isDrawerOpen,
    setDrawerOpen,
    findings,
    addFinding,
    editFinding,
    deleteFinding,
    requestAnchorJump,
    currentUserId,
    isGameMaster,
  } = useCollaboration();

  const [categoryFilter, setCategoryFilter] = useState<'all' | FindingCategory>('all');
  const [search, setSearch] = useState('');
  const [newCategory, setNewCategory] = useState<FindingCategory>('code');
  const [newLabel, setNewLabel] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return findings.filter((f) => {
      if (categoryFilter !== 'all' && f.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        f.label.toLowerCase().includes(q) ||
        (f.details || '').toLowerCase().includes(q) ||
        f.author_name.toLowerCase().includes(q)
      );
    });
  }, [findings, categoryFilter, search]);

  if (!isDrawerOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim() || submitting) return;
    setSubmitting(true);
    try {
      await addFinding({
        category: newCategory,
        label: newLabel.trim(),
        details: newDetails.trim() || undefined,
        sourceTool: 'manual',
      });
      setNewLabel('');
      setNewDetails('');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async (finding: CaseFinding) => {
    try {
      await navigator.clipboard?.writeText(finding.label);
      setCopiedId(finding.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {}
  };

  const startEdit = (f: CaseFinding) => {
    setEditingId(f.id);
    setEditLabel(f.label);
    setEditDetails(f.details || '');
  };

  const saveEdit = async (findingId: string) => {
    if (!editLabel.trim()) return;
    await editFinding(findingId, {
      label: editLabel.trim(),
      details: editDetails.trim() || null,
    });
    setEditingId(null);
  };

  return (
    <aside className="collab-drawer" aria-label="Gaveta de Achados da Equipe">
      <div className="collab-drawer-header">
        <h3>
          <Archive size={16} /> Gaveta de Achados ({findings.length})
        </h3>
        <button
          type="button"
          className="collab-close-btn"
          onClick={() => setDrawerOpen(false)}
          aria-label="Fechar Gaveta de Achados"
        >
          <X size={15} />
        </button>
      </div>

      <div className="collab-drawer-filters">
        <button
          type="button"
          className={`collab-filter-chip ${categoryFilter === 'all' ? 'active' : ''}`}
          onClick={() => setCategoryFilter('all')}
        >
          Todos
        </button>
        {(Object.keys(FINDING_CATEGORY_META) as FindingCategory[]).map((cat) => {
          const meta = FINDING_CATEGORY_META[cat];
          return (
            <button
              key={cat}
              type="button"
              className={`collab-filter-chip ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
            >
              <FindingCategoryIcon category={cat} size={12} /> {meta.label.split(' ')[0]}
            </button>
          );
        })}
      </div>

      <form className="collab-add-form" onSubmit={handleCreate}>
        <select
          className="collab-select"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value as FindingCategory)}
          aria-label="Categoria do achado"
        >
          {(Object.keys(FINDING_CATEGORY_META) as FindingCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {FINDING_CATEGORY_META[cat].label}
            </option>
          ))}
        </select>
        <input
          type="text"
          className="collab-input"
          placeholder="Valor (ex: 7492, Dr. Arnaldo...)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            type="text"
            className="collab-input"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="Contexto opcional..."
            value={newDetails}
            onChange={(e) => setNewDetails(e.target.value)}
          />
          <button type="submit" className="collab-primary-btn" disabled={submitting || !newLabel.trim()}>
            <Plus size={14} /> Salvar
          </button>
        </div>
        <input
          type="search"
          className="collab-input"
          placeholder="Buscar achados..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </form>

      <div className="collab-drawer-list">
        {filtered.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.82rem', textAlign: 'center', marginTop: 20 }}>
            Nenhum achado salvo ainda nesta categoria.
          </p>
        ) : (
          filtered.map((f) => {
            const meta = FINDING_CATEGORY_META[f.category];
            const canModify = isGameMaster || (currentUserId && f.created_by === currentUserId);
            const sourceTitle = f.source_card_id ? cardTitlesById[f.source_card_id] : null;
            const isEditing = editingId === f.id;

            return (
              <div key={f.id} className="collab-finding-card">
                <div className="collab-finding-top">
                  <span className="collab-finding-cat" style={{ color: meta.color, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <FindingCategoryIcon category={f.category} size={12} /> {meta.label}
                  </span>
                  <div className="collab-finding-actions">
                    <button
                      type="button"
                      className="collab-mini-btn"
                      onClick={() => handleCopy(f)}
                      title="Copiar valor"
                    >
                      {copiedId === f.id ? <Check size={12} /> : <Copy size={12} />}
                    </button>
                    {canModify && !isEditing && (
                      <>
                        <button
                          type="button"
                          className="collab-mini-btn"
                          onClick={() => startEdit(f)}
                          title="Editar achado"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          type="button"
                          className="collab-mini-btn"
                          onClick={() => deleteFinding(f.id)}
                          title="Excluir achado"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <input
                      type="text"
                      className="collab-input"
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                    />
                    <input
                      type="text"
                      className="collab-input"
                      value={editDetails}
                      onChange={(e) => setEditDetails(e.target.value)}
                      placeholder="Detalhes..."
                    />
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button type="button" className="collab-primary-btn" onClick={() => saveEdit(f.id)}>
                        Salvar
                      </button>
                      <button type="button" className="collab-mini-btn" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="collab-finding-label">{f.label}</div>
                    {f.details && <p className="collab-finding-details">{f.details}</p>}
                  </>
                )}

                <div className="collab-finding-meta">
                  <span>Por {f.author_name}</span>
                  {f.source_card_id && (
                    <button
                      type="button"
                      className="collab-mini-btn"
                      onClick={() =>
                        requestAnchorJump(
                          f.source_card_id!,
                          (f.source_tool as any) || 'board',
                          f.source_anchor || {}
                        )
                      }
                    >
                      <ExternalLink size={11} /> {sourceTitle || 'Abrir origem'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
