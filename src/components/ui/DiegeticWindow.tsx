import React, { useEffect, useId, useState } from 'react';
import { Minus, X } from 'lucide-react';
import './DiegeticWindow.css';

export interface DiegeticWindowProps {
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
  extraHeaderContent?: React.ReactNode;
}

export default function DiegeticWindow({
  title,
  onClose,
  children,
  className,
  extraHeaderContent,
}: DiegeticWindowProps) {
  const [minimized, setMinimized] = useState(false);
  const titleId = useId();

  useEffect(() => {
    if (!onClose || minimized) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, minimized]);

  if (minimized) {
    return (
      <button
        type="button"
        className="diegetic-minibar"
        onClick={() => setMinimized(false)}
        aria-label={`Restaurar ${title || 'APP'}`}
      >
        <span className="mini-title">{title || 'APP'}</span>
      </button>
    );
  }

  return (
    <div
      className={`diegetic-window ${className || ''}`.trim()}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="diegetic-titlebar">
        <div id={titleId} className="title-left">
          {title || 'APP'}
        </div>
        {extraHeaderContent && <div className="title-extra">{extraHeaderContent}</div>}
        <div className="title-controls">
          <button
            type="button"
            className="ctrl-btn"
            onClick={() => setMinimized(true)}
            title="Minimizar"
            aria-label="Minimizar janela"
          >
            <Minus size={14} />
          </button>
          <button
            type="button"
            className="ctrl-btn close"
            onClick={() => onClose && onClose()}
            title="Fechar"
            aria-label="Fechar janela"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="diegetic-body">{children}</div>
    </div>
  );
}
