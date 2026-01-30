import React from 'react';
import ReactDOM from 'react-dom';
import './BottomNavigationBar.css';

// Definição clara das ferramentas disponíveis no mobile
const MOBILE_TOOLS = [
  { id: 'create', icon: '⚙️', label: 'Criar', gmOnly: true },
  { id: 'connect', icon: '🔗', label: 'Conectar' },
  { id: 'terminal', icon: '🖥️', label: 'Console' },
  { id: 'search', icon: '🔍', label: 'Buscar' },
  { id: 'uv', icon: '🔦', label: 'Luz UV' },
  { id: 'organize', icon: '🗂️', label: 'Organizar' },
  { id: 'reset-cam', icon: '🎯', label: 'Focar' },
  { id: 'decoder', icon: '🔐', label: 'Decodificar' },
  { id: 'undo', icon: '↩', label: 'Desfazer' },
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
          <button type="button" className="close-btn" onClick={closeSheet} aria-label="Fechar ferramentas">✖</button>
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
          <svg className="icon" viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" fill="currentColor"/></svg>
          <span>Início</span>
        </button>
        
        <button type="button" className="nav-item active">
          <svg className="icon" viewBox="0 0 24 24"><path d="M12 2L2 22h20L12 2zm0 3.5L18.5 19H5.5L12 5.5z" fill="currentColor"/></svg>
          <span>Quadro</span>
        </button>

        <button 
          ref={toggleBtnRef}
          type="button"
          className={`nav-item ${showMore ? 'active-tab' : ''}`} 
          onClick={() => { console.debug('BottomNav: toggle showMore ->', !showMore); setShowMore((s) => !s); }}
          aria-expanded={showMore}
        >
          <svg className="icon" viewBox="0 0 24 24"><path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" fill="currentColor"/></svg>
          <span>Ferramentas</span>
        </button>
      </nav>
    </>
  );
};

export default BottomNavigationBar;