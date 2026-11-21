import React from 'react';

export interface ModalSurfaceProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  maxWidth?: string;
}

export const ModalSurface: React.FC<ModalSurfaceProps> = ({
  isOpen,
  onClose,
  title,
  children,
  headerExtra,
  maxWidth = '840px',
}) => {
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(3px)',
          zIndex: 'var(--z-modals, 2000)',
          animation: 'fadeInBackdrop 0.2s ease forwards',
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Modal'}
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `min(94vw, ${maxWidth})`,
          maxHeight: '90dvh',
          background: 'var(--surface, #11141b)',
          border: '1px solid var(--border, #29313d)',
          borderRadius: 'var(--radius-md, 8px)',
          zIndex: 'calc(var(--z-modals, 2000) + 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9)',
          overscrollBehavior: 'contain',
        }}
      >
        {title && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border, #29313d)',
              background: 'rgba(0, 0, 0, 0.3)',
            }}
          >
            <h3
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {headerExtra}
              <button
                onClick={onClose}
                aria-label="Fechar"
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border, #29313d)',
                  color: 'var(--text-secondary, #94a3b8)',
                  borderRadius: 'var(--radius-sm, 4px)',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                }}
              >
                ✕
              </button>
            </div>
          </div>
        )}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '16px',
            scrollbarWidth: 'thin',
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
};

export default ModalSurface;
