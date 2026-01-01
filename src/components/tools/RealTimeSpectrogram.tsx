import React, { useEffect, useRef, useState } from 'react';

type Props = {
  audioBuffer: AudioBuffer | null;
  minFreq?: number;
  maxFreq?: number;
  width?: number;
  height?: number;
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }
function hexToRgb(hex: string) {
  const m = hex.replace('#','');
  const r = parseInt(m.substring(0,2),16);
  const g = parseInt(m.substring(2,4),16);
  const b = parseInt(m.substring(4,6),16);
  return [r,g,b];
}

// simple magma-like palette interpolation (purple -> orange -> yellow)
function colorForValue(v: number) {
  // v in [0,1]
  const stops = ['#0b0026','#5b007a','#ff6a00','#fff176'];
  if (v <= 0) return 'rgba(0,0,0,1)';
  if (v >= 1) return stops[stops.length-1];
  const p = v * (stops.length - 1);
  const i = Math.floor(p);
  const t = p - i;
  const a = hexToRgb(stops[i]);
  const b = hexToRgb(stops[i+1]);
  const r = Math.round(lerp(a[0], b[0], t));
  const g = Math.round(lerp(a[1], b[1], t));
  const bl = Math.round(lerp(a[2], b[2], t));
  return `rgb(${r},${g},${bl})`;
}

export default function RealTimeSpectrogram({ audioBuffer, minFreq = 1000, maxFreq = 12000, width = 800, height = 256 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // cleanup on unmount
    return () => {
      try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch {}
      try { if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current.disconnect(); sourceRef.current = null; } } catch {}
      try { if (audioCtxRef.current) audioCtxRef.current.close(); } catch {}
      analyserRef.current = null;
    };
  }, []);

  useEffect(() => {
    // when buffer changes reset playback
    if (!audioBuffer) return;
    stop();
  }, [audioBuffer]);

  function stop() {
    try { if (rafRef.current) cancelAnimationFrame(rafRef.current); } catch {}
    rafRef.current = null;
    setIsPlaying(false);
    try { if (sourceRef.current) { sourceRef.current.stop(); sourceRef.current.disconnect(); sourceRef.current = null; } } catch {}
    try { if (audioCtxRef.current) { /* keep context open for reuse */ } } catch {}
  }

  function play() {
    if (!audioBuffer) return;
    if (!audioCtxRef.current) audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    const ctx = audioCtxRef.current;
    const src = ctx.createBufferSource();
    src.buffer = audioBuffer;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0;
    src.connect(analyser);
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;
    sourceRef.current = src;
    src.onended = () => { setIsPlaying(false); };
    src.start(0);
    setIsPlaying(true);
    renderLoop();
  }

  function renderLoop() {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    const bufferLength = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyser) return;
      analyser.getByteFrequencyData(data);

      // shift left by 1px for waterfall
      const shift = 1;
      const w = canvas.width;
      const h = canvas.height;
      const img = ctx.getImageData(shift, 0, w - shift, h);
      ctx.putImageData(img, 0, 0);
      // clear right strip
      ctx.fillStyle = 'black';
      ctx.fillRect(w - shift, 0, shift, h);

      // draw new column at right
      for (let y = 0; y < h; y++) {
        // map canvas y to frequency (top = high)
        const freqNorm = 1 - y / h; // 1..0
        const freq = minFreq + freqNorm * (maxFreq - minFreq);
        // find corresponding bin
        const bin = Math.floor(freq / (audioBuffer!.sampleRate / 2) * bufferLength);
        const val = (bin >= 0 && bin < data.length) ? data[bin] : 0;
        const intensity = Math.max(0, Math.min(1, val / 255));
        if (intensity > 0.01) {
          ctx.fillStyle = colorForValue(intensity);
          ctx.fillRect(w - shift, y, shift, 1);
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);
  }

  return (
    <div style={{background:'#000', padding:8, borderRadius:8}}>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:8}}>
        <button onClick={() => { isPlaying ? stop() : play(); }} style={{padding:'6px 10px', background:'#6b21a8', color:'#fff', border:'none', borderRadius:6}}>{isPlaying ? '⏸ Parar' : '▶ Play'}</button>
        <div style={{color:'#aaa', fontSize:12}}>Waterfall: Retro Pixel (purple → orange → yellow)</div>
      </div>
      <div style={{width, height, overflow:'hidden'}}>
        <canvas ref={canvasRef} width={width} height={height} style={{imageRendering:'pixelated', width:'100%', height:'auto', background:'#000'}} />
      </div>
    </div>
  );
}
