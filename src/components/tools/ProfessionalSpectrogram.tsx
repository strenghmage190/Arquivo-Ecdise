import React, { useEffect, useRef, useState } from 'react';
import './ProfessionalSpectrogram.css';

const FFT_SIZE = 2048;
const HOP_SIZE = 512;

// Colormap aprimorado - mais contraste e visibilidade
const getHotColor = (value: number) => {
  const t = value / 255;
  
  if (t < 0.05) return [0, 0, 0];
  
  let r = 0, g = 0, b = 0;
  
  if (t < 0.33) {
    r = Math.floor(t * 3 * 255);
  } else if (t < 0.66) {
    r = 255;
    g = Math.floor((t - 0.33) * 3 * 255);
  } else {
    r = 255;
    g = 255;
    b = Math.floor((t - 0.66) * 3 * 255);
  }
  
  return [r, g, b];
};

const getCyanColor = (value: number) => {
  const t = value / 255;
  if (t < 0.1) return [0, 0, 0];
  const intensity = Math.floor(t * 255);
  return [0, intensity, intensity];
};

const getMagmaColor = (value: number) => {
  const t = value / 255;
  if (t < 0.05) return [0, 0, 0];
  
  if (t < 0.25) {
    return [Math.floor(t * 4 * 100), 0, Math.floor(t * 4 * 120)];
  } else if (t < 0.5) {
    const localT = (t - 0.25) * 4;
    return [Math.floor(100 + localT * 155), Math.floor(localT * 50), Math.floor(120 - localT * 40)];
  } else if (t < 0.75) {
    const localT = (t - 0.5) * 4;
    return [255, Math.floor(50 + localT * 150), Math.floor(80 + localT * 50)];
  } else {
    const localT = (t - 0.75) * 4;
    return [255, Math.floor(200 + localT * 55), Math.floor(130 + localT * 125)];
  }
};

type Props = {
  audioUrl?: string | null;
  spectrogramHeight?: number;
  horizontalScale?: number;
  maxFreq?: number;
  minDB?: number;
  colorScheme?: 'hot' | 'cyan' | 'magma';
  flipVertical?: boolean;
  width: number;
  analysisRequestId?: number;
  onAnalysisComplete?: (result: { optimalMaxFreq: number; optimalMinDB: number }) => void;
  // Optional: allows parent to seek when user clicks the spectrogram (0..1)
  onSeek?: (percentage: number) => void;
  // Optional total duration in seconds to display time tooltip
  duration?: number;
  hideDecorations?: boolean;
  audioData?: Float32Array;
  sampleRate?: number;
};

export default function ProfessionalSpectrogram({
  audioUrl,
  spectrogramHeight = 350,
  horizontalScale = 1,
  maxFreq = 10000,
  minDB = -60,
  colorScheme = 'hot',
  flipVertical = false,
  width,
  analysisRequestId = 0,
  onAnalysisComplete,
  onSeek,
  duration,
  hideDecorations = false,
  audioData,
  sampleRate = 44100,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const [status, setStatus] = useState('Sem áudio');
  const [progress, setProgress] = useState(0);
  const [hoverInfo, setHoverInfo] = useState<{ x: number; y: number; time: string; freq: string } | null>(null);

  useEffect(() => {
    if ((!audioUrl && !audioData) || !canvasRef.current || width <= 0) {
      setStatus('Sem áudio');
      setProgress(0);
      return;
    }
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    const canvas = canvasRef.current;
    const canvasWidth = Math.max(1, Math.floor(width * horizontalScale));
    const canvasHeight = spectrogramHeight;
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    canvas.style.width = `${width}px`;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#05080a';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const worker = new Worker(new URL('../../workers/spectrogram.worker.ts', import.meta.url));
    workerRef.current = worker;

    const handleMessage = (event: MessageEvent<any>) => {
      const { type, payload } = event.data;
      switch (type) {
        case 'analysisComplete':
          if (onAnalysisComplete) onAnalysisComplete(payload);
          break;
        case 'progress':
          setProgress(payload);
          setStatus(payload < 100 ? `Processando... ${Math.floor(payload)}%` : '✓ Completo');
          break;
        case 'chunkProcessed': {
          const { chunkData, startFrame, frames, totalFrames, height } = payload as {
            chunkData: ArrayBuffer;
            startFrame: number;
            frames: number;
            totalFrames: number;
            height: number;
          };
          const imageData = new ImageData(new Uint8ClampedArray(chunkData), frames, height);
          createImageBitmap(imageData).then((bitmap) => {
            const x = (startFrame / totalFrames) * canvasWidth;
            const drawWidth = Math.max(1, (frames / totalFrames) * canvasWidth);
            ctx.save();
            if (flipVertical) {
              ctx.translate(0, canvasHeight);
              ctx.scale(1, -1);
              ctx.drawImage(bitmap, x, 0, drawWidth, canvasHeight);
            } else {
              ctx.drawImage(bitmap, x, 0, drawWidth, canvasHeight);
            }
            ctx.restore();
          });
          break;
        }
        case 'complete':
          setStatus('✓ Completo');
          setProgress(100);
          break;
        default:
          break;
      }
    };

    worker.addEventListener('message', handleMessage);

    const start = async () => {
      try {
        setStatus('Carregando áudio...');
        setProgress(0);

        let transferBuffer: ArrayBuffer;
        let actualSampleRate = sampleRate;

        if (audioData) {
          const channelCopy = new Float32Array(audioData);
          transferBuffer = channelCopy.buffer;
        } else if (audioUrl) {
          const response = await fetch(audioUrl);
          if (!response.ok) throw new Error(`Falha no fetch: ${response.statusText}`);

          const arrayBuffer = await response.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
          const channelCopy = new Float32Array(audioBuffer.getChannelData(0));
          transferBuffer = channelCopy.buffer;
          actualSampleRate = audioBuffer.sampleRate;
          audioCtx.close().catch(() => undefined);
        } else {
          throw new Error('Nenhum dado de áudio fornecido');
        }

        worker.postMessage(
          {
            channelData: transferBuffer,
            sampleRate: actualSampleRate,
            fftSize: FFT_SIZE,
            hopSize: HOP_SIZE,
            minDB,
            maxFreq,
            colorScheme,
          },
          [transferBuffer]
        );

      } catch (err) {
        console.error('[Spectrogram] Erro:', err);
        setStatus(`Erro: ${err instanceof Error ? err.message : 'Desconhecido'}`);
      }
    };

    start();

    return () => {
      worker.removeEventListener('message', handleMessage);
      worker.terminate();
      workerRef.current = null;
    };
  }, [audioUrl, audioData, sampleRate, spectrogramHeight, horizontalScale, maxFreq, minDB, colorScheme, width, analysisRequestId, onAnalysisComplete]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onSeek || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const widthPx = rect.width || 1;
    const percentage = Math.max(0, Math.min(1, x / widthPx));
    onSeek(percentage);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const percentX = Math.max(0, Math.min(1, x / rect.width));
    const percentY = Math.max(0, Math.min(1, 1 - y / rect.height));

    const timeLabel = typeof duration === 'number' && duration > 0 ? formatTime(percentX * duration) : `${(percentX * 100).toFixed(1)}%`;
    const freqHz = percentY * maxFreq;

    setHoverInfo({ x, y, time: timeLabel, freq: `${(freqHz / 1000).toFixed(2)} kHz` });
  };

  const handleMouseLeave = () => setHoverInfo(null);

  return (
    <div className="spectrogram-container" style={hideDecorations ? { border: 'none', background: 'transparent' } : {}}>
      {!hideDecorations && (
        <div className="spectrogram-header">
          <div className="header-content">
            <div className="header-left">
              <div className="status-indicator" />
              <h3 className="header-title">ANÁLISE ESPECTRAL DE SINAL</h3>
            </div>
            <div className="header-right">
              <span className="status-text">{status}</span>
              {progress > 0 && progress < 100 && (
                <span className="progress-percent">{Math.floor(progress)}%</span>
              )}
            </div>
          </div>
          {progress > 0 && progress < 100 && (
            <div className="progress-bar-container">
              <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>
      )}

      <div
        className="canvas-container"
        ref={containerRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ cursor: onSeek ? 'crosshair' : 'default' }}
      >
        <canvas ref={canvasRef} className="spectrogram-canvas" />

        <div className="frequency-markers">
          {[0.9, 0.75, 0.5, 0.25].map((p) => (
            <div key={p} className="freq-marker" style={{ top: `${(1 - p) * 100}%` }}>
              {(maxFreq * p / 1000).toFixed(1)}k
            </div>
          ))}
        </div>

        {/* Crosshair overlays */}
        {hoverInfo && (
          <>
            <div className="crosshair-v" style={{ left: `${hoverInfo.x}px` }} />
            <div className="crosshair-h" style={{ top: `${hoverInfo.y}px` }} />
            <div className="crosshair-tooltip" style={{ left: `${hoverInfo.x + 10}px`, top: `${hoverInfo.y - 30}px` }}>
              {hoverInfo.freq} | {hoverInfo.time}
            </div>
          </>
        )}
      </div>

      {!hideDecorations && (
        <div className="spectrogram-footer">
          <p className="footer-text">
            💡 <strong>Dica:</strong> Padrões anômalos ou formas geométricas podem indicar dados ocultos.
          </p>
        </div>
      )}
    </div>
  );
}
