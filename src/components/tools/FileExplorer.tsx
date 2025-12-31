import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { createInvestigation } from '../../api/investigations';

export default function FileExplorer({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data } = await supabase
          .from('investigations')
          .select('*')
          .order('created_at', { ascending: false });
        if (!mounted) return;
        setCases(data || []);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('FileExplorer load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  const handleCreate = async () => {
    const name = prompt('NOME DO NOVO CASO:');
    if (!name) return;
    try {
      const created = await createInvestigation(name);
      // refresh list
      const { data } = await supabase
        .from('investigations')
        .select('*')
        .order('created_at', { ascending: false });
      setCases(data || []);
      // navigate to new case
      if (created?.id) navigate(`/case/${String(created.id).split(':')[0]}`);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('createInvestigation failed', e);
      alert('Falha ao criar caso. Veja o console para detalhes.');
    }
  };

  return (
    <div className="os-window">
      <div className="os-titlebar">
        <span>C:\ARCHIVES\CASES</span>
        <button className="os-btn-close" onClick={onClose}>X</button>
      </div>
      <div className="os-content">
        <div style={{display:'flex', gap:10, alignItems:'center', marginBottom:12}}>
          <button onClick={handleCreate} className="cris-button">[ MKDIR ] NOVO ARQUIVO</button>
          <div style={{flex:1}} />
          <div style={{color:'var(--muted)'}}>{cases.length} OBJETOS ENCONTRADOS</div>
        </div>

        {loading ? <div>LENDO DISCO...</div> : (
          <div className="files-grid">
            {cases.map((c, idx) => {
              // demo status: cycle by index
              const status = idx % 3 === 0 ? 'open' : (idx % 3 === 1 ? 'locked' : 'corrupted');
              return (
                <div key={c.id} className={`file-card ${status}`} onClick={() => {
                  // open preview modal instead of navigating directly
                  // if locked, request password
                  if (status === 'locked') {
                    const pass = prompt('INSIRA SENHA DE DESBLOQUEIO:');
                    if (pass === 'NEXUS') navigate(`/case/${String(c.id).split(':')[0]}`);
                    else alert('ACESSO NEGADO');
                    return;
                  }
                  if (status === 'corrupted') {
                    alert('DADOS CORROMPIDOS — OPERACAO NAO PERMITIDA');
                    return;
                  }
                  navigate(`/case/${String(c.id).split(':')[0]}`);
                }}>
                  {status === 'open' && <img className="file-thumb" src={`https://picsum.photos/seed/${String(c.id)}/320/160`} alt="thumb" />}
                  {status === 'locked' && <div className="lock-icon">🔒</div>}
                  {status === 'corrupted' && <div className="glitch-overlay" />}
                  <div className="file-info">
                    <h3>{status === 'locked' ? 'ARQUIVO CRIPTOGRAFADO' : (status === 'corrupted' ? 'DADOS_NÃO_EUCLIDIANOS' : String(c.title || 'SEM_NOME'))}</h3>
                    <div style={{marginTop:6}}>
                      <span className={`tag ${status==='corrupted'?'red':''}`}>{status === 'open' ? 'NEX '+(Math.floor(Math.random()*100))+'%' : (status==='locked' ? 'SIGILO MÁXIMO' : 'CORROMPIDO')}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      <div className="os-statusbar">DISK FREE: 64KB | MEM: 4096</div>
    </div>
  );
}
