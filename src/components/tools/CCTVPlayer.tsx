import React, { useRef, useState, useEffect } from 'react';
import { Pin } from 'lucide-react';
import './CCTVPlayer.css';
import { getOptimizedInterval } from '../../utils/performance';
import { useForensicDispatch } from '../../contexts/ForensicDispatchContext';

interface CCTVPlayerProps {
  src?: string | null;
  cameraName?: string;
  thermalSecretText?: string;
  thermalSecretStartSec?: number;
  thermalSecretEndSec?: number;
  cardId?: string;
  allowManage?: boolean;
  onReplace?: (file: File) => void | Promise<void>;
  onRemove?: () => void | Promise<void>;
}

export default function CCTVPlayer({
  src,
  cameraName = 'CAM-04 [SETOR C]',
  thermalSecretText,
  thermalSecretStartSec = 0,
  thermalSecretEndSec = 9999,
  cardId,
  allowManage = false,
  onReplace,
  onRemove,
}: CCTVPlayerProps) {
  const { saveSnippetToBoard } = useForensicDispatch();
  const vidRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const screenRef = useRef<HTMLDivElement | null>(null);

  const [speed, setSpeed] = useState<number>(1);
  const [zoom, setZoom] = useState<number>(1.0);
  const [filterMode, setFilterMode] = useState<'normal' | 'night-vision' | 'thermal'>('normal');
  const [time, setTime] = useState<Date>(new Date());
  const [videoTime, setVideoTime] = useState<number>(0);
  const [extracting, setExtracting] = useState(false);

  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), getOptimizedInterval(1000, 10));
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (vidRef.current) vidRef.current.playbackRate = speed;
  }, [speed]);

  useEffect(() => {
    if (zoom <= 1) setPan({ x: 0, y: 0 });
  }, [zoom]);

  const showThermalSecret =
    Boolean(thermalSecretText) &&
    filterMode === 'thermal' &&
    videoTime >= thermalSecretStartSec &&
    videoTime <= thermalSecretEndSec;

  const handleExtractFrame = async () => {
    const vid = vidRef.current;
    if (!vid) return;
    setExtracting(true);
    try {
      const cvs = document.createElement('canvas');
      cvs.width = vid.videoWidth || 640;
      cvs.height = vid.videoHeight || 360;
      const ctx = cvs.getContext('2d');
      if (ctx) {
        ctx.drawImage(vid, 0, 0, cvs.width, cvs.height);
        if (showThermalSecret && thermalSecretText) {
          ctx.fillStyle = 'rgba(255, 80, 20, 0.9)';
          ctx.font = 'bold 26px monospace';
          ctx.textAlign = 'center';
          ctx.fillText(thermalSecretText, cvs.width / 2, cvs.height / 2);
        }
        const blob = await new Promise<Blob | null>((resolve) => cvs.toBlob((b) => resolve(b), 'image/png'));
        if (blob) {
          await saveSnippetToBoard({
            title: `Frame ${cameraName} (${videoTime.toFixed(1)}s)`,
            description: `Frame extraído no modo ${filterMode.toUpperCase()}.`,
            imageBlob: blob,
            sourceCardId: cardId,
          });
        }
      }
    } finally {
      setExtracting(false);
    }
  };

  const handleReplaceFile = (f: File | null) => {
    if (!f) return;
    try {
      const res = onReplace ? onReplace(f) : undefined;
      if (res && typeof (res as any).then === 'function') (res as Promise<void>).catch(() => {});
    } catch {}
  };

  const handleRemove = () => {
    try {
      const res = onRemove ? onRemove() : undefined;
      if (res && typeof (res as any).then === 'function') (res as Promise<void>).catch(() => {});
    } catch {}
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (zoom <= 1) return;
    setIsPanning(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isPanning || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    const limit = (zoom - 1) * 150;
    setPan({
      x: Math.max(-limit, Math.min(limit, dragStartRef.current.panX + dx)),
      y: Math.max(-limit, Math.min(limit, dragStartRef.current.panY + dy)),
    });
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (isPanning) {
      setIsPanning(false);
      try {
        (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  };

  return (
    <div className={`cctv-wrapper ${filterMode === 'night-vision' ? 'filter-night-vision' : ''} ${filterMode === 'thermal' ? 'filter-thermal' : ''}`}>
      <div
        ref={screenRef}
        className="cctv-screen"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        style={{ touchAction: zoom > 1 ? 'none' : 'auto' }}
      >
        <div className="cam-overlay">
          <div className="rec-dot">
            <div className="rec-circle" /> REC
          </div>
          <div className="cam-name">{cameraName}</div>
          <div className="cam-time">{time.toLocaleTimeString()} ({videoTime.toFixed(1)}s)</div>
        </div>

        <video
          ref={vidRef}
          src={src || undefined}
          loop
          autoPlay
          muted
          playsInline
          onTimeUpdate={(e) => setVideoTime((e.target as HTMLVideoElement).currentTime)}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: zoom > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default',
            maxWidth: '100%',
            maxHeight: '100%',
            transition: isPanning ? 'none' : 'transform 0.15s ease-out',
          }}
        />

        {showThermalSecret && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              color: '#ff6b2b',
              textShadow: '0 0 12px rgba(255, 80, 0, 0.9)',
              fontFamily: 'monospace',
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: '0.12em',
            }}
          >
            {thermalSecretText}
          </div>
        )}

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
                try { if (fileInputRef.current) fileInputRef.current.value = ''; } catch {}
              }}
            />
            <button className="cctv-btn" onClick={() => fileInputRef.current?.click()}>SUBSTITUIR</button>
            <button className="cctv-btn" onClick={() => { if (!confirm('Remover vídeo anexado?')) return; handleRemove(); }} style={{ marginLeft: 8 }}>REMOVER</button>
          </div>
        )}
      </div>

      <div className="cctv-controls">
        <div className="control-group">
          <label>VELOCIDADE: {speed}x</label>
          <div className="cctv-btn-row">
            <button className={`cctv-btn ${speed === 0.25 ? 'active' : ''}`} onClick={() => setSpeed(0.25)}>0.25x</button>
            <button className={`cctv-btn ${speed === 0.5 ? 'active' : ''}`} onClick={() => setSpeed(0.5)}>0.50x</button>
            <button className={`cctv-btn ${speed === 1 ? 'active' : ''}`} onClick={() => setSpeed(1)}>1.0x</button>
          </div>
        </div>

        <div className="control-group">
          <label style={{ color: '#c6a45f' }}>ZOOM: {zoom.toFixed(1)}x {zoom > 1 && '(Arraste para Pan)'}</label>
          <input
            type="range"
            min="1"
            max="4"
            step="0.1"
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="cctv-slider"
          />
        </div>

        <div className="control-group">
          <label>MODO VISUAL</label>
          <div className="cctv-btn-row">
            <button className={`cctv-btn ${filterMode === 'normal' ? 'active' : ''}`} onClick={() => setFilterMode('normal')}>COR</button>
            <button className={`cctv-btn ${filterMode === 'night-vision' ? 'active' : ''}`} onClick={() => setFilterMode('night-vision')}>NVG</button>
            <button className={`cctv-btn ${filterMode === 'thermal' ? 'active' : ''}`} onClick={() => setFilterMode('thermal')}>TERM</button>
            <button className="cctv-btn" onClick={handleExtractFrame} disabled={extracting || !src} title="Extrair Frame para o Mural">
              <Pin size={12} /> {extracting ? '...' : 'FRAME'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
