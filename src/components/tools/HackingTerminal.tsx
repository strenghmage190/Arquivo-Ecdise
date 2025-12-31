import React, { useEffect, useRef, useState } from 'react';
import './HackingTerminal.css';

interface Props {
  correctPassword?: string;
  onUnlock: () => void;
  hint?: string;
}

export default function HackingTerminal({ correctPassword, onUnlock, hint }: Props) {
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach(t => clearTimeout(t));
    };
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
    const speed = 22;
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
    const isGlitch = Math.random() < 0.2;
    let responseText = '';
    if (query.toLowerCase().includes('ajuda')) {
      responseText = 'Funções disponíveis: Protocolo de Criação, Acesso a Arquivos, Desconexão.';
    } else if (query.toLowerCase().includes((correctPassword || '').toLowerCase())) {
      responseText = 'Chave válida. Concedendo acesso...';
    } else {
      responseText = 'Dados insuficientes. Especifique parâmetros ou aumente nível de autorização.';
    }

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
          <div className="log-entry system">&gt; Identificação Biométrica Confirmada.</div>
          <div className="log-entry system">&gt; Bem-vindo à Sala do Servidor.</div>
          <div className="log-entry archivist">"Query recebida. Aguardando input..."</div>
        </div>

        <form className="console-input-wrapper" onSubmit={handleSubmit}>
          <span className="input-prefix">QUERY_INPUT_&gt;</span>
          <input
            id="nexus-input"
            autoComplete="off"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Solicite dados ou análise..."
          />
          <div className="scanline" />
        </form>
      </div>
    </div>
  );
}
