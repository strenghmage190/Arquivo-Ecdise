import { Flashlight, FolderOpen, House, LayoutPanelTop, Link2, LocateFixed, Lock, Menu, MoreHorizontal, Search, Settings, Terminal, Undo2, X } from 'lucide-react';
import React from 'react';
import ReactDOM from 'react-dom';
import './BottomNavigationBar.css';

// Definição clara das ferramentas disponíveis no mobile
const MOBILE_TOOLS = [
  { id: 'create', icon: <Settings size={20} />, label: 'Criar', gmOnly: true },
  { id: 'connect', icon: <Link2 size={20} />, label: 'Conectar' },
  { id: 'terminal', icon: <Terminal size={20} />, label: 'Console' },
  { id: 'search', icon: <Search size={20} />, label: 'Buscar' },
  { id: 'uv', icon: <Flashlight size={20} />, label: 'Luz UV' },
  { id: 'organize', icon: <LayoutPanelTop size={20} />, label: 'Organizar' },
  { id: 'reset-cam', icon: <LocateFixed size={20} />, label: 'Focar' },
  { id: 'decoder', icon: <Lock size={20} />, label: 'Decodificar' },
  { id: 'undo', icon: <Undo2 size={20} />, label: 'Desfazer' },
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
    // give browser a tick to update aria-hidden then focus the toggle
    setTimeout(() => { try { toggleBtnRef.current?.focus(); } catch (e) {} }, 0);
  }, []);

  // focus first tool when sheet opens; handle Escape to close
  React.useEffect(() => {
    if (showMore) {
      setTimeout(() => { try { firstToolRef.current?.focus(); } catch (e) {} }, 0);
      const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { closeSheet(); } };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [showMore, closeSheet]);

  React.useEffect(() => {
    console.debug('BottomNav: showMore state', showMore);
  }, [showMore]);

  // Função disparadora de eventos
  const triggerTool = (toolId: string) => {
    console.debug('BottomNav: triggerTool', toolId);
    // Primeiro tente a função global exposta (garante entrega quando o evento pode chegar antes do listener)
    try {
      const anyWin = window as any;
      if (typeof anyWin.handleInvestigationTool === 'function') {
        anyWin.handleInvestigationTool(toolId);
        try { closeSheet(); } catch (err) { /* ignore */ }
        return;
      }
    } catch (e) {
      // não crítico
      // eslint-disable-next-line no-console
      console.warn('BottomNav: global handler call failed', e);
    }

    // Fallback: dispare o evento que o InvestigationBoard também escuta
    try {
      const event = new CustomEvent('investigation:tool', { detail: toolId, bubbles: true, composed: true });
      window.dispatchEvent(event);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('BottomNav: dispatch event failed', e);
    }

    // Fecha o menu após clicar (opcional)
    try { closeSheet(); } catch (err) { /* ignore in edge cases */ }
  };

  // Build sheet/overlay as portal so it's not clipped by parent containers
  const visibleTools = MOBILE_TOOLS.filter((t) => !(t.gmOnly && !isGameMaster));

  const sheet = (
    <>
      {/* Overlay Escuro quando menu está aberto */}
      {showMore && (
        <div className="mobile-menu-overlay" onClick={closeSheet} tabIndex={-1} aria-hidden={!showMore} />
      )}

      {/* Menu Gaveta (Bottom Sheet) */}
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
          <button type="button" className="close-btn" onClick={closeSheet} aria-label="Fechar ferramentas"><X size={16} /></button>
        </div>

        <div className="mobile-tools-grid">
          {visibleTools.map((tool, idx) => (
            <button
              key={tool.id}
              ref={idx === 0 ? firstToolRef : undefined}
              type="button"
              className="mobile-tool-btn"
              onClick={() => { console.debug('BottomNav: click tool', tool.id); triggerTool(tool.id); }}
              aria-label={tool.label}
            >
              <span className="tool-icon">{tool.icon}</span>
              <span className="tool-label">{tool.label}</span>
            </button>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Render sheet into body to avoid clipping */}
      {typeof document !== 'undefined' && ReactDOM.createPortal(sheet, document.body)}

      {/* Barra de Navegação Fixa */}
      <nav className="mobile-bottom-bar">
        <button type="button" className="nav-item" onClick={() => window.location.href = '/'}>
          <House className="icon" size={20} />
          <span>Início</span>
        </button>
        
        <button type="button" className="nav-item active">
          <LayoutPanelTop className="icon" size={20} />
          <span>Quadro</span>
        </button>

        <button 
          ref={toggleBtnRef}
          type="button"
          className={`nav-item ${showMore ? 'active-tab' : ''}`} 
          onClick={() => { console.debug('BottomNav: toggle showMore ->', !showMore); setShowMore((s) => !s); }}
          aria-expanded={showMore}
        >
          <MoreHorizontal className="icon" size={20} />
          <span>Ferramentas</span>
        </button>
      </nav>
    </>
  );
};

export default BottomNavigationBar;
