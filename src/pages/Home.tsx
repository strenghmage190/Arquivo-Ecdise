import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Home.css';

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
    const { data } = await supabase
      .from('investigations')
      .select('*')
      .order('created_at', { ascending: false });
    setCases(data || []);
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
    <div className="home-screen" style={{ background: '#1a1a1a', minHeight: '100vh', padding: 40, color: '#e0e0e0', fontFamily: 'Courier Prime, monospace' }}>
      <button onClick={handleLogout} style={{ position: 'fixed', top: 20, right: 20, background: '#b33', color: '#fff', border: 'none', padding: '10px 14px', cursor: 'pointer', borderRadius: 4, zIndex: 60 }}>
        SAIR DO SISTEMA
      </button>
      <h1 style={{ borderBottom: '2px solid #b33', paddingBottom: 10 }}>ARQUIVOS DA ORDEM</h1>
      
      <div style={{ marginTop: 30, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 20 }}>
        
        {/* Botão Novo Caso */}
        <div 
          onClick={handleCreate}
          style={{ 
            border: '2px dashed #444', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            cursor: 'pointer', 
            height: 180,
            borderRadius: 4
          }}
        >
          <span style={{ fontSize: 24 }}>+ NOVO CASO</span>
        </div>

        {/* Lista de Casos */}
        {cases.map(c => (
          <div 
            key={c.id} 
            onClick={() => { const clean = String(c.id).split(':')[0]; navigate(`/case/${clean}`); }}
            style={{ 
              background: '#222', 
              border: '1px solid #444', 
              padding: 20, 
              cursor: 'pointer',
              height: 180,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
          >
            <div>
              <div style={{ color: '#b33', fontSize: 12, marginBottom: 5 }}>CONFIDENCIAL</div>
              <h2 style={{ fontSize: 18, margin: 0 }}>{c.title}</h2>
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {new Date(c.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
