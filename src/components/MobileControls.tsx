import React, { useState } from 'react';
import './MobileControls.css';

const MobileControls: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBottomSheet = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="mobile-controls">
      <button className="fab" onClick={toggleBottomSheet}>
        +
      </button>

      {isOpen && (
        <div className="bottom-sheet">
          <div className="bottom-sheet-header">
            <button onClick={toggleBottomSheet} className="close-btn">&times;</button>
          </div>
          <div className="bottom-sheet-content">
            <button className="action-btn">Adicionar Novo Card</button>
            <button className="action-btn">Zoom In</button>
            <button className="action-btn">Zoom Out</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileControls;