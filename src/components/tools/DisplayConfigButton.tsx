import React, { useState } from 'react';
import DisplayConfigPanel from './DisplayConfigPanel';
import './DisplayConfigButton.css';

export default function DisplayConfigButton() {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <button
        className="display-config-button"
        onClick={() => setShowPanel(true)}
        title="Configurar exibição (⚙️)"
      >
        ⚙️
      </button>

      {showPanel && (
        <DisplayConfigPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}
