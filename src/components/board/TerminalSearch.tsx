import React, { useCallback, useEffect, useState } from 'react';
import './TerminalSearch.css';

declare global {
  interface Window {
    crisConsole?: any;
  }
}

interface Props {
  onSearch: (query: string) => Promise<void>;
  onClose?: () => void;
}

export default function TerminalSearch({ onSearch, onClose }: Props) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const submit = useCallback(async (e?: React.FormEvent, override?: string) => {
    e?.preventDefault();
    const query = (override ?? q).trim();
    if (!query) return setMessage('Digite uma palavra-chave...');
    try {
      setBusy(true);
      setMessage(null);
      await onSearch(query);
      setHistory((prev) => [query, ...prev.filter((item) => item !== query)].slice(0, 7));
    } catch (err: any) {
      setMessage(err?.message || 'Erro na busca');
    } finally {
      setBusy(false);
    }
  }, [onSearch, q]);

  useEffect(() => {
    const api = {
      help: () => {
        console.info('[CRIS] comandos: search(q), prefill(q), message(text), clear(), history(), close()');
        return true;
      },
      search: async (value: string) => {
        setQ(value);
        return submit(undefined, value);
      },
      prefill: (value: string) => {
        setQ(value);
        return value;
      },
      message: (text: string) => {
        setMessage(text);
        return text;
      },
      clear: () => {
        setQ('');
        setMessage(null);
        setBusy(false);
        return true;
      },
      history: () => {
        console.table(history.map((h, idx) => ({ idx, query: h })));
        return history;
      },
      close: () => {
        onClose?.();
        return true;
      }
    } as any;

    (window as any).crisConsole = api;
    console.info('🛰️ CRIS console pronto. Use crisConsole.help() para ver comandos.');
    return () => {
      if ((window as any).crisConsole === api) {
        (window as any).crisConsole = undefined;
      }
    };
  }, [history, onClose, submit]);

  return (
    <div className="terminal-search">
      <div className="terminal-header">
        <div className="term-title">C.R.I.S. // BUSCA DE ARQUIVOS</div>
        <button className="term-close" onClick={onClose}>✕</button>
      </div>
      <form onSubmit={submit} className="term-form">
        <label className="term-label">&gt; digite palavra-chave:</label>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)} className="term-input" placeholder="ex: Lilian" />
        <div className="term-actions">
          <button type="submit" className="term-go" disabled={busy}>{busy ? 'BUSCANDO...' : 'PESQUISAR'}</button>
          <button type="button" className="term-cancel" onClick={onClose}>CANCELAR</button>
        </div>
        {message && <div className="term-message">{message}</div>}
      </form>

      {history.length > 0 && (
        <div className="term-history">
          <div className="term-history-title">ULTIMAS CONSULTAS</div>
          <div className="term-history-list">
            {history.map((item) => (
              <button
                key={item}
                type="button"
                className="term-chip"
                onClick={() => submit(undefined, item)}
                disabled={busy}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="term-hints">
        <div className="term-hints-title">ATALHOS DE CONSOLE</div>
        <div className="term-hints-body">
          <div>crisConsole.search('dossie')</div>
          <div>crisConsole.prefill('pista oculta')</div>
          <div>crisConsole.message('Requisitando acesso...')</div>
          <div>crisConsole.history()</div>
        </div>
      </div>
    </div>
  );
}
