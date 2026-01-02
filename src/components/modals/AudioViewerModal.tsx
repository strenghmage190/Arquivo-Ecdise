import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import WaveSurfer from 'wavesurfer.js';
import ProfessionalSpectrogram from '../tools/ProfessionalSpectrogram';
import './AudioViewerModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audioSrc: string;
  title?: string;
}

export default function AudioViewerModal({ 
  isOpen, 
  onClose, 
  audioSrc, 
  title = 'REPRODUTOR DE ÁUDIO'
}: Props) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<any | null>(null);
  const spectrogramContainerRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [spectrogramHeight, setSpectrogramHeight] = useState(350);
  const [horizontalScale, setHorizontalScale] = useState(1);
  
  // Controles do espectrograma
  const [maxFreq, setMaxFreq] = useState(10000);
  const [minDB, setMinDB] = useState(-60);
  const [colorScheme, setColorScheme] = useState<'hot' | 'cyan' | 'magma'>('hot');
  const [analysisRequestId, setAnalysisRequestId] = useState(0);

  useEffect(() => {
    if (!isOpen || !waveformRef.current) {
      return;
    }

    // Cleanup previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const ws = (WaveSurfer as any).create({
      container: waveformRef.current,
      waveColor: '#00ff00',
      progressColor: '#00ff00',
      cursorColor: '#ff0000',
      height: 80,
      responsive: true,
      backend: 'MediaElement',
      minPxPerSec: 250,
    });

    wavesurferRef.current = ws;
    ws.load(audioSrc);

    const formatTime = (secs: number) => {
      const m = Math.floor(secs / 60);
      const s = Math.floor(secs % 60);
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    };

    ws.on('ready', () => {
      setDuration(formatTime(ws.getDuration()));
    });

    const syncSpectrogramScroll = (progress: number) => {
      const container = spectrogramContainerRef.current;
      if (!container) return;

      const maxScroll = container.scrollWidth - container.clientWidth;
      if (maxScroll <= 0) return;

      isSyncingRef.current = true;
      container.scrollLeft = progress * maxScroll;
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    };

    ws.on('seek', (progress: number) => {
      syncSpectrogramScroll(progress);
    });

    ws.on('audioprocess', () => {
      const current = ws.getCurrentTime();
      setCurrentTime(formatTime(current));

      if (ws.isPlaying()) {
        const durationSec = ws.getDuration();
        if (durationSec > 0) {
          syncSpectrogramScroll(current / durationSec);
        }
      }
    });

    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => setIsPlaying(false));

    return () => {
      if (wavesurferRef.current) {
        wavesurferRef.current.destroy();
        wavesurferRef.current = null;
      }
    };
  }, [isOpen, audioSrc]);

  useEffect(() => {
    if (isOpen && spectrogramContainerRef.current) {
      setContainerWidth(spectrogramContainerRef.current.clientWidth);

      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width);
        }
      });
      resizeObserver.observe(spectrogramContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isOpen]);

  useEffect(() => {
    const container = spectrogramContainerRef.current;
    if (!container || !wavesurferRef.current) return;

    const handleScroll = () => {
      if (isSyncingRef.current) return;

      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll <= 0) return;

      const progress = scrollLeft / maxScroll;
      isSyncingRef.current = true;
      wavesurferRef.current.seekTo(progress);
      setTimeout(() => {
        isSyncingRef.current = false;
      }, 50);
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [isOpen]);

  const handleAutoAnalysis = (result: { optimalMaxFreq: number; optimalMinDB: number }) => {
    setMaxFreq(result.optimalMaxFreq);
    setMinDB(result.optimalMinDB);
  };

  if (!isOpen) {
    return null;
  }

  const handlePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const content = (
    <div className="audio-viewer-backdrop" onClick={onClose}>
      <div className="audio-viewer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="audio-viewer-header">
          <div className="audio-viewer-title">🎵 {title}</div>
          <button 
            className="audio-viewer-close" 
            onClick={onClose}
            title="Fechar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Waveform */}
        <div className="audio-viewer-waveform">
          <div ref={waveformRef} id="audio-viewer-wave" />
        </div>

        {/* Controles */}
        <div className="audio-viewer-controls">
          <button 
            className="audio-viewer-play-btn" 
            onClick={handlePlayPause}
            title={isPlaying ? 'Pausar' : 'Reproduzir'}
          >
            {isPlaying ? '⏸ PAUSAR' : '▶ REPRODUZIR'}
          </button>
          <div className="audio-viewer-time">
            <span className="time-current">{currentTime}</span>
            <span className="time-separator">/</span>
            <span className="time-total">{duration}</span>
          </div>
        </div>

        {/* Controles de Espectrograma */}
        <div className="audio-viewer-spectrum-controls">
          <div className="spectrum-control-group">
            <label>📏 Altura:</label>
            <input 
              type="range" 
              min="150" 
              max="800" 
              step="10"
              value={spectrogramHeight}
              onChange={(e) => setSpectrogramHeight(Number(e.target.value))}
              title="Ajusta a altura do espectrograma"
            />
            <span className="control-value">{spectrogramHeight}px</span>
          </div>

          <div className="spectrum-control-group">
            <label>📐 Escala Horizontal:</label>
            <input 
              type="range" 
              min="0.5" 
              max="5" 
              step="0.1"
              value={horizontalScale}
              onChange={(e) => setHorizontalScale(Number(e.target.value))}
              title="Ajusta a largura do espectrograma (pixels por segundo)"
            />
            <span className="control-value">{horizontalScale.toFixed(1)}x</span>
          </div>

          <div className="spectrum-control-group">
            <label>📶 Freq Máxima:</label>
            <input 
              type="range" 
              min={2000} 
              max={22000} 
              step={500}
              value={maxFreq} 
              onChange={e => setMaxFreq(Number(e.target.value))}
            />
            <span className="control-value">{(maxFreq/1000).toFixed(1)}kHz</span>
          </div>

          <div className="spectrum-control-group">
            <label>📻 Sensibilidade:</label>
            <input 
              type="range" 
              min={-100} 
              max={-20} 
              step={5}
              value={minDB} 
              onChange={e => setMinDB(Number(e.target.value))}
            />
            <span className="control-value">{minDB}dB</span>
          </div>

          <div className="spectrum-control-group">
            <label>🎨 Cores:</label>
            <div className="spectrum-color-row">
              <button 
                className={`spectrum-color-btn ${colorScheme === 'hot' ? 'active hot' : ''}`}
                onClick={() => setColorScheme('hot')}
                title="Hot"
              >
                🔥
              </button>
              <button 
                className={`spectrum-color-btn ${colorScheme === 'cyan' ? 'active cyan' : ''}`}
                onClick={() => setColorScheme('cyan')}
                title="Cyan"
              >
                💠
              </button>
              <button 
                className={`spectrum-color-btn ${colorScheme === 'magma' ? 'active magma' : ''}`}
                onClick={() => setColorScheme('magma')}
                title="Magma"
              >
                🌋
              </button>
            </div>
          </div>

          <div className="spectrum-analysis-group">
            <button
              className="spectrum-action-btn"
              onClick={() => {
                setAnalysisRequestId((prev) => prev + 1);
                setMaxFreq(22000);
                setMinDB(-100);
              }}
              title="Analisar áudio e ajustar visualização vertical automaticamente"
            >
              🔬 ANÁLISE RÁPIDA
            </button>
            <button 
              className="spectrum-action-btn"
              onClick={() => {
                setSpectrogramHeight(350);
                setHorizontalScale(1);
                setMaxFreq(10000);
                setMinDB(-60);
                setColorScheme('hot');
              }}
              title="Resetar todos os controles"
            >
              ↺ RESETAR
            </button>
          </div>
        </div>

        {/* Espectrograma Principal */}
        <div className="audio-viewer-spectrogram" ref={spectrogramContainerRef}>
          {containerWidth > 0 && (
            <ProfessionalSpectrogram 
              audioUrl={audioSrc}
              spectrogramHeight={spectrogramHeight}
              horizontalScale={horizontalScale}
              maxFreq={maxFreq}
              minDB={minDB}
              colorScheme={colorScheme}
              width={containerWidth}
              analysisRequestId={analysisRequestId}
              onAnalysisComplete={handleAutoAnalysis}
            />
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
