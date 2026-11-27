import { Folder, Skull, Radio, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../../supabaseClient';
import { eventManager } from '../../utils/EventManager';
import { audioManager } from '../../utils/AudioManager';
import { isExtendedPerformanceMode, isPerformanceMode } from '../../utils/performance';
import './SystemOverlays.css';

// Singleton counter para evitar múltiplas instâncias registrarem listeners duplicados
let systemOverlaysInstanceCount = 0;

export type MembraneUrgency = 'calm' | 'amber' | 'crimson';

export function getMembraneUrgency(percent: number): MembraneUrgency {
  const clamped = Math.max(0, Math.min(100, percent));
  if (clamped >= 80) return 'crimson';
  if (clamped >= 50) return 'amber';
  return 'calm';
}

export function getMembraneColor(urgency: MembraneUrgency): string {
  switch (urgency) {
    case 'crimson':
      return '#e63946';
    case 'amber':
      return '#f59e0b';
    default:
      return '#10b981';
  }
}

export default function SystemOverlays() {
  const monitorRef = useRef<HTMLDivElement | null>(null);
  const integrityRef = useRef<HTMLDivElement | null>(null);
  const integrityTextRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [hideHeader, setHideHeader] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const instanceIdRef = useRef<number>(-1);
  const isAuthPage = location.pathname === '/login' || location.pathname === '/reset-password';
  const isHomePage = location.pathname === '/';

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Sign out error:', err);
      toast.error('Falha ao encerrar sessão. Tente novamente.');
    } finally {
      setSigningOut(false);
    }
  };

  // Registra instância única ao montar
  useEffect(() => {
    systemOverlaysInstanceCount++;
    instanceIdRef.current = systemOverlaysInstanceCount;

    return () => {
      systemOverlaysInstanceCount--;
    };
  }, []);

  // Listen for modal open/close events via EventManager (apenas a primeira instância)
  useEffect(() => {
    const isFirstInstance = instanceIdRef.current === 1;
    if (!isFirstInstance) return;

    const unsubscribeOpen = eventManager.on('modal:opened', () => setHideHeader(true));
    const unsubscribeClose = eventManager.on('modal:closed', () => setHideHeader(false));
    const unsubscribeHeaderToggle = eventManager.on('header:toggle', (show: boolean) => setHideHeader(!show));

    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeHeaderToggle();
    };
  }, []);

  // Membrane tension simulation (0–49% verde/ciano, 50–79% âmbar, 80–100% carmesim crítico)
  useEffect(() => {
    let alive = true;
    const initialValue = 99.4;

    function setMembraneReading(v: number) {
      const clamped = Math.max(0, Math.min(100, v));
      const urgency = getMembraneUrgency(clamped);
      const dynamicColor = getMembraneColor(urgency);
      const isCritical = urgency === 'crimson';

      if (monitorRef.current) {
        monitorRef.current.dataset.urgency = urgency;
      }
      if (integrityRef.current) {
        integrityRef.current.style.width = `${clamped}%`;
        integrityRef.current.style.backgroundColor = dynamicColor;
        integrityRef.current.classList.toggle('danger', isCritical);
      }
      if (integrityTextRef.current) {
        integrityTextRef.current.innerText = `${clamped.toFixed(1)}%`;
        integrityTextRef.current.style.color = dynamicColor;
      }

      window.dispatchEvent(
        new CustomEvent('ordo:membrane-state', {
          detail: { state: urgency, value: clamped },
        })
      );
    }

    setMembraneReading(initialValue);

    if (isExtendedPerformanceMode()) {
      return () => {
        alive = false;
      };
    }

    let spikeTimeout: number | null = null;
    const tick = () => {
      if (!alive) return;
      const base = 99.2 + Math.random() * 0.2;
      setMembraneReading(base);
      if (Math.random() < 0.06) {
        setMembraneReading(64 + Math.random() * 12);
        spikeTimeout = window.setTimeout(() => {
          if (alive) setMembraneReading(99.2 + Math.random() * 0.2);
        }, 900);
      }
    };

    const interval = window.setInterval(tick, 1500);
    return () => {
      alive = false;
      window.clearInterval(interval);
      if (spikeTimeout !== null) window.clearTimeout(spikeTimeout);
    };
  }, []);

  // Decode-effect delegation (com Set para cleanup correto)
  useEffect(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    const activeIntervals = new Set<number>();

    function handleOver(e: Event) {
      const target = e.currentTarget as HTMLElement;
      const original = target.dataset.value || target.innerText || '';
      let iterations = 0;

      const interval = window.setInterval(() => {
        const text = original
          .split('')
          .map((_ch, idx) => {
            if (idx < iterations) return original[idx];
            return letters[Math.floor(Math.random() * letters.length)];
          })
          .join('');

        target.innerText = text;

        if (iterations >= original.length) {
          clearInterval(interval);
          activeIntervals.delete(interval);
        }
        iterations += 1 / 3;
      }, 30) as unknown as number;

      activeIntervals.add(interval);
    }

    const elems = Array.from(document.querySelectorAll<HTMLElement>('.decode-effect'));
    elems.forEach((el) => el.addEventListener('mouseover', handleOver));

    return () => {
      elems.forEach((el) => el.removeEventListener('mouseover', handleOver));
      activeIntervals.forEach(clearInterval);
      activeIntervals.clear();
    };
  }, []);

  // AudioManager cleanup (audio permanece disabled por padrão)
  useEffect(() => {
    return () => {
      audioManager.cleanup();
    };
  }, []);

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <div className="hud-overlay-root">
        <header className={`nexus-hud ${hideHeader ? 'hidden' : ''}`}>
          <div className="hud-left">
            {isHomePage ? (
              <>
                <button
                  type="button"
                  className="nav-btn"
                  title="Arquivos"
                  aria-label="Abrir Arquivos"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'files' } }))}
                >
                  <span aria-hidden="true"><Folder className="lucide-icon inline-icon" size={16} /></span>
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  title="Terminal C.R.I.S."
                  aria-label="Abrir Terminal C.R.I.S."
                  onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'terminal' } }))}
                >
                  <span aria-hidden="true"><Skull className="lucide-icon inline-icon" size={16} /></span>
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  title="Conexão Remota"
                  aria-label="Abrir Conexão Remota"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'net' } }))}
                >
                  <span aria-hidden="true"><Radio className="lucide-icon inline-icon" size={16} /></span>
                </button>
                <button
                  type="button"
                  className="nav-btn"
                  title="Perfil do Agente"
                  aria-label="Abrir Perfil do Agente"
                  onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'profile' } }))}
                >
                  <span aria-hidden="true"><User className="lucide-icon inline-icon" size={16} /></span>
                </button>
              </>
            ) : (
              <div style={{ width: 1, height: 1 }} aria-hidden="true" />
            )}
          </div>

          <div className="hud-right">
            {!isHomePage && (
              <div
                ref={monitorRef}
                className="system-monitor"
                data-urgency="crimson"
                role="status"
                aria-live="polite"
              >
                <span className="membrane-pulse-dot" aria-hidden="true" />
                <div className="label">MEMBRANA LOCAL</div>
                <div className="bar-container">
                  <div className="fill danger" id="integrity-bar" ref={integrityRef} style={{ width: '99.4%' }} />
                </div>
                <div className="value tabular-nums" id="integrity-text" ref={integrityTextRef}>99.4%</div>
              </div>
            )}
            {isHomePage && (
              <button
                type="button"
                className="btn-logout"
                onClick={handleSignOut}
                disabled={signingOut}
              >
                {signingOut ? 'SAINDO...' : 'SAIR DO SISTEMA'}
              </button>
            )}
          </div>
        </header>
      </div>

      {isHomePage && (
        <aside className="sigil-rail" aria-hidden="true">
          <span className="sigil-rail-mark sigil-sinais">A R C H I V O</span>
          <span className="sigil-rail-mark sigil-sigilos">S I G I L O S</span>
          <span className="sigil-rail-mark sigil-sinais">O U T R O L A D O</span>
        </aside>
      )}
    </>
  );
}
