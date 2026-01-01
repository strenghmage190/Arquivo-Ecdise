import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function SystemOverlays() {
  const integrityRef = useRef<HTMLDivElement | null>(null);
  const integrityTextRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<HTMLDivElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const clickIntervalRef = useRef<number | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [hideHeader, setHideHeader] = useState(false);

  // Listen for modal open/close events
  useEffect(() => {
    const handleModalOpen = () => setHideHeader(true);
    const handleModalClose = () => setHideHeader(false);
    
    window.addEventListener('modal-opened', handleModalOpen);
    window.addEventListener('modal-closed', handleModalClose);
    
    return () => {
      window.removeEventListener('modal-opened', handleModalOpen);
      window.removeEventListener('modal-closed', handleModalClose);
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

  // Custom cursor with requestAnimationFrame for smooth, centered tracking
  useEffect(() => {
    let rafId: number | null = null;
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (cursorRef.current) {
        cursorRef.current.style.display = 'block';
        cursorRef.current.style.opacity = '1';
      }
    };

    const onDown = () => { if (cursorRef.current) cursorRef.current.classList.add('pressed'); };
    const onUp = () => { if (cursorRef.current) cursorRef.current.classList.remove('pressed'); };

    const hoverToggle = (e: Event) => {
      if (!cursorRef.current) return;
      const tgt = e.target as HTMLElement | null;
      const interactive = tgt && tgt.closest && (tgt.closest('button, a, input[type="button"], input[type="submit"], .clickable, [role="button"], [onclick], [tabindex]'));
      if (interactive) cursorRef.current.classList.add('active'); else cursorRef.current.classList.remove('active');
    };

    const render = () => {
      if (cursorRef.current) {
        const isActive = cursorRef.current.classList.contains('active');
        const isPressed = cursorRef.current.classList.contains('pressed');
        let scale = isActive ? 1.12 : 1;
        if (isPressed) scale *= 0.85;
        // Set left/top to the pointer position and use transform only for centering + scale
        cursorRef.current.style.left = `${mouseX}px`;
        cursorRef.current.style.top = `${mouseY}px`;
        cursorRef.current.style.transform = `translate(-50%,-50%) scale(${scale})`;
      }
      rafId = requestAnimationFrame(render);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', hoverToggle);
    window.addEventListener('mouseout', hoverToggle);
    window.addEventListener('mousedown', onDown);
    window.addEventListener('mouseup', onUp);

    render();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', hoverToggle);
      window.removeEventListener('mouseout', hoverToggle);
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // Decode-effect delegation
  useEffect(() => {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&';
    let activeIntervals: number[] = [];
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
        }
        iterations += 1/3;
      }, 30) as unknown as number;
      activeIntervals.push(interval);
    }

    const elems = Array.from(document.querySelectorAll<HTMLElement>('.decode-effect'));
    elems.forEach(el => el.addEventListener('mouseover', handleOver));
    return () => { elems.forEach(el => el.removeEventListener('mouseover', handleOver)); activeIntervals.forEach(i => clearInterval(i)); };
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

  // Ambient audio (drone + random clicks) via WebAudio
  const initAudio = async () => {
    try {
      if (audioCtxRef.current) return;
      const AudioContextClass = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext | undefined;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      const gain = ctx.createGain();
      gain.gain.value = 0; // start muted by default
      gain.connect(ctx.destination);
      gainRef.current = gain;

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 60; // low hum
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.6;
      osc.connect(oscGain);
      oscGain.connect(gain);
      osc.start();
      droneRef.current = osc;

      // random clicks
      const clickInterval = window.setInterval(() => {
        const currentCtx = audioCtxRef.current;
        if (!currentCtx) return;
        const now = currentCtx.currentTime;
        const click = currentCtx.createBufferSource();
        const buffer = currentCtx.createBuffer(1, currentCtx.sampleRate * 0.012, currentCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-5 * i / data.length) * 0.4;
        click.buffer = buffer;
        const clickGain = currentCtx.createGain();
        clickGain.gain.value = 0.4;
        click.connect(clickGain);
        clickGain.connect(gain);
        click.start(now + 0);
      }, 4200 + Math.random() * 3000) as unknown as number;
      clickIntervalRef.current = clickInterval;
      // Ensure context is running (resume on user gesture)
      if (ctx.state === 'suspended') await ctx.resume();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Audio init failed', e);
    }
  };

  const teardownAudio = () => {
    try {
      if (clickIntervalRef.current) { clearInterval(clickIntervalRef.current); clickIntervalRef.current = null; }
      if (droneRef.current) { try { droneRef.current.stop(); } catch (e) {} droneRef.current = null; }
      if (audioCtxRef.current) { try { audioCtxRef.current.close(); } catch (e) {} audioCtxRef.current = null; }
      gainRef.current = null;
    } catch (e) {
      // ignore
    }
  };

  // Note: audio remains disabled by default; no UI control for sensors

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

  useEffect(() => {
    return () => { teardownAudio(); };
  }, []);

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
