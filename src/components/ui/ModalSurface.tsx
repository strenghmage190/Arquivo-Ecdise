import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export interface ModalSurfaceProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
  className?: string;
  closeOnBackdropClick?: boolean;
  fullScreenMobile?: boolean;
}

export const ModalSurface: React.FC<ModalSurfaceProps> = ({
  isOpen,
  onClose,
  title,
  children,
  headerExtra,
  footer,
  maxWidth = '840px',
  className = '',
  closeOnBackdropClick = true,
  fullScreenMobile = false,
}) => {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    const prevOverflow = document.body.style.overflow;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = prevOverflow;
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isNarrowViewport =
    typeof window !== 'undefined' && window.innerWidth <= 640;
  const useFullScreen = fullScreenMobile && isNarrowViewport;

  return (
    <>
      <div
        className="modal-backdrop"
        onClick={closeOnBackdropClick ? onClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(3px)',
          WebkitBackdropFilter: 'blur(3px)',
          zIndex: 'var(--z-modals, 2000)',
          animation: 'fadeInBackdrop 0.2s ease forwards',
        }}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={`modal-surface-container ${className}`.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-label={!title ? 'Modal' : undefined}
        style={{
          position: 'fixed',
          top: useFullScreen ? 0 : '50%',
          left: useFullScreen ? 0 : '50%',
          transform: useFullScreen ? 'none' : 'translate(-50%, -50%)',
          width: useFullScreen ? '100vw' : `min(94vw, ${maxWidth})`,
          height: useFullScreen ? '100dvh' : 'auto',
          maxHeight: useFullScreen ? '100dvh' : '90dvh',
          background: 'var(--surface, #11141b)',
          border: useFullScreen ? 'none' : '1px solid var(--border, #29313d)',
          borderRadius: useFullScreen ? 0 : 'var(--radius-md, 8px)',
          zIndex: 'calc(var(--z-modals, 2000) + 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
          overscrollBehavior: 'contain',
          paddingTop: useFullScreen ? 'env(safe-area-inset-top, 0px)' : undefined,
          paddingBottom: useFullScreen ? 'env(safe-area-inset-bottom, 0px)' : undefined,
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
              background: 'rgba(0, 0, 0, 0.3)',
              flexShrink: 0,
            }}
          >
            <h3
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
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
              {headerExtra}
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border, #29313d)',
                  color: 'var(--text-secondary, #94a3b8)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  cursor: 'pointer',
                  minWidth: 'var(--control-h-sm, 32px)',
                  minHeight: 'var(--control-h-sm, 32px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  touchAction: 'manipulation',
                }}
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}
        <div
          className="modal-surface-body"
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
        {footer && (
          <div
            style={{
              padding: '12px 16px',
              paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
              borderTop: '1px solid var(--border, #29313d)',
              background: 'rgba(0, 0, 0, 0.25)',
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </>
  );
};

export default ModalSurface;
