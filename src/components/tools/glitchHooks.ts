import { useEffect, useRef, useState } from 'react';

interface SmoothedValues {
  f: number;
  s: number;
  c: number;
}

export function useSmoothedValues(playerFrequency: number, playerShift: number, playerChromatic: number, key?: string) {
  const displayRef = useRef<SmoothedValues>({ f: playerFrequency, s: playerShift, c: playerChromatic });
  const [, setTick] = useState(0);

  useEffect(() => {
    displayRef.current = { f: playerFrequency, s: playerShift, c: playerChromatic };
    setTick(t => t + 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const step = () => {
      const now = performance.now();
      const dt = Math.min(64, now - last) / 1000;
      last = now;

      const damp = Math.min(1, 1 - Math.pow(0.001, dt));

      const cur = displayRef.current;
      const nf = lerp(cur.f, playerFrequency, damp);
      const ns = lerp(cur.s, playerShift, damp);
      const nc = lerp(cur.c, playerChromatic, damp);

      const changed = Math.abs(nf - cur.f) > 0.001 || Math.abs(ns - cur.s) > 0.001 || Math.abs(nc - cur.c) > 0.001;
      if (changed) {
        displayRef.current = { f: nf, s: ns, c: nc };
        setTick(t => t + 1);
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playerFrequency, playerShift, playerChromatic]);

  return displayRef.current;
}

interface GlitchState {
  freqDelta: number;
  shiftDelta: number;
  chromaDelta: number;
  normalized: number;
  glitchStrength: number;
  clarity: number;
  isDecoding: boolean;
}

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

export function useGlitchState(
  smoothed: SmoothedValues,
  targetFrequency: number,
  targetShift: number,
  targetChromatic: number,
  solved?: boolean,
  onResolved?: () => void,
) {
  const { f: currentPlayerFreq, s: currentPlayerShift, c: currentPlayerChroma } = smoothed;

  const freqDelta = Math.abs(currentPlayerFreq - targetFrequency);
  const shiftDelta = Math.abs(currentPlayerShift - targetShift);
  const chromaDelta = Math.abs(currentPlayerChroma - targetChromatic);

  const normalized = clamp01((freqDelta / 50) + (shiftDelta / 100) + (chromaDelta / 100));
  const glitchStrength = solved ? 0 : clamp01(0.25 + normalized * 1.2);
  const clarity = solved ? 1 : clamp01(1 - normalized * 0.9);
  const isDecoding = !solved && normalized < 0.12;

  const didSignalRef = useRef(false);
  useEffect(() => {
    if (didSignalRef.current) return;
    const withinTolerance = freqDelta <= 1 && shiftDelta <= 2 && chromaDelta <= 2;
    if (withinTolerance) {
      didSignalRef.current = true;
      onResolved?.();
    }
  }, [freqDelta, shiftDelta, chromaDelta, onResolved]);

  return { freqDelta, shiftDelta, chromaDelta, normalized, glitchStrength, clarity, isDecoding } as GlitchState;
}

export default null;
