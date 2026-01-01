import React, { useState, useRef, MouseEvent, useEffect } from 'react';
import './DecipherLens.css';

interface Props {
  realText: string;
  cipherText?: string;
  startActive?: boolean;
  initialRadius?: number; // Calibração inicial da lente
}

export default function DecipherLens({ realText, cipherText, startActive = false, initialRadius }: Props) {
  const [xy, setXy] = useState({ x: -100, y: -100 });
  const [active, setActive] = useState(startActive);
  const containerRef = useRef<HTMLDivElement>(null);
  const [radius, setRadius] = useState<number>(initialRadius || 60);
  const [isManualRadius, setIsManualRadius] = useState(!!initialRadius);

  useEffect(() => {
    setActive(startActive);
  }, [startActive]);

  useEffect(() => {
    const compute = () => {
      try {
        if (isManualRadius) return; // Não recalcular se o usuário está controlando manualmente
        const el = containerRef.current;
        if (!el) return setRadius(initialRadius || 60);
        const w = el.clientWidth || 300;
        const h = el.clientHeight || 200;
        const r = Math.round(Math.max(40, Math.min(w, h) * 0.16));
        setRadius(r);
      } catch (e) {
        setRadius(initialRadius || 60);
      }
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [containerRef.current, isManualRadius, initialRadius]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      // toggle lens with 'l' or Space
      if (ev.key === 'l' || ev.code === 'Space') {
        ev.preventDefault();
        setActive(a => !a);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setXy({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  // if cipherText not provided, create a simple symbolized version
  const cipher = cipherText || (realText ? realText.replace(/[A-Za-z0-9À-ÿ]/g, () => '¥') : '¤¤¤¤ ¤¤¤');

  return (
    <div className="decipher-tool">
      <button
        className={`btn-lens ${active ? 'active' : ''}`}
        onClick={() => setActive(!active)}
        aria-pressed={active}
        title="Ativar/desativar decodificação (atalho: L ou Espaço)"
      >
        {active ? 'DESATIVAR FILTRO' : '👁️ INICIAR DECODIFICAÇÃO'}
      </button>

      <div className="lens-controls">
        <label htmlFor="radius-control" className="calibration-label">
          Calibrar Foco: <span className="freq-value">{radius}hz</span>
        </label>
        <input
          id="radius-control"
          type="range"
          min="10"
          max="200"
          value={radius}
          onChange={e => {
            setRadius(Number(e.target.value));
            setIsManualRadius(true);
          }}
          className="radius-slider"
        />
      </div>

      <div
        className="text-container"
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setXy({ x: -200, y: -200 })}
        style={{ cursor: active ? 'none' : 'text' }}
      >
        <p className="cipher-layer">{cipher}</p>

        <p
          className="real-layer"
          style={
            active
              ? { clipPath: `circle(${radius}px at ${xy.x}px ${xy.y}px)`, WebkitClipPath: `circle(${radius}px at ${xy.x}px ${xy.y}px)` }
              : { clipPath: 'circle(0 at 0 0)', WebkitClipPath: 'circle(0 at 0 0)' }
          }
        >
          {realText}
        </p>

        {active && (
          <div className="lens-ring" style={{ top: xy.y - radius, left: xy.x - radius, width: radius * 2, height: radius * 2 }} />
        )}
      </div>
    </div>
  );
}
