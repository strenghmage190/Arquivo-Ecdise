import React, { useState, useEffect, useRef } from 'react';
import './SystemTerminal.css';

export default function SystemTerminal({ isOpen, onClose, cards, onOpenCard }: any) {
  const [history, setHistory] = useState<string[]>(['C.R.I.S. TERMINAL [VERSÃO 4.0.2]', 'DIGITE "HELP" PARA AJUDA.']);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isOpen]);

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const parts = input.trim().split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1);
    const newHistory = [...history, `> ${input}`];

    switch (cmd) {
      case 'help':
        newHistory.push(
          'COMANDOS DISPONÍVEIS:',
          '  list - Lista arquivos no diretório atual',
          '  open <ID|NAME> - Abre um arquivo visual',
          '  scan - Varredura de integridade',
          '  clear - Limpa a tela',
          '  exit - Fecha o terminal'
        );
        break;
      case 'list':
      case 'ls':
        const files = (cards || []).map((c: any) => `${c.is_locked ? '🔒' : '📄'} [${String(c.id || '').slice(0,4)}] ${String(c.title||'UNTITLED').toUpperCase()}`);
        newHistory.push(...files);
        break;
      case 'open':
        if (args[0]) {
          const needle = args[0].toLowerCase();
          const target = (cards || []).find((c: any) => (String(c.id || '').toLowerCase().startsWith(needle) || String(c.title || '').toLowerCase() === needle));
          if (target) {
            newHistory.push(`ABRINDO ${target.title}...`);
            try { onOpenCard && onOpenCard(target); } catch (e) {}
            try { onClose && onClose(); } catch (e) {}
          } else {
            newHistory.push('ERRO: ARQUIVO NÃO ENCONTRADO.');
          }
        } else {
          newHistory.push('ERRO: ID DO ARQUIVO NECESSÁRIO.');
        }
        break;
      case 'scan':
        newHistory.push('ESCANEANDO REDE MEMBRANA...', '...', 'NENHUMA INTROMISSÃO DETECTADA (POR ENQUANTO).');
        break;
      case 'clear':
        setHistory([]);
        setInput('');
        return;
      case 'exit':
        onClose && onClose();
        break;
      default:
        newHistory.push(`ERRO: COMANDO "${cmd}" DESCONHECIDO.`);
    }

    setHistory(newHistory);
    setInput('');
  };

  if (!isOpen) return null;

  return (
    <div className="terminal-overlay" onClick={() => onClose && onClose()}>
      <div className="terminal-window" onClick={e => e.stopPropagation()}>
        <div className="terminal-output">
          {history.map((line, i) => (
            <div key={i} className="term-line">{line}</div>
          ))}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleCommand} className="terminal-input-row">
          <span>root@ordo:~#</span>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onBlur={e => (e.target as HTMLInputElement).focus()}
          />
        </form>
      </div>
    </div>
  );
}
