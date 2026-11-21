import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';

export interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'left' | 'right';
  children: React.ReactNode;
  title?: string;
  width?: string;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  position = 'left',
  children,
  title,
  width = 'min(85vw, 360px)'
}) => {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  const isLeft = position === 'left';

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.65)',
          backdropFilter: 'blur(3px)',
          zIndex: 'var(--z-modals, 2000)',
          animation: 'fadeInBackdrop 0.2s ease forwards',
        }}
        aria-hidden="true"
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Drawer'}
        style={{
          position: 'fixed',
          top: 0,
          bottom: 0,
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
            }}
          >
            <h2
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
              onClick={onClose}
              aria-label="Fechar gaveta"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-secondary, #94a3b8)',
                cursor: 'pointer',
                minHeight: 'var(--control-h-sm, 32px)',
                minWidth: 'var(--control-h-sm, 32px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
            padding: '16px',
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
