import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Radio, Music2, BarChart2 } from 'lucide-react';
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
  const [canvasW, setCanvasW] = useState(600);

  useEffect(() => {
    if (!centerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setCanvasW(Math.max(200, Math.floor(entry.contentRect.width - 2)));
      }
    });
    ro.observe(centerRef.current);
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
          <div className="al-preview-section" ref={centerRef}>
            <span className="al-preview-label">Espectrograma Preview</span>

            {/* Stacked spectrogram area */}
            <div
              className="al-preview-canvas-wrap"
              style={{ position: 'relative', width: '100%', flex: 1, minHeight: 0, overflow: 'hidden' }}
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
