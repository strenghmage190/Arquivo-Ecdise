import React, { useRef, useState, useEffect } from 'react';
import './MysteryEffects.css';

interface GlobalMouse {
  clientX: number;
  clientY: number;
  overBoard: boolean;
}

interface Props {
  baseSrc?: string;
  hiddenSrc?: string;
  filterLayerSrc?: string;
  filters?: {
    brightness: number;
    contrast: number;
    saturate: number;
  };
  revealTarget?: {
    brightness?: number;
    contrast?: number;
    saturate?: number;
  } | null;
  isUVMode: boolean;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
  pointerLocal?: { x: number; y: number; over: boolean } | undefined;
  forensicChannel?: 'all' | 'r' | 'g' | 'b';
}

export function MysteryImage({
  baseSrc,
  hiddenSrc,
  filterLayerSrc,
  isUVMode,
  filters = { brightness: 100, contrast: 100, saturate: 100 },
  revealTarget = null,
  className = '',
  style = {},
  fit = 'cover',
  pointerLocal
  , forensicChannel = 'all'
}: Props) {
  const [xy, setXy] = useState({ x: -500, y: -500 });
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setXy({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setIsHovering(true);
  };

  const handleMouseLeave = () => setIsHovering(false);

  useEffect(() => {
    if (!pointerLocal) return;
    if (!pointerLocal.over) {
      setIsHovering(false);
      return;
    }
    setXy({ x: pointerLocal.x, y: pointerLocal.y });
    setIsHovering(true);
  }, [pointerLocal]);

  const hasSecret = Boolean(hiddenSrc);

  // compute reveal radius dynamically based on element size so large images get a larger UV lens
  const [RADIUS, setRADIUS] = useState<number>(120);

  useEffect(() => {
    const compute = () => {
      try {
        if (!containerRef.current) return setRADIUS(120);
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        // use ~16% of the smallest dimension, but clamp to reasonable bounds
        const r = Math.round(Math.max(60, Math.min(w, h) * 0.16));
        setRADIUS(r);
      } catch (e) { setRADIUS(120); }
    };
    compute();
    const ro = new ResizeObserver(() => compute());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', compute);
    return () => { ro.disconnect(); window.removeEventListener('resize', compute); };
  }, [containerRef.current]);

  const maskStyle: React.CSSProperties = {
    // explicit gradient stops: solid black up to 60% of the radius, then fade to transparent
    maskImage: `radial-gradient(circle ${RADIUS}px at ${xy.x}px ${xy.y}px, black 0%, black 60%, transparent 100%)`,
    WebkitMaskImage: `radial-gradient(circle ${RADIUS}px at ${xy.x}px ${xy.y}px, black 0%, black 60%, transparent 100%)`
  };

  const bgStyle: React.CSSProperties = {
    backgroundSize: fit,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transition: 'filter 0.1s linear'
  };

  const bgImage = baseSrc ? `url(${baseSrc})` : 'none';
  const hiddenImage = hiddenSrc ? `url(${hiddenSrc})` : 'none';
  const filterImage = filterLayerSrc ? `url(${filterLayerSrc})` : 'none';

  // Aplica filtros na imagem base
  // Apply forensic channel approximation filters if requested
  let channelFilter = '';
  // Refined CSS filter presets to better emphasize individual R/G/B channels.
  // These are still approximations (CSS filters are limited) but tuned for
  // stronger visual separation while preserving contrast.
  if (forensicChannel === 'r') {
    channelFilter = 'contrast(1.25) saturate(2.2) sepia(0.6) hue-rotate(-22deg)';
  } else if (forensicChannel === 'g') {
    channelFilter = 'contrast(1.18) saturate(2.0) sepia(0.25) hue-rotate(60deg)';
  } else if (forensicChannel === 'b') {
    channelFilter = 'contrast(1.2) saturate(2.4) sepia(0.2) hue-rotate(150deg)';
  }

  const filterStyle: React.CSSProperties = {
    backgroundSize: fit,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transition: 'filter 0.1s linear',
    position: 'absolute', inset: 0,
    filter: isUVMode
      ? 'brightness(0.2) contrast(1.1) hue-rotate(260deg)'
      : `${channelFilter} brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`
  };

  // Cálculo de opacidade da camada de tratamento (puzzle)
  let hiddenLayerOpacity = 0;
  // Mostra camada de tratamento com tolerância ajustável.
  // Se houver um `revealTarget` explícito, calcula quão próximo os filtros atuais estão do alvo.
  if (revealTarget !== null && typeof revealTarget === 'object') {
    const rb = revealTarget.brightness ?? 100;
    const rc = revealTarget.contrast ?? 100;
    const rs = revealTarget.saturate ?? 100;
    const closeness = Math.abs(filters.brightness - rb) + Math.abs(filters.contrast - rc) + Math.abs(filters.saturate - rs);
    // quanto menor o closeness, maior a opacidade. Use threshold mais baixo para facilitar aparecimento.
    const THRESH = 180; // sensibilidade levemente aumentada (menor = mais fácil aparecer)
    hiddenLayerOpacity = Math.max(0, Math.min(1, 1 - (closeness / THRESH)));
    // suaviza transição com leve exponenciação
    hiddenLayerOpacity = Math.pow(hiddenLayerOpacity, 0.95);
  } else {
    // Quando não há alvo definido, mostramos a camada proporcionalmente à alteração em relação a 100%.
    const distortionLevel = Math.abs(filters.brightness - 100) + Math.abs(filters.contrast - 100) + Math.abs(filters.saturate - 100);
    hiddenLayerOpacity = Math.min(1, distortionLevel / 80); // torne mais sensível (menor divisor)
  }

  // Debug temporário: ajuda a identificar por que a camada pode permanecer invisível
  try {
    // eslint-disable-next-line no-console
    console.debug('MysteryImage debug', { filters, revealTarget, hiddenLayerOpacity });
  } catch (e) {}

  // canvasRef and drawing effect for pixel-precise forensic channel isolation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    if (forensicChannel === 'all') return; // no canvas processing required
    if (!baseSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseSrc;
    imageRef.current = img;

    let cancelled = false;
    img.onload = () => {
      if (cancelled) return;
      try {
        const container = containerRef.current;
        const cw = container ? container.clientWidth : img.width;
        const ch = container ? container.clientHeight : img.height;
        // size canvas to displayed dimensions
        canvas.width = Math.max(1, cw);
        canvas.height = Math.max(1, ch);
        // draw the image scaled to canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // pixel manipulation for channel isolation
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // amplify selected channel slightly for visibility
        const amp = 1.6;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          if (forensicChannel === 'r') {
            const newR = Math.min(255, Math.round(r * amp));
            data[i] = newR;
            data[i + 1] = 0;
            data[i + 2] = 0;
          } else if (forensicChannel === 'g') {
            const newG = Math.min(255, Math.round(g * amp));
            data[i] = 0;
            data[i + 1] = newG;
            data[i + 2] = 0;
          } else if (forensicChannel === 'b') {
            const newB = Math.min(255, Math.round(b * amp));
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = newB;
          }
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('MysteryImage canvas processing failed', e);
      }
    };

    return () => { cancelled = true; };
  }, [baseSrc, forensicChannel, filters, isUVMode]);

  return (
    <div
      className={`uv-container ${className}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, cursor: isUVMode ? 'none' : 'default' }}
    >
      {/* Render a pixel-precise canvas when forensicChannel is requested, otherwise render the CSS-backed background. */}
      {forensicChannel === 'all' ? (
        <div style={{ ...filterStyle, backgroundImage: bgImage }} />
      ) : (
        <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      )}

      {/* 2. CAMADA DO PUZZLE DE TRATAMENTO */}
      {filterLayerSrc && !isUVMode && (
        <div style={{
          ...filterStyle,
          backgroundImage: filterImage,
          mixBlendMode: 'screen',
          opacity: hiddenLayerOpacity
        }} />
      )}

      {isUVMode && hasSecret && (
        <div className="secret-ink" style={{ ...bgStyle, position: 'absolute', inset: 0, backgroundImage: hiddenImage, ...maskStyle }} />
      )}

      {isUVMode && isHovering && (
        <>
          <div className="static-noise" style={maskStyle} />
          <div className="uv-lens-flare" style={{
            background: `radial-gradient(circle ${RADIUS}px at ${xy.x}px ${xy.y}px, rgba(160,160,255,0.12) 0%, rgba(80,0,180,0.28) 60%, rgba(30,0,80,0.8) 100%)`,
            position: 'absolute', inset: 0
          }} />
        </>
      )}

      {!isUVMode && hasSecret && fit !== 'contain' && <div style={{ position: 'absolute', bottom: 2, right: 4, opacity: 0.6, fontSize: 12 }}>🟣</div>}
    </div>
  );
}

export default MysteryImage;
