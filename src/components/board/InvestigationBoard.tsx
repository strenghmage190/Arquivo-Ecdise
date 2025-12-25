import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../../api/investigations';
import * as connApi from '../../api/connections';
import InvestigationCardModal from '../modals/InvestigationCardModal';
import CreateClueModal from '../modals/CreateClueModal';
import BoardButton from '../tools/BoardButton';
import './investigation.css';

interface Props {
  investigationId: string;
}

export function InvestigationBoard({ investigationId }: Props) {
  const navigate = useNavigate();
  const [cards, setCards] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<any | null>(null);

  const [zoom, setZoom] = useState(1);
  const [origin, setOrigin] = useState({ x: 0, y: 0 });
  const [isGameMaster] = useState(true);
  const [connectionMode, setConnectionMode] = useState(false);
  const [connectionStart, setConnectionStart] = useState<string | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [connectionColor, setConnectionColor] = useState<string>('#9a2b2b');
  const [connectionType, setConnectionType] = useState<'confirmed'|'theory'|'mystic'>('confirmed');
  const [connectionUndoStack, setConnectionUndoStack] = useState<any[]>([]);

  // localPositions used while dragging to avoid frequent re-fetches
  const [localPositions, setLocalPositions] = useState<Record<string, { x: number; y: number }>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const corkboardRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef<any>(null);
  const panningRef = useRef<any>(null);
  const saveTimeouts = useRef<Record<string, ReturnType<typeof setTimeout> | null>>({});

  const loadBoard = async () => {
    try {
      const [cData, connData] = await Promise.all([
        api.fetchCards(investigationId),
        connApi.fetchConnections(investigationId),
      ]);
      setCards(cData || []);
      // initialize localPositions for cards
      setLocalPositions((prev) => {
        const next = { ...prev };
        (cData || []).forEach((c: any) => {
          if (!next[c.id]) next[c.id] = { x: c.x || 100, y: c.y || 100 };
        });
        return next;
      });
      setConnections(connData || []);
    } catch (e) {
      console.error('Erro ao carregar quadro', e);
    }
  };

  useEffect(() => {
    loadBoard();
  }, [investigationId]);

  // Persist on global mouseup (finish drag / pan)
  const handleGlobalMouseUp = async (e: MouseEvent) => {
    if (panningRef.current) {
      panningRef.current = null;
      return;
    }
    if (draggingRef.current) {
      const { id } = draggingRef.current;
      const pos = localPositions[id];
      draggingRef.current = null;
      // immediate save: cancel debounce and persist
      const to = saveTimeouts.current[id];
      if (to) {
        clearTimeout(to as any);
        saveTimeouts.current[id] = null;
      }
      if (pos) {
        try {
          await api.updateCard(id, { x: Math.round(pos.x), y: Math.round(pos.y) });
        } catch (err) {
          console.error('Falha ao salvar posição do card', err);
        }
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
    // intentionally not adding cards to deps; loadBoard will refresh positions
    // and the update handler persists the final position
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investigationId]);

  // TODO: implement pointer/mouse move handlers that update `cards` or a localPositions map
  // Implement global move handlers to update localPositions while dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const p = panningRef.current;
      if (p) {
        const dx = e.clientX - p.startX;
        const dy = e.clientY - p.startY;
        setOrigin({ x: p.originX - dx / zoom, y: p.originY - dy / zoom });
        return;
      }
      const d = draggingRef.current;
      if (!d || !d.id) return;
      const dx = (e.clientX - d.startX) / zoom;
      const dy = (e.clientY - d.startY) / zoom;
      // if multiple selected and the dragged id is part of selection, move all selected
      if (selectedIds.length > 0 && selectedIds.includes(d.id)) {
        setLocalPositions((prev) => {
          const next = { ...prev };
          selectedIds.forEach((sid) => {
            const base = prev[sid] || { x: d.origX, y: d.origY };
            next[sid] = { x: base.x + dx, y: base.y + dy };
          });
          return next;
        });
        // schedule saves for all
        selectedIds.forEach((sid) => scheduleDebouncedSave(sid));
      } else {
        setLocalPositions((prev) => ({ ...prev, [d.id]: { x: d.origX + dx, y: d.origY + dy } }));
        if (d.id) scheduleDebouncedSave(d.id);
      }
      if (connectionMode && connectionStart) setMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
      const p = panningRef.current;
      const t = e.touches[0];
      if (p) {
        const dx = t.clientX - p.startX;
        const dy = t.clientY - p.startY;
        setOrigin({ x: p.originX - dx / zoom, y: p.originY - dy / zoom });
        return;
      }
      const d = draggingRef.current;
      if (!d || !d.id) return;
      const dx = (t.clientX - d.startX) / zoom;
      const dy = (t.clientY - d.startY) / zoom;
      setLocalPositions((prev) => ({ ...prev, [d.id]: { x: d.origX + dx, y: d.origY + dy } }));
      if (connectionMode && connectionStart) setMousePos({ x: t.clientX, y: t.clientY });
      if (d.id) scheduleDebouncedSave(d.id);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove, { passive: false } as any);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom, connectionMode, connectionStart]);

  const scheduleDebouncedSave = useCallback((id: string) => {
    const existing = saveTimeouts.current[id];
    if (existing) return; // already scheduled
    saveTimeouts.current[id] = setTimeout(async () => {
      try {
        const pos = localPositions[id];
        if (pos) await api.updateCard(id, { x: Math.round(pos.x), y: Math.round(pos.y) });
      } catch (err) {
        console.error('Debounced save failed', err);
      } finally {
        saveTimeouts.current[id] = null;
      }
    }, 600);
  }, [localPositions]);

  const clearSelection = () => setSelectedIds([]);

  const toggleSelect = (id: string, additive = false) => {
    setSelectedIds((prev) => {
      if (!additive) return [id];
      if (prev.includes(id)) return prev.filter((p) => p !== id);
      return [...prev, id];
    });
  };

  const onCardClickWhenConnecting = async (cardId: string) => {
    if (!connectionMode) return false;
    if (!connectionStart) {
      setConnectionStart(cardId);
      return true;
    }
    if (connectionStart === cardId) {
      setConnectionStart(null);
      setConnectionMode(false);
      return true;
    }
    try {
      const payload: any = {
        investigation_id: investigationId,
        from_card_id: connectionStart,
        to_card_id: cardId,
        metadata: { type: connectionType },
        color: connectionColor,
      };
      const created = await connApi.createInvestigationConnection(payload);
      setConnections((prev) => [...prev, created]);
      setConnectionUndoStack((s) => [...s, created]);
    } catch (err) {
      console.error('Failed to create connection', err);
    }
    setConnectionStart(null);
    setConnectionMode(false);
    setMousePos(null);
    return true;
  };

  const undoLastConnection = async () => {
    const last = connectionUndoStack[connectionUndoStack.length - 1];
    if (!last) return;
    try {
      await connApi.deleteInvestigationConnection(last.id);
      setConnections((prev) => prev.filter((c) => c.id !== last.id));
      setConnectionUndoStack((s) => s.slice(0, s.length - 1));
    } catch (err) {
      console.error('Failed to undo connection', err);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrl = isMac ? e.metaKey : e.ctrlKey;
      if (ctrl && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (connectionUndoStack.length > 0) undoLastConnection();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [connectionUndoStack]);

  const getCardCenter = (cardId: string | undefined | null) => {
    if (!cardId) return null;
    const pos = localPositions[cardId] || cards.find((c) => c.id === cardId && { x: c.x, y: c.y });
    if (!pos) return null;
    const rectWidth = 220;
    const rectHeight = 160;
    return { x: pos.x + rectWidth / 2, y: pos.y + rectHeight / 2 };
  };

  return (
    <div className="investigation-board">
      <div style={{ position: 'fixed', left: 20, top: 20, zIndex: 1000, display: 'flex', gap: 10 }}>
        <button className="btn-retro" onClick={() => navigate('/')}>← ARQUIVOS</button>
        <div style={{ color: '#fff', alignSelf: 'center', background: '#000', padding: '5px 10px' }}>
          ID: {investigationId.slice(0, 8)}...
        </div>
      </div>

      <div className="investigation-toolbar">
        <BoardButton variant="primary" onClick={() => { setEditingCard(null); setCreateModalOpen(true); }}>+ PISTA</BoardButton>
        <BoardButton onClick={() => setConnectionMode(!connectionMode)}>{connectionMode ? 'CANCELAR CONEXÃO' : 'CONECTAR PISTAS'}</BoardButton>
        {connectionMode && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginLeft: 8 }}>
            <select value={connectionType} onChange={(e) => setConnectionType(e.target.value as any)} style={{ background: 'transparent', color: '#e6d9b3', borderRadius: 6, padding: 6 }}>
              <option value="confirmed">Confirmada</option>
              <option value="theory">Teoria</option>
              <option value="mystic">Mística</option>
            </select>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {['#9a2b2b','#ff8a65','#ffd54f','#7fe0ff','#b39ddb','#ffffff'].map((c) => (
                <div key={c} onClick={() => setConnectionColor(c)} style={{ width: 18, height: 18, borderRadius: 6, background: c, cursor: 'pointer', border: connectionColor === c ? '2px solid #fff' : '1px solid rgba(255,255,255,0.06)' }} />
              ))}
            </div>
            <BoardButton onClick={undoLastConnection} disabled={connectionUndoStack.length === 0}>Undo</BoardButton>
          </div>
        )}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <BoardButton onClick={() => setZoom((z) => Math.max(0.5, z - 0.1))}>−</BoardButton>
          <div style={{ minWidth: 48, textAlign: 'center' }}>{Math.round(zoom * 100)}%</div>
          <BoardButton onClick={() => setZoom((z) => z + 0.1)}>+</BoardButton>
        </div>
      </div>

      <div
        ref={corkboardRef}
        className="corkboard-canvas"
        onMouseDown={(e) => {
          if (e.target === corkboardRef.current || e.target === e.currentTarget) {
            panningRef.current = { startX: e.clientX, startY: e.clientY, originX: origin.x, originY: origin.y };
          }
        }}
      >
        <div
          className="board-transform-layer"
          style={{ transform: `translate(${-origin.x}px, ${-origin.y}px) scale(${zoom})`, transformOrigin: '0 0' }}
        >
          <svg className="connections-layer">
            {connections.map((conn) => {
              const a = getCardCenter(conn.from_card_id);
              const b = getCardCenter(conn.to_card_id);
              if (!a || !b) return null;
              return <line key={conn.id} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(220,80,80,0.9)" strokeWidth={3} />;
            })}
            {connectionMode && connectionStart && mousePos && (() => {
              const a = getCardCenter(connectionStart);
              const board = corkboardRef.current?.getBoundingClientRect();
              if (!a || !board) return null;
              const mx = (mousePos.x - board.left) / zoom + origin.x;
              const my = (mousePos.y - board.top) / zoom + origin.y;
              const stroke = connectionColor || 'rgba(255,255,255,0.8)';
              const dash = connectionType === 'theory' ? '6 6' : connectionType === 'mystic' ? '2 8' : undefined;
              const width = connectionType === 'mystic' ? 2 : 3;
              return <line className="temp-line" x1={a.x} y1={a.y} x2={mx} y2={my} stroke={stroke} strokeWidth={width} strokeDasharray={dash} />;
            })()}
          </svg>

          {cards.map((card) => {
            const pos = localPositions[card.id] || { x: card.x || 100, y: card.y || 100 };
            const isSelected = selectedIds.includes(card.id);
            return (
              <div
                key={card.id}
                className={`card-node ${isSelected ? 'selected' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  const additive = e.shiftKey || e.ctrlKey || e.metaKey;
                  if (!connectionMode) toggleSelect(card.id, additive);
                  const next = { id: card.id, startX: e.clientX, startY: e.clientY, origX: pos.x, origY: pos.y };
                  draggingRef.current = next;
                }}
                onClick={async (ev) => {
                  ev.stopPropagation();
                  if (connectionMode) {
                    const handled = await onCardClickWhenConnecting(card.id);
                    if (handled) return;
                  }
                  // normal click toggles selection (single click selects)
                  if (!ev.shiftKey && !ev.ctrlKey && !ev.metaKey) toggleSelect(card.id, false);
                }}
                onTouchStart={(ev) => {
                  const t = ev.touches[0];
                  const next = { id: card.id, startX: t.clientX, startY: t.clientY, origX: pos.x, origY: pos.y };
                  draggingRef.current = next;
                }}
                onDoubleClick={() => { setEditingCard(card); setModalOpen(true); }}
              >
                <div className="card-photo" style={{ backgroundImage: `url(${card.image_url})` }} />
                <span>{card.title}</span>
              </div>
            );
          })}
        </div>
      </div>

      <CreateClueModal isOpen={createModalOpen} investigationId={investigationId} onClose={() => setCreateModalOpen(false)} onSaved={loadBoard} />

      <InvestigationCardModal open={modalOpen} existing={editingCard} investigationId={investigationId} onClose={() => setModalOpen(false)} onSaved={loadBoard} />
    </div>
  );
}

export default InvestigationBoard;
