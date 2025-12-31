import React, { useEffect, useRef } from 'react';

interface ChannelIsolatorProps {
  imageSrc: string;
  className?: string;
  style?: React.CSSProperties;
  activeChannel?: 'all' | 'r' | 'g' | 'b';
}

export default function ChannelIsolator({
  imageSrc,
  className = '',
  style = {},
  activeChannel = 'all'
}: ChannelIsolatorProps): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      cvs.width = img.width;
      cvs.height = img.height;

      ctx.drawImage(img, 0, 0);

      if (activeChannel === 'all') return;

      const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        if (activeChannel === 'r') {
          data[i + 1] = 0;
          data[i + 2] = 0;
        } else if (activeChannel === 'g') {
          data[i] = 0;
          data[i + 2] = 0;
        } else if (activeChannel === 'b') {
          data[i] = 0;
          data[i + 1] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);
    };
  }, [imageSrc, activeChannel]);

  return (
    <div
      className={className}
      style={{
        ...style,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          boxShadow: '0 0 20px rgba(0,0,0,0.5)'
        }}
      />
    </div>
  );
}
