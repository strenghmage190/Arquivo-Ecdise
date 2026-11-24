import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useHaptics } from '../../hooks/useHaptics';

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export interface TouchContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
  longPressDelay?: number;
  className?: string;
  disabled?: boolean;
  title?: string;
  onOpenChange?: (open: boolean) => void;
}

const MENU_ESTIMATED_WIDTH = 220;
const ITEM_ESTIMATED_HEIGHT = 44;
const VIEWPORT_PADDING = 8;

export const TouchContextMenu: React.FC<TouchContextMenuProps> = ({
  children,
  items,
  longPressDelay = 500,
  className = '',
  disabled = false,
  title,
  onOpenChange,
}) => {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement | null>(null);
  const { medium, selection } = useHaptics();

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const openMenuAt = useCallback(
    (x: number, y: number) => {
      setMenuPos({ x, y });
      onOpenChange?.(true);
    },
    [onOpenChange]
  );

  const closeMenu = useCallback(() => {
    setMenuPos(null);
    onOpenChange?.(false);
  }, [onOpenChange]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || items.length === 0) return;
      if (e.touches.length !== 1) {
        clearTimer();
        return;
      }
      const touch = e.touches[0];
      if (!touch) return;

      startPosRef.current = { x: touch.clientX, y: touch.clientY };
      clearTimer();

      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        medium();
        openMenuAt(startPosRef.current.x, startPosRef.current.y);
      }, longPressDelay);
    },
    [disabled, items.length, longPressDelay, clearTimer, medium, openMenuAt]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      const touch = e.touches[0];
      if (!touch) return;
      const dx = Math.abs(touch.clientX - startPosRef.current.x);
      const dy = Math.abs(touch.clientY - startPosRef.current.y);
      if (dx > 10 || dy > 10) {
        clearTimer();
      }
    },
    [clearTimer]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent) => {
      if (disabled || items.length === 0) return;
      e.preventDefault();
      openMenuAt(e.clientX, e.clientY);
    },
    [disabled, items.length, openMenuAt]
  );

  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);

  useEffect(() => {
    if (!menuPos) return;

    const handleOutsidePointer = (e: Event) => {
      if (menuRef.current && menuRef.current.contains(e.target as Node)) return;
      closeMenu();
    };
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('pointerdown', handleOutsidePointer, true);
    window.addEventListener('keydown', handleGlobalKey);
    window.addEventListener('scroll', closeMenu, true);

    return () => {
      window.removeEventListener('pointerdown', handleOutsidePointer, true);
      window.removeEventListener('keydown', handleGlobalKey);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [menuPos, closeMenu]);

  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 375;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 667;
  const estimatedHeight = items.length * ITEM_ESTIMATED_HEIGHT + (title ? 36 : 16);

  const clampedLeft = menuPos
    ? Math.max(VIEWPORT_PADDING, Math.min(menuPos.x, viewportW - MENU_ESTIMATED_WIDTH - VIEWPORT_PADDING))
    : 0;
  const clampedTop = menuPos
    ? Math.max(VIEWPORT_PADDING, Math.min(menuPos.y, viewportH - estimatedHeight - VIEWPORT_PADDING))
    : 0;

  return (
    <div
      className={`touch-context-menu-wrapper ${className}`.trim()}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={clearTimer}
      onTouchCancel={clearTimer}
      onContextMenu={handleContextMenu}
      style={{ userSelect: 'none', WebkitUserSelect: 'none' }}
    >
      {children}

      {menuPos && (
        <div
          ref={menuRef}
          role="menu"
          aria-label={title || 'Menu de contexto'}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: clampedLeft,
            top: clampedTop,
            zIndex: 'calc(var(--z-modals, 2000) + 10)',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            borderRadius: 'var(--radius-sm, 4px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85)',
            minWidth: '200px',
            maxWidth: 'calc(100vw - 16px)',
            maxHeight: 'calc(100dvh - 16px)',
            overflowY: 'auto',
            overscrollBehavior: 'contain',
            padding: '4px 0',
          }}
        >
          {title && (
            <div
              style={{
                padding: '6px 14px',
                fontSize: '11px',
                fontFamily: 'var(--font-system, monospace)',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: 'var(--text-secondary, #94a3b8)',
                borderBottom: '1px solid var(--border, #29313d)',
              }}
            >
              {title}
            </div>
          )}
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                selection();
                closeMenu();
                item.onClick();
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                minHeight: 'var(--control-h-md, 40px)',
                background: 'transparent',
                border: 'none',
                color: item.danger
                  ? 'var(--institutional-red, #e63946)'
                  : 'var(--text-primary, #f1f5f9)',
                fontFamily: 'var(--font-system, monospace)',
                fontSize: '13px',
                textAlign: 'left',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                touchAction: 'manipulation',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (!item.disabled) {
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }
              }}
            >
              {item.icon && (
                <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                  {item.icon}
                </span>
              )}
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TouchContextMenu;
