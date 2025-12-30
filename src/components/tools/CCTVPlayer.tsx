import React, { useRef, useState, useEffect } from 'react';
import './CCTVPlayer.css';

export default function CCTVPlayer({ src }: { src: string }) {
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const [speed, setSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1);
  const [filter, setFilter] = useState<'normal' | 'night-vision' | 'thermal'>('night-vision');

  useEffect(() => {
    if (vidRef.current) vidRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    // try autoplay if possible
    try { vidRef.current?.play(); } catch (e) {}
  }, [src]);

  const changeSpeed = (rate: number) => {
    if (vidRef.current) vidRef.current.playbackRate = rate;
    setSpeed(rate);
  };

  return (
    <div className="cctv-wrapper">
      <div className={`video-screen ${filter}`} style={{ overflow: 'hidden' }}>
        <div className="cam-overlay">
          <span className="rec-dot">🔴 REC</span>
          <span className="cam-name">CAM-04 CORREDOR</span>
          <span className="cam-time">{new Date().toLocaleTimeString()}</span>
        </div>

        <video
          ref={vidRef}
          src={src}
          loop
          muted
          autoPlay
          playsInline
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>

      <div className="cctv-controls">
        <div className="control-group">
          <label>VELOCIDADE: {speed}x</label>
          <div className="btn-row">
            <button onClick={() => changeSpeed(0.25)}>0.25x</button>
            <button onClick={() => changeSpeed(0.5)}>0.5x</button>
            <button onClick={() => changeSpeed(1.0)}>1.0x</button>
          </div>
        </div>

        <div className="control-group">
          <label>ZOOM DIGITAL: {zoom.toFixed(1)}x</label>
          <input
            type="range"
            min={1}
            max={4}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>

        <div className="control-group">
          <label>MODO VISUAL</label>
          <div className="btn-row">
            <button onClick={() => setFilter('normal')}>COR</button>
            <button onClick={() => setFilter('night-vision')}>NOTURNO</button>
            <button onClick={() => setFilter('thermal')}>TÉRMICO</button>
          </div>
        </div>
      </div>
    </div>
  );
}
