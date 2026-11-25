import React, { useEffect, useRef, useState } from 'react';
import './HackingTerminal.css';
import { isExtendedPerformanceMode } from '../../utils/performance';

interface Props {
  correctPassword?: string;
  onUnlock: () => void;
  hint?: string;
}

export default function HackingTerminal({ correctPassword, onUnlock, hint }: Props) {
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach(t => clearTimeout(t));
    };
  }, []);

  // Boot sequence on mount (fast, non-blocking)
  useEffect(() => {
    const bootMessages = [
      { delay: 100, text: '&gt; Verificando integridade do sistema C.R.I.S....', type: 'system' },
      { delay: 350, text: '&gt; [OK] Autenticação necessária para bypass.', type: 'warning' },
    ];

    bootMessages.forEach(({ delay, text, type }) => {
      const timer = window.setTimeout(() => {
        addLog(text, type);
      }, delay);
      timers.current.push(timer);
    });

    const finalTimer = window.setTimeout(() => {
      setBootComplete(true);
    }, 500);
    timers.current.push(finalTimer);

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function addLog(text: string, type = 'system'): HTMLDivElement | null {
    if (!outputRef.current) return null;
    const div = document.createElement('div');
    div.className = `log-entry ${type}`;
    div.innerHTML = text;
    outputRef.current.appendChild(div);
    outputRef.current.scrollTop = outputRef.current.scrollHeight;
    return div;
  }

  function typeWriter(text: string) {
    const el = document.createElement('div');
    el.className = 'log-entry archivist';
    if (!outputRef.current) return;
    outputRef.current.appendChild(el);
    let i = 0;
    const speed = isExtendedPerformanceMode() ? 5 : 22; // Faster typing in performance mode
    function type() {
      if (i < text.length) {
        el.innerHTML += text.charAt(i);
        i++;
        outputRef.current!.scrollTop = outputRef.current!.scrollHeight;
        const t = window.setTimeout(type, speed);
        timers.current.push(t);
      }
    }
    type();
  }

  function processResponse(query: string) {
    addLog('&gt; Analisando parâmetros de busca...', 'system');
    const q = query.trim().toLowerCase();
    const target = (correctPassword || '').trim().toLowerCase();
    let responseText = '';
    if (q === 'ajuda' || q === 'help') {
      responseText = 'Comandos: ajuda | status | dica | clear — ou digite a credencial de acesso.';
    } else if (q === 'dica') {
      responseText = hint ? `Dica do Sistema: ${hint}` : `Credencial esperada possui ${target.length || '?'} caracteres.`;
    } else if (q === 'status') {
      responseText = `Tentativas registradas: ${attempts + 1}. Terminal aguardando credencial válida.`;
    } else if (target && q === target) {
      responseText = 'Chave válida. Concedendo acesso...';
    } else if (target && q.length === target.length) {
      responseText = `Acesso negado. Comprimento compatível (${target.length} chars), mas assinatura incorreta.`;
    } else {
      responseText = 'Acesso negado. Use "dica" se precisar de orientação.';
    }

    const isGlitch = Math.random() < 0.15;
    if (isGlitch) {
      const t1 = window.setTimeout(() => {
        const glitchMsg = 'NÃO... PARE... A DOR...';
        const el = addLog(glitchMsg, 'glitch');
        const t2 = window.setTimeout(() => {
          if (el) {
            el.className = 'log-entry system';
            el.innerText = '> Erro de sintaxe corrigido. Continuando...';
          }
          const t3 = window.setTimeout(() => typeWriter(responseText), 800);
          timers.current.push(t3);
        }, 1000);
        timers.current.push(t2);
      }, 500);
      timers.current.push(t1);
    } else {
      const t = window.setTimeout(() => typeWriter(responseText), 500);
      timers.current.push(t);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;
    addLog(query, 'user');
    setInput('');
    setAttempts(a => a + 1);

    const t = window.setTimeout(() => {
      processResponse(query);
      // if correct, unlock after short delay
      if (query.toLowerCase() === (correctPassword || '').toLowerCase()) {
        const t2 = window.setTimeout(onUnlock, 1400);
        timers.current.push(t2);
      }
    }, 600);
    timers.current.push(t);
  };

  const quickCommands = ['ajuda', 'status', 'dica', 'clear'];

  return (
    <div className="nexus-container">
      <div className="server-grid-bg" />

      <div className="archivist-avatar">
        <div className="waveform">
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
          <div className="bar" />
        </div>
        <span className="status-text">NEXUS_CORE // ONLINE</span>
      </div>

      <div className="glass-console">
        <div className="console-output" ref={outputRef} id="nexus-output">
          {/* Boot messages will be added dynamically */}
        </div>

        {/* Chips de atalhos rápidos posicionados acima do input / teclado */}
        {bootComplete && (
          <div className="terminal-quick-chips">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                className="terminal-chip"
                onClick={() => setInput(cmd)}
              >
                {cmd}
              </button>
            ))}
          </div>
        )}

        <form className="console-input-wrapper" onSubmit={handleSubmit} style={{ opacity: bootComplete ? 1 : 0.3, pointerEvents: bootComplete ? 'auto' : 'none' }}>
          <span className="input-prefix">QUERY_INPUT_&gt;</span>
          <input
            id="nexus-input"
            autoComplete="off"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={bootComplete ? "Digite a senha de bypass..." : "Aguardando boot..."}
            disabled={!bootComplete}
          />
          <button type="submit" className="terminal-submit-btn" disabled={!bootComplete || !input.trim()}>
            ENVIAR
          </button>
          <div className="scanline" />
        </form>
      </div>
    </div>
  );
}
