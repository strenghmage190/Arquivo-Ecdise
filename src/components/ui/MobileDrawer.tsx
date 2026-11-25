import React, { useEffect, useCallback, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useHaptics } from '../../hooks/useHaptics';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  children: React.ReactNode;
  title?: string;
  width?: string;
  className?: string;
  swipeToClose?: boolean;
  closeOnBackdropClick?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  position = 'left',
  children,
  title,
  width = 'min(85vw, 360px)',
  className = '',
  swipeToClose = true,
  closeOnBackdropClick = true,
}) => {
  const titleId = useId();
  const drawerRef = useRef<HTMLElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const { light } = useHaptics();
  const isLeft = position === 'left';

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (swipeToClose && isLeft) {
        light();
        onClose();
      }
    },
    onSwipedRight: () => {
      if (swipeToClose && !isLeft) {
        light();
        onClose();
      }
    },
    trackMouse: false,
    delta: 50,
  });

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;
    window.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      drawerRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={closeOnBackdropClick ? onClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 'var(--z-modals, 2000)',
          animation: 'fadeInBackdrop 0.2s ease forwards',
        }}
        aria-hidden="true"
      />
      <aside
        ref={drawerRef}
        tabIndex={-1}
        className={`mobile-drawer ${className}`.trim()}
        {...swipeHandlers}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? 'Gaveta lateral' : undefined}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
          height: '100dvh',
          [isLeft ? 'left' : 'right']: 0,
          width,
          maxWidth: '100vw',
          background: 'var(--surface, #11141b)',
          borderRight: isLeft ? '1px solid var(--border, #29313d)' : 'none',
          borderLeft: !isLeft ? '1px solid var(--border, #29313d)' : 'none',
          zIndex: 'calc(var(--z-modals, 2000) + 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 0 40px rgba(0, 0, 0, 0.85)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          paddingLeft: isLeft ? 'env(safe-area-inset-left, 0px)' : '0px',
          paddingRight: !isLeft ? 'env(safe-area-inset-right, 0px)' : '0px',
          overscrollBehavior: 'contain',
          outline: 'none',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 'var(--space-2, 8px)',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border, #29313d)',
            }}
          >
            <h2
              id={titleId}
              style={{
                margin: 0,
                fontSize: 'var(--font-size-sm, 14px)',
                fontFamily: 'var(--font-system, monospace)',
                fontWeight: 700,
                letterSpacing: '1px',
                color: 'var(--text-primary, #f1f5f9)',
                textTransform: 'uppercase',
              }}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Fechar gaveta"
              style={{
                background: 'transparent',
                border: '1px solid transparent',
                borderRadius: 'var(--radius-sm, 4px)',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                minHeight: 'var(--control-h-sm, 32px)',
                minWidth: 'var(--control-h-sm, 32px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'manipulation',
              }}
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            padding: 'var(--space-4, 16px)',
            scrollbarWidth: 'thin',
          }}
        >
          {children}
        </div>
      </aside>
    </>
  );
};

export default MobileDrawer;
