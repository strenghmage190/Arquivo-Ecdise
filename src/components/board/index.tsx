import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { fetchInvestigationById, fetchCardsForInvestigation, updateInvestigationCard } from '../../api/investigations';
import { fetchConnectionsForInvestigation } from '../../api/connections';

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
          onClick={() => setSelectedCard(card)}
          onPointerDown={(e) => {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            dragRef.current = { id: card.id, offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top };
            (e.currentTarget as HTMLElement).setPointerCapture((e as any).pointerId);
          }}
          onPointerMove={(e) => {
            if (!dragRef.current || dragRef.current.id !== card.id) return;
            const boardRect = boardRef.current?.getBoundingClientRect();
            if (!boardRect) return;
            const x = e.clientX - boardRect.left - dragRef.current.offsetX;
            const y = e.clientY - boardRect.top - dragRef.current.offsetY;
            updateCardLocally(card.id, x, y);
          }}
          onPointerUp={async (e) => {
            if (!dragRef.current || dragRef.current.id !== card.id) return;
            const boardRect = boardRef.current?.getBoundingClientRect();
            if (!boardRect) return;
            const x = e.clientX - boardRect.left - dragRef.current.offsetX;
            const y = e.clientY - boardRect.top - dragRef.current.offsetY;
            dragRef.current = null;
            await persistCardPosition(card.id, x, y);
          }}
          style={{
            position: 'absolute',
            left: card.x ?? 0,
            top: card.y ?? 0,
            width: 200,
            padding: 8,
            background: '#111827',
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
