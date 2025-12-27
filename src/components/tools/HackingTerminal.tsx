import React, { useState } from 'react';
import './HackingTerminal.css';

interface Props {
  correctPassword?: string;
  onUnlock: () => void;
  hint?: string;
}

export default function HackingTerminal({ correctPassword, onUnlock, hint }: Props) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'error' | 'success'>('idle');
  const [attempts, setAttempts] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input) return;

    setStatus('checking');

    setTimeout(() => {
      if (input.trim().toLowerCase() === (correctPassword || '').toLowerCase()) {
        setStatus('success');
        setTimeout(onUnlock, 1500);
      } else {
        setStatus('error');
        setAttempts(a => a + 1);
        setInput('');
        setTimeout(() => setStatus('idle'), 2000);
      }
    }, 800);
  };

  return (
    <div className="terminal-wrapper">
      <div className="crt-overlay" />
      <div className="terminal-content">
        <div className="term-header">
          <span>C.R.I.S. SECURE VAULT v4.0</span>
          <span>STATUS: <span style={{ color: 'red' }}>LOCKED</span></span>
        </div>

        <div className="term-body">
          <div className="ascii-lock">
            {status === 'success' ? '🔓 ABERTO' : '🔒 FECHADO'}
          </div>

          <p>ESTE ARQUIVO ESTÁ CRIPTOGRAFADO PELA ORDO REALITAS.</p>
          <p>INSIRA A CHAVE DE ACESSO PARA DESCOMPILAR OS DADOS.</p>

          {status === 'error' && (
            <div className="error-msg">
              ⚠️ SENHA INCORRETA. TENTATIVA {attempts}/?? <br />
              ACESSO NEGADO.
            </div>
          )}

          {status === 'success' && (
            <div className="success-msg">
              ACESSO CONCEDIDO.<br />
              CARREGANDO ASSETS...
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="input-line">
              <span className="prompt">{'>'}</span>
              <input
                autoFocus
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                disabled={status === 'checking' || status === 'success'}
                placeholder="DIGITE A SENHA..."
              />
              <div className="blinker">_</div>
            </div>
          </form>

          {attempts > 2 && hint && (
            <div className="term-hint">DICA DO SISTEMA: {hint}</div>
          )}
        </div>
      </div>
    </div>
  );
}
