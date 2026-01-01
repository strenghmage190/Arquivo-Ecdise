import React, { useEffect, useMemo, useRef } from 'react';
import './GlitchImageEngine.css';

export interface GlitchImageEngineProps {
  imageUrl: string;
  targetFrequency: number;
  targetShift: number;
  targetChromatic: number;
  playerFrequency: number;
  playerShift: number;
  playerChromatic: number;
  solved?: boolean;
  className?: string;
  height?: number | string;
  onResolved?: () => void;
} 

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

// Memoized para evitar recalcular a cada render
const computeDropShadowMemo = (delta: number): string => {
  const intensity = clamp01(delta / 36);
  const offset = 4 + intensity * 14;
  const alpha = 0.18 + intensity * 0.28;
  return `drop-shadow(${offset}px 0 rgba(0,180,255,${alpha})) drop-shadow(-${offset}px 0 rgba(255,0,120,${alpha}))`;
};

interface SliceSeed {
  top: number;
  height: number;
  phase: number;
}

function buildSeeds(seedKey: string): SliceSeed[] {
  // Simple deterministic pseudo-random so the slices stay stable per image
  let hash = 0;
  for (let i = 0; i < seedKey.length; i += 1) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) % 100000;
  }
  const seeds: SliceSeed[] = [];
  for (let i = 0; i < 18; i += 1) {
    const r = (hash = (hash * 9301 + 49297) % 233280) / 233280;
    const top = clamp01(r * 0.9 + 0.05) * 100; // keep a small margin
    const h = 3 + (r * 12);
    seeds.push({ top, height: h, phase: r });
  }
  return seeds;
}

const GlitchImageEngineComponent = ({
  imageUrl,
  targetFrequency,
  targetShift,
  targetChromatic,
  playerFrequency,
  playerShift,
  playerChromatic,
  solved = false,
  className,
  height = 320,
  onResolved,
}: GlitchImageEngineProps): React.ReactElement {
  const seeds = useMemo(() => buildSeeds(imageUrl || 'glitch'), [imageUrl]);
  const freqDelta = Math.abs(playerFrequency - targetFrequency);
  const shiftDelta = Math.abs(playerShift - targetShift);
  const chromaDelta = Math.abs(playerChromatic - targetChromatic);

  const normalized = clamp01((freqDelta / 50) + (shiftDelta / 100) + (chromaDelta / 100));
  const glitchStrength = solved ? 0 : clamp01(0.15 + normalized * 0.9);
  const clarity = solved ? 1 : clamp01(1 - normalized * 0.85);
  
  // Estado de decodificação (quando está próximo mas ainda não resolveu)
  const isDecoding = !solved && normalized < 0.12;

  // fire resolved callback once when all deltas are within tolerance
  const didSignalRef = useRef(false);
  useEffect(() => {
    if (didSignalRef.current) return;
    const withinTolerance = freqDelta <= 1 && shiftDelta <= 2 && chromaDelta <= 2;
    if (withinTolerance) {
      didSignalRef.current = true;
      onResolved?.();
    }
  }, [freqDelta, shiftDelta, chromaDelta, onResolved]);

  const sliceCount = Math.max(3, Math.round(6 + glitchStrength * 12));
  const slices = useMemo(() => seeds.slice(0, sliceCount), [seeds, sliceCount]);

  // Memoizar cálculos de filtro para evitar recalcular quando props não mudam
  const baseFilter = useMemo(
    () => `blur(${glitchStrength * 4}px) contrast(${1 + glitchStrength * 0.4}) saturate(${1 + glitchStrength * 0.5}) ${computeDropShadowMemo(chromaDelta)}`,
    [glitchStrength, chromaDelta]
  );
  const baseTranslate = useMemo(
    () => (shiftDelta * glitchStrength * 0.4) * (Math.sin((playerFrequency + 13) * 0.3) >= 0 ? 1 : -1),
    [shiftDelta, glitchStrength, playerFrequency]
  );
  const grainOpacity = useMemo(
    () => clamp01(0.25 + glitchStrength * 0.7),
    [glitchStrength]
  );

  return (
    <div className={`glitch-engine ${className || ''}`} style={{ height }}>
      <div className="glitch-frame">
        <img
          src={imageUrl}
          alt="evidence"
          className="glitch-base"
          style={{
            filter: baseFilter,
            transform: `translateX(${baseTranslate}px) scale(${1 + glitchStrength * 0.04})`,
            opacity: 0.55 + clarity * 0.45,
          }}
        />

        {/* Sliced overlays */}
        <div className="glitch-slices">
          {slices.map((slice, idx) => {
            const localShift = (Math.sin(slice.phase * 10 + playerShift) * 0.5 + 0.5) * shiftDelta * glitchStrength * 0.6;
            const chroma = clamp01((chromaDelta / 100) * (0.6 + slice.phase * 0.8));
            const shadow = computeDropShadowMemo(chromaDelta * (0.6 + slice.phase * 0.5));
            return (
              <div
                key={`${slice.top}-${idx}`}
                className="glitch-slice"
                style={{
                  top: `${slice.top}%`,
                  height: `${slice.height}%`,
                  backgroundImage: `url(${imageUrl})`,
                  backgroundPosition: `50% ${slice.top}%`,
                  backgroundSize: 'contain',
                  backgroundRepeat: 'no-repeat',
                  transform: `translateX(${localShift}px)`,
                  filter: `${shadow} brightness(${1 + chroma * 0.25}) saturate(${1 + chroma * 0.8})`,
                  opacity: clamp01(0.6 + chroma * 0.3),
                }}
              />
            );
          })}
        </div>

        {/* Noise / film */}
        <div className="glitch-grain" style={{ opacity: grainOpacity }} />

        {/* Decoding animation */}
        {isDecoding && !solved && (
          <div className="glitch-decoding">
            <div className="decoding-spinner" />
            <span className="decoding-text">DECODIFICANDO...</span>
            <div className="decoding-bars">
              <div className="bar" style={{ animationDelay: '0s' }} />
              <div className="bar" style={{ animationDelay: '0.15s' }} />
              <div className="bar" style={{ animationDelay: '0.3s' }} />
            </div>
          </div>
        )}

        {/* Restored overlay */}
        {clarity > 0.98 && (
          <div className="glitch-restored">
            <span className="restored-title">SISTEMA RESTAURADO</span>
            <span className="restored-sub">Imagem estabilizada</span>
          </div>
        )}
      </div>

      <div className="glitch-meter">
        <div className="glitch-meter-bar" style={{ width: `${Math.round(clarity * 100)}%` }} />
        <span className="glitch-meter-label">Nitidez: {Math.round(clarity * 100)}%</span>
      </div>
    </div>
  );
});

// React.memo para evitar re-renders quando props não mudam
export const GlitchImageEngine = React.memo(GlitchImageEngineComponent, (prevProps, nextProps) => {
  return (
    prevProps.imageUrl === nextProps.imageUrl &&
    prevProps.targetFrequency === nextProps.targetFrequency &&
    prevProps.targetShift === nextProps.targetShift &&
    prevProps.targetChromatic === nextProps.targetChromatic &&
    prevProps.playerFrequency === nextProps.playerFrequency &&
    prevProps.playerShift === nextProps.playerShift &&
    prevProps.playerChromatic === nextProps.playerChromatic &&
    prevProps.solved === nextProps.solved &&
    prevProps.height === nextProps.height
  );
});

export default GlitchImageEngine;
