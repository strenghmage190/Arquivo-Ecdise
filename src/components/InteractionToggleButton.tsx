import React, { useState } from 'react';
import './InteractionToggleButton.css';

const InteractionToggleButton: React.FC = () => {
  const [interactionMode, setInteractionMode] = useState<'pan' | 'edit'>('pan');

  const toggleMode = () => {
    setInteractionMode((prev) => (prev === 'pan' ? 'edit' : 'pan'));
  };

  return (
    <button className="fab-toggle-mode" onClick={toggleMode}>
      {interactionMode === 'pan' ? '🖐️' : '✏️'}
    </button>
  );
};

export default InteractionToggleButton;