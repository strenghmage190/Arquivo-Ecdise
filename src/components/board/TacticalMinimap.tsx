import React, { useMemo, useRef, useState, useCallback } from 'react';
import { ChevronDown, ChevronUp, Crosshair, Maximize2, Radar } from 'lucide-react';
import './TacticalMinimap.css';

export interface TacticalMinimapProps {
  cards: any[];
  localPositions: Record<string, { x: number; y: number }>;
  selectedIds: string[];
  origin: { x: number; y: number };
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  isGameMaster: boolean;
  playerView: boolean;
  showHiddenClues: boolean;
  performanceMode?: boolean;
  isOpen?: boolean;
  onToggleOpen?: () => void;
  onNavigate: (worldX: number, worldY: number) => void;
  onZoomToFit: () => void;
}

const CARD_W = 244;
const CARD_H = 286;
const MAP_W = 196;
const MAP_H = 128;
const WORLD_PAD = 320;

const STATUS_COLORS: Record<string, string> = {
  verified: '#2ecc71',
  theory: '#f59e0b',
  false: '#e63946',
};

export const TacticalMinimap: React.FC<TacticalMinimapProps> = ({
  cards,
  localPositions,
  selectedIds,
  origin,
  zoom,
  viewportWidth,
  viewportHeight,
  isGameMaster,
  playerView,
  showHiddenClues,
  performanceMode = false,
  isOpen: controlledOpen,
  onToggleOpen,
  onNavigate,
  onZoomToFit,
}) => {
  const [internalOpen, setInternalOpen] = useState(true);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const toggleOpen = onToggleOpen || (() => setInternalOpen((v) => !v));

  const svgRef = useRef<SVGSVGElement | null>(null);
  const draggingRef = useRef(false);

  // SEGURANÇA ESTRITA: nunca expor pistas is_hidden para jogadores nem em playerView
  const canSeeHidden = isGameMaster && !playerView && showHiddenClues;

  const visibleCards = useMemo(() => {
    return (cards || []).filter((c) => {
      if (!c) return false;
      if (c.is_hidden && !canSeeHidden) return false;
      return true;
    });
  }, [cards, canSeeHidden]);

  const bounds = useMemo(() => {
    const viewWorldW = viewportWidth / Math.max(zoom, 0.1);
    const viewWorldH = viewportHeight / Math.max(zoom, 0.1);

    let minX = origin.x;
    let minY = origin.y;
    let maxX = origin.x + viewWorldW;
    let maxY = origin.y + viewWorldH;

    visibleCards.forEach((c) => {
      const pos = localPositions[c.id] || { x: c.x ?? 100, y: c.y ?? 100 };
      minX = Math.min(minX, pos.x);
      minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + CARD_W);
      maxY = Math.max(maxY, pos.y + CARD_H);
    });

    minX -= WORLD_PAD;
    minY -= WORLD_PAD;
    maxX += WORLD_PAD;
    maxY += WORLD_PAD;

    const worldW = Math.max(1200, maxX - minX);
    const worldH = Math.max(800, maxY - minY);
    const scale = Math.min(MAP_W / worldW, MAP_H / worldH);
    const offsetX = (MAP_W - worldW * scale) / 2;
    const offsetY = (MAP_H - worldH * scale) / 2;

    return { minX, minY, worldW, worldH, scale, offsetX, offsetY, viewWorldW, viewWorldH };
  }, [visibleCards, localPositions, origin.x, origin.y, zoom, viewportWidth, viewportHeight]);

  const navigateFromClient = useCallback(
    (clientX: number, clientY: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const sx = ((clientX - rect.left) / rect.width) * MAP_W;
      const sy = ((clientY - rect.top) / rect.height) * MAP_H;
      const worldX = bounds.minX + (sx - bounds.offsetX) / bounds.scale;
      const worldY = bounds.minY + (sy - bounds.offsetY) / bounds.scale;
      onNavigate(worldX, worldY);
    },
    [bounds, onNavigate]
  );

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.stopPropagation();
    draggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    navigateFromClient(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    e.stopPropagation();
    navigateFromClient(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const toMapX = (wx: number) => bounds.offsetX + (wx - bounds.minX) * bounds.scale;
  const toMapY = (wy: number) => bounds.offsetY + (wy - bounds.minY) * bounds.scale;

  const camX = toMapX(origin.x);
  const camY = toMapY(origin.y);
  const camW = Math.max(10, bounds.viewWorldW * bounds.scale);
  const camH = Math.max(8, bounds.viewWorldH * bounds.scale);

  return (
    <aside
      className={`tactical-minimap ${isOpen ? 'open' : 'collapsed'} ${performanceMode ? 'performance-mode' : ''}`}
      aria-label="Minimapa Tático do Quadro"
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      <div className="tactical-minimap-header">
        <button
          type="button"
          className="minimap-toggle-btn"
          onClick={toggleOpen}
          aria-expanded={isOpen}
          aria-label={isOpen ? 'Recolher minimapa' : 'Expandir minimapa'}
        >
          <Radar size={13} />
          <span>RADAR</span>
          <span className="minimap-count tabular-nums">{visibleCards.length}</span>
          {isOpen ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
        </button>

        <button
          type="button"
          className="minimap-fit-btn"
          onClick={onZoomToFit}
          title="Enquadrar Tudo (Zoom to Fit)"
          aria-label="Enquadrar todas as pistas"
        >
          <Maximize2 size={12} />
        </button>
      </div>

      {isOpen && (
        <div className="tactical-minimap-body">
          <svg
            ref={svgRef}
            className="tactical-minimap-svg"
            viewBox={`0 0 ${MAP_W} ${MAP_H}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            role="application"
            aria-label="Mapa tático clicável das evidências"
          >
            {/* Grade sutil de radar */}
            <g className="minimap-grid" aria-hidden="true">
              <line x1={MAP_W / 2} y1={0} x2={MAP_W / 2} y2={MAP_H} />
              <line x1={0} y1={MAP_H / 2} x2={MAP_W} y2={MAP_H / 2} />
            </g>

            {/* Cards visíveis por status */}
            {visibleCards.map((c) => {
              const pos = localPositions[c.id] || { x: c.x ?? 100, y: c.y ?? 100 };
              const x = toMapX(pos.x);
              const y = toMapY(pos.y);
              const w = Math.max(4, CARD_W * bounds.scale);
              const h = Math.max(4, CARD_H * bounds.scale);
              const status = c?.metadata?.status || '';
              const fill = STATUS_COLORS[status] || (c.is_hidden ? '#a855f7' : '#64748b');
              const isSelected = selectedIds.includes(c.id);
              return (
                <rect
                  key={c.id}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={1}
                  fill={fill}
                  fillOpacity={c.is_hidden ? 0.55 : 0.9}
                  stroke={isSelected ? '#38bdf8' : 'none'}
                  strokeWidth={isSelected ? 1.5 : 0}
                />
              );
            })}

            {/* Retângulo da câmera */}
            <rect
              className="minimap-viewport-rect"
              x={camX}
              y={camY}
              width={camW}
              height={camH}
              rx={1}
            />
          </svg>

          <div className="tactical-minimap-footer">
            <span className="minimap-zoom-readout tabular-nums">
              <Crosshair size={10} /> {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className="minimap-fit-text-btn"
              onClick={onZoomToFit}
            >
              ENQUADRAR
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default TacticalMinimap;
