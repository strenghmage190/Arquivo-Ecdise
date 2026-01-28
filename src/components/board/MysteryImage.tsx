import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import './MysteryEffects.css';
import useThrottledMouse from '../../hooks/useThrottledMouse';

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
  revealSettings?: {
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
  ambientBlur?: boolean;
}

export function MysteryImage({
  baseSrc,
  hiddenSrc,
  filterLayerSrc,
  isUVMode,
  ambientBlur = false,
  filters = { brightness: 100, contrast: 100, saturate: 100 },
  revealSettings = null,
  className = '',
  style = {},
  fit = 'cover',
  pointerLocal
  , forensicChannel = 'all'
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { xy, isHovering } = useThrottledMouse<HTMLDivElement>(
    containerRef,
    pointerLocal ? { x: pointerLocal.x, y: pointerLocal.y, over: Boolean(pointerLocal.over) } : undefined
  );

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

  // preload base/hidden images to avoid flashing on first reveal
  useEffect(() => {
    const preloadImage = (src: string | undefined) => {
      if (!src) return;
      const img = new Image();
      img.src = src;
      img.onload = () => console.debug(`Image preloaded: ${src}`);
      img.onerror = () => console.warn(`Failed to preload image: ${src}`);
    };

    preloadImage(baseSrc);
    preloadImage(hiddenSrc);
    preloadImage(filterLayerSrc);
  }, [baseSrc, hiddenSrc, filterLayerSrc]);

  // mask is now applied via CSS using the container's CSS variables

  const bgStyle: React.CSSProperties = useMemo(() => ({
    backgroundSize: fit,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transition: 'filter 0.1s linear',
  }), [fit]);

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

  const baseFilter = isUVMode
    ? 'brightness(0.2) contrast(1.1) hue-rotate(260deg)'
    : `${channelFilter} brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;

  const filterStyle: React.CSSProperties = useMemo(() => {
    const baseFilter = isUVMode
      ? 'brightness(0.2) contrast(1.1) hue-rotate(260deg)'
      : `${channelFilter} brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;

    return {
      backgroundSize: fit,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      transition: 'filter 0.1s linear',
      position: 'absolute',
      inset: 0,
      zIndex: 5,
      filter: baseFilter,
    };
  }, [isUVMode, channelFilter, filters, fit]);
  // Cálculo de opacidade da camada de tratamento (puzzle)
  let hiddenLayerOpacity = 0;
  // Se o mestre forneceu valores alvo, usamos modo de enigma: mostrar apenas quando o jogador se aproximar
  if (revealSettings !== null && typeof revealSettings === 'object') {
    const rb = revealSettings.brightness ?? 100;
    const rc = revealSettings.contrast ?? 100;
    const rs = revealSettings.saturate ?? 100;
    const dist = Math.abs(filters.brightness - rb) + Math.abs(filters.contrast - rc) + Math.abs(filters.saturate - rs);
    // Se estiver dentro de um raio maior, a camada começa a aparecer — usamos easing
    const THRESH = 60; // aumentar alcance para facilitar o aparecimento
    if (dist < THRESH) {
      const raw = 1 - (dist / THRESH);
      // aplicar easing para deixar o centro (dist baixa) bem mais opaco
      hiddenLayerOpacity = Math.pow(Math.max(0, raw), 0.5);
    } else {
      hiddenLayerOpacity = 0;
    }
  } else {
    // Modo legado: revela proporcionalmente à distorção a partir de 100
    const distortionLevel = Math.abs(filters.brightness - 100) + Math.abs(filters.contrast - 100) + Math.abs(filters.saturate - 100);
    hiddenLayerOpacity = Math.min(1, distortionLevel / 40); // aumentar sensibilidade no modo legado
  }

  // Precompute overlayStyle with useMemo so hooks are not called conditionally during render
  const overlayStyle: React.CSSProperties = useMemo<React.CSSProperties>(() => ({
    backgroundSize: fit,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transition: 'opacity 0.12s linear',
    position: 'absolute',
    inset: 0,
    zIndex: 30,
    pointerEvents: 'none' as React.CSSProperties['pointerEvents'],
    backgroundImage: filterLayerSrc ? filterImage : hiddenImage,
    // render the overlay normally (avoid 'screen' making it faint)
    mixBlendMode: 'normal' as any,
    opacity: Math.min(1, hiddenLayerOpacity * 1.8),
    // increase contrast/saturation to make secret content pop
    filter: 'contrast(1.6) saturate(1.15)'
  }), [fit, hiddenLayerOpacity, filterLayerSrc, filterImage, hiddenImage]);

  // Debug temporário: ajuda a identificar por que a camada pode permanecer invisível
  try {
    // eslint-disable-next-line no-console
    console.debug('MysteryImage debug', { filters, revealSettings, hiddenLayerOpacity });
  } catch (e) {}

  // canvasRef and drawing effect for pixel-precise forensic channel isolation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  // Only redraw the forensic canvas when the source image or the requested
  // forensic channel changes. This avoids expensive reprocessing when unrelated
  // props (filters / isUVMode) change.
  useEffect(() => {
    if (forensicChannel === 'all') return; // no canvas processing required
    if (!baseSrc) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseSrc;
    imageRef.current = img;

    let cancelled = false;
    const onload = async () => {
      if (cancelled) return;
      try {
        const naturalW = img.naturalWidth || img.width || 1024;
        const naturalH = img.naturalHeight || img.height || 768;
        // cap maximum dimension to reduce pixel-processing cost and improve FPS
        const MAX_DIM = 1200; // adjust if you want higher fidelity
        const scale = Math.min(1, MAX_DIM / Math.max(naturalW, naturalH));
        const targetW = Math.max(1, Math.round(naturalW * scale));
        const targetH = Math.max(1, Math.round(naturalH * scale));
        canvas.width = targetW;
        canvas.height = targetH;
        // ensure canvas element will scale visually to fit the container while preserving aspect ratio
        try {
          (canvas as any).style.maxWidth = '100%';
          (canvas as any).style.maxHeight = '100%';
          (canvas as any).style.width = 'auto';
          (canvas as any).style.height = '100%';
          (canvas as any).style.left = '50%';
          (canvas as any).style.top = '50%';
          (canvas as any).style.transform = 'translate(-50%, -50%)';
        } catch (e) {}

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // prefer createImageBitmap where available (faster in many browsers)
        if ((window as any).createImageBitmap) {
          try {
            const bitmap = await (window as any).createImageBitmap(img);
            ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
            try { bitmap.close?.(); } catch (e) {}
          } catch (e) {
            // fallback
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          }
        } else {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }

        // small optimization: work on the scaled canvas only (fewer pixels)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0, len = data.length; i < len; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          let intensity = 0;
          let cr = 0, cg = 0, cb = 0;
          if (forensicChannel === 'r') { intensity = r; cr = 255; cg = 0; cb = 0; }
          else if (forensicChannel === 'g') { intensity = g; cr = 0; cg = 255; cb = 0; }
          else if (forensicChannel === 'b') { intensity = b; cr = 0; cg = 0; cb = 255; }
          data[i] = cr;
          data[i + 1] = cg;
          data[i + 2] = cb;
          data[i + 3] = Math.max(0, Math.min(255, Math.round(intensity)));
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.debug('MysteryImage canvas processing failed', e);
      }
    };

    img.addEventListener('load', onload);
    return () => { cancelled = true; img.removeEventListener('load', onload); };
  }, [baseSrc, forensicChannel]);

  const handleResize = useCallback(() => {
    try {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setRADIUS(Math.min(rect.width, rect.height) / 4);
    } catch (e) {
      console.error('Error computing UV radius:', e);
    }
  }, []);

  useEffect(() => {
    handleResize();
    const ro = new ResizeObserver(() => handleResize());
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener('resize', handleResize);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  return (
    <div
      className={`uv-container ${isUVMode ? 'uv-active' : ''} ${className}`}
      ref={containerRef}
      style={{
        ...style,
        cursor: isUVMode ? 'none' : 'default',
        // expose CSS vars for radius and pointer to enable CSS-only masks
        ['--uv-radius' as any]: `${RADIUS}px`,
        ['--mouse-x' as any]: `${xy.x}px`,
        ['--mouse-y' as any]: `${xy.y}px`
      }}
    >
      {/* Background decorative blur (fills sides with color from the image) - optional */}
      {baseSrc && !isUVMode && ambientBlur && (
        <img src={baseSrc} className="bg-blur" alt="" loading="lazy" draggable={false} style={{ pointerEvents: 'none' }} />
      )}
      {/* Base image always rendered as background layer (keeps layout stable) */}
      <div style={{ ...filterStyle, backgroundImage: bgImage, position: 'absolute', inset: 0 }} />

      {/* Render a pixel-precise overlay canvas when forensicChannel is requested (not 'all') */}
      {forensicChannel !== 'all' && (
        <canvas ref={canvasRef} className="forensic-canvas" />
      )}

      {/* 2. CAMADA DO PUZZLE DE TRATAMENTO */}
      {(filterLayerSrc || hiddenSrc) && !isUVMode && (
        <div style={overlayStyle} />
      )}

      {isUVMode && hasSecret && (
        <div className="secret-ink" style={{ ...bgStyle, position: 'absolute', inset: 0, backgroundImage: hiddenImage }} />
      )}

      {isUVMode && isHovering && (
        <>
          <div className="static-noise" />
          <div className="uv-lens-flare" style={{ position: 'absolute', inset: 0, opacity: 0.55 }} />
        </>
      )}

      {/* Main visible image (on top) - hidden when performing canvas forensic channel work */}
      {baseSrc && forensicChannel === 'all' && !isUVMode && (
        <img
          src={baseSrc}
          className="main-evidence"
          alt="evidence"
          loading="lazy"
          draggable={false}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: fit, filter: baseFilter, transition: 'filter 0.1s linear', zIndex: 10, pointerEvents: 'none' }}
        />
      )}

      {!isUVMode && hasSecret && fit !== 'contain' && <div style={{ position: 'absolute', bottom: 2, right: 4, opacity: 0.6, fontSize: 12 }}>🟣</div>}
    </div>
  );
}

export default MysteryImage;
