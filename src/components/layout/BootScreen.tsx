import React, { useEffect, useState } from 'react';
import './BootScreen.css';

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const bootLog = [
    'INICIANDO SISTEMA C.R.I.S. v0.9.4...',
    'CARREGANDO KERNEL... [OK]',
    'MONTANDO SISTEMA DE ARQUIVOS CRIPTOGRAFADOS...',
    'ESTABELECENDO CONEXÃO SEGURA... (A.R.P. NET)',
    'VERIFICANDO INTEGRIDADE DA MEMBRANA...',
    'ATENÇÃO: ALTA ENTROPIA DETECTADA.',
    'CARREGANDO MÓDULOS DE INVESTIGAÇÃO...',
    'USUÁRIO RECONHECIDO.',
    'BEM-VINDO, AGENTE.'
  ];

  useEffect(() => {
    const timeouts: number[] = [];
    let delay = 0;
    bootLog.forEach((line) => {
      delay += Math.random() * 500 + 200;
      const id = window.setTimeout(() => {
        setLines(prev => [...prev, line]);
      }, delay);
      timeouts.push(id);
    });

    const finishId = window.setTimeout(() => {
      setLoading(false);
      const doneId = window.setTimeout(() => onComplete(), 500);
      timeouts.push(doneId);
    }, delay + 800);
    timeouts.push(finishId);

    return () => {
      timeouts.forEach(t => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`boot-screen ${!loading ? 'fade-out' : ''}`}>
      <div className="boot-container">
        <div className="scanline"></div>
        <div className="boot-logo">
           <span style={{color: '#b33'}}>ORDO</span> REALITAS
        </div>

        <div className="terminal-lines">
          {lines.map((l, i) => (
            <div key={i} className="line">{`> ${l}`}</div>
          ))}
          {loading && <div className="line typing">_</div>}
        </div>

        <div className="loading-bar-container">
           <div className="loading-bar" style={{ width: `${(lines.length / bootLog.length) * 100}%` }}></div>
        </div>
      </div>
    </div>
  );
}
