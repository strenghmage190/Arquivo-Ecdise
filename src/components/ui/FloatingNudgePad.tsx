import React from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Plus, Minus } from 'lucide-react';

export interface FloatingNudgePadProps {
  onNudge: (dx: number, dy: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  step?: number;
  className?: string;
}

export const FloatingNudgePad: React.FC<FloatingNudgePadProps> = ({
  onNudge,
  onZoomIn,
  onZoomOut,
  step = 20,
  className = '',
}) => {
  const btnStyle: React.CSSProperties = {
    width: '36px',
    height: '36px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--surface, #11141b)',
    border: '1px solid var(--border, #29313d)',
    color: 'var(--text-primary, #f1f5f9)',
    borderRadius: 'var(--radius-sm, 4px)',
    cursor: 'pointer',
    touchAction: 'manipulation',
    userSelect: 'none',
  };

  return (
    <div
      className={`floating-nudge-pad ${className}`}
      style={{
        position: 'fixed',
        right: '16px',
        bottom: 'calc(env(safe-area-inset-bottom, 16px) + 70px)',
        zIndex: 'var(--z-hud, 1000)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(11, 12, 16, 0.85)',
        backdropFilter: 'blur(4px)',
        padding: '6px',
        border: '1px solid var(--border, #29313d)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Up */}
      <button
        style={btnStyle}
        onClick={() => onNudge(0, -step)}
        aria-label="Mover para cima"
      >
        <ChevronUp size={18} />
      </button>

      {/* Middle row: Left, Center (reset/zoom), Right */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          style={btnStyle}
          onClick={() => onNudge(-step, 0)}
          aria-label="Mover para esquerda"
        >
          <ChevronLeft size={18} />
        </button>

        {onZoomIn && onZoomOut ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              style={{ ...btnStyle, height: '17px', width: '28px' }}
              onClick={onZoomIn}
              aria-label="Aumentar zoom"
            >
              <Plus size={12} />
            </button>
            <button
              style={{ ...btnStyle, height: '17px', width: '28px' }}
              onClick={onZoomOut}
              aria-label="Diminuir zoom"
            >
              <Minus size={12} />
            </button>
          </div>
        ) : (
          <div style={{ width: '28px', height: '36px' }} />
        )}

        <button
          style={btnStyle}
          onClick={() => onNudge(step, 0)}
          aria-label="Mover para direita"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Down */}
      <button
        style={btnStyle}
        onClick={() => onNudge(0, step)}
        aria-label="Mover para baixo"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );
};

export default FloatingNudgePad;
