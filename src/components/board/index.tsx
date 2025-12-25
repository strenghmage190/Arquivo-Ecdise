import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchInvestigationById, fetchCardsForInvestigation, updateInvestigationCard } from '../../api/investigations';
import { fetchConnectionsForInvestigation } from '../../api/connections';
import { CreateClueModal, InvestigationCardModal } from '../modals';

type Card = any;
type Connection = any;

export default function InvestigationBoard() {
  const { id } = useParams();
  const [investigation, setInvestigation] = useState<any | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const dragRef = useRef<{ id: string; offsetX: number; offsetY: number } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Undo/redo stacks (store map of id -> {x,y})
  const undoStack = useRef<Array<Record<string, { x: number; y: number }>>>([]);
  const redoStack = useRef<Array<Record<string, { x: number; y: number }>>>([]);

  // Debounce timers for saving positions
  const saveTimers = useRef<Record<string, number>>({});

  function pushSnapshot() {
    const snap: Record<string, { x: number; y: number }> = {};
    for (const c of cards) snap[c.id] = { x: c.x ?? 0, y: c.y ?? 0 };
    undoStack.current.push(snap);
    // limit stack
    if (undoStack.current.length > 50) undoStack.current.shift();
    redoStack.current = [];
    // persist stacks to localStorage
    try {
      if (id) {
        localStorage.setItem(`board_undo_${id}`, JSON.stringify(undoStack.current));
        localStorage.setItem(`board_redo_${id}`, JSON.stringify(redoStack.current));
      }
    } catch (e) {
      // ignore
    }
  }

  function applySnapshot(snap: Record<string, { x: number; y: number }>) {
    setCards((prev) => prev.map((c) => (snap[c.id] ? { ...c, x: snap[c.id].x, y: snap[c.id].y } : c)));
  }

  async function persistPositions(ids: string[]) {
    // Persist multiple card positions
    await Promise.all(ids.map(async (id) => {
      const card = cards.find((c) => c.id === id);
      if (!card) return;
      try {
        await updateInvestigationCard(id, { x: card.x ?? 0, y: card.y ?? 0 });
      } catch (e) {
        console.error('Erro ao persistir posição do card', id, e);
      }
    }));
  }

  function schedulePersist(id: string) {
    // debounce 600ms
    if (saveTimers.current[id]) window.clearTimeout(saveTimers.current[id]);
    saveTimers.current[id] = window.setTimeout(() => {
      persistPositions([id]);
      delete saveTimers.current[id];
    }, 600);
  }

  // Load persisted stacks on mount for this investigation
  useEffect(() => {
    try {
      if (!id) return;
      const u = localStorage.getItem(`board_undo_${id}`);
      const r = localStorage.getItem(`board_redo_${id}`);
      if (u) undoStack.current = JSON.parse(u);
      if (r) redoStack.current = JSON.parse(r);
    } catch (e) {
      // ignore
    }
  }, [id]);

  // Keyboard shortcuts: Ctrl/Cmd+Z (undo), Ctrl/Cmd+Y or Ctrl/Cmd+Shift+Z (redo)
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.ctrlKey || e.metaKey;
      if (!isMod) return;
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        const snap = undoStack.current.pop();
        if (!snap) return;
        redoStack.current.push((() => {
          const cur: Record<string, { x: number; y: number }> = {};
          for (const c of cards) cur[c.id] = { x: c.x ?? 0, y: c.y ?? 0 };
          return cur;
        })());
        applySnapshot(snap);
        try { if (id) { localStorage.setItem(`board_undo_${id}`, JSON.stringify(undoStack.current)); localStorage.setItem(`board_redo_${id}`, JSON.stringify(redoStack.current)); } } catch (e) {}
      }
      if (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        const snap = redoStack.current.pop();
        if (!snap) return;
        undoStack.current.push((() => {
          const cur: Record<string, { x: number; y: number }> = {};
          for (const c of cards) cur[c.id] = { x: c.x ?? 0, y: c.y ?? 0 };
          return cur;
        })());
        applySnapshot(snap);
        try { if (id) { localStorage.setItem(`board_undo_${id}`, JSON.stringify(undoStack.current)); localStorage.setItem(`board_redo_${id}`, JSON.stringify(redoStack.current)); } } catch (e) {}
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [cards, id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      const inv = await fetchInvestigationById(id);
      setInvestigation(inv);
      const c = await fetchCardsForInvestigation(id);
      setCards(c || []);
      const con = await fetchConnectionsForInvestigation(id);
      setConnections(con || []);
    })();
  }, [id]);

  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);

  const refreshCards = async () => {
    if (!id) return;
    const c = await fetchCardsForInvestigation(id);
    setCards(c || []);
  };

  const updateCardLocally = useCallback((cardId: string, x: number, y: number) => {
    setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, x, y } : c)));
  }, []);

  const persistCardPosition = useCallback(async (cardId: string, x: number, y: number) => {
    try {
      await updateInvestigationCard(cardId, { x, y });
    } catch (e) {
      console.error('Erro ao salvar posição do card', e);
    }
  }, []);

  function getCardById(cardId: string) {
    return cards.find((c) => c.id === cardId);
  }

  function cardCenterPos(card: Card) {
    const x = (card?.x ?? 0) + 100; // card width/height offsets
    const y = (card?.y ?? 0) + 30;
    return { x, y };
  }

  return (
    <div ref={boardRef} style={{ position: 'relative', width: '100%', height: '80vh', background: '#0b1220', overflow: 'auto' }}>
      <h2 style={{ color: '#e6eef8', padding: 12 }}>{investigation?.title || 'Quadro de Investigação'}</h2>

      <div style={{ padding: 12, display: 'flex', gap: 8 }}>
        <button onClick={() => setOpenCreateModal(true)}>+ Novo Caso / Pista</button>
        <button onClick={() => { if (selectedCard) setOpenEditModal(true); else alert('Selecione um card primeiro'); }}>Editar Card Selecionado</button>
      </div>

      <div style={{ position: 'absolute', right: 12, top: 12, display: 'flex', gap: 8 }}>
        <button onClick={() => {
          const snap = undoStack.current.pop();
          if (!snap) return;
          redoStack.current.push((() => {
            const cur: Record<string, { x: number; y: number }> = {};
            for (const c of cards) cur[c.id] = { x: c.x ?? 0, y: c.y ?? 0 };
            return cur;
          })());
          applySnapshot(snap);
        }}>Undo</button>
        <button onClick={() => {
          const snap = redoStack.current.pop();
          if (!snap) return;
          undoStack.current.push((() => {
            const cur: Record<string, { x: number; y: number }> = {};
            for (const c of cards) cur[c.id] = { x: c.x ?? 0, y: c.y ?? 0 };
            return cur;
          })());
          applySnapshot(snap);
        }}>Redo</button>
      </div>

      {/* SVG layer for connections */}
      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {connections.map((conn) => {
          const from = getCardById(conn.from_card_id);
          const to = getCardById(conn.to_card_id);
          if (!from || !to) return null;
          const a = cardCenterPos(from);
          const b = cardCenterPos(to);
          return (
            <line
              key={conn.id}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={conn.metadata?.color || '#7aa2f7'}
              strokeWidth={2}
              strokeLinecap="round"
            />
          );
        })}
      </svg>

      {/* Cards */}
      {cards.map((card) => (
        <div
          key={card.id}
          onClick={(e) => {
            const shift = (e as React.MouseEvent).shiftKey;
            if (shift) {
              setSelectedIds((prev) => {
                const copy = new Set(prev);
                if (copy.has(card.id)) copy.delete(card.id);
                else copy.add(card.id);
                return copy;
              });
            } else {
              setSelectedIds(new Set([card.id]));
              setSelectedCard(card);
            }
          }}
          onPointerDown={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            dragRef.current = { id: card.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
            (e.currentTarget as HTMLElement).setPointerCapture((e as any).pointerId);
            // push snapshot on drag start
            pushSnapshot();
          }}
          onPointerMove={(e) => {
            if (!dragRef.current || dragRef.current.id !== card.id) return;
            const boardRect = boardRef.current?.getBoundingClientRect();
            if (!boardRect) return;
            const x = e.clientX - boardRect.left - dragRef.current.offsetX;
            const y = e.clientY - boardRect.top - dragRef.current.offsetY;
            // if multiple selected and dragging one of them, move all
            if (selectedIds.has(card.id) && selectedIds.size > 1) {
              // compute deltas relative to initial positions
              const base = cards.find((c) => c.id === card.id);
              if (!base) return;
              const dx = x - (base.x ?? 0);
              const dy = y - (base.y ?? 0);
              setCards((prev) => prev.map((c) => (selectedIds.has(c.id) ? { ...c, x: (c.x ?? 0) + dx, y: (c.y ?? 0) + dy } : c)));
            } else {
              updateCardLocally(card.id, x, y);
            }
            // schedule debounced persist for this card (or group)
            if (selectedIds.has(card.id) && selectedIds.size > 1) {
              selectedIds.forEach((id) => schedulePersist(id));
            } else {
              schedulePersist(card.id);
            }
          }}
          onPointerUp={async (e) => {
            if (!dragRef.current || dragRef.current.id !== card.id) return;
            const boardRect = boardRef.current?.getBoundingClientRect();
            if (!boardRect) return;
            const x = e.clientX - boardRect.left - dragRef.current.offsetX;
            const y = e.clientY - boardRect.top - dragRef.current.offsetY;
            dragRef.current = null;
            // persist immediately on pointer up
            if (selectedIds.has(card.id) && selectedIds.size > 1) {
              await persistPositions(Array.from(selectedIds));
            } else {
              await persistCardPosition(card.id, x, y);
            }
          }}
          style={{
            position: 'absolute',
            left: card.x ?? 0,
            top: card.y ?? 0,
            width: 200,
            padding: 8,
            background: selectedIds.has(card.id) ? '#15202b' : '#111827',
            color: '#e6eef8',
            border: '1px solid #374151',
            borderRadius: 6,
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>{card.title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{card.description_public}</div>
        </div>
      ))}

      {/* Modals integration */}
      {id && (
        <>
          <CreateClueModal isOpen={openCreateModal} onClose={() => { setOpenCreateModal(false); refreshCards(); }} investigationId={id} onSaved={() => refreshCards()} />
          <InvestigationCardModal open={openEditModal} onClose={() => setOpenEditModal(false)} investigationId={id} existing={selectedCard || undefined} onSaved={(c) => { setOpenEditModal(false); refreshCards(); }} />
        </>
      )}

      {/* Sidebar para editar card selecionado */}
      {selectedCard && (
        <aside style={{ position: 'fixed', right: 12, top: 60, width: 320, background: '#071025', color: '#e6eef8', padding: 12, borderRadius: 8, boxShadow: '0 6px 18px rgba(0,0,0,0.6)' }}>
          <h3 style={{ marginTop: 0 }}>{selectedCard.title || 'Detalhes do Card'}</h3>
          <label style={{ display: 'block', fontSize: 12, color: '#9ca3af' }}>Título</label>
          <input defaultValue={selectedCard.title} onChange={(e) => setSelectedCard({ ...selectedCard, title: e.target.value })} style={{ width: '100%', marginBottom: 8 }} />
          <label style={{ display: 'block', fontSize: 12, color: '#9ca3af' }}>Descrição pública</label>
          <textarea defaultValue={selectedCard.description_public} onChange={(e) => setSelectedCard({ ...selectedCard, description_public: e.target.value })} style={{ width: '100%', height: 120 }} />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button onClick={async () => {
              try {
                const updates = { title: selectedCard.title, description_public: selectedCard.description_public };
                await updateInvestigationCard(selectedCard.id, updates);
                setCards((prev) => prev.map((c) => (c.id === selectedCard.id ? { ...c, ...updates } : c)));
                alert('Salvo');
              } catch (e) {
                console.error(e);
                alert('Erro ao salvar');
              }
            }}>Salvar</button>
            <button onClick={() => setSelectedCard(null)}>Fechar</button>
          </div>
        </aside>
      )}
    </div>
  );
}
