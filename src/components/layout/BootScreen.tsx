import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './BootScreen.css';

import BOOT_ART from '../../../assets/ordem/Simbolo da Ordem.png';

export default function BootScreen({ onComplete }: { onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const completedRef = useRef(false);

  const finishBoot = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      window.sessionStorage.setItem('cris_boot_seen', '1');
    } catch {
      // ignore storage errors
    }
    setLoading(false);
    onComplete();
  }, [onComplete]);

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
      delay += Math.random() * 100 + 80;
      const id = window.setTimeout(() => {
        setLines((prev) => [...prev, line]);
      }, delay);
      timeouts.push(id);
    });

    const finishId = window.setTimeout(() => {
      setLoading(false);
      const doneId = window.setTimeout(() => finishBoot(), 250);
      timeouts.push(doneId);
    }, delay + 250);
    timeouts.push(finishId);

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        finishBoot();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      timeouts.forEach((t) => clearTimeout(t));
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [bootLog, finishBoot]);

  return (
    <div
      className={`boot-screen ${!loading ? 'fade-out' : ''}`}
      role="region"
      aria-label="Tela de Inicialização do Sistema"
    >
      <div className="boot-glow" aria-hidden="true" />
      <div className="boot-grid" aria-hidden="true" />
      <div className="scanline" aria-hidden="true" />

      <div className="boot-frame">
        <div className="boot-header">
          <div className="boot-brand">
            <div className="brand-mark">ORDO<span> REALITAS</span></div>
            <div className="brand-sub">C.R.I.S // canal seguro</div>
          </div>
          <div className="boot-art" aria-hidden="true">
            <img
              src={BOOT_ART}
              alt=""
              width={150}
              height={82}
              loading="eager"
            />
          </div>
          <div className="boot-tags">
            <span className="tag tag-primary">NO CR-07</span>
            <span className="tag tag-accent tabular-nums">SINCRONIA {Math.round(progress * 100)}%</span>
          </div>
        </div>

        <div className="boot-content">
          <div className="terminal">
            <div className="terminal-header">
              <span>BOOT CONSOLE</span>
              <span className="indicator"><span className="dot pulse" aria-hidden="true"></span> enlace estável</span>
            </div>
            <div
              className="terminal-lines"
              role="log"
              aria-live="polite"
              aria-relevant="additions"
            >
              {lines.map((l, i) => {
                const lineClass = l.includes('[OK]') ? 'line ok' : l.startsWith('ALERTA') ? 'line alert' : 'line';
                return (
                  <div key={i} className={lineClass}>
                    <span className="caret" aria-hidden="true">&gt;</span>
                    <span className="text">{l}</span>
                  </div>
                );
              })}
              {loading && (
                <div className="line typing" aria-hidden="true">
                  <span className="caret">&gt;</span>
                  <span className="text"><span className="terminal-cursor" /></span>
                </div>
              )}
            </div>
          </div>

          <div className="telemetry">
            <div className="telemetry-card">
              <div className="label">Sincronização</div>
              <div
                className="stat-bar"
                role="progressbar"
                aria-valuenow={Math.round(progress * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progresso da sincronização do kernel"
              >
                <div className="stat-fill" style={{ width: `${progress * 100}%` }} />
              </div>
              <div className="meta-row tabular-nums">
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
            <span className="dot pulse" aria-hidden="true"></span>
            <span>Compilando heurísticas / preparando board</span>
          </div>
          <div
            className="loading-bar-container"
            role="progressbar"
            aria-valuenow={Math.round(progress * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Inicialização global do sistema"
          >
            <div className="loading-bar" style={{ width: `${progress * 100}%` }}></div>
          </div>
          <button
            type="button"
            className="boot-skip-btn"
            onClick={finishBoot}
            aria-label="Pular inicialização"
          >
            PULAR [ESC]
          </button>
        </div>
      </div>
    </div>
  );
}
