import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Radio, Eye, EyeOff, Sliders, Crosshair } from 'lucide-react';
import './SignalReconstructor.css';
import { isExtendedPerformanceMode } from '../../utils/performance';

export interface SignalReconstructorProps {
  realText: string;
  cipherText?: string;
  targetFreq?: number;
  startActive?: boolean;
  initialRadius?: number;
}

const TUNING_THRESHOLD = 0.72;
const TOUCH_Y_OFFSET_PX = 65;

function buildFallbackCipher(source: string): string {
  if (!source) return '¤¤¤¤ ¤¤¤¤ ¤¤¤';
  return source.replace(/[A-Za-z0-9À-ÿ]/g, '¥');
}

export default function SignalReconstructor({
  realText,
  cipherText,
  targetFreq = 115,
  startActive = false,
  initialRadius,
}: SignalReconstructorProps) {
  const safeRealText = realText || '';
  const staticCipher = useMemo(
    () => cipherText || buildFallbackCipher(safeRealText),
    [cipherText, safeRealText]
  );

  const [xy, setXy] = useState({ x: -200, y: -200 });
  const [active, setActive] = useState(startActive);
  const [freq, setFreq] = useState(60);
  const [radius, setRadius] = useState<number>(initialRadius || 72);
  const [isManualRadius, setIsManualRadius] = useState(Boolean(initialRadius));
  const [glitchedText, setGlitchedText] = useState(staticCipher);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActive(startActive);
  }, [startActive]);

  useEffect(() => {
    const compute = () => {
      if (isManualRadius) return;
      const el = containerRef.current;
      if (!el) {
        setRadius(initialRadius || 72);
        return;
      }
      const w = el.clientWidth || 300;
      const h = el.clientHeight || 200;
      setRadius(Math.round(Math.max(40, Math.min(w, h) * 0.18)));
    };
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, [isManualRadius, initialRadius]);

  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const tag = (ev.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (ev.key === 'l' || ev.key === 'L' || ev.code === 'Space') {
        ev.preventDefault();
        setActive((a) => !a);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (cipherText || isExtendedPerformanceMode()) {
      setGlitchedText(staticCipher);
      return;
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*§ØΔΩ';
    const interval = setInterval(() => {
      const res = safeRealText
        .split('')
        .map((char) => (char === ' ' || char === '\n' ? char : chars[Math.floor(Math.random() * chars.length)]))
        .join('');
      setGlitchedText(res || staticCipher);
    }, 85);
    return () => clearInterval(interval);
  }, [safeRealText, cipherText, staticCipher]);

  const updatePointerCoords = (clientX: number, clientY: number, isTouchPointer: boolean) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top - (isTouchPointer ? TOUCH_Y_OFFSET_PX : 0);
    setXy({ x, y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerCoords(e.clientX, e.clientY, e.pointerType === 'touch');
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    updatePointerCoords(e.clientX, e.clientY, e.pointerType === 'touch');
  };

  const accuracy = Math.max(0, 1 - Math.abs(freq - targetFreq) / 50);
  const isTuned = accuracy >= TUNING_THRESHOLD;
  const canExposePlaintext = active && isTuned;

  return (
    <div className="signal-reconstructor">
      <div className="sr-header">
        <div className="sr-title-wrap">
          <Radio size={14} className={isTuned ? 'sr-icon-locked' : 'sr-icon-idle'} />
          <span className="sr-title">RECONSTRUTOR DE SINAL &amp; LENTE</span>
        </div>
        <div className={`sr-stats ${isTuned ? 'is-locked' : ''}`}>
          SINAL: {Math.round(accuracy * 100)}%
        </div>
      </div>

      <div className="sr-controls">
        <div className="sr-slider-row">
          <label htmlFor="sr-freq-range" className="sr-label">
            <Radio size={13} /> SINTONIA:
          </label>
          <input
            id="sr-freq-range"
            type="range"
            min={20}
            max={200}
            value={freq}
            onChange={(e) => setFreq(Number(e.target.value))}
            className="sr-range"
          />
          <span className={`sr-readout ${isTuned ? 'locked' : ''}`}>{freq} Hz</span>
        </div>

        <div className="sr-slider-row">
          <label htmlFor="sr-radius-range" className="sr-label">
            <Sliders size={13} /> FOCO DA LENTE:
          </label>
          <input
            id="sr-radius-range"
            type="range"
            min={20}
            max={200}
            value={radius}
            onChange={(e) => {
              setRadius(Number(e.target.value));
              setIsManualRadius(true);
            }}
            className="sr-range"
          />
          <span className="sr-readout sr-readout-px">{radius} px</span>
        </div>

        <button
          type="button"
          className={`sr-power-btn ${active ? 'on' : ''}`}
          onClick={() => setActive((a) => !a)}
          aria-pressed={active}
          title="Ativar/desativar varredura (atalho: L ou Espaço)"
        >
          {active ? (
            <>
              <EyeOff size={14} /> INTERROMPER SCAN
            </>
          ) : (
            <>
              <Eye size={14} /> INICIAR DECODIFICAÇÃO
            </>
          )}
        </button>
      </div>

      <div
        className={`sr-viewport ${active ? 'scanning' : ''}`}
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => {
          if (e.pointerType === 'touch') setXy({ x: -200, y: -200 });
        }}
        onPointerLeave={() => setXy({ x: -200, y: -200 })}
        style={{
          cursor: active ? 'none' : 'text',
          touchAction: active ? 'none' : 'auto',
        }}
      >
        <p className="sr-layer sr-noise-layer">{glitchedText}</p>

        {canExposePlaintext && (
          <p
            className="sr-layer sr-signal-layer"
            style={{
              clipPath: `circle(${radius}px at ${xy.x}px ${xy.y}px)`,
              WebkitClipPath: `circle(${radius}px at ${xy.x}px ${xy.y}px)`,
              filter: `blur(${Math.max(0, (1 - accuracy) * 4)}px)`,
              opacity: Math.min(1, Math.max(0.45, accuracy)),
            }}
          >
            {safeRealText}
          </p>
        )}

        {active && (
          <div
            className={`sr-reticle ${isTuned ? 'is-locked' : ''}`}
            style={{
              left: xy.x - radius,
              top: xy.y - radius,
              width: radius * 2,
              height: radius * 2,
            }}
          >
            <div className="sr-reticle-label">
              <Crosshair size={10} /> {isTuned ? 'SINAL TRAVADO' : 'SINTONIZANDO...'}
            </div>
          </div>
        )}

        <div className="sr-scanlines" />
      </div>

      <div className="sr-footer">
        {isTuned
          ? 'PORTADORA ESTABILIZADA — ARRASTE A LENTE PARA DECODIFICAR'
          : 'INTERFERÊNCIA DETECTADA — AJUSTE A SINTONIA ATÉ ESTABILIZAR O SINAL'}
      </div>
    </div>
  );
}
