import React, { useEffect, useRef, useState } from 'react';
import './AudioLab.css';

interface Props {
  baseSrc: string;
  hiddenSrc?: string | null;
  audioConfig?: { trigger_time?: number };
}

export default function AudioLab({ baseSrc, hiddenSrc, audioConfig }: Props) {
  const triggerSeconds = audioConfig?.trigger_time || 0;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hiddenTriggered, setHiddenTriggered] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);

  const baseAudioRef = useRef<HTMLAudioElement | null>(null);
  const hiddenAudioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!baseSrc) return;
    let cancelled = false;
    const loadAudio = async () => {
      try {
        const response = await fetch(baseSrc);
        const arrayBuffer = await response.arrayBuffer();
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
        if (!cancelled) {
          setAudioBuffer(decodedBuffer);
          setDuration(decodedBuffer.duration);
        }
      } catch (error) {
        console.error('Erro loading audio:', error);
      }
    };
    loadAudio();
    return () => { cancelled = true; };
  }, [baseSrc]);

  useEffect(() => {
    if (!audioBuffer || !canvasRef.current || !containerRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const container = containerRef.current;
    if (!ctx) return;

    const viewWidth = container.clientWidth || 800;
    const virtualWidth = Math.max(1, Math.floor(viewWidth * zoomLevel));
    const height = container.clientHeight || 200;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = virtualWidth * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${virtualWidth}px`;
    canvas.style.height = `${height}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const raw = audioBuffer.getChannelData(0);
    const step = Math.max(1, Math.floor(raw.length / virtualWidth));

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, virtualWidth, height);
    ctx.beginPath();
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 1;

    const amp = height / 2;
    for (let x = 0; x < virtualWidth; x++) {
      let min = 1.0;
      let max = -1.0;
      const start = x * step;
      for (let i = 0; i < step && start + i < raw.length; i++) {
        const v = raw[start + i];
        if (v < min) min = v;
        if (v > max) max = v;
      }
      const yMin = (1 + min) * amp;
      const yMax = (1 + max) * amp;
      ctx.moveTo(x + 0.5, yMin);
      ctx.lineTo(x + 0.5, Math.max(yMin + 1, yMax));
    }
    ctx.stroke();
  }, [audioBuffer, zoomLevel, containerRef.current?.clientWidth]);

  const handlePlayPause = () => {
    if (!baseAudioRef.current) return;
    if (isPlaying) {
      baseAudioRef.current.pause();
      hiddenAudioRef.current?.pause();
      setIsPlaying(false);
    } else {
      baseAudioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (!baseAudioRef.current) return;
    const t = baseAudioRef.current.currentTime;
    setCurrentTime(t);

    if (zoomLevel > 1 && containerRef.current && isPlaying) {
      const viewWidth = containerRef.current.clientWidth;
      const virtualWidth = viewWidth * zoomLevel;
      const progress = t / (duration || 1);
      const currentX = virtualWidth * progress;
      const half = viewWidth / 2;
      if (currentX > half) containerRef.current.scrollLeft = currentX - half;
    }

    if (hiddenSrc && hiddenAudioRef.current && isPlaying && !hiddenTriggered) {
      if (t >= triggerSeconds && triggerSeconds > 0) {
        hiddenAudioRef.current.currentTime = 0;
        hiddenAudioRef.current.play();
        setHiddenTriggered(true);
      }
    }
    if (t < triggerSeconds && hiddenTriggered) setHiddenTriggered(false);
  };

  const handleSpectrumClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!baseAudioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetX = (e.nativeEvent as any).offsetX;
    const ratio = offsetX / rect.width;
    const newTime = ratio * duration;
    baseAudioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div
        ref={containerRef}
        style={{ flex: 1, position: 'relative', overflowX: zoomLevel > 1 ? 'auto' : 'hidden', background: '#000' }}
        onClick={handleSpectrumClick}
      >
        <div style={{ width: `${zoomLevel * 100}%`, height: '100%', position: 'relative' }}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%', height: '100%' }} />
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: 1, background: 'red', left: `${(currentTime / (duration || 1)) * 100}%`, pointerEvents: 'none' }} />
        </div>
      </div>

      <div style={{ marginTop: 8, padding: 8, background: '#111', borderTop: '1px solid #222' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handlePlayPause} style={{ padding: '6px 12px' }}>{isPlaying ? 'PAUSE' : 'PLAY'}</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ color: '#888', fontSize: 12 }}>ZOOM</label>
            <input type="range" min={1} max={10} step={0.1} value={zoomLevel} onChange={(e) => setZoomLevel(Number(e.target.value))} />
          </div>
          <div style={{ marginLeft: 'auto', color: '#0f0', fontFamily: 'monospace', fontSize: 12 }}>{new Date(currentTime * 1000).toISOString().substr(14, 5)} / {new Date((duration || 0) * 1000).toISOString().substr(14, 5)}</div>
        </div>
      </div>

      <audio ref={baseAudioRef} src={baseSrc} crossOrigin="anonymous" onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
      {hiddenSrc && <audio ref={hiddenAudioRef} src={hiddenSrc} crossOrigin="anonymous" />}
    </div>
  );
}

