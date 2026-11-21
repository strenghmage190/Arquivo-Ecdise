import React, { useEffect, useState } from 'react';
import { isExtendedPerformanceMode, getOptimizedInterval } from '../../utils/performance';

interface Props {
  targetTime: number | null; // ms since epoch
  isGameMaster: boolean;
  onUpdate: (minutesDelta: number) => Promise<void>;
}

export default function DoomsdayClock({ targetTime, isGameMaster, onUpdate }: Props) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const tick = () => {
      if (!targetTime) { setTimeLeft(''); return; }
      const now = Date.now();
      const diff = targetTime - now;
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
    const iv = setInterval(tick, getOptimizedInterval(1000, 5)); // 1000ms normal, 5000ms in performance mode
    return () => clearInterval(iv);
  }, [targetTime]);

  if (!targetTime) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(env(safe-area-inset-top, 0px) + var(--space-2, 8px))',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(5, 5, 8, 0.95)',
        border: '1.5px solid var(--institutional-red, #b33)',
        color: '#ff2a2a',
        padding: 'var(--space-1, 4px) var(--space-3, 12px)',
        fontFamily: 'var(--font-terminal, monospace)',
        fontSize: 'var(--font-size-lg, 18px)',
        fontWeight: 'bold',
        zIndex: 'var(--z-hud, 1000)',
        boxShadow: '0 0 16px rgba(230, 57, 70, 0.4)',
        letterSpacing: '2px',
        textShadow: '0 0 8px rgba(255, 0, 0, 0.7)',
        borderRadius: 'var(--radius-sm, 4px)',
        backdropFilter: 'blur(8px)',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2, 8px)' }}>
        <div style={{ fontVariantNumeric: 'tabular-nums' }}>{timeLeft}</div>
        {isGameMaster && (
          <div style={{ fontSize: 'var(--font-size-xs, 11px)', display: 'flex', gap: 'var(--space-1, 4px)' }}>
            <button
              onClick={() => onUpdate(-10)}
              style={{
                padding: '2px 8px',
                minHeight: '28px',
                background: 'rgba(230, 57, 70, 0.15)',
                color: '#fff',
                border: '1px solid rgba(230, 57, 70, 0.5)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              -10m
            </button>
            <button
              onClick={() => onUpdate(+10)}
              style={{
                padding: '2px 8px',
                minHeight: '28px',
                background: 'rgba(230, 57, 70, 0.15)',
                color: '#fff',
                border: '1px solid rgba(230, 57, 70, 0.5)',
                borderRadius: 'var(--radius-sm, 4px)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
              }}
            >
              +10m
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
