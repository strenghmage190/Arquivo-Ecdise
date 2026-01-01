import React, { useEffect, useMemo, useState } from 'react';
import './BootScreen.css';

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const bootLog = useMemo(
    () => [
      'INICIANDO SISTEMA C.R.I.S. v0.9.4... ',
      'CARREGANDO KERNEL... [OK]',
      'MONTANDO SISTEMA DE ARQUIVOS CRIPTOGRAFADOS...',
      'ESTABELECENDO CONEXÃO SEGURA... (A.R.P. NET)',
      'VERIFICANDO INTEGRIDADE DA MEMBRANA...',
      'ALERTA: ENTROPIA ELEVADA // AJUSTANDO...',
      'CARREGANDO MÓDULOS DE INVESTIGAÇÃO...',
      'USUÁRIO RECONHECIDO // TOKEN VÁLIDO',
      'BEM-VINDO, AGENTE.'
    ],
    []
  );

  const progress = Math.min(lines.length / bootLog.length, 1);

  useEffect(() => {
    const timeouts: number[] = [];
    let delay = 0;

    bootLog.forEach((line) => {
      delay += Math.random() * 500 + 220;
      const id = window.setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, delay);
      timeouts.push(id);
    });

    const finishId = window.setTimeout(() => {
      setLoading(false);
      const doneId = window.setTimeout(() => onComplete(), 520);
      timeouts.push(doneId);
    }, delay + 900);
    timeouts.push(finishId);

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, [bootLog, onComplete]);

  return (
    <div className={`boot-screen ${!loading ? 'fade-out' : ''}`}>
      <div className="boot-glow" aria-hidden="true" />
      <div className="boot-grid" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />

      <div className="boot-frame">
        <div className="boot-header">
          <div className="boot-brand">
            <div className="brand-mark">ORDO<span> REALITAS</span></div>
            <div className="brand-sub">C.R.I.S // canal seguro</div>
          </div>
          <div className="boot-tags">
            <span className="tag tag-primary">NO CR-07</span>
            <span className="tag tag-accent">SINCRONIA {Math.round(progress * 100)}%</span>
          </div>
        </div>

        <div className="boot-content">
          <div className="terminal">
            <div className="terminal-header">
              <span>BOOT CONSOLE</span>
              <span className="indicator"><span className="dot pulse"></span> enlace estável</span>
            </div>
            <div className="terminal-lines">
              {lines.map((l, i) => (
                <div key={i} className="line">
                  <span className="caret">&gt;</span>
                  <span className="text">{l}</span>
                </div>
              ))}
              {loading && (
                <div className="line typing">
                  <span className="caret">&gt;</span>
                  <span className="text">_</span>
                </div>
              )}
            </div>
          </div>

          <div className="telemetry">
            <div className="telemetry-card">
              <div className="label">Sincronização</div>
              <div className="stat-bar">
                <div className="stat-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="meta-row">
                <span>Kernel</span>
                <span>{Math.round(progress * 100)}%</span>
              </div>
            </div>

            <div className="telemetry-grid">
              <div className="meta">
                <span className="meta-label">Criptografia</span>
                <span className="meta-value">AES-512 // PRIME</span>
              </div>
              <div className="meta">
                <span className="meta-label">Canal</span>
                <span className="meta-value">A.R.P. NET</span>
              </div>
              <div className="meta">
                <span className="meta-label">Integridade</span>
                <span className="meta-value ok">Estável</span>
              </div>
              <div className="meta">
                <span className="meta-label">Entropia</span>
                <span className="meta-value warn">Alta</span>
              </div>
            </div>
          </div>
        </div>

        <div className="boot-footer">
          <div className="footer-left">
            <span className="dot pulse"></span>
            <span>Compilando heurísticas / preparando board</span>
          </div>
          <div className="loading-bar-container">
            <div className="loading-bar" style={{ width: `${progress * 100}%` }}></div>
          </div>
        </div>
      </div>
    </div>
  );
}
