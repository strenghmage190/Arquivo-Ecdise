import React, { useState, useRef, useEffect } from 'react';
import './AudioDecrypter.css';

interface Props {
  baseAudio: string;
  hiddenAudio?: string;
  targetFreq?: number; // 0 a 100, padrão 50
}

export default function AudioDecrypter({ baseAudio, hiddenAudio, targetFreq = 50 }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(10);
  const [signalStrength, setSignalStrength] = useState(0);

  const baseRef = useRef<HTMLAudioElement>(null);
  const hiddenRef = useRef<HTMLAudioElement>(null);

  const togglePlay = () => {
    if (isPlaying) {
      baseRef.current?.pause();
      hiddenRef.current?.pause();
      setIsPlaying(false);
      return;
    }

    // Play and handle promise (browser autoplay policies)
    const base = baseRef.current;
    const hid = hiddenRef.current;
    if (!base) return;
    const p = base.play();
    if (p && typeof p.then === 'function') {
      p.then(() => {
        // sync hidden
        if (hid) {
          try { hid.currentTime = base.currentTime; } catch (e) {}
          hid.play().catch(() => {});
        }
        setIsPlaying(true);
      }).catch((err) => {
        console.error('Audio play failed:', err);
        setIsPlaying(false);
      });
    } else {
      // older browsers
      try {
        if (hid) { try { hid.currentTime = base.currentTime; hid.play(); } catch (e) {} }
        setIsPlaying(true);
      } catch (e) { setIsPlaying(false); }
    }
  };

  useEffect(() => {
    const diff = Math.abs(frequency - targetFreq);
    let clarity = 0;
    if (diff < 15) {
      clarity = 1 - diff / 15;
    }
    setSignalStrength(Math.round(clarity * 100));

    if (baseRef.current) {
      baseRef.current.volume = Math.max(0.05, 1 - clarity * 0.8);
    }
    if (hiddenRef.current) {
      hiddenRef.current.volume = clarity;
      try { hiddenRef.current.currentTime = baseRef.current?.currentTime || 0; } catch (e) {}
    }
  }, [frequency, targetFreq]);

  return (
    <div className="audio-decoder-panel">
      <div className="visualizer">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="bar"
            style={{
              height: isPlaying ? `${Math.random() * 40 + 10}px` : '4px',
              background: signalStrength > 80 ? '#00ff00' : '#b33'
            }}
          />
        ))}
      </div>

      <div className="controls-row">
        <button onClick={togglePlay} className={`btn-play ${isPlaying ? 'active' : ''}`}>
          {isPlaying ? 'PAUSAR' : 'REPROD.'}
        </button>

        <div className="knob-container">
          <label>SINTONIZAR MEMBRANA: {frequency}Hz</label>
          <input
            type="range"
            min="0"
            max="100"
            value={frequency}
            onChange={(e) => setFrequency(Number(e.target.value))}
            className="frequency-slider"
          />
        </div>

        <div className="signal-meter">
          <small>SINAL</small>
          <span style={{ color: signalStrength > 80 ? '#0f0' : '#555' }}>
            {signalStrength > 80 ? 'DETECTADO' : 'RUÍDO'}
          </span>
        </div>
      </div>

      <audio ref={baseRef} src={baseAudio} loop crossOrigin="anonymous" />
      <audio ref={hiddenRef} src={hiddenAudio} loop crossOrigin="anonymous" />
    </div>
  );
}
