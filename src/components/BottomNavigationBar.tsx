import {
  BoxSelect,
  Flashlight,
  Grid,
  House,
  LayoutPanelTop,
  Link2,
  LocateFixed,
  Lock,
  Maximize2,
  MoreHorizontal,
  Plus,
  Radar,
  Redo2,
  Search,
  Terminal,
  Undo2,
  X,
  Zap,
} from 'lucide-react';
import React from 'react';
import ReactDOM from 'react-dom';
import { useHaptics } from '../hooks/useHaptics';
import './BottomNavigationBar.css';

interface MobileToolDef {
  id: string;
  icon: React.ReactNode;
  label: string;
  tooltip: string;
  gmOnly?: boolean;
}

const MOBILE_TOOL_GROUPS: Array<{ id: string; label: string; tools: MobileToolDef[] }> = [
  {
    id: 'creation-vision',
    label: 'Criação & Câmera',
    tools: [
      { id: 'create', icon: <Plus size={19} />, label: 'Criar', tooltip: 'Criar nova evidência', gmOnly: true },
      { id: 'fit-view', icon: <Maximize2 size={19} />, label: 'Enquadrar', tooltip: 'Enquadrar todas as pistas (Zoom to Fit)' },
      { id: 'reset-cam', icon: <LocateFixed size={19} />, label: 'Reset 100%', tooltip: 'Resetar câmera para 100%' },
      { id: 'minimap', icon: <Radar size={19} />, label: 'Minimapa', tooltip: 'Alternar Minimapa Tático' },
    ],
  },
  {
    id: 'connections-layers',
    label: 'Conexões & Quadro',
    tools: [
      { id: 'connect', icon: <Link2 size={19} />, label: 'Conectar', tooltip: 'Conectar pistas com fios' },
      { id: 'marquee', icon: <BoxSelect size={19} />, label: 'Seleção', tooltip: 'Seleção em área (Marquee)' },
      { id: 'uv', icon: <Flashlight size={19} />, label: 'Luz UV', tooltip: 'Alternar Luz Ultravioleta (UV)' },
      { id: 'organize', icon: <LayoutPanelTop size={19} />, label: 'Organizar', tooltip: 'Organizar pistas no quadro' },
      { id: 'snap-grid', icon: <Grid size={19} />, label: 'Grade', tooltip: 'Alternar Snap to Grid' },
    ],
  },
  {
    id: 'search-history',
    label: 'Busca, C.R.I.S. & Histórico',
    tools: [
      { id: 'search', icon: <Search size={19} />, label: 'Buscar', tooltip: 'Buscar pistas no quadro' },
      { id: 'terminal', icon: <Terminal size={19} />, label: 'C.R.I.S.', tooltip: 'Abrir Terminal C.R.I.S.' },
      { id: 'decoder', icon: <Lock size={19} />, label: 'Decoder', tooltip: 'Decodificador de texto' },
      { id: 'undo', icon: <Undo2 size={19} />, label: 'Desfazer', tooltip: 'Desfazer última alteração' },
      { id: 'redo', icon: <Redo2 size={19} />, label: 'Refazer', tooltip: 'Refazer última alteração' },
    ],
  },
  {
    id: 'settings-performance',
    label: 'Sistema',
    tools: [
      { id: 'performance', icon: <Zap size={19} />, label: 'Desempenho', tooltip: 'Alternar Modo Performance' },
    ],
  },
];

interface BottomNavigationBarProps {
  isGameMaster?: boolean;
  activeTools?: Record<string, boolean>;
  onGoHome?: () => void;
}

const BottomNavigationBar: React.FC<BottomNavigationBarProps> = ({
  isGameMaster = false,
  activeTools = {},
  onGoHome,
}) => {
  const [showMore, setShowMore] = React.useState(false);
  const toggleBtnRef = React.useRef<HTMLButtonElement | null>(null);
  const firstToolRef = React.useRef<HTMLButtonElement | null>(null);
  const { selection } = useHaptics();

  const closeSheet = React.useCallback(() => {
    try {
      const active = document.activeElement as HTMLElement | null;
      if (active && (active.tagName === 'BUTTON' || active.tagName === 'INPUT' || active.tagName === 'A')) {
        active.blur();
      }
    } catch {
      // ignore
    }
    setShowMore(false);
    setTimeout(() => {
      try {
        toggleBtnRef.current?.focus();
      } catch {
        // ignore
      }
    }, 0);
  }, []);

  React.useEffect(() => {
    if (showMore) {
      setTimeout(() => {
        try {
          firstToolRef.current?.focus();
        } catch {
          // ignore
        }
      }, 0);
      const onKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') closeSheet();
      };
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
    return undefined;
  }, [showMore, closeSheet]);

  const triggerTool = (toolId: string) => {
    selection();
    try {
      const anyWin = window as any;
      if (typeof anyWin.handleInvestigationTool === 'function') {
        anyWin.handleInvestigationTool(toolId);
        closeSheet();
        return;
      }
    } catch {
      // fallback below
    }

    try {
      const event = new CustomEvent('investigation:tool', {
        detail: toolId,
        bubbles: true,
        composed: true,
      });
      window.dispatchEvent(event);
    } catch {
      // ignore
    }
    closeSheet();
  };

  const visibleGroups = MOBILE_TOOL_GROUPS
    .map((group) => ({
      ...group,
      tools: group.tools.filter((t) => !(t.gmOnly && !isGameMaster)),
    }))
    .filter((group) => group.tools.length > 0);
  let renderedToolIndex = 0;

  const sheet = (
    <>
      {showMore && (
        <div
          className="mobile-menu-overlay"
          onClick={closeSheet}
          tabIndex={-1}
          aria-hidden={!showMore}
        />
      )}

      <div
        id="mobile-tools-sheet"
        className={`mobile-tools-sheet ${showMore ? 'open' : ''}`}
        role="dialog"
        aria-hidden={!showMore}
        aria-modal={showMore}
        aria-labelledby="mobile-tools-title"
        onKeyDown={(e) => {
          if (e.key === 'Escape') closeSheet();
        }}
      >
        <div className="mobile-sheet-header">
          <span id="mobile-tools-title">FERRAMENTAS DO QUADRO</span>
          <button
            type="button"
            className="close-btn"
            onClick={closeSheet}
            aria-label="Fechar ferramentas"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mobile-tools-groups">
          {visibleGroups.map((group) => (
            <div key={group.id} className="mobile-tools-group">
              <div className="mobile-tools-group-label">{group.label}</div>
              <div className="mobile-tools-grid">
                {group.tools.map((tool) => {
                  const isFirst = renderedToolIndex === 0;
                  renderedToolIndex += 1;
                  const isActive = Boolean(activeTools[tool.id]);
                  return (
                    <button
                      key={tool.id}
                      ref={isFirst ? firstToolRef : undefined}
                      type="button"
                      className={`mobile-tool-btn ${isActive ? 'is-active' : ''}`}
                      onClick={() => triggerTool(tool.id)}
                      title={tool.tooltip}
                      aria-label={tool.tooltip || tool.label}
                      aria-pressed={isActive}
                    >
                      <span className="tool-icon">{tool.icon}</span>
                      <span className="tool-label">{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );

  return (
    <>
      {typeof document !== 'undefined' && ReactDOM.createPortal(sheet, document.body)}

      <nav className="mobile-bottom-bar" aria-label="Navegação Mobile">
        <button
          type="button"
          className="nav-item"
          onClick={() => {
            selection();
            if (onGoHome) {
              onGoHome();
            } else {
              window.location.href = '/';
            }
          }}
        >
          <House className="icon" size={20} />
          <span>Início</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTools.search ? 'active-tab' : ''}`}
          onClick={() => triggerTool('search')}
        >
          <Search className="icon" size={20} />
          <span>Buscar</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTools.uv ? 'active-tab' : ''}`}
          onClick={() => triggerTool('uv')}
        >
          <Flashlight className="icon" size={20} />
          <span>Luz UV</span>
        </button>

        <button
          ref={toggleBtnRef}
          type="button"
          className={`nav-item ${showMore ? 'active-tab' : ''}`}
          onClick={() => {
            selection();
            setShowMore((s) => !s);
          }}
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
