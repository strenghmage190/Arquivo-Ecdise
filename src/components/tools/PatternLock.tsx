import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import TeamFindingsPopover from '../collaboration/TeamFindingsPopover';
import './PatternLock.css';

interface PatternLockProps {
  code?: string | null; // pattern string like "1-2-3-6-9"
  onUnlock?: (unlockedPattern?: string) => void;
  onVerify?: (attempt: string) => Promise<boolean>;
  onInput?: (value: string) => void; // editor mode: report current pattern
  allowEdit?: boolean; // if true, allow constructing pattern (editor)
  forensicLens?: 'none' | 'uv' | 'thermal';
  smudgeNodes?: number[];
  thermalMap?: Record<number, number>;
}

const GRID = [1, 2, 3, 4, 5, 6, 7, 8, 9];

export default function PatternLock({
  code,
  onUnlock,
  onVerify,
  onInput,
  allowEdit = false,
  forensicLens = 'none',
  smudgeNodes = [],
  thermalMap = {},
}: PatternLockProps) {
  const { investigationId } = useCollaboration();
  const [pattern, setPattern] = useState<number[]>([]);
  const [status, setStatus] = useState<'locked' | 'verifying' | 'error' | 'success'>('locked');
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
    if (!allowEdit && !code && !onVerify) return;
    if (status === 'verifying' || status === 'success') return;
    addPoint(n);
  };

  const handleClear = () => {
    if (status === 'verifying') return;
    setPattern([]);
    setStatus('locked');
    onInput && onInput('');
  };

  const verifyPattern = useCallback(async (currentPattern: number[]) => {
    const str = currentPattern.join('-');
    if (!str) return;
    if (onVerify) {
      setStatus('verifying');
      try {
        const ok = await onVerify(str);
        if (ok) {
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
      } catch {
        setStatus('error');
        setTimeout(() => {
          setPattern([]);
          setStatus('locked');
          onInput && onInput('');
        }, 900);
      }
      return;
    }

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
  }, [code, onUnlock, onVerify, onInput]);

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
        {GRID.map((n) => {
          const heat = thermalMap[n];
          const hasSmudge = smudgeNodes.includes(n);
          const lensStyle: React.CSSProperties | undefined =
            forensicLens === 'thermal' && typeof heat === 'number'
              ? {
                  borderColor: heat >= 0.8 ? '#fef08a' : heat >= 0.5 ? '#fb923c' : '#a855f7',
                  boxShadow:
                    heat >= 0.8
                      ? '0 0 18px rgba(239, 68, 68, 0.9)'
                      : heat >= 0.5
                      ? '0 0 12px rgba(249, 115, 22, 0.7)'
                      : '0 0 9px rgba(168, 85, 247, 0.6)',
                  background:
                    heat >= 0.8
                      ? 'radial-gradient(circle, rgba(254,240,138,0.85) 0%, rgba(239,68,68,0.55) 75%, transparent 100%)'
                      : heat >= 0.5
                      ? 'radial-gradient(circle, rgba(251,146,60,0.72) 0%, rgba(220,38,38,0.35) 75%, transparent 100%)'
                      : 'radial-gradient(circle, rgba(168,85,247,0.52) 0%, rgba(59,130,246,0.28) 80%, transparent 100%)',
                }
              : forensicLens === 'uv' && hasSmudge
              ? {
                  borderColor: '#c084fc',
                  boxShadow: '0 0 14px rgba(168, 85, 247, 0.85)',
                  background: 'radial-gradient(circle, rgba(192,132,252,0.35) 0%, transparent 72%)',
                }
              : undefined;
          return (
            <div
              key={n}
              ref={(el) => {
                if (el) cellRefs.current.set(n, el);
                else cellRefs.current.delete(n);
              }}
              role="button"
              tabIndex={0}
              className={`pattern-cell ${pattern.includes(n) ? 'active' : ''}`}
              style={lensStyle}
              onClick={() => handleCellClick(n)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleCellClick(n);
              }}
              aria-label={`Dot ${n}`}
            >
              <div className="dot" />
            </div>
          );
        })}
      </div>

      <div className="pattern-actions">
        <button className="btn-mini" onClick={handleClear}>
          limpar
        </button>
        <button className="btn-primary" onClick={handleEnter} disabled={!pattern.length}>
          OK
        </button>
      </div>
      {!allowEdit && investigationId && (
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
          <TeamFindingsPopover
            onSelectValue={(val) => {
              const nodes = val
                .split(/[-,\s]+/)
                .map((n) => Number(n.trim()))
                .filter((n) => Number.isInteger(n) && n >= 1 && n <= 9);
              if (nodes.length > 0) {
                setPattern(nodes);
                setStatus('locked');
                onInput && onInput(nodes.join('-'));
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
