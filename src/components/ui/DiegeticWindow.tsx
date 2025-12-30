import React, { useState } from 'react';
import './DiegeticWindow.css';

interface Props {
  title?: string;
  onClose?: () => void;
  children?: React.ReactNode;
  className?: string;
}

export default function DiegeticWindow({ title, onClose, children, className }: Props) {
  const [minimized, setMinimized] = useState(false);

  if (minimized) {
    return (
      <div className="diegetic-minibar" onClick={() => setMinimized(false)}>
        <div className="mini-title">{title || 'APP'}</div>
      </div>
    );
  }

  return (
    <div className={`diegetic-window ${className || ''}`} role="dialog">
      <div className="diegetic-titlebar">
        <div className="title-left">{title || 'APP'}</div>
        <div className="title-controls">
          <button className="ctrl-btn" onClick={() => setMinimized(true)} title="Minimizar">—</button>
          <button className="ctrl-btn close" onClick={() => onClose && onClose()} title="Fechar">✕</button>
        </div>
      </div>
      <div className="diegetic-body">{children}</div>
    </div>
  );
}
