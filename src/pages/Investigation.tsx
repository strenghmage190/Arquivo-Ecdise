import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getInvestigationById } from '../api';
import { InvestigationBoard } from '../components/board/InvestigationBoard';

export default function Investigation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [investigation, setInvestigation] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'monospace'
      }}>
        <div className="loading-spinner" />
        <h2 style={{marginTop: 20, color: '#b33', letterSpacing: 2}}>ACESSANDO ARQUIVOS DA ORDEM...</h2>
        <p style={{color: '#555'}}>Aguarde, calibrando a Membrana...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'monospace'
      }}>
        <h2 style={{color: '#b33'}}>ACESSO NEGADO</h2>
        <p style={{color: '#555'}}>{error}</p>
        <button onClick={() => navigate('/')} style={{ marginTop: 12, padding: '8px 12px', background: '#b33', color: '#fff', border: 'none', cursor: 'pointer' }}>Voltar</button>
      </div>
    );
  }

  if (!investigation) return <div className="container">Caso não encontrado.</div>;

  return (
    <div className="container">
      <h1>{investigation.title}</h1>
      <p>{investigation.description}</p>
      <InvestigationBoard investigationId={id as string} />
    </div>
  );
}
