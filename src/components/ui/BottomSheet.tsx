import React from 'react';
import { useSwipeable } from 'react-swipeable';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const BottomSheet: React.FC<BottomSheetProps> = React.memo(({ isOpen, onClose, children, title = 'Menu' }) => {
  const handlers = useSwipeable({
    onSwipedDown: onClose,
    trackMouse: true,
    delta: 50,
  });

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.22)', zIndex: 9998 }}
          aria-hidden="true"
        />
      )}
      <div
        className={`bottom-sheet ${isOpen ? 'open' : ''}`}
        {...handlers}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bottom-sheet-title"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          width: '100vw',
          maxHeight: isOpen ? '70vh' : '0px',
          height: isOpen ? 'auto' : 0,
          background: 'var(--sheet-bg, #fff)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          transition: 'max-height 0.28s ease, height 0.28s ease',
          zIndex: 10000,
          overflow: 'hidden',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.12)'
        }}
      >
        <div style={{ padding: '14px 16px', height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }} onClick={(e) => e.stopPropagation()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <h2 id="bottom-sheet-title" style={{ margin: 0, fontSize: 16 }}>{title}</h2>
            <button aria-label="Fechar menu" onClick={onClose} className="hud-btn">✖</button>
          </div>
          {children}
        </div>
      </div>
    </>
  );
});

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;