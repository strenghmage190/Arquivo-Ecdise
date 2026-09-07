import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Folder, Skull, Radio, User } from 'lucide-react';
import { supabase } from '../supabaseClient';
import styles from './Home.module.scss';
import ordoCrest from '../../assets/ordem/Simbolo da Ordem.png';
import Desktop from '../components/layout/Desktop';
import Button from '../components/ui/Button';
import { createInvestigation, deleteInvestigation } from '../api/investigations';

function generateDossierCode(title: string, id: string) {
  const words = title.split(' ').filter(w => w.length > 2).slice(0, 2);
  const initials = words.map(w => w[0].toUpperCase()).join('');
  const suffix = String(id).slice(0, 4).toUpperCase();
  return `#${initials || 'CX'}-${suffix}`;
}

function getCaseElement(id: string) {
  const elements = ['sangue', 'morte', 'energia', 'conhecimento'];
  const hash = String(id).split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  return elements[hash % 4];
}

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
      <div className={styles['home-nav-left']}>
        <button className="nav-btn" title="Arquivos" onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'files' } }))}>
          <span aria-hidden><Folder className="lucide-icon inline-icon" size={16} /></span>
        </button>
        <button className="nav-btn" title="Terminal C.R.I.S." onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'terminal' } }))}>
          <span aria-hidden><Skull className="lucide-icon inline-icon" size={16} /></span>
        </button>
        <button className="nav-btn" title="Conexão Remota" onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'net' } }))}>
          <span aria-hidden><Radio className="lucide-icon inline-icon" size={16} /></span>
        </button>
        <button className="nav-btn" title="Perfil do Agente" onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'profile' } }))}>
          <span aria-hidden><User className="lucide-icon inline-icon" size={16} /></span>
        </button>
      </div>
      <div className={styles['home-nav-right']}>
        <button className="btn-logout" onClick={handleLogout}>SAIR DO SISTEMA</button>
      </div>

      <Desktop cases={cases} />
      <div className={styles['ordo-header']}>
        <img src={ordoCrest} alt="Ordo Realitas" className={styles['ordo-crest']} />
        <div className={styles['ordo-title-group']}>
          <h1 className="font-oculto">ARQUIVOS</h1>
          <h2 className="font-terminal text-secondary">// DIVISÃO FORENSE</h2>
        </div>
      </div>

          <div className={styles['case-grid']}>
        {/* Botão Novo Caso restaurado */}
        <div onClick={() => { setShowCreateModal(true); setNewTitle(''); }} className={styles['case-new-card']}>
          <span>+ NOVO CASO</span>
          <small>Iniciar investigação</small>
        </div>

        {/* Lista de Casos */}
        {cases.map(c => {
          const element = getCaseElement(c.id);
          const dossieCode = generateDossierCode(c.title, c.id);
          return (
          <div key={c.id} className={styles['case-card']} style={{ '--card-color': `var(--el-${element})` } as React.CSSProperties} onClick={() => { const clean = String(c.id).split(':')[0]; navigate(`/case/${clean}`); }}>
            {c.cover_url && <div className={styles['case-cover']} style={{ backgroundImage: `url(${c.cover_url})` }} aria-hidden />}
            <div className={styles['elemental-badge']} title={`Elemento Principal: ${element.toUpperCase()}`} />
            <Button variant="caseDelete" title="Apagar caso" onClick={(e) => { e.stopPropagation(); handleDelete(c.id); }}>✕</Button>
            
            <div className={styles['case-content']}>
              <div className={`${styles['dossier-code']} font-terminal`}>{dossieCode}</div>
              <h2>{c.title}</h2>
              {c.description && <p className={styles['case-desc']}>{c.description}</p>}
              <div className={styles['paranormal-meta']}>
                <span>AMEAÇA: DESCONHECIDA</span>
                <span>EVIDÊNCIAS: 12</span>
              </div>
            </div>
            <div className={`${styles['case-footer']} font-documento`}>{new Date(c.created_at).toLocaleDateString()}</div>
          </div>
        )})}
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

      <div className={styles['telemetry-footer']}>
        <div className={styles['ticker-wrap']}>
          <div className={`font-terminal ${styles['ticker-content']}`}>
            SISTEMA ONLINE... SINCRONIZANDO EVIDÊNCIAS... STATUS DA MEMBRANA: ESTÁVEL... ACESSO RESTRITO...
          </div>
        </div>
      </div>
    </div>
  );
}
