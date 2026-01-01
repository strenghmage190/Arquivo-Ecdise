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
  audioUrl: string | null;
};

type ColorScheme = 'hot' | 'cyan' | 'magma';

export default function ProfessionalSpectrogram({ audioUrl }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState('Sem áudio');
  const [progress, setProgress] = useState(0);
  const [maxFreq, setMaxFreq] = useState(10000);
  const [minDB, setMinDB] = useState(-60);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('hot');
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!audioUrl || !canvasRef.current) {
      setStatus('Sem áudio');
      return;
    }

    let cancelled = false;
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

    const process = async () => {
      try {
        setStatus('Carregando...');
        setProgress(0);

        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();

        if (cancelled) return;
        setStatus('Decodificando...');

        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

        if (cancelled) return;
        setStatus('Processando...');

        const canvas = canvasRef.current!;
        const channelData = audioBuffer.getChannelData(0);
        const sampleRate = audioBuffer.sampleRate;
        
        // Calcula dimensões
        const numFrames = Math.floor((channelData.length - FFT_SIZE) / HOP_SIZE);
        const width = Math.min(numFrames, 2000);
        const height = 512;
        
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d', { alpha: false, willReadFrequently: false });
        if (!ctx) return;

        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);

        // OfflineContext para análise
        const offlineCtx = new OfflineAudioContext(1, audioBuffer.length, sampleRate);
        const source = offlineCtx.createBufferSource();
        source.buffer = audioBuffer;
        
        const analyser = offlineCtx.createAnalyser();
        analyser.fftSize = FFT_SIZE;
        analyser.smoothingTimeConstant = 0;
        analyser.minDecibels = minDB;
        analyser.maxDecibels = 0;
        
        source.connect(analyser);
        analyser.connect(offlineCtx.destination);

        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const allFrames: Uint8Array[] = [];

        // ScriptProcessor para capturar frames
        const processor = offlineCtx.createScriptProcessor(HOP_SIZE, 1, 1);
        analyser.connect(processor);
        processor.connect(offlineCtx.destination);

        processor.onaudioprocess = () => {
          analyser.getByteFrequencyData(dataArray);
          allFrames.push(new Uint8Array(dataArray));
          
          const percent = (allFrames.length / numFrames) * 100;
          setProgress(Math.min(percent, 95));
        };

        source.start(0);
        await offlineCtx.startRendering();

        if (cancelled) return;
        setStatus('Renderizando...');
        setProgress(98);

        // Renderiza
        const imageData = ctx.createImageData(width, height);
        const pixels = imageData.data;

        const maxFreqBin = Math.floor((maxFreq / (sampleRate / 2)) * bufferLength);

        for (let x = 0; x < width; x++) {
          const frameIdx = Math.floor((x / width) * allFrames.length);
          const frame = allFrames[frameIdx];
          
          if (!frame) continue;

          for (let y = 0; y < height; y++) {
            const freqRatio = 1 - (y / height);
            const binIdx = Math.floor(freqRatio * maxFreqBin);
            const value = frame[Math.max(0, Math.min(binIdx, bufferLength - 1))] || 0;
            
            const colorFunc = colorScheme === 'hot' ? getHotColor : 
                             colorScheme === 'cyan' ? getCyanColor : getMagmaColor;
            const [r, g, b] = colorFunc(value);
            
            const idx = (y * width + x) * 4;
            pixels[idx] = r;
            pixels[idx + 1] = g;
            pixels[idx + 2] = b;
            pixels[idx + 3] = 255;
          }
        }

        ctx.putImageData(imageData, 0, 0);
        setStatus('✓ Completo');
        setProgress(100);

      } catch (err) {
        console.error(err);
        setStatus('Erro');
      }
    };

    process();

    return () => {
      cancelled = true;
      audioCtx.close();
    };
  }, [audioUrl, maxFreq, minDB, colorScheme]);

  return (
    <div className="spectrogram-container">
      {/* Header */}
      <div className="spectrogram-header">
        <div className="header-content">
          <div className="header-left">
            <div className="status-indicator"></div>
            <h3 className="header-title">ANALISADOR ESPECTRAL</h3>
          </div>
          <div className="header-right">
            <span className="status-text">{status}</span>
            {progress > 0 && progress < 100 && (
              <span className="progress-percent">{Math.floor(progress)}%</span>
            )}
          </div>
        </div>
        
        {/* Progress Bar */}
        {progress > 0 && progress < 100 && (
          <div className="progress-bar-container">
            <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="spectrogram-controls">
        <div className="control-grid">
          <div className="control-group">
            <div className="control-label-row">
              <label className="control-label">FREQ MÁXIMA</label>
              <span className="control-value">{(maxFreq/1000).toFixed(1)} kHz</span>
            </div>
            <input 
              type="range" 
              min={2000} 
              max={22000} 
              step={500}
              value={maxFreq} 
              onChange={e => setMaxFreq(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label className="control-label">SENSIBILIDADE</label>
              <span className="control-value">{minDB} dB</span>
            </div>
            <input 
              type="range" 
              min={-100} 
              max={-20} 
              step={5}
              value={minDB} 
              onChange={e => setMinDB(Number(e.target.value))}
              className="control-slider"
            />
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label className="control-label">PALETA DE CORES</label>
            </div>
            <div className="color-scheme-buttons">
              <button 
                className={`color-btn ${colorScheme === 'hot' ? 'active hot' : ''}`}
                onClick={() => setColorScheme('hot')}
              >
                🔥 Hot
              </button>
              <button 
                className={`color-btn ${colorScheme === 'cyan' ? 'active cyan' : ''}`}
                onClick={() => setColorScheme('cyan')}
              >
                💠 Cyan
              </button>
              <button 
                className={`color-btn ${colorScheme === 'magma' ? 'active magma' : ''}`}
                onClick={() => setColorScheme('magma')}
              >
                🌋 Magma
              </button>
            </div>
          </div>

          <div className="control-group">
            <div className="control-label-row">
              <label className="control-label">ZOOM</label>
              <span className="control-value">{zoom.toFixed(1)}x</span>
            </div>
            <input 
              type="range" 
              min={0.5} 
              max={4} 
              step={0.1}
              value={zoom} 
              onChange={e => setZoom(Number(e.target.value))}
              className="control-slider"
            />
          </div>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="canvas-container">
        <div className="canvas-wrapper" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
          <canvas 
            ref={canvasRef}
            className="spectrogram-canvas"
          />
        </div>
        
        {/* Frequency markers */}
        <div className="frequency-markers">
          <div className="freq-marker" style={{top: '10%'}}>
            {(maxFreq * 0.9 / 1000).toFixed(0)}k
          </div>
          <div className="freq-marker" style={{top: '25%'}}>
            {(maxFreq * 0.75 / 1000).toFixed(0)}k
          </div>
          <div className="freq-marker highlight" style={{top: '50%'}}>
            {(maxFreq * 0.5 / 1000).toFixed(0)}k ← Texto aqui
          </div>
          <div className="freq-marker" style={{top: '75%'}}>
            {(maxFreq * 0.25 / 1000).toFixed(0)}k
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="spectrogram-footer">
        <p className="footer-text">
          💡 <strong>Dica:</strong> Texto esteganográfico aparece como padrões geométricos entre 2-8 kHz. 
          Ajuste sensibilidade e paleta de cores para melhor visualização.
        </p>
      </div>
    </div>
  );
}
