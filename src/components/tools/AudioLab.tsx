import React, { useEffect, useRef, useState } from 'react';
import './AudioLab.css';

interface Props {
  baseSrc: string;
  hiddenSrc?: string | null;
  targetFreq?: number;
  externalBaseId?: string;
  externalHiddenId?: string;
}

export default function AudioLab({ baseSrc, hiddenSrc, targetFreq = 50, externalBaseId, externalHiddenId }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentFreq, setCurrentFreq] = useState(10);
  const [clarity, setClarity] = useState(0);
  const [mode, setMode] = useState<'wave' | 'spec'>('spec');

  const basePlayer = useRef<HTMLAudioElement | null>(null);
  const hiddenPlayer = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  // attach external audio elements if provided
  useEffect(() => {
    if (externalBaseId) {
      const el = document.getElementById(externalBaseId) as HTMLAudioElement | null;
      if (el) basePlayer.current = el;
    }
    if (externalHiddenId) {
      const elh = document.getElementById(externalHiddenId) as HTMLAudioElement | null;
      if (elh) hiddenPlayer.current = elh;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalBaseId, externalHiddenId]);

  // fallback: find audio elements inside component
  useEffect(() => {
    if (!basePlayer.current) {
      const found = containerRef.current?.querySelector('audio') as HTMLAudioElement | null;
      if (found) basePlayer.current = found;
    }
    if (!hiddenPlayer.current) {
      const list = containerRef.current?.querySelectorAll('audio');
      if (list && list.length > 1) hiddenPlayer.current = list[1] as HTMLAudioElement;
    }
  }, [baseSrc, hiddenSrc]);

  // create AudioContext and analyser, but avoid racing with user gesture policies
  useEffect(() => {
    let ctx: AudioContext | null = null;
    let baseSource: MediaElementAudioSourceNode | null = null;
    let hiddenSource: MediaElementAudioSourceNode | null = null;
    let analyser: AnalyserNode | null = null;
    let cancelled = false;

    const init = () => {
      if (cancelled) return;
      if (!basePlayer.current) {
        setTimeout(init, 50);
        return;
      }

      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      try {
        ctx = new AudioCtx();
        audioCtxRef.current = ctx;
      } catch (e) {
        console.error('AudioLab: AudioContext create failed', e);
        return;
      }

      try {
        baseSource = ctx.createMediaElementSource(basePlayer.current as HTMLMediaElement);
      } catch (e) { baseSource = null; }
      if (hiddenPlayer.current) {
        try { hiddenSource = ctx.createMediaElementSource(hiddenPlayer.current as HTMLMediaElement); } catch (e) { hiddenSource = null; }
      }

      analyser = ctx.createAnalyser();
      analyser.fftSize = 2048;
      analyserRef.current = analyser;

      try {
        if (baseSource) baseSource.connect(analyser);
        if (hiddenSource) hiddenSource.connect(analyser);
        analyser.connect(ctx.destination);
        startDrawing();
      } catch (e) {
        // defer connection until user gesture
        console.debug('AudioLab: deferred connect', e);
      }
    };

    init();

    return () => {
      cancelled = true;
      stopDrawing();
      try { analyser?.disconnect(); } catch (e) {}
      try { baseSource?.disconnect(); hiddenSource?.disconnect(); } catch (e) {}
      try { ctx?.close(); } catch (e) {}
      audioCtxRef.current = null;
      analyserRef.current = null;
    };
  }, [baseSrc, hiddenSrc]);

  // drawing
  const startDrawing = () => {
    const canvas = canvasRef.current;
    const container = containerRef.current || (canvas ? canvas.parentElement as HTMLDivElement : null);
    const analyser = analyserRef.current;
    if (!canvas || !analyser || !container) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const DPR = window.devicePixelRatio || 1;
    const desiredHeight = 180;
    const cw = Math.max(300, Math.floor(container.clientWidth));
    const wPx = Math.floor(cw * DPR);
    const hPx = Math.floor(desiredHeight * DPR);
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${desiredHeight}px`;
    canvas.width = wPx;
    canvas.height = hPx;

    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const intensityToColor = (v: number) => {
      const n = Math.min(1, Math.max(0, Math.pow(v / 255, 0.7)));
      const hue = 220 - (n * 220);
      const light = 20 + n * 60;
      return `hsl(${hue}, 100%, ${light}%)`;
    };

    const draw = () => {
      try {
        analyser.getByteFrequencyData(data);
        const w = canvas.width; const h = canvas.height;
        try {
          ctx.drawImage(canvas, DPR, 0, w - DPR, h, 0, 0, w - DPR, h);
        } catch (e) {
          try {
            const sx = DPR; const sw = w - sx;
            const image = ctx.getImageData(sx, 0, sw, h);
            ctx.putImageData(image, 0, 0);
          } catch (e2) {}
        }

        for (let i = 0; i < bufferLength; i++) {
          const v = data[i];
          const y = Math.floor((i / bufferLength) * h);
          ctx.fillStyle = intensityToColor(v);
          ctx.fillRect(w - DPR, h - 1 - y, DPR, 1);
        }

        const markerX = Math.round((currentFreq / 100) * w);
        // draw a thin, semi-transparent marker line instead of a full opaque block
        ctx.strokeStyle = 'rgba(198,164,95,0.35)';
        ctx.lineWidth = Math.max(1, DPR);
        ctx.beginPath();
        const x = markerX + 0.5; // align to pixel grid
        ctx.moveTo(x, 0);
        ctx.lineTo(x, h);
        ctx.stroke();
      } catch (err) {
        console.error('Spectrogram draw error:', err);
        stopDrawing();
        return;
      }
      rafRef.current = requestAnimationFrame(draw);
    };

    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(draw);
  };

  const stopDrawing = () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); rafRef.current = null; };

  useEffect(() => {
    const onResize = () => { if (analyserRef.current) { stopDrawing(); startDrawing(); } };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const distance = Math.abs(currentFreq - targetFreq);
    let signal = 0;
    if (distance < 15) signal = 1 - distance / 15;
    setClarity(Math.round(signal * 100));

    if (basePlayer.current && hiddenPlayer.current) {
      hiddenPlayer.current.volume = Math.min(1, Math.pow(signal, 0.5));
      basePlayer.current.volume = Math.max(0.05, 1 - signal * 0.8);
      try { hiddenPlayer.current.currentTime = basePlayer.current.currentTime; } catch (e) {}
    }

    if (hiddenSrc) {
      // no-op for now; visual switching could use activeTrack state
    }
  }, [currentFreq, targetFreq, baseSrc, hiddenSrc]);

  // ensure audio context and connect sources on user gesture
  const ensureAudioContext = () => {
    if (audioCtxRef.current && analyserRef.current) return;
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = audioCtxRef.current || new AudioCtx();
      audioCtxRef.current = ctx;

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser(); analyser.fftSize = 2048; analyserRef.current = analyser;
      }

      try {
        if (basePlayer.current) {
          try { ctx.createMediaElementSource(basePlayer.current).connect(analyserRef.current!); } catch (e) {}
        }
        if (hiddenPlayer.current) {
          try { ctx.createMediaElementSource(hiddenPlayer.current).connect(analyserRef.current!); } catch (e) {}
        }
        try { analyserRef.current!.connect(ctx.destination); } catch (e) {}
      } catch (e) {
        console.debug('ensureAudioContext connect failed', e);
      }
    } catch (err) {
      console.error('ensureAudioContext error', err);
    }
  };

  const togglePlay = async () => {
    if (!basePlayer.current) return;
    console.debug('AudioLab: togglePlay', { isPlaying, baseExists: !!basePlayer.current, hiddenExists: !!hiddenPlayer.current, audioCtxState: audioCtxRef.current?.state });
    ensureAudioContext();
    try { if (audioCtxRef.current?.state === 'suspended') await audioCtxRef.current.resume(); } catch (e) { console.error('resume failed', e); }

    if (isPlaying) {
      basePlayer.current.pause();
      hiddenPlayer.current?.pause();
      stopDrawing();
      setIsPlaying(false);
      return;
    }

    try {
      if (hiddenPlayer.current) {
        try { hiddenPlayer.current.currentTime = basePlayer.current.currentTime; } catch (e) {}
      }
      const pBase = basePlayer.current.play();
      const pHidden = hiddenPlayer.current ? hiddenPlayer.current.play() : Promise.resolve();
      const results = await Promise.allSettled([pBase, pHidden]);
      console.debug('AudioLab: play results', results);
      startDrawing();
      setIsPlaying(true);
    } catch (err) {
      console.error('play failed', err);
    }
  };

  // Play reversed audio using Web Audio API by fetching and reversing channel data
  const playReverse = async () => {
    if (!baseSrc) return;
    try {
      const AudioCtx = (window.AudioContext || (window as any).webkitAudioContext);
      const ctx = new AudioCtx();
      const response = await fetch(baseSrc);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      // Reverse each channel in-place
      for (let ch = 0; ch < audioBuffer.numberOfChannels; ch++) {
        const data = audioBuffer.getChannelData(ch);
        for (let a = 0, b = data.length - 1; a < b; a++, b--) {
          const tmp = data[a];
          data[a] = data[b];
          data[b] = tmp;
        }
      }

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);
      source.start();
      source.onended = () => { try { ctx.close(); } catch (e) {} };
    } catch (e) {
      console.error('playReverse error', e);
    }
  };

  return (
    <div className="audio-lab-panel" ref={containerRef as any}>
      {/* --- TELA SUPERIOR (VISUALIZADOR) --- */}
      <div className="analyzer-section">
         <div className="screen-info-left">CANAL DE ENTRADA: 01</div>
         <div className="screen-info-right">
            <span style={{color:'#666', fontSize:9, display:'block'}}>FREQUÊNCIA ALVO</span>
            <span className="signal-status" style={{ 
               color: clarity > 85 ? '#00ff00' : (clarity > 30 ? '#ffae00' : '#ff3333') 
            }}>
               {clarity > 85 ? 'SINAL LIMPO (LOCKED)' : (clarity > 30 ? 'INTERFERÊNCIA' : 'SEM SINAL')} ({currentFreq}Hz)
            </span>
         </div>

         {/* Canvas visualizer fills the analyzer area */}
         <div style={{ position: 'absolute', inset: 28 }}>
           <div className="analyzer-canvas" style={{ width: '100%', height: '100%' }}>
             <canvas ref={canvasRef as any} />
           </div>
         </div>
      </div>

      {/* --- TELA INFERIOR (CONTROLES) --- */}
      <div className="controls-section">
         <button className={`btn-big-play ${isPlaying?'playing':''}`} onClick={togglePlay}>
            {isPlaying ? '◼' : '▶'}
         </button>

         <div className="evp-tuner">
            <div className="tuner-label">
               <span>SINTONIZAR DIAL EVP</span>
               <span style={{color: '#c6a45f'}}>{currentFreq.toFixed(1)} Hz</span>
            </div>
            
            <input 
               type="range" min="0" max="100" step="0.5"
               value={currentFreq}
               onChange={(e) => setCurrentFreq(Number(e.target.value))}
               className="tuner-slider"
            />
            
            <div className="tuner-ruler">
               <span>0</span><span>20</span><span>40</span><span>60</span><span>80</span><span>100</span>
            </div>
         </div>

         <div className="extra-tools">
            <button className="tool-mini-btn" title="Loop de Fita">🔁</button>
            <button className="tool-mini-btn" title="Redutor de Ruído">🔇 NR</button>
         </div>

      </div>

      {/* Players (Invisíveis) */}
      <audio ref={basePlayer} src={baseSrc} loop crossOrigin="anonymous" onEnded={() => setIsPlaying(false)} style={{ display: 'none' }} />
      <audio ref={hiddenPlayer} src={hiddenSrc} loop crossOrigin="anonymous" style={{ display: 'none' }} />
    </div>
  );
}
