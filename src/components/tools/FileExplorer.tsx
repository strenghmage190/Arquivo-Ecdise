import { AlertTriangle, FolderOpen, LockKeyhole, Plus, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { createInvestigation } from '../../api/investigations';

type CaseStatus = 'active' | 'locked' | 'corrupted';

export default function FileExplorer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadCases = async () => {
    const { data } = await supabase
      .from('investigations')
      .select('id, title, description, cover_url, created_at, owner_id')
      .order('created_at', { ascending: false });
    setCases(data || []);
  };

  useEffect(() => {
    let mounted = true;
    loadCases()
      .catch((error) => console.error('FileExplorer load error', error))
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    const name = prompt('Nome do novo caso:');
    if (!name?.trim()) return;
    try {
      const created = await createInvestigation(name.trim());
      await loadCases();
      if (created?.id) navigate(`/case/${String(created.id).split(':')[0]}`);
    } catch (error) {
      console.error('createInvestigation failed', error);
      alert('Não foi possível criar o caso.');
    }
  };

  const getStatus = (item: any): CaseStatus => {
    if (item?.is_corrupted || item?.status === 'corrupted') return 'corrupted';
    if (item?.is_locked || item?.status === 'locked') return 'locked';
    return 'active';
  };

  const openCase = (item: any, status: CaseStatus) => {
    if (status === 'locked') {
      const password = prompt('Insira a senha de desbloqueio:');
      if (password !== 'NEXUS') alert('Acesso negado.');
      else navigate(`/case/${String(item.id).split(':')[0]}`);
      return;
    }
    if (status === 'corrupted') {
      alert('Dados corrompidos — operação não permitida.');
      return;
    }
    navigate(`/case/${String(item.id).split(':')[0]}`);
  };

  return (
    <section className="os-window assets-window" aria-label="Arquivo de casos">
      <header className="os-titlebar">
        <div className="assets-window-heading">
          <span className="assets-kicker">ARQUIVO / CASOS</span>
          <strong>ASSETS</strong>
        </div>
        <button className="os-btn-close" onClick={onClose} aria-label="Fechar Assets"><X size={16} /></button>
      </header>

      <div className="os-content assets-content">
        <div className="assets-toolbar">
          <div>
            <p className="assets-eyebrow">REPOSITÓRIO DE EVIDÊNCIAS</p>
            <p className="assets-count">{cases.length} {cases.length === 1 ? 'CASO INDEXADO' : 'CASOS INDEXADOS'}</p>
          </div>
          <button onClick={handleCreate} className="cris-button"><Plus size={15} /> NOVO CASO</button>
        </div>

        {loading ? (
          <div className="assets-state">LENDO ARQUIVO<span className="assets-cursor">_</span></div>
        ) : cases.length === 0 ? (
          <div className="assets-state assets-empty">
            <FolderOpen size={24} strokeWidth={1.5} />
            <strong>NENHUM CASO INDEXADO</strong>
            <span>Crie um caso para iniciar uma nova investigação.</span>
          </div>
        ) : (
          <div className="files-grid">
            {cases.map((item) => {
              const status = getStatus(item);
              const title = status === 'locked' ? 'ARQUIVO RESTRITO' : status === 'corrupted' ? 'DADOS CORROMPIDOS' : String(item.title || 'CASO SEM NOME');
              const statusLabel = status === 'locked' ? 'ACESSO RESTRITO' : status === 'corrupted' ? 'INTEGRIDADE FALHA' : 'ATIVO';
              return (
                <button key={item.id} className={`file-card ${status}`} onClick={() => openCase(item, status)} aria-label={`Abrir ${title}`}>
                  <div className="file-card-topline"><span>CASO / {String(item.id).slice(0, 8).toUpperCase()}</span><span>{statusLabel}</span></div>
                  <div className="file-card-icon" aria-hidden="true">
                    {status === 'locked' ? <LockKeyhole size={24} /> : status === 'corrupted' ? <AlertTriangle size={24} /> : <FolderOpen size={24} />}
                  </div>
                  <div className="file-info">
                    <h3>{title}</h3>
                    <p>{item.description || 'Sem descrição registrada.'}</p>
                  </div>
                  <div className={`tag ${status === 'corrupted' ? 'red' : ''}`}>{statusLabel}</div>
                </button>
              );
            })}
          </div>
        )}
      </div>
      <footer className="os-statusbar"><span>ORDEM: MAIS RECENTES</span><span>ACESSO: AUTORIZADO</span></footer>
    </section>
  );
}
