import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Home.css';
import Desktop from '../components/layout/Desktop';
import { createInvestigation, deleteInvestigation } from '../api/investigations';
 

export default function Home() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [creating, setCreating] = useState(false);
  

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
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const created = await createInvestigation(title, newDescription.trim() || undefined, coverUrl.trim() || undefined);
      if (created && created.id) {
        const newId = String(created.id).split(':')[0];
        setShowCreateModal(false);
        setNewTitle('');
        setNewDescription('');
        setCoverUrl('');
        await fetchCases();
        navigate(`/case/${newId}`);
      }
    } catch (error) {
      alert('Erro ao iniciar caso');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este caso? Essa ação é irreversível.')) return;
    try {
      await deleteInvestigation(id);
      await fetchCases();
    } catch (e) {
      alert('Erro ao apagar caso. Verifique permissões.');
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
        <div className="action-bar">
          <button className="action-btn primary" onClick={() => { setShowCreateModal(true); setNewTitle(''); }}>
            <span aria-hidden>✚</span>
            NOVO CASO
          </button>
        </div>
      </div>

          <div className="case-grid">
        {/* Botão Novo Caso */}
        <div onClick={() => { setShowCreateModal(true); setNewTitle(''); }} className="case-new-card">
          <span>+ NOVO CASO</span>
          <small>Iniciar investigação</small>
        </div>

        {/* Lista de Casos */}
        {cases.map(c => (
          <div key={c.id} className="case-card" onClick={() => { const clean = String(c.id).split(':')[0]; navigate(`/case/${clean}`); }}>
            {c.cover_url && <div className="case-cover" style={{ backgroundImage: `url(${c.cover_url})` }} aria-hidden />}
            <button className="case-delete" title="Apagar caso" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>✕</button>
            <div>
              <div className="meta">CONFIDENCIAL</div>
              <h2>{c.title}</h2>
              {c.description && <p className="case-desc">{c.description}</p>}
            </div>
            <div className="meta">{new Date(c.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {/* Terminal is available via HUD shortcuts */}

      {showCreateModal && (
        <div className="quick-modal" role="dialog" aria-modal="true" onClick={() => setShowCreateModal(false)}>
          <div className="quick-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="quick-modal-header">
              <div className="pill">PROTOCOLO // NOVO CASO</div>
              <button className="close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <label className="quick-label">Título do caso</label>
            <input
              className="quick-input"
              placeholder="Ex: Operação Membrana"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              autoFocus
            />
            <label className="quick-label">Descrição</label>
            <textarea
              className="quick-textarea"
              placeholder="Resumo curto do caso"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
            />
            <label className="quick-label">Imagem de capa (URL)</label>
            <input
              className="quick-input"
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
            <div className="quick-actions">
              <button className="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</button>
              <button className="solid" disabled={!newTitle.trim() || creating} onClick={handleCreate}>
                {creating ? 'CRIANDO...' : 'Iniciar Caso'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
