import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Radio, Music2, BarChart2, Play, Pause, Square } from 'lucide-react';
import SteganoInputPanel from './SteganoInputPanel';
import FrequencyControls from './FrequencyControls';
import AudioLayerPanel from './AudioLayerPanel';
import DSPFiltersPanel from './DSPFiltersPanel';
import SignalGeneratorPanel from './SignalGeneratorPanel';
import ProfessionalSpectrogram from '../ProfessionalSpectrogram';
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
  const [durationSec, setDurationSec] = useState(10);
  const [colormap, setColormap] = useState<ColormapName>('cyberneon');
  const [usePinkNoise, setUsePinkNoise] = useState(true);

  const [baseAudioSamples, setBaseAudioSamples] = useState<Float32Array | null>(null);
  const [baseAudioUrl, setBaseAudioUrl] = useState<string | null>(null);
  const [generatedSamples, setGeneratedSamples] = useState<Float32Array | null>(null);
  const [generatedSampleRate, setGeneratedSampleRate] = useState(44100);

  const [dspFilters, setDspFilters] = useState<DSPFilterNode[]>([]);

  const centerRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [canvasW, setCanvasW] = useState(600);
  const [canvasH, setCanvasH] = useState(300);

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
    if (samples) {
      setUsePinkNoise(false);
      setDurationSec(dur);
    } else {
      setUsePinkNoise(true);
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

  return (
    <div className="al-overlay" role="dialog" aria-label="AudioLab — Estúdio de Esteganografia">
      {/* Header */}
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

      {/* Body */}
      <div className="al-body">
        {/* Left: Frequency / params */}
        <div className="al-col-left">
          {activeTab === 'steg' && (
            <FrequencyControls
              minFreqHz={minFreqHz}          setMinFreqHz={setMinFreqHz}
              maxFreqHz={maxFreqHz}          setMaxFreqHz={setMaxFreqHz}
              intensity={intensity}          setIntensity={setIntensity}
              mixRatio={mixRatio}            setMixRatio={setMixRatio}
              durationSec={durationSec}      setDurationSec={setDurationSec}
              colormap={colormap}            setColormap={setColormap}
              usePinkNoise={usePinkNoise}    setUsePinkNoise={setUsePinkNoise}
              hasBaseAudio={!!baseAudioSamples}
            />
          )}
          {activeTab === 'dsp' && (
            <DSPFiltersPanel filters={dspFilters} onChange={setDspFilters} />
          )}
          {activeTab === 'synth' && (
            <SignalGeneratorPanel onGenerateBase={handleGeneratedBase} />
          )}
        </div>

        {/* Center: Spectrogram + input panel */}
        <div className="al-col-center">
          {/* Hidden audio element for base audio playback */}
          <audio ref={audioRef} style={{ display: 'none' }} />

          <div className="al-preview-section" ref={centerRef}>
            <span className="al-preview-label">Espectrograma Preview</span>

            {/* Compact player bar */}
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

            {/* Stacked spectrogram area */}
            <div
              ref={wrapRef}
              className="al-preview-canvas-wrap"
            >
              {/* Layer 1: Base audio spectrogram (background) */}
              {(baseAudioSamples || baseAudioUrl) ? (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                  <ProfessionalSpectrogram
                    audioUrl={baseAudioUrl ?? undefined}
                    audioData={baseAudioSamples ?? undefined}
                    sampleRate={44100}
                    colorScheme={scheme}
                    maxFreq={maxFreqHz}
                    width={canvasW}
                    height={canvasH}
                  />
                </div>
              ) : (
                /* Empty state */
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--nx-text-muted, #4a5a6a)', fontSize: 13,
                  border: '1px solid var(--nx-border, #1a2535)', borderRadius: 4,
                }}>
                  Carregue um áudio base ou configure os parâmetros
                </div>
              )}

              {/* Layer 2: Generated payload spectrogram (screen blend) */}
              {generatedSamples && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 2,
                  mixBlendMode: (baseAudioSamples || baseAudioUrl) ? 'screen' : 'normal',
                  pointerEvents: 'none',
                }}>
                  <ProfessionalSpectrogram
                    audioData={generatedSamples}
                    sampleRate={generatedSampleRate}
                    colorScheme={scheme}
                    maxFreq={maxFreqHz}
                    hideDecorations={!!(baseAudioSamples || baseAudioUrl)}
                    width={canvasW}
                    height={canvasH}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="al-input-section">
            <SteganoInputPanel onImageDataChange={setImageData} />
          </div>
        </div>

        {/* Right: Layers + synth + export */}
        <div className="al-col-right">
          <AudioLayerPanel
            imageData={imageData}
            minFreqHz={minFreqHz}
            maxFreqHz={maxFreqHz}
            intensity={intensity}
            mixRatio={mixRatio}
            durationSec={durationSec}
            usePinkNoise={usePinkNoise}
            onBaseAudioLoaded={handleBaseAudioLoaded}
            onGeneratedBuffer={handleGeneratedBuffer}
            generatedSamples={generatedSamples}
            generatedSampleRate={generatedSampleRate}
            dspFilters={dspFilters}
            onSave={onSave}
            initialBaseAudio={initialBaseAudio}
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
