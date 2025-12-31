import React from 'react';
import './Desktop.css';
import SystemTerminal from '../tools/SystemTerminal';
import FileExplorer from '../tools/FileExplorer';
import NetUplink from '../tools/NetUplink';

export default function Desktop({ cases }: { cases: any[] }) {
  const [openWindow, setOpenWindow] = React.useState<string | null>(null);
  const navigateToCase = (id?: string) => {
    if (!id) return;
    window.location.href = `/case/${String(id).split(':')[0]}`;
  };

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent;
      if (ce && ce.detail && ce.detail.window) setOpenWindow(String(ce.detail.window));
    };
    window.addEventListener('open-desktop-window', handler as EventListener);
    return () => window.removeEventListener('open-desktop-window', handler as EventListener);
  }, []);

  return (
    <div className="desktop-root">
      {/* Desktop icons moved to HUD for compactness */}

      {openWindow === 'files' && <FileExplorer onClose={() => setOpenWindow(null)} />}
      {openWindow === 'net' && <NetUplink onClose={() => setOpenWindow(null)} />}
      {openWindow === 'terminal' && (
        <SystemTerminal
          isOpen={true}
          onClose={() => setOpenWindow(null)}
          cards={cases || []}
          onOpenCard={(c: any) => { if (c && c.id) navigateToCase(c.id); }}
        />
      )}
    </div>
  );
}
