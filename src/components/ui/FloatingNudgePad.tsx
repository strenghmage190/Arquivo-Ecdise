import React, { useState, useCallback } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
  Minus,
  Zap,
  X,
} from 'lucide-react';
import { useHaptics } from '../../hooks/useHaptics';

export interface FloatingNudgePadProps {
  onNudge: (dx: number, dy: number) => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  step?: number;
  fastStep?: number;
  label?: string;
  onClose?: () => void;
  className?: string;
}

export const FloatingNudgePad: React.FC<FloatingNudgePadProps> = ({
  onNudge,
  onZoomIn,
  onZoomOut,
  step = 10,
  fastStep,
  label,
  onClose,
  className = '',
}) => {
  const [fastMode, setFastMode] = useState(false);
  const { selection, light } = useHaptics();
  const resolvedFastStep = fastStep ?? step * 5;

  const triggerNudge = useCallback(
    (dirX: number, dirY: number, shiftKey = false) => {
      const amount = fastMode || shiftKey ? resolvedFastStep : step;
      selection();
      onNudge(dirX * amount, dirY * amount);
    },
    [fastMode, resolvedFastStep, step, selection, onNudge]
  );

  const toggleFastMode = useCallback(() => {
    light();
    setFastMode((prev) => !prev);
  }, [light]);

  const btnStyle: React.CSSProperties = {
    width: '40px',
    height: '40px',
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
    padding: 0,
  };

  return (
    <div
      className={`floating-nudge-pad ${className}`.trim()}
      role="group"
      aria-label={label || 'Controle direcional de precisão'}
      style={{
        position: 'fixed',
        right: 'calc(env(safe-area-inset-right, 0px) + 16px)',
        bottom: 'calc(env(safe-area-inset-bottom, 0px) + 76px)',
        zIndex: 'var(--z-mobile-bars, 1200)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '4px',
        background: 'rgba(11, 12, 16, 0.92)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        padding: '8px',
        border: '1px solid var(--border, #29313d)',
        borderRadius: 'var(--radius-md, 8px)',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.65)',
      }}
    >
      {/* Header row: Fast-step (Shift) toggle & optional close */}
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '4px',
          marginBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={toggleFastMode}
          aria-pressed={fastMode}
          aria-label={fastMode ? 'Desativar passo rápido' : 'Ativar passo rápido'}
          title={`Passo atual: ${fastMode ? resolvedFastStep : step}px`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            height: '28px',
            minHeight: '28px',
            minWidth: 'auto',
            padding: '0 8px',
            fontSize: '11px',
            fontFamily: 'var(--font-system, monospace)',
            fontWeight: 700,
            borderRadius: 'var(--radius-sm, 4px)',
            border: `1px solid ${fastMode ? 'var(--institutional-red, #e63946)' : 'var(--border, #29313d)'}`,
            background: fastMode ? 'rgba(230, 57, 70, 0.2)' : 'var(--surface, #11141b)',
            color: fastMode ? 'var(--text-primary, #f1f5f9)' : 'var(--text-secondary, #94a3b8)',
            cursor: 'pointer',
            touchAction: 'manipulation',
          }}
        >
          <Zap size={12} />
          <span>{fastMode ? `${resolvedFastStep}px` : `${step}px`}</span>
        </button>

        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar controle direcional"
            style={{
              width: '28px',
              height: '28px',
              minHeight: '28px',
              minWidth: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'transparent',
              border: '1px solid transparent',
              color: 'var(--text-secondary, #94a3b8)',
              borderRadius: 'var(--radius-sm, 4px)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Up */}
      <button
        type="button"
        style={btnStyle}
        onClick={(e) => triggerNudge(0, -1, e.shiftKey)}
        aria-label="Mover para cima"
      >
        <ChevronUp size={18} />
      </button>

      {/* Middle row: Left, Center (zoom), Right */}
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <button
          type="button"
          style={btnStyle}
          onClick={(e) => triggerNudge(-1, 0, e.shiftKey)}
          aria-label="Mover para esquerda"
        >
          <ChevronLeft size={18} />
        </button>

        {onZoomIn && onZoomOut ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <button
              type="button"
              style={{ ...btnStyle, height: '19px', minHeight: '19px', width: '32px', minWidth: '32px' }}
              onClick={() => {
                selection();
                onZoomIn();
              }}
              aria-label="Aumentar zoom"
            >
              <Plus size={12} />
            </button>
            <button
              type="button"
              style={{ ...btnStyle, height: '19px', minHeight: '19px', width: '32px', minWidth: '32px' }}
              onClick={() => {
                selection();
                onZoomOut();
              }}
              aria-label="Diminuir zoom"
            >
              <Minus size={12} />
            </button>
          </div>
        ) : (
          <div style={{ width: '32px', height: '40px' }} />
        )}

        <button
          type="button"
          style={btnStyle}
          onClick={(e) => triggerNudge(1, 0, e.shiftKey)}
          aria-label="Mover para direita"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Down */}
      <button
        type="button"
        style={btnStyle}
        onClick={(e) => triggerNudge(0, 1, e.shiftKey)}
        aria-label="Mover para baixo"
      >
        <ChevronDown size={18} />
      </button>
    </div>
  );
};

export default FloatingNudgePad;
