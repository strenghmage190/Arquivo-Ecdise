import React, { useEffect, useRef, useState } from 'react';
import './AudioLab.css';

interface Props {
  baseSrc: string;
  hiddenSrc?: string | null;
  targetFreq?: number;
}

export default function AudioLab({ baseSrc, hiddenSrc, targetFreq = 50 }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(10);
  const [clarity, setClarity] = useState(0);
  const [activeTrack, setActiveTrack] = useState<string>(baseSrc);

  const basePlayer = useRef<HTMLAudioElement | null>(null);
  const hiddenPlayer = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const distance = Math.abs(currentFreq - targetFreq);
    let signal = 0;
    if (distance < 15) signal = 1 - distance / 15;
    setClarity(Math.round(signal * 100));

    if (basePlayer.current && hiddenPlayer.current) {
      hiddenPlayer.current.volume = Math.min(1, Math.pow(signal, 0.5));
      basePlayer.current.volume = Math.max(0.05, 1 - signal * 0.8);
      try { hiddenPlayer.current.currentTime = basePlayer.current.currentTime; } catch(e) {}
    }

    if (hiddenSrc) setActiveTrack(signal > 0.6 ? hiddenSrc as string : baseSrc);
  }, [currentFreq, targetFreq, baseSrc, hiddenSrc]);

  const togglePlay = () => {
    if (!basePlayer.current) return;
    if (isPlaying) {
      basePlayer.current.pause();
      hiddenPlayer.current?.pause();
    } else {
      basePlayer.current.play();
      if (hiddenPlayer.current) {
        try { hiddenPlayer.current.currentTime = basePlayer.current.currentTime; } catch(e) {}
        hiddenPlayer.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-lab-panel">
      <div className="analyzer-section">
        <div className="visualizer">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="bar" style={{ height: `${isPlaying ? Math.random() * 40 + 6 : 6}px`, background: clarity > 80 ? '#0f0' : '#b33' }} />
          ))}
        </div>

        <div className="freq-status">FREQ: {currentFreq}Hz <span style={{ color: clarity > 80 ? '#0f0' : clarity > 30 ? '#ffce00' : '#b33', marginLeft: 8 }}>SINAL: {clarity > 80 ? 'LÍMPIDO' : clarity > 30 ? 'INTERFERÊNCIA' : 'RUÍDO'}</span></div>
      </div>

      <div className="controls-section">
        <button className={`btn-big-play ${isPlaying ? 'playing' : ''}`} onClick={togglePlay}>{isPlaying ? 'PAUSE' : 'PLAY'}</button>

        <div className="evp-tuner">
          <label>SINTONIZADOR EVP (Membrana Auditiva)</label>
          <input type="range" min={0} max={100} step={0.5} value={currentFreq} onChange={e => setCurrentFreq(Number(e.target.value))} className="tuner-slider" />
          <div className="ticks">{[0,20,40,60,80,100].map(t => <span key={t}>|</span>)}</div>
        </div>
      </div>

      <audio ref={basePlayer} src={baseSrc} loop crossOrigin="anonymous" onEnded={() => setIsPlaying(false)} />
      {hiddenSrc && <audio ref={hiddenPlayer} src={hiddenSrc} loop crossOrigin="anonymous" />}
    </div>
  );
}
