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
  const computeRadius = () => {
    try {
      if (!containerRef.current) return 120;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      // use ~18% of the smallest dimension, but clamp to reasonable bounds
      const r = Math.round(Math.max(80, Math.min(w, h) * 0.18));
      return r;
    } catch (e) { return 120; }
  };

  const RADIUS = computeRadius();

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
  const filterStyle: React.CSSProperties = {
    backgroundSize: fit,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transition: 'filter 0.1s linear',
    position: 'absolute', inset: 0,
    filter: isUVMode ? 'brightness(0.2) contrast(1.1) hue-rotate(260deg)' : `brightness(${filters.brightness}%) contrast(${filters.contrast}%) saturate(${filters.saturate}%)`
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
    // quanto menor o closeness, maior a opacidade. Aumentamos THRESH para evitar "não aparecer" em casos comuns.
    const THRESH = 250; // sensibilidade aumentada
    hiddenLayerOpacity = Math.max(0, Math.min(1, 1 - (closeness / THRESH)));
  } else {
    // Quando não há alvo definido, mostramos a camada proporcionalmente à alteração em relação a 100%.
    const distortionLevel = Math.abs(filters.brightness - 100) + Math.abs(filters.contrast - 100) + Math.abs(filters.saturate - 100);
    hiddenLayerOpacity = Math.min(1, distortionLevel / 100);
  }

  // Debug temporário: ajuda a identificar por que a camada pode permanecer invisível
  try {
    // eslint-disable-next-line no-console
    console.debug('MysteryImage debug', { filters, revealTarget, hiddenLayerOpacity });
  } catch (e) {}

  return (
    <div
      className={`uv-container ${className}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, cursor: isUVMode ? 'none' : 'default' }}
    >
      <div style={{ ...filterStyle, backgroundImage: bgImage }} />

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
