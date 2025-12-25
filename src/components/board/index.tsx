import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { fetchInvestigationById, fetchCardsForInvestigation } from '../../api/investigations';
import { fetchConnectionsForInvestigation } from '../../api/connections';

type Card = any;
type Connection = any;

export default function InvestigationBoard() {
  const { id } = useParams();
  const [investigation, setInvestigation] = useState<any | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const boardRef = useRef<HTMLDivElement | null>(null);

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
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>{card.title}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{card.description_public}</div>
        </div>
      ))}
    </div>
  );
}
