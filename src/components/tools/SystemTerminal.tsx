import React, { useState, useEffect, useRef } from 'react';
import './SystemTerminal.css';

interface SystemTerminalProps {
  isOpen: boolean;
  onClose?: () => void;
  cards?: Array<any>;
  onOpenCard?: (card: any) => void;
  onThermalUnlock?: (keyword: string) => Promise<{ success: boolean; message: string; card?: any }>;
  onDiscoverHidden?: (code: string) => Promise<{ success: boolean; message: string; card?: any }>;
}

export default function SystemTerminal({ isOpen, onClose, cards, onOpenCard, onThermalUnlock, onDiscoverHidden }: SystemTerminalProps) {
  const [history, setHistory] = useState<string[]>(['C.R.I.S. TERMINAL [VERSÃO 4.0.2]', 'DIGITE "HELP" PARA AJUDA.']);
  const [input, setInput] = useState('');
  const [processing, setProcessing] = useState(false);
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
          '  locate <CODE> - Localiza arquivo oculto por código',
          '  thermal <KEYWORD> - Desbloqueia modo termográfico',
          '  unlock <KEYWORD> - Alias para thermal',
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
      case 'thermal':
      case 'unlock':
        if (!args[0]) {
          newHistory.push('ERRO: PALAVRA-CHAVE NECESSÁRIA.');
          newHistory.push('USO: thermal <KEYWORD>');
          setHistory(newHistory);
          setInput('');
          return;
        }
        if (onThermalUnlock) {
          setProcessing(true);
          setHistory([...newHistory, 'PROCESSANDO...']);
          setInput('');
          onThermalUnlock(args.join(' ')).then(result => {
            const finalHistory = [...newHistory];
            if (result.success) {
              finalHistory.push('═══════════════════════════════════');
              finalHistory.push('🌡️  DESBLOQUEIO TERMAL AUTORIZADO');
              finalHistory.push('═══════════════════════════════════');
              finalHistory.push(`EVIDÊNCIA: ${result.card?.title || 'DESCONHECIDA'}`);
              finalHistory.push(`STATUS: MODO TERMOGRÁFICO ATIVO`);
              finalHistory.push('═══════════════════════════════════');
            } else {
              finalHistory.push('⚠️  ACESSO NEGADO');
              finalHistory.push(result.message);
            }
            setHistory(finalHistory);
            setProcessing(false);
          }).catch(() => {
            setHistory([...newHistory, 'ERRO: FALHA NA COMUNICAÇÃO COM O SERVIDOR']);
            setProcessing(false);
          });
          return;
        } else {
          newHistory.push('ERRO: SISTEMA DE DESBLOQUEIO INDISPONÍVEL.');
        }
        break;
      case 'locate':
      case 'find':
        if (!args[0]) {
          newHistory.push('ERRO: CÓDIGO NECESSÁRIO.');
          newHistory.push('USO: locate <CODE>');
          setHistory(newHistory);
          setInput('');
          return;
        }
        if (onDiscoverHidden) {
          setProcessing(true);
          setHistory([...newHistory, 'LOCALIZANDO ARQUIVO OCULTO...']);
          setInput('');
          onDiscoverHidden(args.join(' ').toUpperCase()).then(result => {
            const finalHistory = [...newHistory];
            if (result.success) {
              finalHistory.push('═══════════════════════════════════');
              finalHistory.push('🔍 ARQUIVO ENCONTRADO');
              finalHistory.push('═══════════════════════════════════');
              finalHistory.push(`ASSET: ${result.card?.title || 'DESCONHECIDA'}`);
              finalHistory.push('DECRYPTING ON BOARD...');
              finalHistory.push('═══════════════════════════════════');
            } else {
              finalHistory.push('⚠️  ARQUIVO NÃO LOCALIZADO');
              finalHistory.push(result.message);
            }
            setHistory(finalHistory);
            setProcessing(false);
          }).catch(() => {
            setHistory([...newHistory, 'ERRO: FALHA NA BUSCA']);
            setProcessing(false);
          });
          return;
        } else {
          newHistory.push('ERRO: SISTEMA DE LOCALIZAÇÃO INDISPONÍVEL.');
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
          {history.map((line, i) => {
            // Destaque especial para linhas termais
            const isThermalLine = line.includes('🌡️') || line.includes('TERMAL') || line.includes('TERMOGRÁFICO') || line.includes('═');
            const isSuccessLine = line.includes('DESBLOQUEIO') || line.includes('AUTORIZADO');
            const className = isThermalLine || isSuccessLine ? 'term-line thermal-highlight' : 'term-line';
            return <div key={i} className={className}>{line}</div>;
          })}
          <div ref={bottomRef} />
        </div>
        <form onSubmit={handleCommand} className="terminal-input-row">
          <span>root@ordo:~#</span>
          <input
            autoFocus
            value={input}
            onChange={e => setInput(e.target.value)}
            onBlur={e => (e.target as HTMLInputElement).focus()}
            disabled={processing}
          />
        </form>
      </div>
    </div>
  );
}
