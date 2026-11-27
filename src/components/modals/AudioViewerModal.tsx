import { Music, Palette, X, Play, Pause, MoveVertical, MoveHorizontal, Activity, Radio, Flame, Diamond, Mountain, Microscope, Terminal, RotateCcw, Sliders } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import WaveSurfer from 'wavesurfer.js';
import ProfessionalSpectrogram from '../tools/ProfessionalSpectrogram';
import AcousticWorkbench from '../tools/AcousticWorkbench';
import ForensicTerminalModal from './ForensicTerminalModal';
import ModalSurface from '../ui/ModalSurface';
import { unlockAudio } from '../../utils/audio';
import './AudioViewerModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audioSrc: string;
  title?: string;
}

type WaveSurferInstance = InstanceType<typeof WaveSurfer>;

export default function AudioViewerModal({ 
  isOpen, 
  onClose, 
  audioSrc, 
  title = 'REPRODUTOR DE ÁUDIO'
}: Props) {
  const waveformRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurferInstance | null>(null);
  const spectrogramContainerRef = useRef<HTMLDivElement | null>(null);
  const isSyncingRef = useRef(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState('00:00');
  const [duration, setDuration] = useState('00:00');
  const [durationSec, setDurationSec] = useState<number>(0);
  const [spectrogramHeight, setSpectrogramHeight] = useState(350);
  const [horizontalScale, setHorizontalScale] = useState(1);
  
  // Controles do espectrograma
  const [maxFreq, setMaxFreq] = useState(10000);
  const [minDB, setMinDB] = useState(-60);
  const [colorScheme, setColorScheme] = useState<'hot' | 'cyan' | 'magma'>('hot');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisRequestId, setAnalysisRequestId] = useState(0);
  const [showTerminal, setShowTerminal] = useState(false);
  const [activeView, setActiveView] = useState<'spectrum' | 'workbench'>('spectrum');

  useEffect(() => {
    if (!isOpen || !waveformRef.current) {
      return;
    }

    // Cleanup previous instance
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: 'rgba(45, 212, 191, 0.36)',
      progressColor: '#2dd4bf',
      cursorColor: '#f43f5e',
      cursorWidth: 2,
      height: 80,
      responsive: true,
      backend: 'MediaElement',
      minPxPerSec: 250,
      interact: true,
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
      setDurationSec(ws.getDuration());
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
    if (isOpen && activeView === 'spectrum' && spectrogramContainerRef.current) {
      setContainerWidth(spectrogramContainerRef.current.clientWidth);

      const resizeObserver = new ResizeObserver((entries) => {
        if (entries[0]) {
          setContainerWidth(entries[0].contentRect.width);
        }
      });
      resizeObserver.observe(spectrogramContainerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [isOpen, activeView]);

  useEffect(() => {
    const container = spectrogramContainerRef.current;
    if (!container || !wavesurferRef.current || activeView !== 'spectrum') return;

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
  }, [isOpen, activeView]);

  // CORREÇÃO CRÍTICA AQUI:
  const handleAutoAnalysis = (result: { optimalMaxFreq: number; optimalMinDB: number }) => {
    // Só aceita a sugestão do filho se NÓS pedimos a análise (isAnalyzing == true)
    if (isAnalyzing) {
      setMaxFreq(result.optimalMaxFreq);
      setMinDB(result.optimalMinDB);
      setIsAnalyzing(false); // Desliga a espera, voltando o controle para o manual
    }
  };

  const handleManualChangeMaxFreq = (val: number) => {
    setIsAnalyzing(false); // Garante que o modo manual assuma
    setMaxFreq(val);
  };

  const handleManualChangeMinDB = (val: number) => {
    setIsAnalyzing(false); // Garante que o modo manual assuma
    setMinDB(val);
  };

  if (!isOpen) {
    return null;
  }

  const handlePlayPause = () => {
    void unlockAudio();
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const content = (
    <div className="audio-viewer-backdrop" onClick={onClose}>
      <div className="audio-viewer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="audio-viewer-header">
          <div className="avm-header-left">
            <span className="avm-badge">C.R.I.S. AUDIO LAB</span>
            <div className="audio-viewer-title">
              <Music className="lucide-icon inline-icon" size={16} />
              <span>{title}</span>
            </div>
          </div>
          <button
            className="audio-viewer-close"
            onClick={onClose}
            title="Fechar (ESC)"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Waveform Oscilloscope */}
        <div className="audio-viewer-waveform">
          <div className="avm-scope-grid" aria-hidden="true" />
          <div className="avm-scope-axis" aria-hidden="true" />
          <div ref={waveformRef} id="audio-viewer-wave" />
        </div>

        {/* Controles */}
        <div className="audio-viewer-controls">
          <div className="avm-controls-left">
            <button
              className={`audio-viewer-play-btn ${isPlaying ? 'is-playing' : ''}`}
              onClick={handlePlayPause}
              title={isPlaying ? 'Pausar' : 'Reproduzir'}
            >
              {isPlaying ? <><Pause size={14} /> PAUSAR</> : <><Play size={14} /> REPRODUZIR</>}
            </button>
            <span className={`avm-status-pill ${isPlaying ? 'is-playing' : ''}`}>
              <span className="avm-status-dot" aria-hidden="true" />
              {isPlaying ? 'REPRODUZINDO' : 'STANDBY'}
            </span>
          </div>
          <div className="audio-viewer-time">
            <span className="time-current">{currentTime}</span>
            <span className="time-separator">/</span>
            <span className="time-total">{duration}</span>
          </div>
        </div>

        {/* Seletor de Modo Analítico (evita dois espectrogramas empilhados) */}
        <div className="avm-view-tabs" role="tablist" aria-label="Modo de análise acústica">
          <div className="avm-view-tabs-left">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'spectrum'}
              className={`avm-tab-btn ${activeView === 'spectrum' ? 'active' : ''}`}
              onClick={() => setActiveView('spectrum')}
            >
              <Activity size={14} /> Espectrograma HD
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === 'workbench'}
              className={`avm-tab-btn ${activeView === 'workbench' ? 'active' : ''}`}
              onClick={() => setActiveView('workbench')}
            >
              <Sliders size={14} /> Bancada Acústica (Filtros L/R)
            </button>
          </div>
          <button
            type="button"
            className={`spectrum-action-btn ${showTerminal ? 'active' : ''}`}
            onClick={() => setShowTerminal(!showTerminal)}
            title="Abrir Terminal Forense para ler mensagens ocultas LSB"
          >
            <Terminal size={14} /> TERMINAL LSB
          </button>
        </div>

        {/* Terminal Modal LSB */}
        <ForensicTerminalModal
          isOpen={showTerminal}
          onClose={() => setShowTerminal(false)}
          audioUrl={audioSrc}
        />

        {activeView === 'spectrum' ? (
          <>
            {/* Controles do Espectrograma HD */}
            <div className="audio-viewer-spectrum-controls">
              <div className="avm-controls-grid">
                <div className="spectrum-control-group">
                  <div className="avm-control-top">
                    <label><MoveVertical className="lucide-icon inline-icon" size={13} /> Altura</label>
                    <span className="control-value">{spectrogramHeight}px</span>
                  </div>
                  <input
                    type="range"
                    min="150"
                    max="800"
                    step="10"
                    value={spectrogramHeight}
                    onChange={(e) => setSpectrogramHeight(Number(e.target.value))}
                    title="Ajusta a altura do espectrograma"
                  />
                </div>

                <div className="spectrum-control-group">
                  <div className="avm-control-top">
                    <label><MoveHorizontal className="lucide-icon inline-icon" size={13} /> Escala Horizontal</label>
                    <span className="control-value">{horizontalScale.toFixed(1)}x</span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={horizontalScale}
                    onChange={(e) => setHorizontalScale(Number(e.target.value))}
                    title="Ajusta a largura do espectrograma (pixels por segundo)"
                  />
                </div>

                <div className="spectrum-control-group">
                  <div className="avm-control-top">
                    <label><Activity className="lucide-icon inline-icon" size={13} /> Freq Máxima</label>
                    <span className="control-value">{(maxFreq / 1000).toFixed(1)}kHz</span>
                  </div>
                  <input
                    type="range"
                    min={2000}
                    max={22000}
                    step={500}
                    value={maxFreq}
                    onChange={(e) => handleManualChangeMaxFreq(Number(e.target.value))}
                  />
                </div>

                <div className="spectrum-control-group">
                  <div className="avm-control-top">
                    <label><Radio className="lucide-icon inline-icon" size={13} /> Sensibilidade</label>
                    <span className="control-value">{minDB}dB</span>
                  </div>
                  <input
                    type="range"
                    min={-100}
                    max={-20}
                    step={5}
                    value={minDB}
                    onChange={(e) => handleManualChangeMinDB(Number(e.target.value))}
                  />
                </div>

                <div className="spectrum-control-group">
                  <div className="avm-control-top">
                    <label><Palette className="lucide-icon inline-icon" size={13} /> Paleta</label>
                    <span className="control-value">{colorScheme.toUpperCase()}</span>
                  </div>
                  <div className="spectrum-color-row">
                    <button
                      type="button"
                      className={`spectrum-color-btn ${colorScheme === 'hot' ? 'active hot' : ''}`}
                      onClick={() => setColorScheme('hot')}
                      title="Hot"
                    >
                      <Flame size={13} /> Hot
                    </button>
                    <button
                      type="button"
                      className={`spectrum-color-btn ${colorScheme === 'cyan' ? 'active cyan' : ''}`}
                      onClick={() => setColorScheme('cyan')}
                      title="Cyan"
                    >
                      <Diamond size={13} /> Ciano
                    </button>
                    <button
                      type="button"
                      className={`spectrum-color-btn ${colorScheme === 'magma' ? 'active magma' : ''}`}
                      onClick={() => setColorScheme('magma')}
                      title="Magma"
                    >
                      <Mountain size={13} /> Magma
                    </button>
                  </div>
                </div>
              </div>

              <div className="spectrum-analysis-group">
                <button
                  type="button"
                  className="spectrum-action-btn spectrum-action-btn--primary"
                  onClick={() => {
                    setIsAnalyzing(true);
                    setAnalysisRequestId((prev) => prev + 1);
                  }}
                  title="Analisar áudio e ajustar visualização automaticamente"
                >
                  <Microscope size={14} /> ANÁLISE RÁPIDA
                </button>
                <button
                  type="button"
                  className="spectrum-action-btn"
                  onClick={() => {
                    setIsAnalyzing(false);
                    setSpectrogramHeight(350);
                    setHorizontalScale(1);
                    setMaxFreq(10000);
                    setMinDB(-60);
                    setColorScheme('hot');
                  }}
                  title="Resetar todos os controles"
                >
                  <RotateCcw size={14} /> RESETAR
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
                  onSeek={(percentage: number) => {
                    if (wavesurferRef.current) wavesurferRef.current.seekTo(percentage);
                  }}
                  duration={durationSec}
                />
              )}
            </div>
          </>
        ) : (
          /* Bancada Acústica Unificada (Filtros, L/R e Reverso) */
          <div className="avm-workbench-wrap">
            <AcousticWorkbench audioSrc={audioSrc} title={title} />
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
