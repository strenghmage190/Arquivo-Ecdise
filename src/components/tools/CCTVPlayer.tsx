import React, { useRef, useState, useEffect, useCallback } from 'react';
import './CCTVPlayer.css';
import { isExtendedPerformanceMode, getOptimizedInterval } from '../../utils/performance';

interface CCTVPlayerProps {
  src?: string | null;
  allowManage?: boolean;
  onReplace?: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
}

export default function CCTVPlayer({ src, allowManage = false, onReplace, onRemove }: CCTVPlayerProps) {
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);
  
  // Estado dos controles
  const [speed, setSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [filterMode, setFilterMode] = useState<'normal' | 'night-vision' | 'thermal'>('normal');
  const [time, setTime] = useState<Date>(new Date());

  // Pan (arraste) com mouse ou touch quando em zoom
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });

  // Relógio do Sistema de Câmera
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), getOptimizedInterval(1000, 10)); // 1000ms normal, 10000ms in performance mode
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (vidRef.current) vidRef.current.playbackRate = speed;
  }, [speed]);

  // Reset pan quando zoom for 1.0
  useEffect(() => {
    if (zoom <= 1) {
      setPan({ x: 0, y: 0 });
    }
  }, [zoom]);

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

  // Pan Touch e Mouse handlers
  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y
    };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Limite razoável de pan proporcional ao zoom
    const limit = (zoom - 1) * 150;
    const nextX = Math.max(-limit, Math.min(limit, dragStartRef.current.panX + dx));
    const nextY = Math.max(-limit, Math.min(limit, dragStartRef.current.panY + dy));
    setPan({ x: nextX, y: nextY });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch (err) {}
    }
  };

  return (
    <div className={`cctv-wrapper ${filterMode === 'night-vision' ? 'filter-night-vision' : ''} ${filterMode === 'thermal' ? 'filter-thermal' : ''}`}>
       
      {/* 1. TELA DO VÍDEO */}
      <div 
        ref={screenRef}
        className="cctv-screen"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: zoom > 1 ? 'none' : 'auto' }}
      >
        {/* Interface da Câmera (Sobreposição) */}
        <div className="cam-overlay">
          <div className="rec-dot">
            <div className="rec-circle"/> REC
          </div>
          <div className="cam-name">CAM-04 [SETOR C]</div>
          <div className="cam-time">{time.toLocaleTimeString()}</div>
        </div>
          
        <video 
          ref={vidRef} 
          src={src || undefined} 
          loop 
          autoPlay 
          muted 
          playsInline
          style={{ 
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            maxWidth: '100%',
            maxHeight: '100%',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out'
          }}
        />
        {allowManage && (
          <div className="cctv-manage">
            <input 
              ref={fileInputRef} 
              type="file" 
              accept="video/*" 
              style={{ display: 'none' }} 
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                handleReplaceFile(f);
                try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch (e) {}
              }} 
            />
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
            <button className={`cctv-btn ${speed===0.25?'active':''}`} onClick={()=>handleSpeed(0.25)}>0.25x</button>
            <button className={`cctv-btn ${speed===0.5?'active':''}`} onClick={()=>handleSpeed(0.5)}>0.50x</button>
            <button className={`cctv-btn ${speed===1?'active':''}`} onClick={()=>handleSpeed(1)}>1.0x</button>
          </div>
        </div>

        {/* Slider de Zoom Digital */}
        <div className="control-group">
          <label style={{color: '#c6a45f'}}>ZOOM: {zoom.toFixed(1)}x {zoom > 1 && '(Arraste para Pan)'}</label>
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
