import { Settings, Search, Lock, Monitor, Home, ClipboardList, MoreHorizontal, X, Link2, Terminal, Flashlight, FolderTree, Crosshair, Undo2 } from 'lucide-react';
import React from 'react';
import ReactDOM from 'react-dom';
import './BottomNavigationBar.css';

const MOBILE_TOOLS = [
  { id: 'create', icon: Settings, label: 'Criar', gmOnly: true },
  { id: 'connect', icon: Link2, label: 'Conectar' },
  { id: 'terminal', icon: Terminal, label: 'Console' },
  { id: 'search', icon: Search, label: 'Buscar' },
  { id: 'uv', icon: Flashlight, label: 'Luz UV' },
  { id: 'organize', icon: FolderTree, label: 'Organizar' },
  { id: 'reset-cam', icon: Crosshair, label: 'Focar' },
  { id: 'decoder', icon: Lock, label: 'Decodificar' },
  { id: 'undo', icon: Undo2, label: 'Desfazer' },
];

const BottomNavigationBar: React.FC<{ isGameMaster?: boolean }> = ({ isGameMaster = false }) => {
  const [showMore, setShowMore] = React.useState(false);
  const toggleBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const firstToolRef = React.useRef<HTMLButtonElement | null>(null);

  const closeSheet = React.useCallback(() => {
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'BUTTON' || active.tagName === 'INPUT' || active.tagName === 'A')) {
        active.blur();
      }
    } catch (e) {}
    setShowMore(false);
    setTimeout(() => { try { toggleBtnRef.current?.focus(); } catch (e) {} }, 0);
  }, []);

  React.useEffect(() => {
    if (showMore) {
      setTimeout(() => { try { firstToolRef.current?.focus(); } catch (e) {} }, 0);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeSheet(); } };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [showMore, closeSheet]);

  const triggerTool = (toolId: string) => {
    try {
      const anyWin = window as any;
      if (typeof anyWin.handleInvestigationTool === 'function') {
        anyWin.handleInvestigationTool(toolId);
        try { closeSheet(); } catch (err) { /* ignore */ }
        return;
      }
    } catch (e) {
      console.warn('BottomNav: global handler call failed', e);
    }

    try {
      const event = new CustomEvent('investigation:tool', { detail: toolId, bubbles: true, composed: true });
      window.dispatchEvent(event);
    } catch (e) {
      console.warn('BottomNav: dispatch event failed', e);
    }

    try { closeSheet(); } catch (err) { /* ignore in edge cases */ }
  };

  const visibleTools = MOBILE_TOOLS.filter((t) => !(t.gmOnly && !isGameMaster));

  const sheet = (
    <>
      {showMore && (
        <div className="mobile-menu-overlay" onClick={closeSheet} tabIndex={-1} aria-hidden={!showMore} />
      )}

      <div
        id="mobile-tools-sheet"
        className={`mobile-tools-sheet ${showMore ? 'open' : ''}`}
        role="dialog"
        aria-hidden={!showMore}
        aria-modal={showMore}
        aria-labelledby="mobile-tools-title"
        onKeyDown={(e) => { if (e.key === 'Escape') closeSheet(); }}
      >
        <div className="mobile-sheet-header">
          <span id="mobile-tools-title">FERRAMENTAS</span>
          <button type="button" className="close-btn" onClick={closeSheet} aria-label="Fechar ferramentas">
            <X size={16} />
          </button>
        </div>

        <div className="mobile-tools-grid">
          {visibleTools.map((tool, idx) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.id}
                ref={idx === 0 ? firstToolRef : undefined}
                type="button"
                className="mobile-tool-btn"
                onClick={() => { triggerTool(tool.id); }}
                aria-label={tool.label}
              >
                <span className="tool-icon"><Icon size={20} /></span>
                <span className="tool-label">{tool.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <>
      {typeof document !== 'undefined' && ReactDOM.createPortal(sheet, document.body)}

      <nav className="mobile-bottom-bar">
        <button type="button" className="nav-item" onClick={() => window.location.href = '/'}>
          <Home size={20} />
          <span>Início</span>
        </button>

        <button type="button" className="nav-item active">
          <ClipboardList size={20} />
          <span>Quadro</span>
        </button>

        <button
          ref={toggleBtnRef}
          type="button"
          className={`nav-item ${showMore ? 'active-tab' : ''}`}
          onClick={() => { setShowMore((s) => !s); }}
          aria-expanded={showMore}
        >
          <MoreHorizontal size={20} />
          <span>Ferramentas</span>
        </button>
      </nav>
    </>
  );
};

export default BottomNavigationBar;
