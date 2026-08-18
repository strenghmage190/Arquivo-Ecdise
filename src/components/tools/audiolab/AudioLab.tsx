import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Radio, Music2, BarChart2, Play, Pause, Square } from 'lucide-react';
import SteganoInputPanel from './SteganoInputPanel';
import FrequencyControls from './FrequencyControls';
import AudioLayerPanel from './AudioLayerPanel';
import DSPFiltersPanel from './DSPFiltersPanel';
import SignalGeneratorPanel from './SignalGeneratorPanel';
import ProfessionalSpectrogram from '../ProfessionalSpectrogram';
import ForensicTerminalModal from '../../modals/ForensicTerminalModal';
import type { DSPFilterNode } from '../../../utils/dspAudioEngine';
import './AudioLab.css';

export type ColormapName = 'cyberneon' | 'inferno' | 'viridis';

export interface AudioLabProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
  initialBaseAudio?: File | null;
}

type ActiveTab = 'steg' | 'dsp' | 'synth';

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'steg',   label: 'Esteganografia', icon: <Radio size={13} /> },
  { id: 'dsp',    label: 'Filtros DSP',    icon: <BarChart2 size={13} /> },
  { id: 'synth',  label: 'Sintetizador',   icon: <Music2 size={13} /> },
];

function colormapToScheme(c: ColormapName): 'cyan' | 'hot' | 'magma' {
  if (c === 'cyberneon') return 'cyan';
  if (c === 'inferno') return 'hot';
  return 'magma';
}

function AudioLabContent({ onClose, onSave, initialBaseAudio }: Omit<AudioLabProps, 'isOpen'>) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('steg');
  const [imageData, setImageData] = useState<ImageData | null>(null);

  const [minFreqHz, setMinFreqHz] = useState(8000);
  const [maxFreqHz, setMaxFreqHz] = useState(18000);
  const [intensity, setIntensity] = useState(0.8);
  const [mixRatio, setMixRatio] = useState(0.5);
  const [durationSec, setDurationSec] = useState(1);
  const [offsetSec, setOffsetSec] = useState(0);
  const [colormap, setColormap] = useState<ColormapName>('cyberneon');
  const [usePinkNoise, setUsePinkNoise] = useState(true);

  const [stegoMethod, setStegoMethod] = useState<'spectrogram' | 'lsb'>('spectrogram');
  const [lsbText, setLsbText] = useState('');

  const [baseAudioSamples, setBaseAudioSamples] = useState<Float32Array | null>(null);
  const [baseAudioUrl, setBaseAudioUrl] = useState<string | null>(null);
  const [baseAudioDuration, setBaseAudioDuration] = useState<number>(0);
  const [generatedSamples, setGeneratedSamples] = useState<Float32Array | null>(null);
  const [generatedSampleRate, setGeneratedSampleRate] = useState(44100);
  const [synthType, setSynthType] = useState<OscillatorType>('sine');
  const [synthFrequency, setSynthFrequency] = useState<number>(440);

  const [showForensicTerminal, setShowForensicTerminal] = useState(false);

  const [dspFilters, setDspFilters] = useState<DSPFilterNode[]>([]);

  const centerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(600);
  const [canvasH, setCanvasH] = useState(300);
  const [zoom, setZoom] = useState(1);

  // Audio playback
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const genSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const genCtxRef = useRef<AudioContext | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const rafRef = useRef<number>(0);

  const stopAll = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    if (genSourceRef.current) { try { genSourceRef.current.stop(); } catch {} genSourceRef.current = null; }
    if (genCtxRef.current) { genCtxRef.current.close(); genCtxRef.current = null; }
    cancelAnimationFrame(rafRef.current);
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  // Sync audio element when baseAudioUrl changes
  useEffect(() => {
    stopAll();
    const el = audioRef.current;
    if (!el || !baseAudioUrl) { setTotalDuration(0); return; }
    el.src = baseAudioUrl;
    el.onloadedmetadata = () => setTotalDuration(el.duration);
  }, [baseAudioUrl, stopAll]);

  // Update totalDuration when generatedSamples arrive (no base)
  useEffect(() => {
    if (!baseAudioUrl && generatedSamples) {
      setTotalDuration(generatedSamples.length / (generatedSampleRate || 44100));
    }
  }, [generatedSamples, generatedSampleRate, baseAudioUrl]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) { stopAll(); return; }

    // Play base audio via <audio> element if available
    if (baseAudioUrl && audioRef.current) {
      const el = audioRef.current;
      el.play().catch(() => {});
      setIsPlaying(true);
      const tick = () => {
        if (!el.paused) {
          setCurrentTime(el.currentTime);
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      el.onended = () => { setIsPlaying(false); setCurrentTime(0); };
      return;
    }

    // Play generated audio via Web Audio API
    if (generatedSamples) {
      const ac = new (window.AudioContext || (window as any).webkitAudioContext)();
      genCtxRef.current = ac;
      const buf = ac.createBuffer(1, generatedSamples.length, generatedSampleRate || 44100);
      buf.getChannelData(0).set(generatedSamples);
      const src = ac.createBufferSource();
      src.buffer = buf;
      src.connect(ac.destination);
      src.start();
      genSourceRef.current = src;
      setIsPlaying(true);
      const startedAt = ac.currentTime;
      const dur = buf.duration;
      setTotalDuration(dur);
      const tick = () => {
        const t = ac.currentTime - startedAt;
        if (t < dur) {
          setCurrentTime(t);
          rafRef.current = requestAnimationFrame(tick);
        } else {
          setIsPlaying(false);
          setCurrentTime(0);
          ac.close();
          genCtxRef.current = null;
        }
      };
      rafRef.current = requestAnimationFrame(tick);
      src.onended = () => { setIsPlaying(false); setCurrentTime(0); };
    }
  }, [isPlaying, baseAudioUrl, generatedSamples, generatedSampleRate, stopAll]);

  const handleSeek = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const frac = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const t = frac * totalDuration;
    if (baseAudioUrl && audioRef.current) {
      audioRef.current.currentTime = t;
      setCurrentTime(t);
    }
  }, [baseAudioUrl, totalDuration]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0)  setCanvasW(Math.floor(width));
        if (height > 0) setCanvasH(Math.floor(height));
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBaseAudioLoaded = useCallback((samples: Float32Array | null, dur: number, url?: string) => {
    setBaseAudioSamples(samples);
    setBaseAudioUrl(url || null);
    setBaseAudioDuration(dur);
    if (samples) {
      setUsePinkNoise(false);
    } else {
      setUsePinkNoise(true);
      setOffsetSec(0);
    }
  }, []);

  const handleGeneratedBase = useCallback((samples: Float32Array, _sampleRate: number, duration: number) => {
    setBaseAudioSamples(samples);
    setUsePinkNoise(false);
    setDurationSec(duration);
  }, []);

  const handleGeneratedBuffer = useCallback((samples: Float32Array, sampleRate: number) => {
    setGeneratedSamples(samples);
    setGeneratedSampleRate(sampleRate);
  }, []);

  const scheme = colormapToScheme(colormap);
  const hasAudio = !!(baseAudioUrl || generatedSamples);
  
  const renderDuration = Math.max(durationSec + offsetSec, baseAudioDuration);
  
  // Zoom logic: 1.0x fits on standard screen width (~800px)
  // Max width is capped at 16000px by browser canvas limits.
  const specWidth = Math.min(16000, Math.max(800, Math.floor(800 * zoom)));

  return (
    <div className="al-overlay" role="dialog" aria-label="AudioLab — Estúdio de Esteganografia">
      <header className="al-header">
        <div className="al-header-logo">
          <Radio size={16} />
          AudioLab
        </div>
        <nav className="al-header-tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`al-header-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>
        <button className="al-close-btn" onClick={onClose} aria-label="Fechar AudioLab" title="Fechar (Esc)">
          <X size={16} />
        </button>
      </header>

      <div className="al-body">
        <div className="al-col-left">
          <div style={{ marginBottom: '16px', padding: '12px', background: 'var(--nx-bg-darker)', borderRadius: '4px', border: '1px solid var(--nx-border)' }}>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--nx-text-muted)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Método de Ocultação
            </label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className={`al-btn-ghost al-btn-sm ${stegoMethod === 'spectrogram' ? 'active' : ''}`}
                style={{ flex: 1, border: stegoMethod === 'spectrogram' ? '1px solid var(--al-neon)' : undefined }}
                onClick={() => setStegoMethod('spectrogram')}
              >
                Espectrograma
              </button>
              <button
                className={`al-btn-ghost al-btn-sm ${stegoMethod === 'lsb' ? 'active' : ''}`}
                style={{ flex: 1, border: stegoMethod === 'lsb' ? '1px solid var(--al-neon)' : undefined }}
                onClick={() => setStegoMethod('lsb')}
              >
                LSB (Silencioso)
              </button>
            </div>
          </div>

          {activeTab === 'steg' && stegoMethod === 'spectrogram' && (
            <FrequencyControls
              minFreqHz={minFreqHz} setMinFreqHz={setMinFreqHz}
              maxFreqHz={maxFreqHz} setMaxFreqHz={setMaxFreqHz}
              intensity={intensity} setIntensity={setIntensity}
              mixRatio={mixRatio} setMixRatio={setMixRatio}
              durationSec={durationSec} setDurationSec={setDurationSec}
              offsetSec={offsetSec} setOffsetSec={setOffsetSec}
              colormap={colormap} setColormap={setColormap}
              usePinkNoise={usePinkNoise} setUsePinkNoise={setUsePinkNoise}
              baseAudioDuration={baseAudioDuration}
            />
          )}
          {activeTab === 'steg' && stegoMethod === 'lsb' && (
            <div style={{ padding: '12px', color: 'var(--nx-text-muted)', fontSize: '12px', background: 'rgba(0,243,255,0.05)', border: '1px dashed var(--nx-border)', borderRadius: '4px' }}>
              <strong>Modo LSB (Least Significant Bit)</strong>
              <p style={{ marginTop: '8px', marginBottom: '8px' }}>
                Este modo não usa ondas sonoras. O texto digitado será convertido em binário e embutido no último bit de cada amostra do arquivo de áudio original.
              </p>
              <p>
                O resultado é <strong>100% inaudível</strong> e não aparecerá no espectrograma acima. 
                Somente arquivos base WAV são suportados para manter a integridade dos dados sem perdas.
              </p>
            </div>
          )}
          {activeTab === 'dsp' && (
            <DSPFiltersPanel filters={dspFilters} onChange={setDspFilters} />
          )}
          {activeTab === 'synth' && (
            <SignalGeneratorPanel onGenerateBase={handleGeneratedBase} />
          )}
        </div>

        <div className="al-col-center">
          <audio ref={audioRef} style={{ display: 'none' }} />

          <div className="al-preview-section" ref={centerRef}>
            <span className="al-preview-label">Espectrograma Preview</span>

            {hasAudio && (
              <div className="al-player-bar">
                <button
                  className={`al-player-btn ${isPlaying ? 'active' : ''}`}
                  onClick={handlePlayPause}
                  title={isPlaying ? 'Parar' : 'Reproduzir'}
                >
                  {isPlaying ? <Square size={12} /> : <Play size={12} />}
                </button>
                <span className="al-player-time">
                  {fmt(currentTime)} / {fmt(totalDuration)}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: '8px', marginRight: '8px' }}>
                  <label style={{ fontSize: '11px', color: 'var(--nx-text-muted, #4a5a6a)' }}>Zoom:</label>
                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="1"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    style={{ width: '100px', accentColor: 'var(--nexus-blue, #00f3ff)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--nexus-blue, #00f3ff)', width: '30px' }}>{zoom.toFixed(1)}x</span>
                </div>
                <div
                  className="al-player-seek"
                  onClick={handleSeek}
                  title="Clique para buscar"
                >
                  <div
                    className="al-player-seek-fill"
                    style={{ width: totalDuration > 0 ? `${(currentTime / totalDuration) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            )}

            <div
              ref={wrapRef}
              className="al-preview-canvas-wrap"
              style={{ overflowX: 'auto', overflowY: 'auto', height: '100%' }}
            >
              {generatedSamples ? (
                <div style={{ position: 'relative', zIndex: 1, minWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ProfessionalSpectrogram
                    audioData={generatedSamples}
                    sampleRate={generatedSampleRate}
                    colorScheme={scheme}
                    maxFreq={22050}
                    width={specWidth}
                  />
                </div>
              ) : (baseAudioSamples || baseAudioUrl) ? (
                <div style={{ position: 'relative', zIndex: 1, minWidth: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <ProfessionalSpectrogram
                    audioUrl={baseAudioUrl ?? undefined}
                    audioData={baseAudioSamples ?? undefined}
                    sampleRate={44100}
                    colorScheme={scheme}
                    maxFreq={22050}
                    width={specWidth}
                  />
                </div>
              ) : (
                <div style={{
                  position: 'relative', zIndex: 1, height: '100%', minHeight: '350px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--nx-text-muted, #4a5a6a)', fontSize: 13,
                  border: '1px solid var(--nx-border, #1a2535)', borderRadius: 4,
                }}>
                  Carregue um áudio base ou configure os parâmetros
                </div>
              )}
            </div>
          </div>

          <div className="al-input-section">
            <SteganoInputPanel onImageDataChange={setImageData} onTextChange={setLsbText} stegoMethod={stegoMethod} />
          </div>
        </div>

        <div className="al-col-right">
          {/* Audio Tracks & Mix */}
          <AudioLayerPanel
            imageData={imageData}
            lsbText={lsbText}
            stegoMethod={stegoMethod}
            minFreqHz={minFreqHz}
            maxFreqHz={maxFreqHz}
            intensity={intensity}
            mixRatio={mixRatio}
            durationSec={durationSec}
            offsetSec={offsetSec}
            usePinkNoise={usePinkNoise}
            onBaseAudioLoaded={handleBaseAudioLoaded}
            onGeneratedBuffer={handleGeneratedBuffer}
            generatedSamples={generatedSamples}
            generatedSampleRate={generatedSampleRate}
            dspFilters={dspFilters}
            onSave={onSave}
            initialBaseAudio={initialBaseAudio}
          />
          
          {/* SEU NOVO MINIGAME DE INVESTIGAÇÃO AQUI: */}
          <div className="al-section-divider" style={{ marginTop: '16px', marginBottom: '16px' }} />
          <button 
            className="al-btn-secondary" 
            style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', border: '1px solid var(--nx-neon-cyan)', color: 'var(--nx-neon-cyan)' }}
            onClick={() => setShowForensicTerminal(true)}
          >
            Abrir Terminal Forense (LSB)
          </button>
          
          <ForensicTerminalModal 
            isOpen={showForensicTerminal}
            onClose={() => setShowForensicTerminal(false)}
            baseAudioSamples={generatedSamples || baseAudioSamples} 
          />
        </div>
      </div>
    </div>
  );
}

export default function AudioLab({ isOpen, onClose, onSave, initialBaseAudio }: AudioLabProps) {
  if (!isOpen) return null;
  return createPortal(
    <div className="al-overlay">
      <AudioLabContent onClose={onClose} onSave={onSave} initialBaseAudio={initialBaseAudio} />
    </div>,
    document.body
  );
}
