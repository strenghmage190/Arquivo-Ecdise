import React, { useEffect, useMemo, useRef } from 'react';
import './GlitchImageEngine.css';
import { useSmoothedValues, useGlitchState } from './glitchHooks';

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

const GlitchImageEngineComponent: React.FC<GlitchImageEngineProps> = ({
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
}) => {
  const seeds = useMemo(() => buildSeeds(imageUrl || 'glitch'), [imageUrl]);

  const smoothed = useSmoothedValues(playerFrequency, playerShift, playerChromatic, imageUrl);
  const { freqDelta, shiftDelta, chromaDelta, normalized, glitchStrength, clarity, isDecoding } = useGlitchState(
    smoothed,
    targetFrequency,
    targetShift,
    targetChromatic,
    solved,
    onResolved,
  );

  const sliceCount = Math.max(3, Math.round(6 + glitchStrength * 12));
  const slices = useMemo(() => seeds.slice(0, sliceCount).map(slice => ({
    ...slice,
    top: slice.top * (1 + glitchStrength * 0.1),
    height: slice.height * (1 + glitchStrength * 0.1),
  })), [seeds, sliceCount, glitchStrength]);

  const grainOpacity = clamp01(0.35 + glitchStrength * 0.8);
  const [displayClarity, setDisplayClarity] = React.useState<number | null>(null);
  const [flashMeter, setFlashMeter] = React.useState(false);

  React.useEffect(() => {
    try {
      // eslint-disable-next-line no-console
      console.debug('[GlitchImageEngine] props', {
        imageUrl,
        targetFrequency,
        targetShift,
        targetChromatic,
        playerFrequency,
        playerShift,
        playerChromatic,
        solved,
      });
      // eslint-disable-next-line no-console
      console.debug('[GlitchImageEngine] computed', { freqDelta, shiftDelta, chromaDelta, normalized, glitchStrength, clarity, displayClarity });
    } catch (e) {}
  }, [imageUrl, targetFrequency, targetShift, targetChromatic, playerFrequency, playerShift, playerChromatic, solved, freqDelta, shiftDelta, chromaDelta, normalized, glitchStrength, clarity]);

  useEffect(() => {
    if (displayClarity === null) {
      setDisplayClarity(clarity);
      return;
    }
    if (Math.abs(displayClarity - clarity) > 0.005) {
      // eslint-disable-next-line no-console
      console.debug('[GlitchImageEngine] clarity changed', { before: displayClarity, after: clarity });
      setDisplayClarity(clarity);
      setFlashMeter(true);
      const t = setTimeout(() => setFlashMeter(false), 300);
      return () => clearTimeout(t);
    }
  }, [clarity, displayClarity]);

  const glitchStyle = {
    '--image-url': `url(${imageUrl})`,
    '--glitch-strength': String(glitchStrength),
    '--clarity': String(clarity),
    '--rgb-offset': String(1 + glitchStrength * 12),
    '--shift-delta': String(shiftDelta),
    '--freq-delta': String(freqDelta),
    '--chroma-delta': String(chromaDelta),
  } as React.CSSProperties;

  return (
    <div className={`glitch-engine ${className || ''}`} style={{ height }}>
      <div className="glitch-frame" style={glitchStyle}>
        <div className="glitch-base" />
        <div className="glitch-rgb-layers" />

        {/* Sliced overlays (pass only local variables via CSS) */}
        <div className="glitch-slices">
          {slices.map((slice, idx) => {
            const localShift = (Math.sin(slice.phase * 10 + smoothed.s) * 0.5 + 0.5) * shiftDelta * glitchStrength * 0.6;
            const localShakeY = (Math.sin(slice.phase * 7 + smoothed.f) * 0.5) * (freqDelta * 0.03) * glitchStrength;
            const chroma = clamp01((chromaDelta / 100) * (0.6 + slice.phase * 0.8));
            return (
              <div
                key={`${slice.top}-${idx}`}
                className="glitch-slice"
                style={{
                  top: `${slice.top}%`,
                  height: `${slice.height}%`,
                  '--slice-pos': `${slice.top}%`,
                  '--local-shift-x': String(localShift),
                  '--local-shift-y': String(localShakeY),
                  '--local-chroma': String(chroma),
                } as React.CSSProperties}
              />
            );
          })}
        </div>

        <div className="glitch-grain" style={{ opacity: grainOpacity }} />
        <div className="glitch-scanlines" />

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
        <div className={`glitch-meter-bar ${flashMeter ? 'flash' : ''}`} style={{ width: `${Math.round(clarity * 100)}%` }} />
        <span className="glitch-meter-label">Nitidez: {Math.round(clarity * 100)}%</span>
      </div>
    </div>
  );
};

// React.memo para evitar re-renders quando props não mudam
// Use default React.memo shallow comparison to avoid subtle comparator bugs
export const GlitchImageEngine = React.memo(GlitchImageEngineComponent);

export default GlitchImageEngine;
