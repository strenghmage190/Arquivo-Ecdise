import React, { useState, useRef, useEffect, useCallback } from 'react';
import './PatternLock.css';

interface PatternLockProps {
  code?: string | null; // pattern string like "1-2-3-6-9"
  onUnlock?: (unlockedPattern?: string) => void;
  onInput?: (value: string) => void; // editor mode: report current pattern
  allowEdit?: boolean; // if true, allow constructing pattern (editor)
}

const GRID = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function PatternLock({ code, onUnlock, onInput, allowEdit = false }: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [status, setStatus] = useState<'locked' | 'error' | 'success'>('locked');
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const cellRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    onInput && onInput(pattern.join('-'));
  }, [pattern, onInput]);

  const addPoint = useCallback((n: number) => {
    setPattern(prev => {
      if (prev.includes(n)) return prev;
      return [...prev, n];
    });
  }, []);

  const handleCellClick = (n: number) => {
    if (!allowEdit && !code) return;
    addPoint(n);
  };

  const handleClear = () => {
    setPattern([]);
    setStatus('locked');
    onInput && onInput('');
  };

  const verifyPattern = useCallback((currentPattern: number[]) => {
    const str = currentPattern.join('-');
    if (!code) return; // nothing to check
    if (str === String(code)) {
      setStatus('success');
      setTimeout(() => onUnlock && onUnlock(str), 350);
    } else {
      setStatus('error');
      setTimeout(() => {
        setPattern([]);
        setStatus('locked');
        onInput && onInput('');
      }, 900);
    }
  }, [code, onUnlock, onInput]);

  const handleEnter = () => {
    verifyPattern(pattern);
  };

  // Identifica o nó mais próximo a partir das coordenadas da tela com um raio de hit generoso
  const checkHit = useCallback((clientX: number, clientY: number) => {
    for (const n of GRID) {
      const el = cellRefs.current.get(n);
      if (!el) continue;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      // Raio de tolerância amplo (38px de raio = 76px de diâmetro)
      const dist = Math.hypot(clientX - centerX, clientY - centerY);
      if (dist <= 38) {
        addPoint(n);
        break;
      }
    }
  }, [addPoint]);

  // Touch handlers com prevenção contínua de pull-to-refresh e gestos
  const handleTouchStart = (e: React.TouchEvent) => {
    if (status !== 'locked') return;
    setIsDragging(true);
    const touch = e.touches[0];
    if (touch) {
      checkHit(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || status !== 'locked') return;
    // Prevenção de scroll da página/pull-to-refresh
    if (e.cancelable) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    if (touch) {
      checkHit(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    if (!allowEdit && code && pattern.length > 0) {
      verifyPattern(pattern);
    }
  };

  return (
    <div className={`pattern-shell status-${status}`} ref={containerRef}>
      <div className="pattern-display" aria-live="polite">
        {status === 'error'
          ? 'ACESSO NEGADO'
          : status === 'success'
          ? 'AUTENTICADO'
          : pattern.length
          ? '• '.repeat(pattern.length)
          : '----'}
      </div>

      <div
        ref={gridRef}
        className="pattern-grid"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {GRID.map(n => (
          <div
            key={n}
            ref={el => {
              if (el) cellRefs.current.set(n, el);
              else cellRefs.current.delete(n);
            }}
            role="button"
            tabIndex={0}
            className={`pattern-cell ${pattern.includes(n) ? 'active' : ''}`}
            onClick={() => handleCellClick(n)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') handleCellClick(n);
            }}
            aria-label={`Dot ${n}`}
          >
            <div className="dot" />
          </div>
        ))}
      </div>

      <div className="pattern-actions">
        <button className="btn-mini" onClick={handleClear}>
          limpar
        </button>
        <button className="btn-primary" onClick={handleEnter} disabled={!pattern.length}>
          OK
        </button>
      </div>
    </div>
  );
}
