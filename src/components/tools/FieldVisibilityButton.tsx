import React, { useState } from 'react';
import FieldVisibilityEditor from './FieldVisibilityEditor';
import './FieldVisibilityButton.css';

export default function FieldVisibilityButton() {
  const [showEditor, setShowEditor] = useState(false);

  return (
    <>
      <button
        className="field-visibility-button"
        onClick={() => setShowEditor(true)}
        title="Escolher quais campos aparecem"
      >
        👁️
      </button>

      {showEditor && (
        <FieldVisibilityEditor onClose={() => setShowEditor(false)} />
      )}
    </>
  );
}
