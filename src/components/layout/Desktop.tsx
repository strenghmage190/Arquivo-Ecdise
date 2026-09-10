import React from 'react';
import './Desktop.css';
import SystemTerminal from '../tools/SystemTerminal';
import FileExplorer from '../tools/FileExplorer';
import NetUplink from '../tools/NetUplink';

const SIGIL_ELEMENTS = ['sangue', 'morte', 'conhecimento', 'energia', 'medo'] as const;
const SIGIL_GLYPHS = ['A', 'S', 'R', 'N', 'V', 'O', 'X', 'E', 'K', 'M', 'T', 'C'];
const FALLING_SIGILS = Array.from({ length: 64 }, (_, index) => ({
  id: `sigil-${index}`,
  element: SIGIL_ELEMENTS[index % SIGIL_ELEMENTS.length],
  glyph: Array.from({ length: 5 + (index % 8) }, (_, glyphIndex) => SIGIL_GLYPHS[(index + glyphIndex * 3) % SIGIL_GLYPHS.length]).join('\n'),
  left: `${(index * 37 + 5) % 100}%`,
  top: `${-18 + ((index * 23) % 118)}vh`,
  delay: `${-((index * 2.1) % 24)}s`,
  duration: `${9 + (index % 9) * 1.15}s`,
  drift: `${(index % 2 === 0 ? 1 : -1) * (12 + (index % 6) * 8)}px`,
  size: `${14 + (index % 4) * 5}px`,
  font: index % 3 === 0 ? 'sigil-sinais' : 'sigil-estrangeiro',
}));

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

  React.useEffect(() => {
    if (openWindow) {
      window.dispatchEvent(new Event('modal-opened'));
    } else {
      window.dispatchEvent(new Event('modal-closed'));
    }
  }, [openWindow]);

  return (
    <div className="desktop-root">
      <div className="falling-sigils" aria-hidden="true">
        {FALLING_SIGILS.map((sigil) => (
          <span
            key={sigil.id}
            className={`falling-sigil falling-sigil-${sigil.element} ${sigil.font}`}
            style={{
              '--sigil-left': sigil.left,
              '--sigil-top': sigil.top,
              '--sigil-delay': sigil.delay,
              '--sigil-duration': sigil.duration,
              '--sigil-drift': sigil.drift,
              '--sigil-size': sigil.size,
            } as React.CSSProperties}
          >
            {sigil.glyph}
          </span>
        ))}
      </div>

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
