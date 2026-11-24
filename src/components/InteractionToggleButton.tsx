import { Hand, PenTool } from 'lucide-react';
import React from 'react';
import { useHaptics } from '../hooks/useHaptics';
import './InteractionToggleButton.css';

interface InteractionToggleButtonProps {
  mode: 'pan' | 'edit';
  onToggle: () => void;
  className?: string;
}

const InteractionToggleButton: React.FC<InteractionToggleButtonProps> = ({
  mode,
  onToggle,
  className = '',
}) => {
  const { selection } = useHaptics();

  return (
    <button
      type="button"
      className={`fab-toggle-mode ${mode === 'edit' ? 'edit-mode' : 'pan-mode'} ${className}`.trim()}
      onClick={() => {
        selection();
        onToggle();
      }}
      aria-label={mode === 'pan' ? 'Alternar para Modo Edição' : 'Alternar para Modo Panorâmica (Navegar)'}
      aria-pressed={mode === 'edit'}
      title={mode === 'pan' ? 'Modo Navegação (1 dedo pan) — toque para editar' : 'Modo Edição (arrastar pistas) — toque para navegar'}
    >
      {mode === 'pan' ? <Hand size={19} /> : <PenTool size={19} />}
      <span className="fab-toggle-label">{mode === 'pan' ? 'PAN' : 'EDIT'}</span>
    </button>
  );
};

export default InteractionToggleButton;
