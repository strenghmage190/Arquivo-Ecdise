import { useEffect, useRef } from 'react';
import { eventManager } from '../utils/EventManager';

export interface MouseEventHandlers {
  onMouseMove?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onMouseOver?: (e: MouseEvent) => void;
  onMouseOut?: (e: MouseEvent) => void;
}

/**
 * Hook centralizado para eventos globais de mouse/touch.
 * Usa ref estável para evitar re-inscrições desnecessárias a cada render.
 */
export function useGlobalMouseEvents(handlers: MouseEventHandlers) {
  const handlersRef = useRef<MouseEventHandlers>(handlers);
  handlersRef.current = handlers;

  const hasMouseMove = Boolean(handlers.onMouseMove);
  const hasMouseDown = Boolean(handlers.onMouseDown);
  const hasMouseUp = Boolean(handlers.onMouseUp);
  const hasTouchStart = Boolean(handlers.onTouchStart);
  const hasTouchEnd = Boolean(handlers.onTouchEnd);
  const hasMouseOver = Boolean(handlers.onMouseOver);
  const hasMouseOut = Boolean(handlers.onMouseOut);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];

    if (hasMouseMove) {
      unsubscribers.push(
        eventManager.on('global:mousemove', (e: MouseEvent) => handlersRef.current.onMouseMove?.(e))
      );
    }

    if (hasMouseDown) {
      unsubscribers.push(
        eventManager.on('global:mousedown', (e: MouseEvent) => handlersRef.current.onMouseDown?.(e))
      );
    }

    if (hasMouseUp) {
      unsubscribers.push(
        eventManager.on('global:mouseup', (e: MouseEvent) => handlersRef.current.onMouseUp?.(e))
      );
    }

    if (hasTouchStart) {
      unsubscribers.push(
        eventManager.on('global:touchstart', (e: any) => handlersRef.current.onTouchStart?.(e))
      );
    }

    if (hasTouchEnd) {
      unsubscribers.push(
        eventManager.on('global:touchend', (e: any) => handlersRef.current.onTouchEnd?.(e))
      );
    }

    if (hasMouseOver) {
      unsubscribers.push(
        eventManager.on('global:mouseover', (e: MouseEvent) => handlersRef.current.onMouseOver?.(e))
      );
    }

    if (hasMouseOut) {
      unsubscribers.push(
        eventManager.on('global:mouseout', (e: MouseEvent) => handlersRef.current.onMouseOut?.(e))
      );
    }

    return () => unsubscribers.forEach((unsub) => unsub());
  }, [
    hasMouseMove,
    hasMouseDown,
    hasMouseUp,
    hasTouchStart,
    hasTouchEnd,
    hasMouseOver,
    hasMouseOut,
  ]);
}

/**
 * Setup global - executar UMA VEZ no App.tsx ou main.tsx
 * Inicializa os listeners nativos e repassa para o EventManager
 */
export function setupGlobalMouseListeners() {
  if (typeof window === 'undefined') {
    return () => {};
  }

  let rafId: number | null = null;
  let lastMouseEvent: MouseEvent | null = null;

  const handleMouseMove = (e: MouseEvent) => {
    lastMouseEvent = e;

    if (rafId === null) {
      rafId = requestAnimationFrame(() => {
        if (lastMouseEvent) {
          eventManager.emit('global:mousemove', lastMouseEvent);
        }
        rafId = null;
      });
    }
  };

  const handleMouseDown = (e: MouseEvent) => {
    eventManager.emit('global:mousedown', e);
  };

  const handleMouseUp = (e: MouseEvent) => {
    eventManager.emit('global:mouseup', e);
  };

  const handleTouchStart = (e: TouchEvent) => {
    eventManager.emit('global:touchstart', e);
  };

  const handleTouchEnd = (e: TouchEvent) => {
    eventManager.emit('global:touchend', e);
  };

  const handleMouseOver = (e: MouseEvent) => {
    eventManager.emit('global:mouseover', e);
  };

  const handleMouseOut = (e: MouseEvent) => {
    eventManager.emit('global:mouseout', e);
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd, { passive: true });
  window.addEventListener('mouseover', handleMouseOver);
  window.addEventListener('mouseout', handleMouseOut);

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('mouseover', handleMouseOver);
    window.removeEventListener('mouseout', handleMouseOut);
  };
}
