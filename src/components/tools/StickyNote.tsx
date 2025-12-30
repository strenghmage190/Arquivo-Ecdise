import React, { useEffect, useRef, useState } from 'react';
import './StickyNote.css';

interface Props {
  note: any;
  onUpdate: (id: string, content: string) => void;
  onMove: (id: string, x: number, y: number) => void;
  onDelete: (id: string) => void;
}

export default function StickyNote({ note, onUpdate, onMove, onDelete }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const [localContent, setLocalContent] = useState(note.content || '');

  useEffect(() => { setLocalContent(note.content || ''); }, [note.content]);

  useEffect(() => {
    const handleMove = (e: any) => {
      if (!dragging) return;
      const clientX = (e as any).clientX ?? ((e as any).touches && (e as any).touches[0]?.clientX);
      const clientY = (e as any).clientY ?? ((e as any).touches && (e as any).touches[0]?.clientY);
      if (clientX == null || clientY == null) return;
      const board = ref.current?.offsetParent as HTMLElement | null;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = (clientX - rect.left) - dragOffset.current.x;
      const y = (clientY - rect.top) - dragOffset.current.y;
      onMove(note.id, Math.round(x), Math.round(y));
    };

    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('touchmove', handleMove, { passive: false } as any);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove as any);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    const clientX = (e as any).clientX ?? ((e as any).touches && (e as any).touches[0]?.clientX);
    const clientY = (e as any).clientY ?? ((e as any).touches && (e as any).touches[0]?.clientY);
    const board = ref.current?.offsetParent as HTMLElement | null;
    if (!board || clientX == null || clientY == null) return;
    const rect = board.getBoundingClientRect();
    dragOffset.current = { x: clientX - rect.left - (note.x || 0), y: clientY - rect.top - (note.y || 0) };
    setDragging(true);
  };

  return (
    <div
      ref={ref}
      className="sticky-note"
      style={{ left: note.x, top: note.y, backgroundColor: note.color || '#f1c40f', transform: `rotate(${note.id ? (note.id.charCodeAt(0) % 6) - 3 : 0}deg)` }}
      onMouseDown={startDrag}
      onTouchStart={startDrag}
    >
      <div className="pin">📍</div>
      <button className="del-note" onClick={(e) => { e.stopPropagation(); onDelete(note.id); }}>x</button>
      <textarea
        value={localContent}
        onChange={e => setLocalContent(e.target.value)}
        onBlur={() => onUpdate(note.id, localContent)}
        placeholder="Teoria..."
      />
    </div>
  );
}
