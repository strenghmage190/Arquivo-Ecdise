import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowUpRight, Circle, FolderOpen, Image, Plus, ShieldCheck, Trash2, X, Pencil } from 'lucide-react';
import { supabase } from '../supabaseClient';
import styles from './Home.module.scss';
import Desktop from '../components/layout/Desktop';
import { createInvestigation, deleteInvestigation, updateInvestigation } from '../api/investigations';

import artSangue from '../../assets/ordem/Altera3Fes_de_Sangue_em_Sobrevivendo_ao_Horror.webp';
import artMorte from '../../assets/ordem/Altera3Fes_de_Morte_em_Sobrevivendo_ao_Horror.webp';
import artConhecimento from '../../assets/ordem/Altera3Fes_de_Conhecimento_em_Sobrevivendo_ao_Horror.webp';
import artEnergia from '../../assets/ordem/Altera3Fes_de_Energia_em_Sobrevivendo_ao_Horror.webp';
import artMedo from '../../assets/ordem/Medo.webp';
import artMedoAlt from '../../assets/ordem/Medo_alt.webp';
import baseSangue from '../../assets/ordem/Sangue.webp';
import baseMorte from '../../assets/ordem/Morte.webp';
import baseConhecimento from '../../assets/ordem/Conhecimento.webp';
import baseEnergia from '../../assets/ordem/Energia.webp';

const ARCHIVE_ART = {
  hero: baseSangue,
  sangue: baseSangue,
  morte: baseMorte,
  conhecimento: baseConhecimento,
  energia: baseEnergia,
  medo: artMedo,
  medo_alt: artMedoAlt,
  sangue_alt: artSangue,
  morte_alt: artMorte,
  conhecimento_alt: artConhecimento,
  energia_alt: artEnergia,
} as const;

const CASE_ART = [
  { key: 'sangue', label: 'SANGUE', short: 'SAN', src: ARCHIVE_ART.sangue },
  { key: 'morte', label: 'MORTE', short: 'MOR', src: ARCHIVE_ART.morte },
  { key: 'conhecimento', label: 'CONHECIMENTO', short: 'CON', src: ARCHIVE_ART.conhecimento },
  { key: 'energia', label: 'ENERGIA', short: 'ENE', src: ARCHIVE_ART.energia },
  { key: 'medo', label: 'MEDO', short: 'MED', src: ARCHIVE_ART.medo },
] as const;

const HERO_CONTENT = [
  { art: 'sangue', key: 'sangue', label: 'SANGUE', title1: 'O que foi ocultado', title2: 'deixa vestígio.' },
  { art: 'sangue_alt', key: 'sangue', label: 'SANGUE', title1: 'A carne se contorce', title2: 'e a dor ensina.' },
  { art: 'morte', key: 'morte', label: 'MORTE', title1: 'O tempo distorce', title2: 'o que já pereceu.' },
  { art: 'morte_alt', key: 'morte', label: 'MORTE', title1: 'Cinzas ao vento', title2: 'do fim inevitável.' },
  { art: 'conhecimento', key: 'conhecimento', label: 'CONHECIMENTO', title1: 'A verdade enlouquece', title2: 'quem tenta entender.' },
  { art: 'conhecimento_alt', key: 'conhecimento', label: 'CONHECIMENTO', title1: 'O saber absoluto', title2: 'exige sacrifícios.' },
  { art: 'energia', key: 'energia', label: 'ENERGIA', title1: 'O caos se espalha', title2: 'sem pedir licença.' },
  { art: 'energia_alt', key: 'energia', label: 'ENERGIA', title1: 'A fúria elétrica', title2: 'não pode ser contida.' },
  { art: 'medo', key: 'medo', label: 'MEDO', title1: 'O terror ancestral', title2: 'nunca desaparece.' },
  { art: 'medo_alt', key: 'medo', label: 'MEDO', title1: 'O medo é', title2: 'infinito.' },
];

const CASE_EVOLUTIONS = [
  'METAMORFOSE',
  'ENCARNAÇÃO',
  'APOTEOSE',
  'SÍNTESE',
  'QUIMERA',
  'SINGULARIDADE',
] as const;

type CaseElement = (typeof CASE_ART)[number]['key'];
type CaseEvolution = (typeof CASE_EVOLUTIONS)[number];
type CaseClassification = { element: CaseElement; evolution?: CaseEvolution };

const CLASSIFICATIONS_STORAGE_KEY = 'cris-case-classifications';

function readCaseClassifications(): Record<string, CaseClassification> {
  try {
    return JSON.parse(window.localStorage.getItem(CLASSIFICATIONS_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function getCaseArt(id: unknown, element?: string | null) {
  const elementalArt = CASE_ART.find((art) => art.key === element);
  if (elementalArt) return elementalArt;

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
  const [newElement, setNewElement] = useState<CaseElement | ''>('');
  const [newEvolution, setNewEvolution] = useState<CaseEvolution | ''>('');
  const [creating, setCreating] = useState(false);
  const [heroElement, setHeroElement] = useState(HERO_CONTENT[0]);
  const [imageMode, setImageMode] = useState<'default' | 'url' | 'upload'>('default');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingCaseId, setEditingCaseId] = useState<string | null>(null);

  useEffect(() => {
    setHeroElement(HERO_CONTENT[Math.floor(Math.random() * HERO_CONTENT.length)]);
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
      const classifications = readCaseClassifications();
      setCases(((res.data as any[]) || []).map((currentCase: any) => {
        let coverUrl = currentCase.cover_url;
        if (coverUrl && coverUrl.includes('cdn.builder.io')) {
          coverUrl = null;
        }
        return {
          ...currentCase,
          cover_url: coverUrl,
          ...(classifications[String(currentCase.id)] || {}),
        };
      }));
    }
  }

  async function handleCreate() {
    const title = newTitle.trim();
    if (!title || !newElement) return;
    setCreating(true);
    try {
      let targetId = editingCaseId;
      if (editingCaseId) {
        await updateInvestigation(editingCaseId, { title, description: newDescription.trim() || null, cover_url: coverUrl.trim() || null });
      } else {
        const created = await createInvestigation(title, newDescription.trim() || undefined, coverUrl.trim() || undefined);
        targetId = created?.id;
      }
      if (targetId) {
        const newId = String(targetId).split(':')[0];
        const classifications = readCaseClassifications();
        classifications[newId] = {
          element: newElement,
          ...(newEvolution ? { evolution: newEvolution } : {}),
        };
        window.localStorage.setItem(CLASSIFICATIONS_STORAGE_KEY, JSON.stringify(classifications));
        setShowCreateModal(false);
        await fetchCases();
        if (!editingCaseId) navigate(`/case/${newId}`);
      }
    } catch (error) {
      alert('Erro ao salvar caso');
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Apagar este caso? Essa ação é irreversível.')) return;
    try {
      await deleteInvestigation(id);
      const classifications = readCaseClassifications();
      delete classifications[String(id).split(':')[0]];
      window.localStorage.setItem(CLASSIFICATIONS_STORAGE_KEY, JSON.stringify(classifications));
      await fetchCases();
    } catch (error) {
      alert('Erro ao apagar caso. Verifique permissões.');
    }
  }

  function openCase(id: unknown) {
    navigate(`/case/${String(id).split(':')[0]}`);
  }

  function openCreateModal() {
    setEditingCaseId(null);
    setNewTitle('');
    setNewDescription('');
    setCoverUrl('');
    setNewElement('');
    setNewEvolution('');
    setImageMode('default');
    setUploadingImage(false);
    setShowCreateModal(true);
  }

  function openEditModal(caseData: any) {
    setEditingCaseId(caseData.id);
    setNewTitle(caseData.title || '');
    setNewDescription(caseData.description || '');
    setCoverUrl(caseData.cover_url || '');
    setNewElement(caseData.element || '');
    setNewEvolution(caseData.evolution || '');
    const isDefault = !caseData.cover_url || Object.values(ARCHIVE_ART).includes(caseData.cover_url);
    setImageMode(isDefault ? 'default' : (caseData.cover_url?.includes('supabase') ? 'upload' : 'url'));
    setUploadingImage(false);
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
              <div className={styles['eyebrow']}>ARQUIVOS // DIVISÃO FORENSE</div>
              <h1>ARQUIVOS DA ORDEM</h1>
            </div>
          </div>
          <div className={styles['header-readout']} aria-label="Estado do arquivo">
            <div className={styles['element-radar']} aria-label="Radar elemental">
              {CASE_ART.map((element) => (
                <span key={element.key} className={styles['radar-node']} data-spectrum={element.key} title={element.label}>
                  <Circle size={10} />
                  <span>{element.short}</span>
                </span>
              ))}
            </div>
            <div className={styles['membrane-readout']}>
              <span>MEMBRANA LOCAL</span>
              <strong>99.4%</strong>
            </div>
            <div className={styles['archive-readout-meta']}>
              <span><ShieldCheck size={13} /> ACESSO INSTITUCIONAL</span>
              <span>{String(cases.length).padStart(2, '0')} REGISTROS ATIVOS</span>
            </div>
          </div>
        </header>

        <section className={styles['archive-hero']} aria-labelledby="home-hero-title">
          <div className={styles['hero-copy']}>
            <div className={styles['hero-kicker']}><FolderOpen size={14} /> CENTRAL DE INVESTIGAÇÕES</div>
            <h2 id="home-hero-title">{heroElement.title1}<br /><em style={{ color: `var(--home-${heroElement.key})` }}>{heroElement.title2}</em></h2>
            <p>Reúna pistas, preserve versões e acompanhe a ruptura antes que ela encontre o próximo agente.</p>
            <button type="button" className={styles['primary-action']} onClick={openCreateModal}>
              <Plus size={16} /> ABRIR NOVO CASO
            </button>
          </div>
          <div className={styles['hero-art']}>
            <img src={ARCHIVE_ART[heroElement.art as keyof typeof ARCHIVE_ART]} alt={`Alterações de ${heroElement.key} em quatro estágios`} />
            <div className={styles['hero-art-label']}>
              <span>PLACA DE REFERÊNCIA 01</span>
              <strong style={{ color: `var(--home-${heroElement.key})` }}>ALTERAÇÃO // {heroElement.label}</strong>
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
              const art = getCaseArt(currentCase.id || index, currentCase.element);
              const cleanId = String(currentCase.id).split(':')[0];
              return (
                <article
                  key={currentCase.id}
                  className={styles['case-card']}
                  data-spectrum={art.key}
                  onClick={() => openCase(currentCase.id)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      openCase(currentCase.id);
                    }
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
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        className={styles['case-delete']}
                        title="Editar caso"
                        aria-label={`Editar caso ${currentCase.title}`}
                        onClick={(event) => {
                          event.stopPropagation();
                          openEditModal(currentCase);
                        }}
                      >
                        <Pencil size={14} />
                      </button>
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
                  </div>
                  <div className={styles['case-card-body']}>
                    <span className={styles['case-element']}><Image size={12} /> {art.label}</span>
                    {currentCase.evolution && <span className={styles['case-evolution']}>{currentCase.evolution}</span>}
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

        <footer className={styles['telemetry-ticker']} aria-label="Telemetria da Ordem">
          <span className={styles['telemetry-label']}>LOG DO OUTRO LADO</span>
          <div className={styles['telemetry-track']}>
            <span>[21:44] Flutuação paranormal detectada no Setor Leste</span>
            <span>[21:47] Membrana local estabilizada em 99.4%</span>
            <span>[21:52] Nenhuma autorização pendente no arquivo central</span>
          </div>
        </footer>
      </main>

      {showCreateModal && (
        <div className={styles['quick-modal']} role="dialog" aria-modal="true" aria-labelledby="create-case-title" onClick={() => setShowCreateModal(false)}>
          <div className={styles['quick-modal-card']} onClick={(event) => event.stopPropagation()}>
            <div className={styles['quick-modal-header']}>
              <div>
                <div className={styles['eyebrow']}>PROTOCOLO // {editingCaseId ? 'ATUALIZAÇÃO' : 'ABERTURA'}</div>
                <h2 id="create-case-title">{editingCaseId ? 'Editar caso' : 'Novo caso'}</h2>
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
            <label htmlFor="case-element">Elemento atribuído</label>
            <select
              id="case-element"
              className={styles['quick-select']}
              value={newElement}
              onChange={(event) => setNewElement(event.target.value as CaseElement | '')}
              required
            >
              <option value="">Selecionar Elemento</option>
              {CASE_ART.map((element) => <option key={element.key} value={element.key}>{element.label}</option>)}
            </select>
            <label htmlFor="case-evolution">Evolução planejada <span>(opcional)</span></label>
            <select
              id="case-evolution"
              className={styles['quick-select']}
              value={newEvolution}
              onChange={(event) => setNewEvolution(event.target.value as CaseEvolution | '')}
            >
              <option value="">Manter em observação</option>
              {CASE_EVOLUTIONS.map((evolution) => <option key={evolution} value={evolution}>{evolution}</option>)}
            </select>
            <label htmlFor="case-description">Descrição</label>
            <textarea
              id="case-description"
              className={styles['quick-textarea']}
              placeholder="Resumo curto do caso"
              value={newDescription}
              onChange={(event) => setNewDescription(event.target.value)}
              rows={3}
            />
            <label>Imagem de capa (opcional)</label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', fontSize: '11px', color: 'var(--home-muted)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="imgMode" checked={imageMode === 'default'} onChange={() => { setImageMode('default'); setCoverUrl(''); }} /> Padrão
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="imgMode" checked={imageMode === 'url'} onChange={() => setImageMode('url')} /> Link da Web
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                <input type="radio" name="imgMode" checked={imageMode === 'upload'} onChange={() => setImageMode('upload')} /> Enviar Arquivo
              </label>
            </div>
            {imageMode === 'default' && (
              <div 
                style={{ 
                  display: 'flex', 
                  gap: '8px', 
                  marginBottom: '16px', 
                  overflowX: 'auto', 
                  paddingBottom: '8px',
                  scrollbarWidth: 'thin',
                  scrollbarColor: 'var(--home-muted) transparent'
                }}
              >
                {Object.entries(ARCHIVE_ART).map(([key, src]) => {
                  const isSelected = coverUrl === src || (!coverUrl && key === newElement);
                  return (
                    <button 
                      key={key} 
                      type="button"
                      onClick={() => setCoverUrl(src)}
                      style={{ 
                        flex: '0 0 70px',
                        padding: 0, 
                        border: isSelected ? '2px solid var(--nexus-blue)' : '2px solid transparent', 
                        background: 'none', 
                        cursor: 'pointer',
                        opacity: isSelected ? 1 : 0.6,
                        transition: 'all 0.2s ease',
                        borderRadius: '4px',
                        overflow: 'hidden'
                      }}
                      title={key}
                    >
                      <img src={src} alt={key} style={{ width: '100%', height: '48px', objectFit: 'cover', display: 'block' }} />
                    </button>
                  );
                })}
              </div>
            )}
            {imageMode === 'url' && (
              <input
                className={styles['quick-input']}
                placeholder="https://..."
                value={coverUrl}
                onChange={(event) => setCoverUrl(event.target.value)}
              />
            )}
            {imageMode === 'upload' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '8px' }}>
                <input
                  type="file"
                  accept="image/*"
                  className={styles['quick-input']}
                  disabled={uploadingImage}
                  style={{ padding: '8px' }}
                  onChange={async (event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    setUploadingImage(true);
                    try {
                      const fileExt = file.name.split('.').pop();
                      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
                      const path = `case-covers/${fileName}`;
                      const { error } = await supabase.storage.from('investigation-assets').upload(path, file);
                      if (error) throw error;
                      const { data } = supabase.storage.from('investigation-assets').getPublicUrl(path);
                      setCoverUrl(data.publicUrl);
                    } catch (error) {
                      console.error(error);
                      alert('Erro ao enviar imagem');
                    } finally {
                      setUploadingImage(false);
                    }
                  }}
                />
                {uploadingImage && <small style={{ color: 'var(--home-muted)' }}>Enviando arquivo...</small>}
                {coverUrl && !uploadingImage && <small style={{ color: 'var(--home-conhecimento)' }}>Arquivo enviado com sucesso!</small>}
              </div>
            )}
            <div className={styles['quick-actions']}>
              <button type="button" className={styles['secondary-action']} onClick={() => setShowCreateModal(false)}>CANCELAR</button>
              <button type="button" className={styles['primary-action']} disabled={!newTitle.trim() || !newElement || creating} onClick={handleCreate}>
                {creating ? 'SALVANDO...' : editingCaseId ? 'SALVAR ALTERAÇÕES' : 'INICIAR PROTOCOLO'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
