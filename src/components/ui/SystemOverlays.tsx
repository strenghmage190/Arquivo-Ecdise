import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { eventManager } from '../../utils/EventManager';
import { audioManager } from '../../utils/AudioManager';

export default function SystemOverlays() {
  const integrityRef = useRef<HTMLDivElement | null>(null);
  const integrityTextRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [hideHeader, setHideHeader] = useState(false);

  // ✅ Listen for modal open/close events via EventManager
  useEffect(() => {
    const unsubscribeOpen = eventManager.on('modal:opened', () => setHideHeader(true));
    const unsubscribeClose = eventManager.on('modal:closed', () => setHideHeader(false));
    const unsubscribeHeaderToggle = eventManager.on('header:toggle', (show: boolean) => setHideHeader(!show));
    
    return () => {
      unsubscribeOpen();
      unsubscribeClose();
      unsubscribeHeaderToggle();
    };
  }, []);

  // Integrity simulation
  useEffect(() => {
    let alive = true;
    let current = 99.4;
    function setIntegrity(v: number, danger = false) {
      current = v;
      if (integrityRef.current) integrityRef.current.style.width = `${v}%`;
      if (integrityTextRef.current) integrityTextRef.current.innerText = `${v.toFixed(1)}%`;
      if (integrityRef.current) {
        if (danger) integrityRef.current.classList.add('danger'); else integrityRef.current.classList.remove('danger');
      }
    }
    setIntegrity(current);

    const tick = () => {
      if (!alive) return;
      // small oscillation between 98 and 99.5
      const base = 98 + Math.random() * 1.5;
      setIntegrity(base, false);
      // occasionally dip
      if (Math.random() < 0.06) {
        setIntegrity(85 + Math.random() * 3, true);
        setTimeout(() => { if (alive) setIntegrity(98 + Math.random() * 1.5, false); }, 900);
      }
    };
    const interval = window.setInterval(tick, 1500);
    return () => { alive = false; clearInterval(interval); };
  }, []);

  // ✅ Custom cursor tracking (sem duplicatas, com cleanup garantido)
  useEffect(() => {
    let rafId: number | null = null;
    const cursor = cursorRef.current;
    if (!cursor) return;

    let isActive = false;
    let isPressed = false;

    const render = () => {
      if (!cursor) return;
      let scale = isActive ? 1.12 : 1;
      if (isPressed) scale *= 0.85;
      cursor.style.transform = `translate(-50%,-50%) scale(${scale})`;
    };

    const onMove = (e: MouseEvent) => {
      if (!cursor) return;
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
      cursor.style.display = 'block';
      cursor.style.opacity = '1';
    };

    const onDown = () => {
      isPressed = true;
      if (cursor) cursor.classList.add('pressed');
      render();
    };

    const onUp = () => {
      isPressed = false;
      if (cursor) cursor.classList.remove('pressed');
      render();
    };

    const hoverToggle = (e: Event) => {
      if (!cursor) return;
      const tgt = e.target as HTMLElement | null;
      const interactive = tgt && tgt.closest && (
        tgt.closest('button, a, input[type="button"], input[type="submit"], .clickable, [role="button"], [onclick], [tabindex]')
      );
      
      if (interactive) {
        isActive = true;
        cursor.classList.add('active');
      } else {
        isActive = false;
        cursor.classList.remove('active');
      }
      render();
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', hoverToggle);
    window.addEventListener('mouseout', hoverToggle);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    // Initial render
    rafId = requestAnimationFrame(render);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', hoverToggle);
      window.removeEventListener('mouseout', hoverToggle);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ✅ Decode-effect delegation (com Set para cleanup correto)
  useEffect(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    const activeIntervals = new Set<number>();

    function handleOver(e: Event) {
      const target = e.currentTarget as HTMLElement;
      const original = target.dataset.value || target.innerText || '';
      let iterations = 0;

      const interval = window.setInterval(() => {
        const text = original.split('').map((ch, idx) => {
          if (idx < iterations) return original[idx];
          return letters[Math.floor(Math.random() * letters.length)];
        }).join('');
        
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
    elems.forEach(el => el.addEventListener('mouseover', handleOver));

    return () => {
      elems.forEach(el => el.removeEventListener('mouseover', handleOver));
      activeIntervals.forEach(clearInterval);
      activeIntervals.clear();
    };
  }, []);

  // ✅ AudioManager cleanup (audio permanece disabled por padrão)
  useEffect(() => {
    // Note: audio remains disabled by default; no UI control for sensors
    return () => {
      audioManager.cleanup();
    };
  }, []);

  // Apply a document-level class so we only hide native cursor when overlay is active
  useEffect(() => {
    try {
      document.documentElement.classList.add('use-custom-cursor');
    } catch (e) {
      // ignore (SSR or test environments)
    }
    return () => {
      try { document.documentElement.classList.remove('use-custom-cursor'); } catch (e) {}
    };
  }, []);

  // background hex data generator (static columns)
  const hexColumn = (lines = 40) => {
    const parts: string[] = [];
    const choices = '0123456789ABCDEF';
    for (let i = 0; i < lines; i++) {
      let line = '';
      for (let j = 0; j < 12; j++) {
        line += choices[Math.floor(Math.random() * 16)];
        if (j % 2) line += ' ';
      }
      parts.push(line);
    }
    return parts.join('\n');
  };

  return (
    <>
      <header className={`nexus-hud ${hideHeader ? 'hidden' : ''}`} aria-hidden>
        <div className="hud-left">
          {location.pathname === '/' ? (
            <>
              <button className="nav-btn" title="Arquivos" onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'files' } }))}>
                <span aria-hidden>📁</span>
              </button>
              <button className="nav-btn" title="Terminal C.R.I.S." onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'terminal' } }))}>
                <span aria-hidden>💀</span>
              </button>
              <button className="nav-btn" title="Conexão Remota" onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'net' } }))}>
                <span aria-hidden>📡</span>
              </button>
              <button className="nav-btn" title="Perfil do Agente" onClick={() => window.dispatchEvent(new CustomEvent('open-desktop-window', { detail: { window: 'profile' } }))}>
                <span aria-hidden>👤</span>
              </button>
            </>
          ) : (
            <div style={{ width: 160, height: 1 }} aria-hidden />
          )}
        </div>

        <div className="hud-right">
          <div className="system-monitor" aria-hidden>
            <div className="label">INTEGRIDADE NEXUS</div>
            <div className="bar-container">
              <div className="fill" id="integrity-bar" ref={integrityRef}></div>
            </div>
            <div className="value" id="integrity-text" ref={integrityTextRef}>99.4%</div>
          </div>
          {location.pathname === '/' && (
            <button className="btn-logout" onClick={() => navigate('/login')}>SAIR DO SISTEMA</button>
          )}
        </div>
      </header>

      <div id="custom-cursor" ref={cursorRef} />

      <div className="background-data" style={{left:8}} dangerouslySetInnerHTML={{__html: hexColumn(50).replace(/\n/g,'<br/>') }} />
      <div className="background-data" style={{right:8, left:'auto'}} dangerouslySetInnerHTML={{__html: hexColumn(50).replace(/\n/g,'<br/>') }} />
    </>
  );
}
