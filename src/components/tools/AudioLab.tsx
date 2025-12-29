import React, { useEffect, useRef, useState } from 'react';
import './AudioLab.css';

interface Props {
  baseSrc: string;
  hiddenSrc?: string | null;
  targetFreq?: number;
  externalBaseId?: string; // optional id of an existing audio element to control
  externalHiddenId?: string;
}

export default function AudioLab({ baseSrc, hiddenSrc, targetFreq = 50, externalBaseId, externalHiddenId }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(10);
  const [clarity, setClarity] = useState(0);
  const [activeTrack, setActiveTrack] = useState<string>(baseSrc);
  const [mode, setMode] = useState<'wave' | 'spec'>('spec');

  const basePlayer = useRef<HTMLAudioElement | null>(null);
  const hiddenPlayer = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // initialize players (use external if available)
  useEffect(() => {
    if (externalBaseId) {
      const el = document.getElementById(externalBaseId) as HTMLAudioElement | null;
      if (el) basePlayer.current = el;
    }
    if (externalHiddenId) {
      const elh = document.getElementById(externalHiddenId) as HTMLAudioElement | null;
      if (elh) hiddenPlayer.current = elh;
    }
  }, [externalBaseId, externalHiddenId]);

  // Setup WebAudio analyser
  useEffect(() => {
    if (!basePlayer.current) return;
    const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
    const ctx = new AudioCtx();
    audioCtxRef.current = ctx;

    const source = ctx.createMediaElementSource(basePlayer.current);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyserRef.current = analyser;
    source.connect(analyser);
    analyser.connect(ctx.destination);

    startDrawing();

    return () => {
      stopDrawing();
      try { analyser.disconnect(); source.disconnect(); } catch (e) {}
      try { ctx.close(); } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basePlayer.current]);

  // drawing loop
  const startDrawing = () => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyser || !canvas) return;
      analyser.getByteFrequencyData(data);
      const w = canvas.width; const h = canvas.height;
      // shift image left for waterfall
      const image = ctx.getImageData(1, 0, w-1, h);
      ctx.putImageData(image, 0, 0);
      // draw new column at right
      for (let i = 0; i < bufferLength; i++) {
        const v = data[i];
        const y = Math.floor((i / bufferLength) * h);
        const color = `rgb(${v},${Math.floor(v*0.6)},${Math.floor(255 - v)})`;
        ctx.fillStyle = color;
        ctx.fillRect(w-1, h-1 - y, 1, 1);
      }
      rafRef.current = requestAnimationFrame(draw);
    };
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  const stopDrawing = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

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

  const togglePlay = async () => {
    if (!basePlayer.current) return;
    // resume audio context if suspended
    try { if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume(); } catch(e){}
    if (isPlaying) {
      basePlayer.current.pause();
      hiddenPlayer.current?.pause();
      stopDrawing();
    } else {
      await basePlayer.current.play();
      if (hiddenPlayer.current) {
        try { hiddenPlayer.current.currentTime = basePlayer.current.currentTime; } catch(e){}
        hiddenPlayer.current.play();
      }
      startDrawing();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="audio-lab-panel">
      <div style={{display:'flex', gap:12, alignItems:'center'}}>
        <canvas ref={canvasRef as any} width={600} height={120} style={{flex:1, background:'#000', border:'1px solid #222'}} />
        <div style={{display:'flex', flexDirection:'column', gap:8}}>
          <div className="freq-status" title="Indicador de sintonia e força do sinal">FREQ: {currentFreq}Hz <div style={{fontSize:11, color: clarity>80? '#0f0': clarity>30? '#ffce00':'#b33'}}>SINAL: {clarity}%</div></div>
          <div style={{display:'flex', gap:6}}>
            <button className={`btn-big-play ${isPlaying ? 'playing' : ''}`} onClick={togglePlay} title="Play/Pause">{isPlaying ? 'PAUSE' : 'PLAY'}</button>
            <button className="btn-retro" onClick={() => setMode(mode === 'spec' ? 'wave' : 'spec')} title="Alternar visualizador">{mode === 'spec' ? 'Espectro' : 'Onda'}</button>
          </div>
        </div>
      </div>

      <div className="controls-section">
        <div className="evp-tuner">
          <label title="Ajuste este dial até que o sinal fique mais claro">SINTONIZADOR EVP (Membrana Auditiva)</label>
          <input type="range" min={0} max={100} step={0.5} value={currentFreq} onChange={e => setCurrentFreq(Number(e.target.value))} className="tuner-slider" />
          <div className="ticks">{[0,20,40,60,80,100].map(t => <span key={t}>|</span>)}</div>
        </div>
      </div>

      <audio ref={basePlayer} src={baseSrc} loop crossOrigin="anonymous" style={{display:'none'}} />
      {hiddenSrc && <audio ref={hiddenPlayer} src={hiddenSrc} loop crossOrigin="anonymous" style={{display:'none'}} />}
    </div>
  );
}
