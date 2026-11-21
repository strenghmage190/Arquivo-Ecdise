import React, { useRef, useState, useCallback, useEffect } from 'react';

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
}

export const TouchContextMenu: React.FC<TouchContextMenuProps> = ({
  children,
  items,
  longPressDelay = 500,
  className = '',
  disabled = false,
}) => {
  const [menuPos, setMenuPos] = useState<{ x: number; y: number } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    const touch = e.touches[0];
    if (!touch) return;

    startPosRef.current = { x: touch.clientX, y: touch.clientY };
    clearTimer();

    timerRef.current = setTimeout(() => {
      // Vibrate se suportado
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate(40);
        } catch (err) {
          // Ignore
        }
      }
      setMenuPos({ x: startPosRef.current.x, y: startPosRef.current.y });
    }, longPressDelay);
  }, [disabled, longPressDelay, clearTimer]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    const dx = Math.abs(touch.clientX - startPosRef.current.x);
    const dy = Math.abs(touch.clientY - startPosRef.current.y);
    if (dx > 10 || dy > 10) {
      clearTimer();
    }
  }, [clearTimer]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (disabled) return;
    e.preventDefault();
    setMenuPos({ x: e.clientX, y: e.clientY });
  }, [disabled]);

  const closeMenu = useCallback(() => {
    setMenuPos(null);
  }, []);

  useEffect(() => {
    const handleGlobalClick = () => closeMenu();
    const handleGlobalKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenu();
    };

    if (menuPos) {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('keydown', handleGlobalKey);
      window.addEventListener('scroll', closeMenu, true);
    }
    return () => {
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('keydown', handleGlobalKey);
      window.removeEventListener('scroll', closeMenu, true);
    };
  }, [menuPos, closeMenu]);

  return (
    <div
      className={`touch-context-menu-wrapper ${className}`}
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
          role="menu"
          aria-label="Menu de contexto"
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            left: Math.min(menuPos.x, window.innerWidth - 220),
            top: Math.min(menuPos.y, window.innerHeight - (items.length * 44 + 20)),
            zIndex: 'var(--z-modals, 2000)',
            background: 'var(--surface, #11141b)',
            border: '1px solid var(--border, #29313d)',
            borderRadius: 'var(--radius-sm, 4px)',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.85)',
            minWidth: '200px',
            overflow: 'hidden',
            padding: '4px 0',
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
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
                color: item.danger ? 'var(--institutional-red, #e63946)' : 'var(--text-primary, #f1f5f9)',
                fontFamily: 'var(--font-system, monospace)',
                fontSize: '13px',
                textAlign: 'left',
                cursor: item.disabled ? 'not-allowed' : 'pointer',
                opacity: item.disabled ? 0.4 : 1,
                touchAction: 'manipulation',
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
              }}
              onMouseLeave={(e) => {
                if (!item.disabled) (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              {item.icon && <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>}
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TouchContextMenu;
