import { useEffect, useCallback } from 'react';
import { eventManager } from '../utils/EventManager';

interface MouseEventHandlers {
  onMouseMove?: (e: MouseEvent) => void;
  onMouseDown?: (e: MouseEvent) => void;
  onMouseUp?: (e: MouseEvent) => void;
  onTouchStart?: (e: TouchEvent) => void;
  onTouchEnd?: (e: TouchEvent) => void;
  onMouseOver?: (e: MouseEvent) => void;
  onMouseOut?: (e: MouseEvent) => void;
}

/**
 * Hook centralizado para eventos globais de mouse/touch
 * Previne duplicação de event listeners
 * 
 * @example
 * useGlobalMouseEvents({
 *   onMouseUp: () => setDragging(false),
 *   onTouchEnd: () => setDragging(false)
 * });
 */
export function useGlobalMouseEvents(handlers: MouseEventHandlers) {
  // Memoizar handlers para evitar re-registros
  const memoizedHandlers = useCallback(() => handlers, [
    handlers.onMouseMove,
    handlers.onMouseDown,
    handlers.onMouseUp,
    handlers.onTouchStart,
    handlers.onTouchEnd,
    handlers.onMouseOver,
    handlers.onMouseOut
  ]);

  useEffect(() => {
    const unsubscribers: Array<() => void> = [];
    const currentHandlers = memoizedHandlers();

    // Registrar handlers customizados
    if (currentHandlers.onMouseMove) {
      unsubscribers.push(
        eventManager.on('global:mousemove', currentHandlers.onMouseMove)
      );
    }

    if (currentHandlers.onMouseDown) {
      unsubscribers.push(
        eventManager.on('global:mousedown', currentHandlers.onMouseDown)
      );
    }

    if (currentHandlers.onMouseUp) {
      unsubscribers.push(
        eventManager.on('global:mouseup', currentHandlers.onMouseUp)
      );
    }

    if (currentHandlers.onTouchStart) {
      unsubscribers.push(
        eventManager.on('global:touchstart', currentHandlers.onTouchStart as any)
      );
    }

    if (currentHandlers.onTouchEnd) {
      unsubscribers.push(
        eventManager.on('global:touchend', currentHandlers.onTouchEnd as any)
      );
    }

    if (currentHandlers.onMouseOver) {
      unsubscribers.push(
        eventManager.on('global:mouseover', currentHandlers.onMouseOver)
      );
    }

    if (currentHandlers.onMouseOut) {
      unsubscribers.push(
        eventManager.on('global:mouseout', currentHandlers.onMouseOut)
      );
    }

    // Cleanup
    return () => unsubscribers.forEach(unsub => unsub());
  }, [memoizedHandlers]);
}

/**
 * Setup global - executar UMA VEZ no App.tsx ou main.tsx
 * Inicializa os listeners nativos e repassa para o EventManager
 */
export function setupGlobalMouseListeners() {
  const handleMouseMove = (e: MouseEvent) => {
    eventManager.emitDebounced('global:mousemove', 16, e); // 60fps max
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
    eventManager.emitDebounced('global:mouseover', 50, e);
  };

  const handleMouseOut = (e: MouseEvent) => {
    eventManager.emitDebounced('global:mouseout', 50, e);
  };

  window.addEventListener('mousemove', handleMouseMove, { passive: true });
  window.addEventListener('mousedown', handleMouseDown);
  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('touchstart', handleTouchStart, { passive: true });
  window.addEventListener('touchend', handleTouchEnd);
  window.addEventListener('mouseover', handleMouseOver);
  window.addEventListener('mouseout', handleMouseOut);

  console.log('[useGlobalMouseEvents] Global mouse listeners initialized');

  // Retornar cleanup (se necessário)
  return () => {
    window.removeEventListener('mousemove', handleMouseMove);
    window.removeEventListener('mousedown', handleMouseDown);
    window.removeEventListener('mouseup', handleMouseUp);
    window.removeEventListener('touchstart', handleTouchStart);
    window.removeEventListener('touchend', handleTouchEnd);
    window.removeEventListener('mouseover', handleMouseOver);
    window.removeEventListener('mouseout', handleMouseOut);
  };
}
