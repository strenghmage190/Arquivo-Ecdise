import React, { useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = React.memo(({
  isOpen,
  onClose,
  children,
  title = 'Menu',
  maxHeight = '80dvh'
}) => {
  const handlers = useSwipeable({
    onSwipedDown: onClose,
    trackMouse: true,
    delta: 50,
  });

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

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(2px)',
          zIndex: 'var(--z-modals, 2000)',
          animation: 'fadeInBackdrop 0.2s ease forwards',
        }}
        aria-hidden="true"
      />
      <div
        className="bottom-sheet open"
        {...handlers}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          width: '100vw',
          maxHeight: maxHeight,
          background: 'var(--surface, #11141b)',
          borderTop: '1px solid var(--border, #29313d)',
          borderTopLeftRadius: 'var(--radius-lg, 12px)',
          borderTopRightRadius: 'var(--radius-lg, 12px)',
          zIndex: 'calc(var(--z-modals, 2000) + 1)',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)',
          paddingBottom: 'env(safe-area-inset-bottom, 16px)',
          overscrollBehavior: 'contain',
        }}
      >
        {/* Grab Handle */}
        <div
          style={{
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            paddingTop: '8px',
            paddingBottom: '4px',
            cursor: 'grab',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '4px',
              backgroundColor: 'var(--border, #29313d)',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 16px 12px',
            borderBottom: '1px solid var(--border, #29313d)',
          }}
        >
          <h2
            id="bottom-sheet-title"
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
            aria-label="Fechar"
            onClick={onClose}
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

        {/* Content */}
        <div
          style={{
            padding: '16px',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            flex: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
});

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;
