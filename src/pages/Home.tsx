import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Home.css';
import Desktop from '../components/layout/Desktop';
 

export default function Home() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rawFetch, setRawFetch] = useState<any>(null);
  const [showEditor, setShowEditor] = useState(false);
  

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    // Busca todas as investigações ordenadas pela mais recente
    const res = await supabase
      .from('investigations')
      .select('*')
      .order('created_at', { ascending: false });
    setRawFetch(res);
    // @ts-ignore
    if (res.error) {
      // eslint-disable-next-line no-console
      console.error('fetchCases error', res.error);
      // @ts-ignore
      setFetchError(String(res.error.message || res.error));
      // @ts-ignore
      setCases([]);
    } else {
      // @ts-ignore
      setCases(res.data || []);
      setFetchError(null);
    }
  }

  async function handleCreate() {
    const title = prompt("Nome do Novo Caso / Missão:");
    if (!title) return;

    const { data, error } = await supabase
      .from('investigations')
      .insert([{ title }])
      .select()
      .single();

    if (error) {
      alert('Erro ao iniciar caso');
    } else if (data) {
      const newId = String(data.id).split(':')[0];
      navigate(`/case/${newId}`);
    }
  }

  return (
    <div className="home-screen nexus-page">
      <Desktop cases={cases} />
      <div className="nexus-header">
        <h1 className="nexus-title">ARQUIVOS DA ORDEM</h1>
      </div>

      <div className="case-grid">
        {/* Botão Novo Caso */}
        <div onClick={handleCreate} className="case-new-card">
          <span>+ NOVO CASO</span>
        </div>

        {/* Lista de Casos */}
        {cases.map(c => (
          <div key={c.id} onClick={() => { const clean = String(c.id).split(':')[0]; navigate(`/case/${clean}`); }} className="case-card">
            <div>
              <div className="meta">CONFIDENCIAL</div>
              <h2>{c.title}</h2>
            </div>
            <div className="meta">{new Date(c.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {showEditor && (
        <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
          <div style={{width:'min(1100px,96%)'}}>
            {/* Lazy import to avoid increasing bundle for now */}
            <React.Suspense fallback={<div>Carregando editor...</div>}>
              {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
              {/* @ts-ignore */}
              {React.createElement(require('../components/tools/AudioEditor').default, { onSave: (f: File) => { console.log('saved file', f); setShowEditor(false); }, onClose: () => setShowEditor(false) })}
            </React.Suspense>
          </div>
        </div>
      )}
      {/* Terminal is available via HUD shortcuts */}
      {/* Debug panel: mostra erros de fetch e dados brutos (temporário) */}
      <div style={{ position: 'fixed', right: 20, bottom: 20, background: 'rgba(0,0,0,0.6)', color: '#9df', padding: 10, borderRadius: 6, maxWidth: 420, zIndex: 80 }}>
        <div style={{ fontSize: 12, marginBottom: 6 }}>Debug: casos carregados: <strong>{cases.length}</strong></div>
        {fetchError && <div style={{ color: '#f66', fontSize: 12 }}>Erro: {fetchError}</div>}
        {rawFetch && <details style={{ color: '#9df', fontSize: 12 }}>
          <summary>Mostrar resposta crua</summary>
          <pre style={{ maxHeight: 220, overflow: 'auto', color: '#cfeff0' }}>{JSON.stringify(rawFetch, null, 2)}</pre>
        </details>}
        <div style={{marginTop:8}}>
          <button onClick={() => setShowEditor(true)} className="btn-stamp">Abrir Editor de Áudio</button>
        </div>
      </div>
    </div>
  );
}
