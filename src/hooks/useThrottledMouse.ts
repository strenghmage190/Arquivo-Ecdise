import { useEffect, useRef, useState } from 'react';

type Pointer = { x: number; y: number; over: boolean };

export default function useThrottledMouse<T extends HTMLElement>(
  ref: React.RefObject<T>,
  externalPointer?: Pointer | undefined
) {
  const [xy, setXy] = useState<{ x: number; y: number }>({ x: -500, y: -500 });
  const [isHovering, setIsHovering] = useState(false);
  const frameId = useRef<number | null>(null);
  const last = useRef<Pointer>({ x: -500, y: -500, over: false });
  const prev = useRef<Pointer>({ x: -500, y: -500, over: false });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      const newPtr = { x: nx, y: ny, over: true } as Pointer;
      // skip tiny movements to reduce updates
      const dx = newPtr.x - prev.current.x;
      const dy = newPtr.y - prev.current.y;
      if (Math.hypot(dx, dy) < 1.5 && newPtr.over === prev.current.over) return;
      last.current = newPtr;
      if (frameId.current === null) {
        frameId.current = requestAnimationFrame(() => {
          setXy({ x: last.current.x, y: last.current.y });
          setIsHovering(last.current.over);
          prev.current = { ...last.current };
          frameId.current = null;
        });
      }
    };

    const handleLeave = () => {
      last.current.over = false;
      prev.current.over = false;
      if (frameId.current === null) {
        frameId.current = requestAnimationFrame(() => {
          setIsHovering(false);
          frameId.current = null;
        });
      }
    };

    const handleTouch = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      const rect = el.getBoundingClientRect();
      const nx = t.clientX - rect.left;
      const ny = t.clientY - rect.top;
      const newPtr = { x: nx, y: ny, over: true } as Pointer;
      const dx = newPtr.x - prev.current.x;
      const dy = newPtr.y - prev.current.y;
      if (Math.hypot(dx, dy) < 1.5 && newPtr.over === prev.current.over) return;
      last.current = newPtr;
      if (frameId.current === null) {
        frameId.current = requestAnimationFrame(() => {
          setXy({ x: last.current.x, y: last.current.y });
          setIsHovering(true);
          prev.current = { ...last.current };
          frameId.current = null;
        });
      }
    };

    const handleTouchEnd = () => {
      last.current = { x: -500, y: -500, over: false };
      prev.current = { x: -500, y: -500, over: false };
      if (frameId.current === null) {
        frameId.current = requestAnimationFrame(() => {
          setIsHovering(false);
          frameId.current = null;
        });
      }
    };

    el.addEventListener('mousemove', handleMove);
    el.addEventListener('mouseleave', handleLeave);
    el.addEventListener('touchmove', handleTouch, { passive: true } as EventListenerOptions);
    el.addEventListener('touchstart', handleTouch);
    el.addEventListener('touchend', handleTouchEnd);

    return () => {
      el.removeEventListener('mousemove', handleMove);
      el.removeEventListener('mouseleave', handleLeave);
      el.removeEventListener('touchmove', handleTouch as EventListener);
      el.removeEventListener('touchstart', handleTouch as EventListener);
      el.removeEventListener('touchend', handleTouchEnd as EventListener);
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
        frameId.current = null;
      }
    };
  }, [ref]);

  // Allow external pointer updates (from parent or other input) to feed the same RAF loop
  useEffect(() => {
    if (!externalPointer) return;
    const newPtr = { x: externalPointer.x, y: externalPointer.y, over: Boolean(externalPointer.over) } as Pointer;
    const dx = newPtr.x - prev.current.x;
    const dy = newPtr.y - prev.current.y;
    if (Math.hypot(dx, dy) < 1.5 && newPtr.over === prev.current.over) return;
    last.current = newPtr;
    if (frameId.current === null) {
      frameId.current = requestAnimationFrame(() => {
        setXy({ x: last.current.x, y: last.current.y });
        setIsHovering(last.current.over);
        prev.current = { ...last.current };
        frameId.current = null;
      });
    }
  }, [externalPointer]);

  return { xy, isHovering };
}
