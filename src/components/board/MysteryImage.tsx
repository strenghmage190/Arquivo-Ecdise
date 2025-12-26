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
  isUVMode: boolean;
  className?: string;
  style?: React.CSSProperties;
  fit?: 'cover' | 'contain';
  pointerLocal?: { x: number; y: number; over: boolean } | undefined;
}

export function MysteryImage({
  baseSrc,
  hiddenSrc,
  isUVMode,
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
  const RADIUS = 120;

  const maskStyle: React.CSSProperties = {
    maskImage: `radial-gradient(circle ${RADIUS}px at ${xy.x}px ${xy.y}px, black 100%, transparent 100%)`,
    WebkitMaskImage: `radial-gradient(circle ${RADIUS}px at ${xy.x}px ${xy.y}px, black 100%, transparent 100%)`
  };

  const bgStyle: React.CSSProperties = {
    backgroundSize: fit,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'center',
    transition: 'filter 0.3s ease'
  };

  const bgImage = baseSrc ? `url(${baseSrc})` : 'none';
  const hiddenImage = hiddenSrc ? `url(${hiddenSrc})` : 'none';

  return (
    <div
      className={`uv-container ${className}`}
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...style, cursor: isUVMode ? 'none' : 'default' }}
    >
      <div style={{ ...bgStyle, position: 'absolute', inset: 0, backgroundImage: bgImage, filter: isUVMode ? 'brightness(0.2) contrast(1.1) hue-rotate(260deg)' : 'none' }} />

      {isUVMode && hasSecret && (
        <div className="secret-ink" style={{ ...bgStyle, position: 'absolute', inset: 0, backgroundImage: hiddenImage, ...maskStyle }} />
      )}

      {isUVMode && isHovering && (
        <>
          <div className="static-noise" style={maskStyle} />
          <div className="uv-lens-flare" style={{ background: `radial-gradient(circle ${RADIUS}px at ${xy.x}px ${xy.y}px, rgba(160,160,255,0.1) 0%, rgba(80,0,180,0.3) 60%, rgba(30,0,80,0.8) 100%)` }} />
        </>
      )}

      {!isUVMode && hasSecret && fit !== 'contain' && <div style={{ position: 'absolute', bottom: 2, right: 4, opacity: 0.6, fontSize: 12 }}>🟣</div>}
    </div>
  );
}

export default MysteryImage;
