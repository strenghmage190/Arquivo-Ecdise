import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LocateFixed, Search, X } from 'lucide-react';
import { Virtuoso } from 'react-virtuoso';
import './TerminalSearch.css';

declare global {
  interface Window {
    crisConsole?: any;
  }
}

interface Props {
  onSearch: (query: string) => Promise<void>;
  onClose?: () => void;
  cards?: any[];
  onSelectCard?: (cardId: string) => void;
}

export default function TerminalSearch({ onSearch, onClose, cards = [], onSelectCard }: Props) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);

  const localMatches = useMemo(() => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed || !cards.length) return [];
    return cards
      .filter((c) => {
        if (!c) return false;
        const title = String(c.title || '').toLowerCase();
        const desc = String(c.description_public || c.description || '').toLowerCase();
        const tags = Array.isArray(c.tags) ? c.tags.join(' ').toLowerCase() : '';
        return title.includes(trimmed) || desc.includes(trimmed) || tags.includes(trimmed);
      })
      .slice(0, 12);
  }, [q, cards]);

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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

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
    return () => {
      if ((window as any).crisConsole === api) {
        (window as any).crisConsole = undefined;
      }
    };
  }, [history, onClose, submit]);

  return (
    <div className="terminal-search-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}>
      <div className="terminal-search" role="dialog" aria-modal="true" aria-label="C.R.I.S. Busca de Arquivos">
        <div className="terminal-header">
          <div className="term-title">
            <Search size={13} /> C.R.I.S. // BUSCA DE ARQUIVOS
          </div>
          <button type="button" className="term-close" onClick={onClose} aria-label="Fechar busca">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={submit} className="term-form">
          <label htmlFor="cris-search-input" className="term-label">&gt; palavra-chave ou código oculto:</label>
          <input
            id="cris-search-input"
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="term-input"
            placeholder="ex: Lilian, telefone, código..."
            autoComplete="off"
          />
          <div className="term-actions">
            <button type="submit" className="term-go" disabled={busy}>
              {busy ? 'BUSCANDO...' : 'PESQUISAR'}
            </button>
            <button type="button" className="term-cancel" onClick={onClose}>
              FECHAR
            </button>
          </div>
          {message && <div className="term-message">{message}</div>}
        </form>

        {localMatches.length > 0 && onSelectCard && (
          <div className="term-matches">
            <div className="term-history-title">PISTAS NO QUADRO ({localMatches.length})</div>
            <div className="term-matches-list">
              {localMatches.map((card) => (
                <button
                  key={card.id}
                  type="button"
                  className="term-match-item"
                  onClick={() => {
                    onSelectCard(card.id);
                    onClose?.();
                  }}
                >
                  <span className="term-match-title">{card.title || 'Sem título'}</span>
                  <span className="term-match-go">
                    <LocateFixed size={12} /> IR
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {history.length > 0 && (
          <div className="term-history">
            <div className="term-history-title">ÚLTIMAS CONSULTAS</div>
            <div className="term-history-list" style={{ height: Math.min(180, history.length * 36 + 12) }}>
              <Virtuoso
                data={history}
                itemContent={(_, item) => (
                  <button
                    type="button"
                    className="term-chip"
                    onClick={() => submit(undefined, item)}
                    disabled={busy}
                    style={{ display: 'block', width: '100%', marginBottom: '4px' }}
                  >
                    {item}
                  </button>
                )}
              />
            </div>
          </div>
        )}

        <div className="term-hints">
          <div className="term-hints-title">ATALHOS DE CONSOLE</div>
          <div className="term-hints-body">
            <div>crisConsole.search(&apos;dossie&apos;)</div>
            <div>crisConsole.prefill(&apos;pista oculta&apos;)</div>
            <div>crisConsole.history()</div>
          </div>
        </div>
      </div>
    </div>
  );
}
