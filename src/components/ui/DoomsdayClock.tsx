import React, { useEffect, useState } from 'react';
import { getOptimizedInterval } from '../../utils/performance';
import { getMembraneUrgency, type MembraneUrgency } from './SystemOverlays';
import './SystemOverlays.css';

interface Props {
  targetTime: number | null; // ms since epoch
  isGameMaster: boolean;
  onUpdate: (minutesDelta: number) => Promise<void>;
  /** Optional total duration in ms for percentage urgency calculation */
  totalDurationMs?: number;
}

const DEFAULT_CALM_THRESHOLD_MS = 30 * 60 * 1000; // >= 30m => 0–49% (verde/ciano)
const DEFAULT_AMBER_THRESHOLD_MS = 10 * 60 * 1000; // 10–30m => 50–79% (âmbar), < 10m => 80–100% (carmesim)

function computeUrgencyPercent(remainingMs: number, totalDurationMs?: number): number {
  if (remainingMs <= 0) return 100;
  if (totalDurationMs && totalDurationMs > 0) {
    const elapsedRatio = (totalDurationMs - remainingMs) / totalDurationMs;
    return Math.max(0, Math.min(100, Math.round(elapsedRatio * 100)));
  }
  if (remainingMs >= DEFAULT_CALM_THRESHOLD_MS) {
    // 30m..120m maps smoothly inside 0–49%
    const ratio = Math.min(1, (remainingMs - DEFAULT_CALM_THRESHOLD_MS) / (90 * 60 * 1000));
    return Math.round((1 - ratio) * 49);
  }
  if (remainingMs >= DEFAULT_AMBER_THRESHOLD_MS) {
    // 10m..30m maps smoothly inside 50–79%
    const ratio = (remainingMs - DEFAULT_AMBER_THRESHOLD_MS) / (DEFAULT_CALM_THRESHOLD_MS - DEFAULT_AMBER_THRESHOLD_MS);
    return Math.round(50 + (1 - ratio) * 29);
  }
  // < 10m maps smoothly inside 80–100%
  const ratio = remainingMs / DEFAULT_AMBER_THRESHOLD_MS;
  return Math.round(80 + (1 - ratio) * 20);
}

export default function DoomsdayClock({ targetTime, isGameMaster, onUpdate, totalDurationMs }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [urgency, setUrgency] = useState<MembraneUrgency>('calm');

  useEffect(() => {
    const tick = () => {
      if (!targetTime) {
        setTimeLeft('');
        return;
      }
      const now = Date.now();
      const diff = targetTime - now;
      const pct = computeUrgencyPercent(diff, totalDurationMs);
      setUrgency(getMembraneUrgency(pct));

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setTimeLeft(`${h}:${m < 10 ? '0' + m : m}:${s < 10 ? '0' + s : s}`);
    };
    tick();
    const iv = window.setInterval(tick, getOptimizedInterval(1000, 5)); // 1000ms normal, 5000ms in performance mode
    return () => window.clearInterval(iv);
  }, [targetTime, totalDurationMs]);

  if (!targetTime) return null;

  return (
    <div className="doomsday-hud-slot">
      <div
        className="doomsday-clock"
        data-urgency={urgency}
        role="timer"
        aria-live="off"
        aria-label={`Contagem regressiva: ${timeLeft}`}
      >
        <div className="doomsday-clock-time tabular-nums">{timeLeft}</div>
        {isGameMaster && (
          <div className="doomsday-clock-controls">
            <button
              type="button"
              className="doomsday-clock-btn"
              onClick={() => onUpdate(-10)}
              aria-label="Subtrair 10 minutos"
            >
              -10m
            </button>
            <button
              type="button"
              className="doomsday-clock-btn"
              onClick={() => onUpdate(+10)}
              aria-label="Adicionar 10 minutos"
            >
              +10m
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
