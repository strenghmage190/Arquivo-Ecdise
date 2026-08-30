import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import styles from './Home.module.scss';
import Desktop from '../components/layout/Desktop';
import Button from '../components/ui/Button';
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
      .select('id, title, description, cover_url, created_at, owner_id')
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

  async function handleHomeClick() {
    navigate('/'); // Navigate to the home screen
  }

  function handleMoreOptions() {
    // removed
  }

  return (
    <div className={`${styles['home-screen']} nexus-page`}>
      <Desktop cases={cases} />
      <div className="nexus-header">
        <div className={styles['nexus-title-wrap']}>
          <div className={styles['title-badge']}>HQ</div>
          <h1 className="nexus-title">ARQUIVOS DA ORDEM</h1>
        </div>
        <div className={styles['action-bar']}>
          {/* Botões removidos */}
        </div>
      </div>

          <div className={styles['case-grid']}>
        {/* Botão Novo Caso restaurado */}
        <div onClick={() => { setShowCreateModal(true); setNewTitle(''); }} className={styles['case-new-card']}>
          <span>+ NOVO CASO</span>
          <small>Iniciar investigação</small>
        </div>

        {/* Lista de Casos */}
        {cases.map(c => (
          <div key={c.id} className={styles['case-card']} onClick={() => { const clean = String(c.id).split(':')[0]; navigate(`/case/${clean}`); }}>
            {c.cover_url && <div className={styles['case-cover']} style={{ backgroundImage: `url(${c.cover_url})` }} aria-hidden />}
            <Button variant="caseDelete" title="Apagar caso" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>✕</Button>
            <div>
              <div className={styles['meta']}>CONFIDENCIAL</div>
              <h2>{c.title}</h2>
              {c.description && <p className={styles['case-desc']}>{c.description}</p>}
            </div>
            <div className={styles['meta']}>{new Date(c.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </div>

      {/* Terminal is disponível via atalhos HUD */}

      {showCreateModal && (
        <div className={styles['quick-modal']} role="dialog" aria-modal="true" onClick={() => setShowCreateModal(false)}>
          <div className={styles['quick-modal-card']} onClick={(e) => e.stopPropagation()}>
            <div className={styles['quick-modal-header']}>
              <div className={styles['pill']}>PROTOCOLO // NOVO CASO</div>
              <Button variant="close" onClick={() => setShowCreateModal(false)}>✕</Button>
            </div>
            <label className="quick-label">Título do caso</label>
            <input
              className={styles['quick-input']}
              placeholder="Ex: Operação Membrana"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              autoFocus
            />
            <label className="quick-label">Descrição</label>
            <textarea
              className={styles['quick-textarea']}
              placeholder="Resumo curto do caso"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={3}
            />
            <label className="quick-label">Imagem de capa (URL)</label>
            <input
              className={styles['quick-input']}
              placeholder="https://..."
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
            />
            <div className={styles['quick-actions']}>
              <Button variant="ghost" onClick={() => setShowCreateModal(false)}>Cancelar</Button>
              <Button variant="solid" disabled={!newTitle.trim() || creating} onClick={handleCreate}>
                {creating ? 'CRIANDO...' : 'Iniciar Caso'}
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* more-menu removed */}
    </div>
  );
}
