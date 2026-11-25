import React, { useEffect, useRef, useState } from 'react';
import { ShieldAlert, Terminal } from 'lucide-react';
import { useCollaboration } from '../../contexts/CollaborationContext';
import TeamFindingsPopover from '../collaboration/TeamFindingsPopover';
import { isExtendedPerformanceMode } from '../../utils/performance';
import './HackingTerminal.css';

interface Props {
  correctPassword?: string;
  onUnlock: () => void;
  hint?: string;
}

interface LogLine {
  id: string;
  text: string;
  type: 'system' | 'warning' | 'user' | 'cris' | 'error' | 'success';
}

export default function HackingTerminal({ correctPassword, onUnlock, hint }: Props) {
  const { investigationId } = useCollaboration();
  const [logs, setLogs] = useState<LogLine[]>([]);
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [bootComplete, setBootComplete] = useState(false);
  const outputRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timers.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [logs]);

  const appendLog = (text: string, type: LogLine['type'] = 'system') => {
    setLogs((prev) => [
      ...prev,
      { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, text, type },
    ]);
  };

  // Boot sequence on mount (fast, non-blocking)
  useEffect(() => {
    const bootMessages: Array<{ delay: number; text: string; type: LogLine['type'] }> = [
      { delay: 80, text: 'C.R.I.S. SHELL [AUTH_GATE v4.0.2] — VERIFICANDO INTEGRIDADE...', type: 'system' },
      { delay: 260, text: '[LOCKED] CREDENCIAL DE ACESSO NECESSÁRIA PARA BYPASS.', type: 'warning' },
    ];

    bootMessages.forEach(({ delay, text, type }) => {
      const timer = window.setTimeout(() => appendLog(text, type), delay);
      timers.current.push(timer);
    });

    const finalTimer = window.setTimeout(() => {
      setBootComplete(true);
    }, 380);
    timers.current.push(finalTimer);
  }, []);

  const typeResponse = (text: string, type: LogLine['type'] = 'cris') => {
    const lineId = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setLogs((prev) => [...prev, { id: lineId, text: '', type }]);

    let i = 0;
    const speed = isExtendedPerformanceMode() ? 4 : 16;

    const step = () => {
      i += 1;
      setLogs((prev) =>
        prev.map((entry) => (entry.id === lineId ? { ...entry, text: text.slice(0, i) } : entry))
      );
      if (i < text.length) {
        const t = window.setTimeout(step, speed);
        timers.current.push(t);
      }
    };

    const startTimer = window.setTimeout(step, speed);
    timers.current.push(startTimer);
  };

  const processResponse = (query: string) => {
    const q = query.trim().toLowerCase();
    const target = (correctPassword || '').trim().toLowerCase();

    if (q === 'clear' || q === 'cls') {
      setLogs([]);
      return;
    }

    appendLog('> Analisando parâmetros de autenticação...', 'system');

    let responseText = '';
    let responseType: LogLine['type'] = 'cris';

    if (q === 'ajuda' || q === 'help') {
      responseText = 'Comandos: ajuda | status | dica | clear — ou informe a credencial de acesso.';
    } else if (q === 'dica') {
      responseText = hint
        ? `Dica do Sistema: ${hint}`
        : 'Nenhuma dica pública registrada. Consulte as evidências ou os achados da equipe.';
    } else if (q === 'status') {
      responseText = `Tentativas registradas: ${attempts + 1}. Terminal C.R.I.S. aguardando credencial válida.`;
    } else if (target && q === target) {
      responseText = '[OK] Credencial validada. Concedendo acesso...';
      responseType = 'success';
    } else {
      responseText = '[DENIED] Acesso negado. Credencial inválida.';
      responseType = 'error';
    }

    const t = window.setTimeout(() => typeResponse(responseText, responseType), 250);
    timers.current.push(t);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = input.trim();
    if (!query || !bootComplete) return;
    appendLog(`auth@ordo:~# ${query}`, 'user');
    setInput('');
    setAttempts((a) => a + 1);

    const t = window.setTimeout(() => {
      processResponse(query);
      if (correctPassword && query.toLowerCase() === correctPassword.trim().toLowerCase()) {
        const t2 = window.setTimeout(onUnlock, 1100);
        timers.current.push(t2);
      }
    }, 200);
    timers.current.push(t);
  };

  const quickCommands = ['ajuda', 'status', 'dica', 'clear'];

  return (
    <div className="cris-auth-shell">
      <div className="cris-auth-window">
        <div className="cris-auth-header">
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Terminal size={14} /> C.R.I.S. TERMINAL [TTY-AUTH]
          </span>
          <span className="cris-auth-badge">
            <ShieldAlert size={12} /> LOCKED
          </span>
        </div>

        <div className="cris-auth-output" ref={outputRef} id="nexus-output">
          {logs.map((entry) => (
            <div key={entry.id} className={`cris-log-entry ${entry.type}`}>
              {entry.text}
            </div>
          ))}
        </div>

        {bootComplete && (
          <div className="terminal-quick-chips">
            {quickCommands.map((cmd) => (
              <button
                key={cmd}
                type="button"
                className="terminal-chip"
                onClick={() => {
                  if (cmd === 'clear') {
                    setLogs([]);
                  } else {
                    setInput(cmd);
                  }
                }}
              >
                {cmd}
              </button>
            ))}
            {(investigationId !== undefined) && (
              <TeamFindingsPopover
                onSelectValue={(val) => setInput(val)}
              />
            )}
          </div>
        )}

        <form
          className="cris-auth-input-row"
          onSubmit={handleSubmit}
          style={{ opacity: bootComplete ? 1 : 0.4, pointerEvents: bootComplete ? 'auto' : 'none' }}
        >
          <span className="cris-input-prefix">auth@ordo:~#</span>
          <input
            id="nexus-input"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={bootComplete ? 'Digite a credencial de acesso...' : 'Inicializando shell...'}
            disabled={!bootComplete}
          />
          <button type="submit" className="terminal-submit-btn" disabled={!bootComplete || !input.trim()}>
            OK
          </button>
        </form>
      </div>
    </div>
  );
}
