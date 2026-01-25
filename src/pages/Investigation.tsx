import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvestigationById } from '../api';
import InvestigationBoard from '../components/board/InvestigationBoard';
import BootScreen from '../components/layout/BootScreen';

export default function Investigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investigation, setInvestigation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bootDone, setBootDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    if (id) {
      getInvestigationById(id)
        .then((res) => { if (mounted) setInvestigation(res); })
        .catch((e) => { console.error(e); if (mounted) setError(String(e?.message || e)); })
        .finally(() => { if (mounted) setLoading(false); });
    } else {
      setLoading(false);
    }
    return () => { mounted = false; };
  }, [id]);

  const showBoot = loading || !bootDone;

  if (showBoot) {
    return <BootScreen onComplete={() => setBootDone(true)} />;
  }

  if (error) {
    return (
      <div className="nexus-page" style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh'}}>
        <div style={{textAlign:'center', color:'var(--nexus-blue)'}}>
          <h2 style={{color:'var(--nexus-glitch)'}}>ACESSO NEGADO</h2>
          <p style={{color:'var(--muted)'}}>{error}</p>
          <button onClick={() => navigate('/')} className="btn-cancel" style={{marginTop:12}}>Voltar</button>
        </div>
      </div>
    );
  }

  if (!investigation) return <div className="nexus-page"><div className="container">Caso não encontrado.</div></div>;

  return (
    <div className="nexus-page container">
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', gap:12}}>
        <div>
          <h1 style={{margin:0, color:'#dff'}}>{investigation.title}</h1>
          <div style={{color:'var(--muted)', fontSize:13}}>{new Date(investigation.created_at).toLocaleString()}</div>
        </div>
      </div>

      <div style={{marginTop:18}}>
        <p style={{color:'var(--muted)'}}>{investigation.description}</p>
      </div>

      <div style={{marginTop:20}}>
        <InvestigationBoard investigationId={id as string} />
      </div>
    </div>
  );
}
