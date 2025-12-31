import React, { useEffect, useRef, useState } from 'react';
import './StickyNote.css';

interface StickyNoteData {
  id: string;
  x?: number;
  y?: number;
  content?: string;
  color?: string;
}

interface Props {
  note: StickyNoteData;
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
    const handleMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging) return;
      let clientX: number | undefined;
      let clientY: number | undefined;
      if ('clientX' in e) {
        clientX = (e as MouseEvent).clientX;
        clientY = (e as MouseEvent).clientY;
      } else if ((e as TouchEvent).touches && (e as TouchEvent).touches.length > 0) {
        clientX = (e as TouchEvent).touches[0].clientX;
        clientY = (e as TouchEvent).touches[0].clientY;
      }
      if (clientX == null || clientY == null) return;
      const board = ref.current?.offsetParent as HTMLElement | null;
      if (!board) return;
      const rect = board.getBoundingClientRect();
      const x = (clientX - rect.left) - dragOffset.current.x;
      const y = (clientY - rect.top) - dragOffset.current.y;
      onMove(note.id, Math.round(x), Math.round(y));
    };

    const handleUp = () => setDragging(false);
    window.addEventListener('mousemove', handleMove as EventListener);
    window.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('touchmove', handleMove as EventListener);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging]);

  const startDrag = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    let clientX: number | undefined;
    let clientY: number | undefined;
    const ev = e as unknown as MouseEvent | TouchEvent;
    if ('clientX' in ev) {
      clientX = (ev as MouseEvent).clientX;
      clientY = (ev as MouseEvent).clientY;
    } else if ((ev as TouchEvent).touches && (ev as TouchEvent).touches.length > 0) {
      clientX = (ev as TouchEvent).touches[0].clientX;
      clientY = (ev as TouchEvent).touches[0].clientY;
    }
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
