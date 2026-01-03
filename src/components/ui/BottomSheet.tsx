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
    trackMouse: false,
  });

  return (
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
        height: isOpen ? '50vh' : '0vh',
        background: 'white',
        borderTop: '1px solid #ccc',
        transition: 'height 0.3s ease',
        zIndex: 1000,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '20px', height: '100%', overflowY: 'auto' }}>
        <h2 id="bottom-sheet-title" style={{ margin: 0, marginBottom: '10px' }}>{title}</h2>
        {children}
      </div>
    </div>
  );
});

BottomSheet.displayName = 'BottomSheet';

export default BottomSheet;