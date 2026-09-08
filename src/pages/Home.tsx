import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, FolderOpen, Image, Plus, ShieldCheck, Trash2, X } from 'lucide-react';
import { supabase } from '../supabaseClient';
import styles from './Home.module.scss';
import Desktop from '../components/layout/Desktop';
import { createInvestigation, deleteInvestigation } from '../api/investigations';

const ARCHIVE_ART = {
  hero: 'https://cdn.builder.io/api/v1/image/assets%2Fb4bc12b65d81467ebb24dfe4e4692469%2Fe7ef5a85ce2149138f7aa6359c8c6e6e',
  sangue: 'https://cdn.builder.io/api/v1/image/assets%2Fb4bc12b65d81467ebb24dfe4e4692469%2Fbd1b1e72ab334e99ac89d4f65041a129',
  morte: 'https://cdn.builder.io/api/v1/image/assets%2Fb4bc12b65d81467ebb24dfe4e4692469%2F5b95b382ddba400285c5133f82db3d2e',
  conhecimento: 'https://cdn.builder.io/api/v1/image/assets%2Fb4bc12b65d81467ebb24dfe4e4692469%2F7cfe432a926148baa1f91932bfa4ee8b',
  energia: 'https://cdn.builder.io/api/v1/image/assets%2Fb4bc12b65d81467ebb24dfe4e4692469%2F83a99cbf648c481a81b23068a2c88d4b',
  medo: 'https://cdn.builder.io/api/v1/image/assets%2Fb4bc12b65d81467ebb24dfe4e4692469%2Fe041d53d3b6b426691cf8f5a76051b0d',
} as const;

const CASE_ART = [
  { key: 'sangue', label: 'SANGUE', src: ARCHIVE_ART.sangue },
  { key: 'morte', label: 'MORTE', src: ARCHIVE_ART.morte },
  { key: 'conhecimento', label: 'CONHECIMENTO', src: ARCHIVE_ART.conhecimento },
  { key: 'energia', label: 'ENERGIA', src: ARCHIVE_ART.energia },
  { key: 'medo', label: 'MEDO', src: ARCHIVE_ART.medo },
] as const;

function getCaseArt(id: unknown) {
  const source = String(id ?? '');
  const index = [...source].reduce((sum, character) => sum + character.charCodeAt(0), 0) % CASE_ART.length;
  return CASE_ART[index];
}

export default function Home() {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCases();
  }, []);

  async function fetchCases() {
    const res = await supabase
      .from('investigations')
      .select('id, title, description, cover_url, created_at, owner_id')
      .order('created_at', { ascending: false });

    if (res.error) {
      setCases([]);
    } else {
      setCases(res.data || []);
    }
  }

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title) return;
    setCreating(true);
    try {
      const created = await createInvestigation(title, newDescription.trim() || undefined, coverUrl.trim() || undefined);
      if (created?.id) {
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
    } catch (error) {
      alert('Erro ao apagar caso. Verifique permissões.');
    }
  }

  function openCase(id: unknown) {
    navigate(`/case/${String(id).split(':')[0]}`);
  }

  function openCreateModal() {
    setNewTitle('');
    setNewDescription('');
    setCoverUrl('');
    setShowCreateModal(true);
  }

  return (
    <div className={styles['home-screen']}>
      <Desktop cases={cases} />

      <main className={styles['home-shell']}>
        <header className={styles['archive-header']}>
          <div className={styles['brand-lockup']}>
            <div className={styles['title-badge']}>C.R.I.S</div>
            <div>
              <div className={styles['eyebrow']}>ORDEM // ARQUIVO CENTRAL</div>
              <h1>ARQUIVOS DA ORDEM</h1>
            </div>
          </div>
          <div className={styles['header-readout']} aria-label="Estado do arquivo">
            <span><ShieldCheck size={13} /> ACESSO INSTITUCIONAL</span>
            <span>{String(cases.length).padStart(2, '0')} REGISTROS ATIVOS</span>
          </div>
        </header>

        <section className={styles['archive-hero']} aria-labelledby="home-hero-title">
          <div className={styles['hero-copy']}>
            <div className={styles['hero-kicker']}><FolderOpen size={14} /> CENTRAL DE INVESTIGAÇÕES</div>
            <h2 id="home-hero-title">O que foi ocultado<br /><em>deixa vestígio.</em></h2>
            <p>Reúna pistas, preserve versões e acompanhe a ruptura antes que ela encontre o próximo agente.</p>
            <button type="button" className={styles['primary-action']} onClick={openCreateModal}>
              <Plus size={16} /> ABRIR NOVO CASO
            </button>
          </div>
          <div className={styles['hero-art']}>
            <img src={ARCHIVE_ART.hero} alt="Alterações de sangue em quatro estágios" />
            <div className={styles['hero-art-label']}>
              <span>PLACA DE REFERÊNCIA 01</span>
              <strong>ALTERAÇÃO // SANGUE</strong>
            </div>
          </div>
        </section>

        <section className={styles['archive-list']} aria-labelledby="case-list-title">
          <header className={styles['section-header']}>
            <div>
              <div className={styles['eyebrow']}>REGISTROS // EM OBSERVAÇÃO</div>
              <h2 id="case-list-title">Casos em investigação</h2>
            </div>
            <span className={styles['section-index']}>ARQUIVO 07 / {String(cases.length).padStart(2, '0')}</span>
          </header>

          <div className={styles['case-grid']}>
            <button type="button" className={styles['case-new-card']} onClick={openCreateModal}>
              <span className={styles['new-card-mark']}><Plus size={20} /></span>
              <strong>INICIAR INVESTIGAÇÃO</strong>
              <small>Registrar um novo caso</small>
            </button>

            {cases.map((currentCase, index) => {
              const art = getCaseArt(currentCase.id || index);
              const cleanId = String(currentCase.id).split(':')[0];
              return (
                <article
                  key={currentCase.id}
                  className={styles['case-card']}
                  data-spectrum={art.key}
                  onClick={() => openCase(currentCase.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') openCase(currentCase.id);
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Abrir caso ${currentCase.title}`}
                >
                  <div className={styles['case-art']}>
                    <img src={currentCase.cover_url || art.src} alt="" aria-hidden="true" />
                  </div>
                  <div className={styles['case-scanline']} aria-hidden="true" />
                  <div className={styles['case-card-top']}>
                    <span className={styles['case-index']}>CASO {String(index + 1).padStart(2, '0')}</span>
                    <button
                      type="button"
                      className={styles['case-delete']}
                      title="Apagar caso"
                      aria-label={`Apagar caso ${currentCase.title}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        handleDelete(currentCase.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className={styles['case-card-body']}>
                    <span className={styles['case-element']}><Image size={12} /> {art.label}</span>
                    <h3>{currentCase.title}</h3>
                    {currentCase.description && <p>{currentCase.description}</p>}
                  </div>
                  <div className={styles['case-card-footer']}>
                    <span>{new Date(currentCase.created_at).toLocaleDateString('pt-BR')}</span>
                    <span className={styles['open-case']}><ArrowUpRight size={14} /> ABRIR</span>
                  </div>
                  <span className={styles['case-id']}>ID // {cleanId.slice(0, 8)}</span>
                </article>
              );
            })}
          </div>

          {cases.length === 0 && (
            <div className={styles['empty-state']}>
              <span>NENHUM REGISTRO INDEXADO</span>
              <small>O primeiro caso ainda aguarda autorização de abertura.</small>
            </div>
          )}
        </section>
      </main>

      {showCreateModal && (
        <div className={styles['quick-modal']} role="dialog" aria-modal="true" aria-labelledby="create-case-title" onClick={() => setShowCreateModal(false)}>
          <div className={styles['quick-modal-card']} onClick={(event) => event.stopPropagation()}>
            <div className={styles['quick-modal-header']}>
              <div>
                <div className={styles['eyebrow']}>PROTOCOLO // ABERTURA</div>
                <h2 id="create-case-title">Novo caso</h2>
              </div>
              <button type="button" className={styles['modal-close']} onClick={() => setShowCreateModal(false)} aria-label="Fechar abertura de caso">
                <X size={17} />
              </button>
            </div>
            <label htmlFor="case-title">Título do caso</label>
            <input
              id="case-title"
              className={styles['quick-input']}
              placeholder="Ex: Operação Membrana"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              onKeyDown={(event) => { if (event.key === 'Enter') handleCreate(); }}
              autoFocus
            />
            <label htmlFor="case-description">Descrição</label>
            <textarea
              id="case-description"
              className={styles['quick-textarea']}
              placeholder="Resumo curto do caso"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              rows={3}
            />
            <label htmlFor="case-cover">Imagem de capa (opcional)</label>
            <input
              id="case-cover"
              className={styles['quick-input']}
              placeholder="https://..."
              value={coverUrl}
              onChange={(event) => setCoverUrl(event.target.value)}
            />
            <div className={styles['quick-actions']}>
              <button type="button" className={styles['secondary-action']} onClick={() => setShowCreateModal(false)}>CANCELAR</button>
              <button type="button" className={styles['primary-action']} disabled={!newTitle.trim() || creating} onClick={handleCreate}>
                {creating ? 'CRIANDO...' : 'INICIAR CASO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
