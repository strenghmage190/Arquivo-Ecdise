import React, { useState } from 'react';
import './NumericKeypad.css';

interface NumericKeypadProps {
  code: string | number;
  onUnlock?: () => void;
  onInput?: (value: string) => void;
}

export default function NumericKeypad({ code, onUnlock, onInput }: NumericKeypadProps) {
  const [input, setInput] = useState<string>('');
  const [status, setStatus] = useState<'locked' | 'error' | 'success'>('locked');

  const handlePress = (num: string) => {
    if (status !== 'locked') setStatus('locked');
    if (input.length >= 6) return;
    const next = input + num;
    setInput(next);
    onInput && onInput(next);
  };

  const handleEnter = () => {
    if (!String(code)) return;
    if (input === String(code)) {
      setStatus('success');
      setTimeout(() => { onUnlock && onUnlock(); }, 450);
    } else {
      setStatus('error');
      setTimeout(() => { setInput(''); setStatus('locked'); onInput && onInput(''); }, 900);
    }
  };

  const handleClear = () => {
    setInput('');
    setStatus('locked');
    onInput && onInput('');
  };

  const handleBackspace = () => {
    if (!input) return;
    const next = input.slice(0, -1);
    setInput(next);
    if (status !== 'locked') setStatus('locked');
    onInput && onInput(next);
  };

  const masked = input ? '• '.repeat(input.length) : '----'; // Melhor visual para a máscara
  const displayText = status === 'error' ? 'ACESSO NEGADO' : status === 'success' ? 'AUTENTICADO' : masked;

  return (
    <div className={`keypad-shell status-${status}`}>
      <div className="keypad-top">
        <div className="keypad-display" aria-live="polite">{displayText}</div>
      </div>

      <div className="keypad-grid">
        {[1,2,3,4,5,6,7,8,9].map(n => (
          <button key={n} onClick={() => handlePress(String(n))} className="keypad-btn">{n}</button>
        ))}
        <button className="keypad-btn alt" onClick={handleBackspace}>⌫</button>
        <button className="keypad-btn" onClick={() => handlePress('0')}>0</button>
        <button className="keypad-btn primary" onClick={handleEnter}>OK</button>
      </div>

      <div className="keypad-hint">Digite o PIN e pressione OK</div>
      <div className="keypad-actions">
        <button className="keypad-mini" onClick={handleClear}>limpar</button>
      </div>
    </div>
  );
}
