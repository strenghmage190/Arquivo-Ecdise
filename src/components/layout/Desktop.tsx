import React from 'react';
import './Desktop.css';
import SystemTerminal from '../tools/SystemTerminal';

export default function Desktop({ cases }: { cases: any[] }) {
  const [termOpen, setTermOpen] = React.useState(false);
  const navigateToCase = (id?: string) => {
    if (!id) return;
    window.location.href = `/case/${String(id).split(':')[0]}`;
  };

  return (
    <div className="desktop-root">
      <div className="desktop-icons">
        <div className="desktop-icon" onDoubleClick={() => navigateToCase(cases?.[0]?.id)} title="📁 CASOS_ARQUIVADOS">
          <div className="icon-emoji">📁</div>
          <div className="icon-label">CASOS_ARQUIVADOS</div>
        </div>

        <div className="desktop-icon" onClick={() => setTermOpen(true)} title="C.R.I.S_CONSOLE.EXE">
          <div className="icon-emoji">💀</div>
          <div className="icon-label">C.R.I.S_CONSOLE.EXE</div>
        </div>

        <div className="desktop-icon" onDoubleClick={() => alert('Abrir conexão remota...')} title="📡 CONEXÃO_REMOTA">
          <div className="icon-emoji">📡</div>
          <div className="icon-label">CONEXÃO_REMOTA</div>
        </div>
      </div>

      {termOpen && (
        <SystemTerminal
          isOpen={termOpen}
          onClose={() => setTermOpen(false)}
          cards={cases || []}
          onOpenCard={(c: any) => { if (c && c.id) navigateToCase(c.id); }}
        />
      )}
    </div>
  );
}
