import React, { useRef, useState, useEffect } from 'react';
import './CCTVPlayer.css';

interface CCTVPlayerProps {
  src?: string | null;
  allowManage?: boolean;
  onReplace?: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
}

export default function CCTVPlayer({ src, allowManage = false, onReplace, onRemove }: CCTVPlayerProps) {
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Estado dos controles
  const [speed, setSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [filterMode, setFilterMode] = useState<'normal' | 'night-vision' | 'thermal'>('normal');
  const [time, setTime] = useState<Date>(new Date());

  // Relógio do Sistema de Câmera
  useEffect(() => {
   const timer = setInterval(() => setTime(new Date()), 1000);
   return () => clearInterval(timer);
  }, []);

  useEffect(() => {
   if (vidRef.current) vidRef.current.playbackRate = speed;
  }, [speed]);

  const handleSpeed = (s: number) => { setSpeed(s); };

  const handleReplaceFile = (f: File | null) => {
    if (!f) return;
    try {
      const res = onReplace ? onReplace(f) : undefined;
      if (res && typeof (res as any).then === 'function') (res as Promise<void>).catch(() => {});
    } catch (e) {}
  };

  const handleRemove = () => {
    try {
      const res = onRemove ? onRemove() : undefined;
      if (res && typeof (res as any).then === 'function') (res as Promise<void>).catch(() => {});
    } catch (e) {}
  };

  return (
   <div className={`cctv-wrapper ${filterMode === 'night-vision' ? 'filter-night-vision' : ''} ${filterMode === 'thermal' ? 'filter-thermal' : ''}`}>
       
     {/* 1. TELA DO VÍDEO */}
     <div className="cctv-screen">
       {/* Interface da Câmera (Sobreposição) */}
       <div className="cam-overlay">
         <div className="rec-dot">
           <div className="rec-circle"/> REC
         </div>
         <div>CAM-04 [SETOR C]</div>
         <div>{time.toLocaleTimeString()}</div>
       </div>
          
       <video 
         ref={vidRef} 
         src={src || undefined} 
         loop 
         autoPlay 
         muted 
         playsInline
         style={{ 
           // Aplica o zoom via CSS Transform
           transform: `scale(${zoom})`,
           cursor: zoom > 1 ? 'grab' : 'default',
           maxWidth: '100%',
           maxHeight: '100%'
         }}
       />
       {allowManage && (
        <div className="cctv-manage" style={{ position: 'absolute', right: 12, bottom: 12, zIndex: 40, pointerEvents: 'auto' }}>
          <input ref={fileInputRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={(e) => {
           const f = e.target.files?.[0] || null;
           handleReplaceFile(f);
           try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (e) {}
          }} />
          <button className="cctv-btn" onClick={() => fileInputRef.current?.click()}>SUBSTITUIR</button>
          <button className="cctv-btn" onClick={() => { if (!confirm('Remover vídeo anexado?')) return; handleRemove(); }} style={{ marginLeft: 8 }}>REMOVER</button>
        </div>
       )}
     </div>

     {/* 2. BARRA DE CONTROLE (DECK) */}
     <div className="cctv-controls">
          
       {/* Velocidade de Playback */}
       <div className="control-group">
         <label>VELOCIDADE: {speed}x</label>
         <div className="cctv-btn-row">
           <button className={`cctv-btn ${speed===0.25?'active':''}`} onClick={()=>handleSpeed(0.25)}>0.25</button>
           <button className={`cctv-btn ${speed===0.5?'active':''}`} onClick={()=>handleSpeed(0.5)}>0.5</button>
           <button className={`cctv-btn ${speed===1?'active':''}`} onClick={()=>handleSpeed(1)}>1.0</button>
         </div>
       </div>

       {/* Slider de Zoom Digital */}
       <div className="control-group">
         <label style={{color: '#c6a45f'}}>ZOOM ÓPTICO: {zoom.toFixed(1)}x</label>
         <input 
           type="range" min="1" max="4" step="0.1" 
           value={zoom} 
           onChange={e => setZoom(Number(e.target.value))}
           className="cctv-slider"
         />
       </div>

       {/* Modos de Visão */}
       <div className="control-group">
         <label>MODO VISUAL</label>
         <div className="cctv-btn-row">
           <button className={`cctv-btn ${filterMode==='normal'?'active':''}`} onClick={()=>setFilterMode('normal')}>COR</button>
           <button className={`cctv-btn ${filterMode==='night-vision'?'active':''}`} onClick={()=>setFilterMode('night-vision')}>NVG</button>
           <button className={`cctv-btn ${filterMode==='thermal'?'active':''}`} onClick={()=>setFilterMode('thermal')}>TERM</button>
         </div>
       </div>

     </div>
   </div>
  );
}

