import React, { useRef, useEffect, useState } from 'react';

type Props = {
  audioSourceNode: AudioNode | null;
  audioContext: AudioContext | null;
};

const SpectrogramAnalyzer: React.FC<Props> = ({ audioSourceNode, audioContext }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Visual settings
  const FFT_SIZE = 2048;
  const SCROLL_SPEED = 2;

  useEffect(() => {
    if (!audioSourceNode || !audioContext) return;
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = FFT_SIZE;
    analyser.smoothingTimeConstant = 0;
    analyserRef.current = analyser;

    try {
      audioSourceNode.connect(analyser);
    } catch (e) {
      // ignore connect errors
    }

    setIsReady(true);

    return () => {
      try { analyser.disconnect(); } catch (e) {}
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [audioSourceNode, audioContext]);

  useEffect(() => {
    if (!isReady || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;
    const analyser = analyserRef.current as AnalyserNode;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d')!;

    const render = () => {
      analyser.getByteFrequencyData(dataArray);

      tempCtx.drawImage(canvas, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(tempCanvas, -SCROLL_SPEED, 0);

      const x = canvas.width - SCROLL_SPEED;
      const height = canvas.height;
      const zoomFactor = bufferLength / height;

      for (let y = 0; y < height; y++) {
        const dataIndex = Math.floor((height - 1 - y) * zoomFactor);
        if (dataIndex < bufferLength) {
          const value = dataArray[dataIndex];
          if (value > 10) {
            const r = value;
            const g = value > 128 ? 255 : value * 2;
            const b = value > 200 ? 255 : 0;
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            ctx.fillRect(x, y, SCROLL_SPEED, 1);
          }
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isReady]);

  return (
    <div className="mt-4">
      <h3 className="text-sm font-bold mb-1 text-gray-500">Visualizador (Spectrograma)</h3>
      <canvas
        ref={canvasRef}
        width={1200}
        height={400}
        className="w-full h-80 bg-black border border-gray-700 rounded shadow-inner"
      />
      <div className="flex justify-between text-xs text-gray-400 mt-1 px-1">
        <span>Alta Freq (Agudos)</span>
        <span>Tempo &rarr;</span>
      </div>
    </div>
  );
};

export default SpectrogramAnalyzer;
