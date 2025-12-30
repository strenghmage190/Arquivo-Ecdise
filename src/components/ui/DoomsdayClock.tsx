import React, { useEffect, useState } from 'react';

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
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [targetTime]);

  if (!targetTime) return null;

  return (
    <div style={{
      position: 'fixed', top: 10, left: '50%', transform: 'translateX(-50%)',
      background: '#000', border: '2px solid #b33', color: '#ff0000',
      padding: '5px 15px', fontFamily: 'monospace', fontSize: '20px', fontWeight: 'bold',
      zIndex: 8000, boxShadow: '0 0 15px #b33', letterSpacing: '2px', textShadow: '0 0 5px red'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div>{timeLeft}</div>
        {isGameMaster && (
          <div style={{ fontSize: 12, display: 'flex', gap: 6 }}>
            <button onClick={() => onUpdate(-10)} style={{ padding: '2px 6px' }}>-10m</button>
            <button onClick={() => onUpdate(+10)} style={{ padding: '2px 6px' }}>+10m</button>
          </div>
        )}
      </div>
    </div>
  );
}
