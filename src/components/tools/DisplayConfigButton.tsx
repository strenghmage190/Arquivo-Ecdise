import { Settings } from 'lucide-react';
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
        title="Configurar exibição"
      >
        <Settings className="lucide-icon inline-icon" size={16} />
      </button>

      {showPanel && (
        <DisplayConfigPanel onClose={() => setShowPanel(false)} />
      )}
    </>
  );
}
