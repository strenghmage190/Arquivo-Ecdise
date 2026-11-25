import React, { useEffect, useCallback, useId, useRef } from 'react';
import { X } from 'lucide-react';
import { useSwipeable } from 'react-swipeable';
import { useHaptics } from '../../hooks/useHaptics';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
  className?: string;
  showHandle?: boolean;
  closeOnBackdropClick?: boolean;
}

const BottomSheet: React.FC<BottomSheetProps> = React.memo(
  ({
    isOpen,
    onClose,
    children,
    title = 'Menu',
    maxHeight = '85dvh',
    className = '',
    showHandle = true,
    closeOnBackdropClick = true,
  }) => {
    const titleId = useId();
    const sheetRef = useRef<HTMLDivElement | null>(null);
    const bodyRef = useRef<HTMLDivElement | null>(null);
    const previousFocusRef = useRef<HTMLElement | null>(null);
    const { light } = useHaptics();

    const handleSwipeDismiss = useCallback(() => {
      // Só fecha por swipe-down se o conteúdo interno estiver no topo do scroll
      if (bodyRef.current && bodyRef.current.scrollTop > 4) return;
      light();
      onClose();
    }, [light, onClose]);

    const handlers = useSwipeable({
      onSwipedDown: handleSwipeDismiss,
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
        sheetRef.current?.focus();
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
            backdropFilter: 'blur(2px)',
            WebkitBackdropFilter: 'blur(2px)',
            zIndex: 'var(--z-modals, 2000)',
            animation: 'fadeInBackdrop 0.2s ease forwards',
          }}
          aria-hidden="true"
        />
        <div
          ref={sheetRef}
          tabIndex={-1}
          className={`bottom-sheet open ${className}`.trim()}
          {...handlers}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            width: '100%',
            maxWidth: '100vw',
            maxHeight,
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
            outline: 'none',
          }}
        >
          {showHandle && (
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                paddingTop: '10px',
                paddingBottom: '4px',
                cursor: 'grab',
                touchAction: 'none',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '4px',
                  backgroundColor: 'var(--border-hover, #475569)',
                  borderRadius: 'var(--radius-full, 9999px)',
                }}
              />
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 'var(--space-2, 8px)',
              padding: '8px 16px 12px',
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
              aria-label="Fechar"
              onClick={onClose}
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

          <div
            ref={bodyRef}
            style={{
              padding: 'var(--space-4, 16px)',
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
  }
);

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;
