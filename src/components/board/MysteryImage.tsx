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
  onToggleUV?: () => void;
  allowImageUVControl?: boolean;
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
  pointerLocal,
  forensicChannel = 'all',
  onToggleUV,
  allowImageUVControl = false,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { xy, isHovering } = useThrottledMouse<HTMLDivElement>(
    containerRef,
    pointerLocal ? { x: pointerLocal.x, y: pointerLocal.y, over: Boolean(pointerLocal.over) } : undefined
  );

  const hasSecret = Boolean(hiddenSrc);
  // ADDED: flag if forensic inspection is active
  const isForensicActive = forensicChannel !== 'all';

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
      const run = async () => {
        try {
          if ((window as any).createImageBitmap) {
            const resp = await fetch(src, { mode: 'cors' });
            const blob = await resp.blob();
            const bitmap = await (window as any).createImageBitmap(blob);
            try { bitmap.close?.(); } catch (e) {}
            // console.debug(`ImageBitmap preloaded: ${src}`);
          } else {
            const img = new Image();
            img.src = src;
            img.onload = () => {/*noop*/};
          }
        } catch (e) {
          // ignore preload errors
        }
      };

      if ('requestIdleCallback' in window) {
        try { (window as any).requestIdleCallback(() => { run(); }); }
        catch (e) { setTimeout(run, 200); }
      } else {
        setTimeout(run, 200);
      }
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
    backgroundImage: (baseSrc && !isForensicActive) ? `url(${baseSrc})` : 'none',
  }), [fit, baseSrc, isForensicActive]);

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
    ? 'brightness(0.25) contrast(1.5) saturate(0.2) hue-rotate(260deg)'
    : `${channelFilter} brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`;

  const filterStyle: React.CSSProperties = useMemo(() => {
    const baseFilter = isUVMode
      ? 'brightness(0.25) contrast(1.5) saturate(0.2) hue-rotate(260deg)'
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
      backgroundImage: (baseSrc && !isForensicActive) ? `url(${baseSrc})` : 'none',
    };
  }, [isUVMode, channelFilter, filters, fit, baseSrc, isForensicActive]);
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
    backgroundImage: filterImage,
    // render the overlay normally (avoid 'screen' making it faint)
    mixBlendMode: 'normal' as any,
    opacity: Math.min(1, hiddenLayerOpacity * 3.0),
    // increase contrast/saturation to make secret content pop
    filter: 'brightness(2.0) contrast(2.2) saturate(2.0)'
  }), [fit, hiddenLayerOpacity, filterLayerSrc, filterImage, hiddenImage]);

  // Debug temporário: ajuda a identificar por que a camada pode permanecer invisível
  try {
    // eslint-disable-next-line no-console
    console.debug('MysteryImage debug', { filters, revealSettings, hiddenLayerOpacity });
  } catch (e) {}

  // canvasRef and drawing effect for pixel-precise forensic channel isolation
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const workerRef = useRef<Worker | null>(null);

  // Lazy-mount heavy decorative FX (noise / lens flare) to avoid creating DOM
  // elements on every tiny hover change. Mount shortly after hover starts and
  // unmount with a small delay when hover ends to avoid thrash.
  const [fxMounted, setFxMounted] = useState(false);
  const fxMountTimer = useRef<number | null>(null);
  const fxUnmountTimer = useRef<number | null>(null);

  useEffect(() => {
    if (!isUVMode) {
      if (fxMountTimer.current) { clearTimeout(fxMountTimer.current); fxMountTimer.current = null; }
      if (fxUnmountTimer.current) { clearTimeout(fxUnmountTimer.current); fxUnmountTimer.current = null; }
      setFxMounted(false);
      return;
    }

    if (isHovering) {
      if (fxUnmountTimer.current) { clearTimeout(fxUnmountTimer.current); fxUnmountTimer.current = null; }
      if (!fxMounted && fxMountTimer.current == null) {
        fxMountTimer.current = window.setTimeout(() => {
          fxMountTimer.current = null;
          setFxMounted(true);
        }, 80); // small delay to avoid quick mouse passes
      }
    } else {
      if (fxMountTimer.current) { clearTimeout(fxMountTimer.current); fxMountTimer.current = null; }
      if (fxMounted && fxUnmountTimer.current == null) {
        fxUnmountTimer.current = window.setTimeout(() => {
          fxUnmountTimer.current = null;
          setFxMounted(false);
        }, 220); // allow fade-out to complete before removing from DOM
      }
    }

    return () => {
      if (fxMountTimer.current) { clearTimeout(fxMountTimer.current); fxMountTimer.current = null; }
      if (fxUnmountTimer.current) { clearTimeout(fxUnmountTimer.current); fxUnmountTimer.current = null; }
    };
  }, [isHovering, isUVMode, fxMounted]);

  // If OffscreenCanvas + Worker are available, offload pixel work to a dedicated worker.
  // Fallback to main-thread processing if not supported.
  useEffect(() => {
    if (forensicChannel === 'all') return;
    if (!baseSrc) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // Limpa o canvas imediatamente ao mudar o canal para evitar 'fantasmas'
    try {
      const _ctx = canvas.getContext('2d');
      if (_ctx) _ctx.clearRect(0, 0, canvas.width || 0, canvas.height || 0);
    } catch (e) {}

    const MAX_DIM = 800; // keep reduced size to limit pixel work

    const supportsOffscreen = typeof (window as any).OffscreenCanvas !== 'undefined' && typeof Worker !== 'undefined';

    let cancelled = false;

    const cleanupWorker = () => {
      if (workerRef.current) {
        try { workerRef.current.terminate(); } catch (e) {}
        workerRef.current = null;
      }
    };

    const doMainThreadProcessing = async () => {
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = baseSrc;
      await new Promise<void>((res) => { img.onload = () => res(); img.onerror = () => res(); });
      if (cancelled) return;
      try {
        // Determine container size so canvas drawing matches background positioning
        const container = containerRef.current;
        const containerW = container ? Math.max(1, container.clientWidth) : (img.naturalWidth || img.width || 1024);
        const containerH = container ? Math.max(1, container.clientHeight) : (img.naturalHeight || img.height || 768);

        const naturalW = img.naturalWidth || img.width || 1024;
        const naturalH = img.naturalHeight || img.height || 768;

        // Compute draw box according to 'fit' (contain / cover)
        let drawW = containerW;
        let drawH = containerH;
        let offsetX = 0;
        let offsetY = 0;
        const imgAspect = naturalW / naturalH;
        const containerAspect = containerW / containerH;
        if (fit === 'contain') {
          if (imgAspect > containerAspect) {
            // image fills width
            drawW = containerW;
            drawH = Math.round(containerW / imgAspect);
            offsetX = 0;
            offsetY = Math.round((containerH - drawH) / 2);
          } else {
            // fills height
            drawH = containerH;
            drawW = Math.round(containerH * imgAspect);
            offsetY = 0;
            offsetX = Math.round((containerW - drawW) / 2);
          }
        } else {
          // cover
          if (imgAspect > containerAspect) {
            // image taller -> fill height
            drawH = containerH;
            drawW = Math.round(containerH * imgAspect);
            offsetX = Math.round((containerW - drawW) / 2);
            offsetY = 0;
          } else {
            drawW = containerW;
            drawH = Math.round(containerW / imgAspect);
            offsetX = 0;
            offsetY = Math.round((containerH - drawH) / 2);
          }
        }

        const dpr = window.devicePixelRatio || 1;
        // size backing store to container size (not limited to MAX_DIM to preserve alignment)
        canvas.width = Math.max(1, Math.round(containerW * dpr));
        canvas.height = Math.max(1, Math.round(containerH * dpr));
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // draw image into the computed box scaled by dpr so visual placement matches background
        const sx = Math.round(offsetX * dpr);
        const sy = Math.round(offsetY * dpr);
        const sW = Math.max(1, Math.round(drawW * dpr));
        const sH = Math.max(1, Math.round(drawH * dpr));

        if ((window as any).createImageBitmap) {
          try {
            const bitmap = await (window as any).createImageBitmap(img);
            ctx.drawImage(bitmap, sx, sy, sW, sH);
            try { bitmap.close?.(); } catch (e) {}
          } catch (e) {
            ctx.drawImage(img, sx, sy, sW, sH);
          }
        } else ctx.drawImage(img, sx, sy, sW, sH);

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        for (let i = 0, len = data.length; i < len; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          let intensity = 0, cr = 0, cg = 0, cb = 0;
          if (forensicChannel === 'r') { intensity = r; cr = 255; }
          else if (forensicChannel === 'g') { intensity = g; cg = 255; }
          else if (forensicChannel === 'b') { intensity = b; cb = 255; }
          data[i] = cr; data[i + 1] = cg; data[i + 2] = cb;
          data[i + 3] = Math.max(0, Math.min(255, Math.round(intensity)));
        }
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        console.debug('MysteryImage main-thread canvas processing failed', e);
      }
    };

    if (supportsOffscreen) {
      try {
        cleanupWorker();
        const w = new Worker(new URL('../../workers/forensicWorker.ts', import.meta.url), { type: 'module' });
        workerRef.current = w;
        const offscreen = (canvas as any).transferControlToOffscreen();
        const msg = { canvas: offscreen, src: baseSrc, channel: forensicChannel, maxDim: MAX_DIM } as any;
        w.postMessage(msg, [offscreen]);
        // politely ask worker to warm/cache the source as well
        try { w.postMessage({ type: 'warm', src: baseSrc }); } catch (e) {}
      } catch (e) {
        // if worker path fails for any reason, fallback to main thread
        doMainThreadProcessing();
      }
    } else {
      doMainThreadProcessing();
    }

    return () => { cancelled = true; cleanupWorker(); };
  }, [baseSrc, forensicChannel]);

  // Performance: write pointer CSS vars directly to the container to avoid
  // re-rendering the React tree on every mouse move. useThrottledMouse still
  // provides coarse updates, but RAF ensures smooth, coalesced DOM writes.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let rafId: number | null = null;
    const updateVars = () => {
      try {
        el.style.setProperty('--mouse-x', `${xy.x}px`);
        el.style.setProperty('--mouse-y', `${xy.y}px`);
      } catch (e) {}
      rafId = null;
    };

    if (isUVMode) {
      if (rafId == null) rafId = requestAnimationFrame(updateVars);
    }

    return () => { if (rafId != null) cancelAnimationFrame(rafId); };
  }, [xy.x, xy.y, isUVMode]);

  // Expose radius as CSS var via DOM writes to avoid inline style churn
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    try { el.style.setProperty('--uv-radius', `${RADIUS}px`); } catch (e) {}
  }, [RADIUS]);

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
      onClick={(e) => {
        try { e.stopPropagation(); } catch (err) {}
        if (!hasSecret) return;
        if (!allowImageUVControl) return;
        // ignore clicks that are part of a double-click (detail > 1)
        try {
          const detail = (e as any).detail as number | undefined;
          if (typeof detail === 'number' && detail > 1) return;
        } catch (err) {}
        try {
          if (typeof onToggleUV === 'function') {
            onToggleUV();
            return;
          }
        } catch (err) {}
        try {
          (window as any).dispatchEvent(new CustomEvent('inspection:select-tool', { detail: { tool: 'uv', origin: 'image' }, bubbles: true }));
        } catch (err) {}
      }}
      onPointerDown={(e) => {
        try { (e as any).stopPropagation(); } catch (err) {}
        if (!hasSecret) return;
        if (!allowImageUVControl) return;
        try {
          // prefer explicit callback for press-start if parent provided a handler
          if (typeof onToggleUV === 'function') {
            // parent toggle won't support start/end; dispatch event instead
          }
        } catch (err) {}
        try {
          (window as any).dispatchEvent(new CustomEvent('inspection:select-tool', { detail: { tool: 'uv', action: 'start' }, bubbles: true }));
        } catch (err) {}
      }}
      onPointerUp={(e) => {
        try { (e as any).stopPropagation(); } catch (err) {}
        if (!hasSecret) return;
        if (!allowImageUVControl) return;
        try {
          (window as any).dispatchEvent(new CustomEvent('inspection:select-tool', { detail: { tool: 'uv', action: 'end' }, bubbles: true }));
        } catch (err) {}
      }}
      onPointerLeave={(e) => {
        try { (e as any).stopPropagation(); } catch (err) {}
        if (!hasSecret) return;
        if (!allowImageUVControl) return;
        try {
          (window as any).dispatchEvent(new CustomEvent('inspection:select-tool', { detail: { tool: 'uv', action: 'end' }, bubbles: true }));
        } catch (err) {}
      }}
      // Touch fallback for older browsers that may not fire pointer events reliably
      onTouchStart={(e) => {
        try { e.stopPropagation(); } catch (err) {}
        if (!hasSecret) return;
        if (!allowImageUVControl) return;
        try {
          (window as any).dispatchEvent(new CustomEvent('inspection:select-tool', { detail: { tool: 'uv', action: 'start' }, bubbles: true }));
        } catch (err) {}
      }}
      onTouchEnd={(e) => {
        try { e.stopPropagation(); } catch (err) {}
        if (!hasSecret) return;
        if (!allowImageUVControl) return;
        try {
          (window as any).dispatchEvent(new CustomEvent('inspection:select-tool', { detail: { tool: 'uv', action: 'end' }, bubbles: true }));
        } catch (err) {}
      }}
      style={{
        ...style,
        cursor: isUVMode ? 'none' : (hasSecret ? 'pointer' : 'default'),
        // MUDANÇA 1: Fundo preto no forense para contraste correto
        backgroundColor: isForensicActive ? '#000' : 'transparent',
        // ADICIONADO: evitar scroll/gesto no mobile e criar contexto de empilhamento isolado
        touchAction: 'none' as React.CSSProperties['touchAction'],
        isolation: 'isolate' as React.CSSProperties['isolation'],
        // expose CSS vars for radius and pointer to enable CSS-only masks
        ['--uv-radius' as any]: `${RADIUS}px`,
        ['--mouse-x' as any]: `${xy.x}px`,
        ['--mouse-y' as any]: `${xy.y}px`
      }}
    >
      {/* MUDANÇA 2: Esconder camadas normais se forense estiver ativo */}
      {!isForensicActive && (
        <>
          {/* Background decorative blur (fills sides with color from the image) - optional */}
          {baseSrc && !isUVMode && ambientBlur && (
            <img src={baseSrc} className="bg-blur" alt="" loading="lazy" draggable={false} style={{ pointerEvents: 'none' }} />
          )}

          {/* Base image always rendered as background layer (keeps layout stable) */}
          <div style={{ ...filterStyle }} />

          {/* 2. CAMADA DO PUZZLE DE TRATAMENTO (só filterLayerSrc, não hiddenSrc) */}
          {filterLayerSrc && !isUVMode && (
            <div style={overlayStyle} />
          )}

          {isUVMode && hasSecret && (
            <div className="secret-ink" style={{ ...bgStyle, position: 'absolute', inset: 0, backgroundImage: hiddenImage }} />
          )}
        </>
      )}

      {/* Canvas Forense (já estava correto com o pointerEvents: none do fix anterior) */}
      {isForensicActive && (
        <canvas
          ref={canvasRef}
          className="forensic-canvas"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            // z-index reduzido e seguro dentro do contexto isolado do container
            zIndex: 10,
            pointerEvents: 'none' as React.CSSProperties['pointerEvents'],
            objectFit: fit,
          }}
        />
      )}

      {isUVMode && fxMounted && (
        <>
          <div
            className="static-noise"
            style={{
              opacity: isHovering ? 0.06 : 0,
              transition: 'opacity 220ms linear',
            }}
          />
          <div
            className="uv-lens-flare"
            style={{
              position: 'absolute',
              inset: 0,
              opacity: isHovering ? 0.55 : 0,
              transition: 'opacity 220ms linear'
            }}
          />
        </>
      )}

      {/* Imagem Principal: Esconder no forense */}
      {baseSrc && !isForensicActive && !isUVMode && (
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
