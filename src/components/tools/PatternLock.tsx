import React, { useState, useRef, useEffect } from 'react';
import './PatternLock.css';

interface PatternLockProps {
  code?: string | null; // pattern string like "1-2-3-6-9"
  onUnlock?: () => void;
  onInput?: (value: string) => void; // editor mode: report current pattern
  allowEdit?: boolean; // if true, allow constructing pattern (editor)
}

const GRID = [1,2,3,4,5,6,7,8,9];

export default function PatternLock({ code, onUnlock, onInput, allowEdit = false }: PatternLockProps) {
  const [pattern, setPattern] = useState<number[]>([]);
  const [status, setStatus] = useState<'locked'|'error'|'success'>('locked');
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    onInput && onInput(pattern.join('-'));
  }, [pattern, onInput]);

  const handleCellClick = (n: number) => {
    if (!allowEdit && !code) return;
    // prevent duplicates
    if (pattern.includes(n)) return;
    const next = [...pattern, n];
    setPattern(next);
  };

  const handleClear = () => {
    setPattern([]);
    setStatus('locked');
    onInput && onInput('');
  };

  const handleEnter = () => {
    const str = pattern.join('-');
    if (!code) return; // nothing to check
    if (str === String(code)) {
      setStatus('success');
      setTimeout(() => onUnlock && onUnlock(), 350);
    } else {
      setStatus('error');
      setTimeout(() => { setPattern([]); setStatus('locked'); onInput && onInput(''); }, 900);
    }
  };

  return (
    <div className={`pattern-shell status-${status}`} ref={containerRef}>
      <div className="pattern-display" aria-live="polite">
        {status === 'error' ? 'ACESSO NEGADO' : status === 'success' ? 'AUTENTICADO' : (pattern.length ? '• '.repeat(pattern.length) : '----')}
      </div>

      <div className="pattern-grid">
        {GRID.map(n => (
          <div
            key={n}
            role="button"
            tabIndex={0}
            className={`pattern-cell ${pattern.includes(n) ? 'active' : ''}`}
            onClick={() => handleCellClick(n)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleCellClick(n); }}
            aria-label={`Dot ${n}`}
          >
            <div className="dot" />
          </div>
        ))}
      </div>

      <div className="pattern-actions">
        <button className="btn-mini" onClick={handleClear}>limpar</button>
        <button className="btn-primary" onClick={handleEnter} disabled={!pattern.length}>OK</button>
      </div>
    </div>
  );
}
