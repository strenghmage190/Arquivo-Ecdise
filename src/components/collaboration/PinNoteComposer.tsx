import React, { useState } from 'react';
import { Archive, Pin, X } from 'lucide-react';
import {
  FINDING_CATEGORY_META,
  FindingCategory,
  PIN_TAG_META,
  PinTag,
} from '../../types/collaboration';

interface PinNoteComposerProps {
  title: string;
  subtitle?: string;
  onSubmitPin: (tag: PinTag, note: string) => Promise<void>;
  onSubmitFinding?: (category: FindingCategory, label: string, details?: string) => Promise<void>;
  onCancel: () => void;
}

export default function PinNoteComposer({
  title,
  subtitle,
  onSubmitPin,
  onSubmitFinding,
  onCancel,
}: PinNoteComposerProps) {
  const [mode, setMode] = useState<'pin' | 'finding'>('pin');
  const [tag, setTag] = useState<PinTag>('look_here');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState<FindingCategory>('code');
  const [label, setLabel] = useState('');
  const [details, setDetails] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      if (mode === 'pin') {
        if (!note.trim()) return;
        await onSubmitPin(tag, note.trim());
      } else if (onSubmitFinding) {
        if (!label.trim()) return;
        await onSubmitFinding(category, label.trim(), details.trim() || undefined);
      }
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label={title}
      style={{
        background: 'rgba(9, 13, 22, 0.96)',
        border: '1px solid rgba(245, 158, 11, 0.45)',
        borderRadius: 10,
        padding: 12,
        marginTop: 8,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 40,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <div>
          <strong style={{ fontSize: '0.82rem', color: '#fbbf24' }}>{title}</strong>
          {subtitle && (
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontFamily: 'monospace' }}>
              {subtitle}
            </div>
          )}
        </div>
        <button type="button" className="collab-mini-btn" onClick={onCancel} aria-label="Cancelar">
          <X size={13} />
        </button>
      </div>

      {onSubmitFinding && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            className={`collab-filter-chip ${mode === 'pin' ? 'active' : ''}`}
            onClick={() => setMode('pin')}
          >
            <Pin size={11} /> Cravar Marcador
          </button>
          <button
            type="button"
            className={`collab-filter-chip ${mode === 'finding' ? 'active' : ''}`}
            onClick={() => setMode('finding')}
          >
            <Archive size={11} /> Salvar na Gaveta
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {mode === 'pin' ? (
          <>
            <select
              className="collab-select"
              value={tag}
              onChange={(e) => setTag(e.target.value as PinTag)}
              aria-label="Etiqueta do marcador"
            >
              {(Object.keys(PIN_TAG_META) as PinTag[]).map((t) => (
                <option key={t} value={t}>
                  {PIN_TAG_META[t].label}
                </option>
              ))}
            </select>
            <input
              type="text"
              className="collab-input"
              placeholder="Ex: Dá zoom aqui e liga L-R!"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              autoFocus
            />
            <button type="submit" className="collab-primary-btn" disabled={saving || !note.trim()}>
              <Pin size={13} /> Salvar Marcador
            </button>
          </>
        ) : (
          <>
            <select
              className="collab-select"
              value={category}
              onChange={(e) => setCategory(e.target.value as FindingCategory)}
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
              placeholder="Informação extraída (ex: 7492)..."
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
            />
            <input
              type="text"
              className="collab-input"
              placeholder="Nota opcional..."
              value={details}
              onChange={(e) => setDetails(e.target.value)}
            />
            <button type="submit" className="collab-primary-btn" disabled={saving || !label.trim()}>
              <Archive size={13} /> Salvar na Gaveta
            </button>
          </>
        )}
      </form>
    </div>
  );
}
