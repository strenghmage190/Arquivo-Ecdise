import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronRight, Eye, EyeOff, Pin, Trash2 } from 'lucide-react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { CasePin, PIN_TAG_META } from '../../types/collaboration';

interface PinListBarProps {
  pins: CasePin[];
  showPins: boolean;
  onToggleShowPins: () => void;
  onSelectPin: (pin: CasePin) => void;
  renderAnchorSummary?: (pin: CasePin) => string;
  variant?: 'card' | 'sidebar';
}

export default function PinListBar({
  pins,
  showPins,
  onToggleShowPins,
  onSelectPin,
  renderAnchorSummary,
  variant = 'card',
}: PinListBarProps) {
  const { resolvePin, deletePin, currentUserId, isGameMaster } = useCollaboration();
  const [showResolved, setShowResolved] = useState(false);

  const activePins = pins.filter((p) => !p.is_resolved);
  const resolvedPins = pins.filter((p) => p.is_resolved);

  const renderPinRow = (pin: CasePin) => {
    const tagMeta = PIN_TAG_META[pin.tag] || PIN_TAG_META.look_here;
    const canDelete = isGameMaster || (currentUserId && pin.created_by === currentUserId);
    const summary = renderAnchorSummary ? renderAnchorSummary(pin) : '';

    if (variant === 'sidebar') {
      return (
        <div
          key={pin.id}
          className={`plb-row ${pin.is_resolved ? 'plb-row--resolved' : ''}`}
          style={!pin.is_resolved ? { borderColor: `${tagMeta.color}44` } : undefined}
        >
          <button
            type="button"
            onClick={() => onSelectPin(pin)}
            className="plb-row-main"
          >
            <div className="plb-row-tags">
              <span
                className="plb-tag"
                style={{ color: tagMeta.color }}
              >
                [{tagMeta.label}]
              </span>
              {summary && (
                <span className="plb-summary">
                  {summary}
                </span>
              )}
            </div>
            <span className="plb-note">
              {pin.note}
            </span>
            <small className="plb-author">— {pin.author_name}</small>
          </button>

          <div className="plb-row-actions">
            <button
              type="button"
              className="phone-compact-btn plb-icon-btn"
              onClick={() => resolvePin(pin.id, !pin.is_resolved)}
              title={pin.is_resolved ? 'Reabrir marcação' : 'Marcar como resolvido'}
            >
              <CheckCircle2 size={12} color={pin.is_resolved ? '#10b981' : '#94a3b8'} />
            </button>
            {canDelete && (
              <button
                type="button"
                className="phone-compact-btn plb-icon-btn plb-icon-btn--danger"
                onClick={() => deletePin(pin.id)}
                title="Excluir marcação"
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div
        key={pin.id}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '6px 8px',
          borderRadius: 6,
          background: pin.is_resolved ? 'rgba(15, 23, 42, 0.45)' : 'rgba(15, 23, 42, 0.85)',
          border: `1px solid ${pin.is_resolved ? 'rgba(148,163,184,0.16)' : tagMeta.color + '55'}`,
          opacity: pin.is_resolved ? 0.7 : 1,
        }}
      >
        <button
          type="button"
          onClick={() => onSelectPin(pin)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#e2e8f0',
            textAlign: 'left',
            cursor: 'pointer',
            flex: 1,
            padding: 0,
            fontSize: '0.78rem',
          }}
        >
          <span style={{ color: tagMeta.color, fontWeight: 700, marginRight: 6 }}>
            [{tagMeta.label}]
          </span>
          {summary && (
            <span style={{ color: '#94a3b8', fontFamily: 'monospace', marginRight: 6 }}>
              {summary}
            </span>
          )}
          <span>{pin.note}</span>
          <small style={{ display: 'block', color: '#64748b', fontSize: '0.7rem' }}>
            — {pin.author_name}
          </small>
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          <button
            type="button"
            className="collab-mini-btn"
            onClick={() => resolvePin(pin.id, !pin.is_resolved)}
            title={pin.is_resolved ? 'Reabrir marcação' : 'Marcar como resolvido'}
          >
            <CheckCircle2 size={12} color={pin.is_resolved ? '#10b981' : '#94a3b8'} />
          </button>
          {canDelete && (
            <button
              type="button"
              className="collab-mini-btn"
              onClick={() => deletePin(pin.id)}
              title="Excluir marcação"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (variant === 'sidebar') {
    return (
      <div className="plb-sidebar">
        <div className="plb-header">
          <div className="plb-header-left">
            <Pin size={13} style={{ color: '#fbbf24', flexShrink: 0 }} />
            <span className="plb-title">
              Marcadores da Equipe
            </span>
            <span className="plb-count">
              {activePins.length}
            </span>
          </div>
          <button
            type="button"
            onClick={onToggleShowPins}
            className="phone-compact-btn plb-toggle-btn"
          >
            {showPins ? <EyeOff size={12} /> : <Eye size={12} />}
            <span>{showPins ? 'Ocultar' : 'Mostrar'}</span>
          </button>
        </div>

        {activePins.length === 0 ? (
          <div className="plb-empty">
            Nenhum marcador ativo. Passe o cursor ou toque em uma mensagem e clique no alfinete para marcar.
          </div>
        ) : (
          <div className="plb-list">{activePins.map(renderPinRow)}</div>
        )}

        {resolvedPins.length > 0 && (
          <div className="plb-resolved-section">
            <button
              type="button"
              onClick={() => setShowResolved((s) => !s)}
              className="phone-compact-btn plb-resolved-toggle"
            >
              {showResolved ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              <span>Resolvidos ({resolvedPins.length})</span>
            </button>
            {showResolved && (
              <div className="plb-list" style={{ marginTop: 8 }}>{resolvedPins.map(renderPinRow)}</div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 10,
        padding: '8px 10px',
        borderRadius: 8,
        background: 'rgba(2, 6, 23, 0.65)',
        border: '1px solid rgba(148, 163, 184, 0.16)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: '0.76rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pin size={13} color="#f59e0b" /> Marcadores da Equipe ({activePins.length} ativos)
        </span>
        <button type="button" className="collab-mini-btn" onClick={onToggleShowPins}>
          {showPins ? <EyeOff size={12} /> : <Eye size={12} />}
          <span>{showPins ? 'Ocultar Marcadores' : 'Mostrar Marcadores'}</span>
        </button>
      </div>

      {activePins.length === 0 ? (
        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>
          Nenhum marcador ativo nesta evidência.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {activePins.map(renderPinRow)}
        </div>
      )}

      {resolvedPins.length > 0 && (
        <div>
          <button
            type="button"
            className="collab-mini-btn"
            onClick={() => setShowResolved((s) => !s)}
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {showResolved ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span>Resolvidos ({resolvedPins.length})</span>
          </button>
          {showResolved && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 6 }}>
              {resolvedPins.map(renderPinRow)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
