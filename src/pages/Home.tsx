import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Home.css';
import Desktop from '../components/layout/Desktop';
 

export default function Home() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  

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
    if (res.error) {
      setCases([]);
    } else {
      // @ts-ignore
      setCases(res.data || []);
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
        <div className="nexus-title-wrap">
          <div className="title-badge">HQ</div>
          <h1 className="nexus-title">ARQUIVOS DA ORDEM</h1>
        </div>
        <button className="nexus-ghost" onClick={handleLogout}>SAIR</button>
      </div>

      <div className="case-grid">
        {/* Botão Novo Caso */}
        <div onClick={handleCreate} className="case-new-card">
          <span>+ NOVO CASO</span>
          <small>Iniciar investigação</small>
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

      {/* Terminal is available via HUD shortcuts */}
    </div>
  );
}
