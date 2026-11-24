import React, { useState, useRef, useEffect, useCallback } from 'react';

export type TooltipPlace = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  id: string;
  text: string;
  children: React.ReactNode;
  place?: TooltipPlace;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  id,
  text,
  children,
  place = 'top',
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement | null>(null);

  const hide = useCallback(() => setVisible(false), []);
  const show = useCallback(() => setVisible(true), []);

  useEffect(() => {
    if (!visible) return;

    const handleOutsidePointer = (e: Event) => {
      if (wrapperRef.current && wrapperRef.current.contains(e.target as Node)) return;
      setVisible(false);
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setVisible(false);
    };

    window.addEventListener('pointerdown', handleOutsidePointer, true);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointer, true);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [visible]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Permite toggle por toque no mobile sem bloquear clique do elemento filho
      if (e.touches.length === 1) {
        setVisible((prev) => !prev);
      }
    },
    []
  );

  const positionStyle: React.CSSProperties = (() => {
    switch (place) {
      case 'bottom':
        return { top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
      case 'left':
        return { right: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      case 'right':
        return { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' };
      case 'top':
      default:
        return { bottom: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' };
    }
  })();

  return (
    <span
      ref={wrapperRef}
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      aria-describedby={visible ? id : undefined}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
      onTouchStart={handleTouchStart}
    >
      {children}
      {visible && text && (
        <span
          id={id}
          role="tooltip"
          className={`uv-tooltip ${className}`.trim()}
          style={{
            position: 'absolute',
            ...positionStyle,
            zIndex: 'var(--z-tooltip, 4500)',
            background: 'var(--surface, #11141b)',
            color: 'var(--text-primary, #f1f5f9)',
            border: '1px solid var(--border, #29313d)',
            borderRadius: 'var(--radius-sm, 4px)',
            padding: '6px 10px',
            fontSize: 'var(--font-size-xs, 12px)',
            fontFamily: 'var(--font-system, monospace)',
            lineHeight: 1.35,
            maxWidth: 'min(80vw, 260px)',
            width: 'max-content',
            pointerEvents: 'none',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.75)',
            whiteSpace: 'normal',
            textAlign: 'left',
          }}
        >
          {text}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
