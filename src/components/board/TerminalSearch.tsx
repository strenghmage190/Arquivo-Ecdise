import React, { useState } from 'react';
import './TerminalSearch.css';

interface Props {
  onSearch: (query: string) => Promise<void>;
  onClose?: () => void;
}

export default function TerminalSearch({ onSearch, onClose }: Props) {
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return setMessage('Digite uma palavra-chave...');
    try {
      setBusy(true);
      setMessage(null);
      await onSearch(query);
    } catch (err: any) {
      setMessage(err?.message || 'Erro na busca');
    } finally {
      setBusy(false);
    }
  };

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
    </div>
  );
}
