import React, { useMemo, useState } from 'react';
import { Archive, Check, Copy, Sparkles } from 'lucide-react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { FINDING_CATEGORY_META, FindingCategory } from '../../types/collaboration';
import { FindingCategoryIcon } from './CollaborationIcons';
import './Collaboration.css';

interface TeamFindingsPopoverProps {
  preferredCategory?: FindingCategory;
  onSelectValue?: (value: string) => void;
  buttonLabel?: string;
}

export default function TeamFindingsPopover({
  preferredCategory = 'code',
  onSelectValue,
  buttonLabel = 'Consultar Achados da Equipe',
}: TeamFindingsPopoverProps) {
  const { findings } = useCollaboration();
  const [open, setOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const visibleFindings = useMemo(() => {
    if (showAll) return findings;
    const preferred = findings.filter((f) => f.category === preferredCategory);
    return preferred.length > 0 ? preferred : findings;
  }, [findings, preferredCategory, showAll]);

  const handleCopy = async (id: string, value: string) => {
    try {
      await navigator.clipboard?.writeText(value);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1200);
    } catch {}
  };

  return (
    <div className="collab-popover-wrap">
      <button
        type="button"
        className="collab-popover-trigger"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <Archive size={13} />
        <span>{buttonLabel}</span>
        {findings.length > 0 && <strong>({findings.length})</strong>}
      </button>

      {open && (
        <div className="collab-popover-panel" role="dialog" aria-label="Achados da Equipe">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: '0.74rem', color: '#7dd3fc', fontWeight: 600 }}>
              Dados Extraídos ({visibleFindings.length})
            </span>
            <button
              type="button"
              className="collab-mini-btn"
              style={{ minHeight: 36, touchAction: 'manipulation' }}
              onClick={() => setShowAll((s) => !s)}
            >
              {showAll
                ? `Só ${FINDING_CATEGORY_META[preferredCategory]?.label.split(' ')[0] || 'Filtro'}`
                : 'Ver Todos'}
            </button>
          </div>

          {visibleFindings.length === 0 ? (
            <div style={{ fontSize: '0.76rem', color: '#94a3b8', padding: '8px 4px' }}>
              Nenhum achado salvo pela equipe ainda.
            </div>
          ) : (
            visibleFindings.map((f) => {
              const meta = FINDING_CATEGORY_META[f.category];
              return (
                <div key={f.id} className="collab-popover-item">
                  <div style={{ minWidth: 0 }}>
                    <strong style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <FindingCategoryIcon category={f.category} size={12} /> {f.label}
                    </strong>
                    <small>
                      {f.author_name}
                      {f.details ? ` • ${f.details}` : ''}
                    </small>
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {onSelectValue && (
                      <button
                        type="button"
                        className="collab-mini-btn"
                        onClick={() => {
                          onSelectValue(f.label);
                          setOpen(false);
                        }}
                        title="Aplicar código"
                      >
                        <Sparkles size={11} /> Usar
                      </button>
                    )}
                    <button
                      type="button"
                      className="collab-mini-btn"
                      onClick={() => handleCopy(f.id, f.label)}
                      title="Copiar"
                    >
                      {copiedId === f.id ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
