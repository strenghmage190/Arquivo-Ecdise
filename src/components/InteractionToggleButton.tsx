import { Hand, PenTool } from 'lucide-react';
import React from 'react';
import './InteractionToggleButton.css';

interface InteractionToggleButtonProps {
  mode: 'pan' | 'edit';
  onToggle: () => void;
  className?: string;
}

const InteractionToggleButton: React.FC<InteractionToggleButtonProps> = ({ mode, onToggle, className = '' }) => {
  return (
    <button
      type="button"
      className={`fab-toggle-mode ${mode === 'edit' ? 'edit-mode' : 'pan-mode'} ${className}`.trim()}
      onClick={onToggle}
      aria-label={mode === 'pan' ? 'Alternar para Modo Edição' : 'Alternar para Modo Panorâmica (Navegar)'}
      title={mode === 'pan' ? 'Modo Navegação (toque para editar)' : 'Modo Edição (toque para navegar)'}
    >
      {mode === 'pan' ? <Hand size={20} /> : <PenTool size={20} />}
    </button>
  );
};

export default InteractionToggleButton;