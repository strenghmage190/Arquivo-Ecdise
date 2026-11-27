import React, { useState } from 'react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import TeamFindingsPopover from '../collaboration/TeamFindingsPopover';
import './NumericKeypad.css';

interface NumericKeypadProps {
  code?: string | number;
  onUnlock?: (unlockedCode?: string) => void;
  onVerify?: (attempt: string) => Promise<boolean>;
  onInput?: (value: string) => void;
  smudgeHints?: string[];
  forensicLens?: 'none' | 'uv' | 'thermal';
  thermalMap?: Record<string, number>;
}

function getThermalKeyStyle(heat: number): React.CSSProperties {
  if (heat >= 0.85) {
    return {
      background: 'radial-gradient(circle, rgba(254, 240, 138, 0.92) 0%, rgba(239, 68, 68, 0.78) 65%, rgba(127, 29, 29, 0.6) 100%)',
      borderColor: '#fef08a',
      boxShadow: '0 0 18px rgba(239, 68, 68, 0.85)',
      color: '#1c1917',
    };
  }
  if (heat >= 0.55) {
    return {
      background: 'radial-gradient(circle, rgba(251, 146, 60, 0.82) 0%, rgba(220, 38, 38, 0.55) 75%, rgba(69, 10, 10, 0.5) 100%)',
      borderColor: '#fb923c',
      boxShadow: '0 0 12px rgba(249, 115, 22, 0.65)',
      color: '#fff',
    };
  }
  return {
    background: 'radial-gradient(circle, rgba(168, 85, 247, 0.58) 0%, rgba(59, 130, 246, 0.42) 80%, rgba(15, 23, 42, 0.6) 100%)',
    borderColor: '#a855f7',
    boxShadow: '0 0 9px rgba(168, 85, 247, 0.55)',
    color: '#e9d5ff',
  };
}

export default function NumericKeypad({
  code,
  onUnlock,
  onVerify,
  onInput,
  smudgeHints = [],
  forensicLens = 'none',
  thermalMap = {},
}: NumericKeypadProps) {
  const { investigationId } = useCollaboration();
  const [input, setInput] = useState<string>('');
  const [status, setStatus] = useState<'locked' | 'verifying' | 'error' | 'success'>('locked');

  const handlePress = (num: string) => {
    if (status === 'verifying' || status === 'success') return;
    if (status !== 'locked') setStatus('locked');
    if (input.length >= 6) return;
    const next = input + num;
    setInput(next);
    onInput && onInput(next);
  };

  const handleEnter = async () => {
    if (!input || status === 'verifying' || status === 'success') return;

    if (onVerify) {
      setStatus('verifying');
      try {
        const ok = await onVerify(input);
        if (ok) {
          setStatus('success');
          const matched = input;
          setTimeout(() => { onUnlock && onUnlock(matched); }, 450);
        } else {
          setStatus('error');
          setTimeout(() => { setInput(''); setStatus('locked'); onInput && onInput(''); }, 900);
        }
      } catch {
        setStatus('error');
        setTimeout(() => { setInput(''); setStatus('locked'); onInput && onInput(''); }, 900);
      }
      return;
    }

    if (!String(code || '')) return;
    if (input === String(code)) {
      setStatus('success');
      const matched = input;
      setTimeout(() => { onUnlock && onUnlock(matched); }, 450);
    } else {
      setStatus('error');
      setTimeout(() => { setInput(''); setStatus('locked'); onInput && onInput(''); }, 900);
    }
  };

  const handleClear = () => {
    if (status === 'verifying') return;
    setInput('');
    setStatus('locked');
    onInput && onInput('');
  };

  const handleBackspace = () => {
    if (!input || status === 'verifying') return;
    const next = input.slice(0, -1);
    setInput(next);
    if (status !== 'locked') setStatus('locked');
    onInput && onInput(next);
  };

  const masked = input ? '• '.repeat(input.length) : '----'; // Melhor visual para a máscara
  const displayText =
    status === 'verifying'
      ? 'VERIFICANDO...'
      : status === 'error'
      ? 'ACESSO NEGADO'
      : status === 'success'
      ? 'AUTENTICADO'
      : masked;

  return (
    <div className={`keypad-shell status-${status}`}>
      <div className="keypad-top">
        <div className="keypad-display" aria-live="polite">{displayText}</div>
      </div>

      <div className="keypad-grid">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
          const keyStr = String(n);
          const hasSmudge = smudgeHints.includes(keyStr);
          const heat = thermalMap[keyStr];
          const lensStyle: React.CSSProperties | undefined =
            forensicLens === 'thermal' && typeof heat === 'number'
              ? getThermalKeyStyle(heat)
              : forensicLens === 'uv' && hasSmudge
              ? {
                  borderColor: '#c084fc',
                  boxShadow: '0 0 14px rgba(168, 85, 247, 0.85), inset 0 0 10px rgba(192, 132, 252, 0.55)',
                  background: 'radial-gradient(circle, rgba(192, 132, 252, 0.36) 0%, rgba(88, 28, 135, 0.22) 70%, transparent 100%)',
                }
              : undefined;
          return (
            <button
              key={n}
              type="button"
              onClick={() => handlePress(keyStr)}
              className={`keypad-btn ${hasSmudge ? 'smudge-hint' : ''}`}
              style={lensStyle}
              data-heat={typeof heat === 'number' && forensicLens === 'thermal' ? heat.toFixed(2) : undefined}
            >
              {n}
            </button>
          );
        })}
        <button type="button" className="keypad-btn alt" onClick={handleBackspace}>⌫</button>
        <button
          type="button"
          className={`keypad-btn ${smudgeHints.includes('0') ? 'smudge-hint' : ''}`}
          style={
            forensicLens === 'thermal' && typeof thermalMap['0'] === 'number'
              ? getThermalKeyStyle(thermalMap['0'])
              : forensicLens === 'uv' && smudgeHints.includes('0')
              ? {
                  borderColor: '#c084fc',
                  boxShadow: '0 0 14px rgba(168, 85, 247, 0.85), inset 0 0 10px rgba(192, 132, 252, 0.55)',
                }
              : undefined
          }
          onClick={() => handlePress('0')}
        >
          0
        </button>
        <button type="button" className="keypad-btn primary" onClick={handleEnter}>OK</button>
      </div>

      <div className="keypad-hint">Digite o PIN e pressione OK</div>
      <div className="keypad-actions">
        <button className="keypad-mini" onClick={handleClear}>limpar</button>
      </div>
      {investigationId && (
        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
          <TeamFindingsPopover
            onSelectValue={(val) => {
              const digits = val.replace(/\D/g, '').slice(0, 6);
              if (digits) {
                setInput(digits);
                setStatus('locked');
                onInput && onInput(digits);
              }
            }}
          />
        </div>
      )}
    </div>
  );
}
