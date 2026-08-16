import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Radio, Music2, BarChart2 } from 'lucide-react';
import SteganoInputPanel from './SteganoInputPanel';
import FrequencyControls from './FrequencyControls';
import SpectrogramPreviewCanvas, { type ColormapName } from './SpectrogramPreviewCanvas';
import AudioLayerPanel from './AudioLayerPanel';
import DSPFiltersPanel from './DSPFiltersPanel';
import SignalGeneratorPanel from './SignalGeneratorPanel';
import type { DSPFilterNode } from '../../../utils/dspAudioEngine';
import './AudioLab.css';

export interface AudioLabProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}

type ActiveTab = 'steg' | 'dsp' | 'synth';

const TABS: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
  { id: 'steg',   label: 'Esteganografia', icon: <Radio size={13} /> },
  { id: 'dsp',    label: 'Filtros DSP',    icon: <BarChart2 size={13} /> },
  { id: 'synth',  label: 'Sintetizador',   icon: <Music2 size={13} /> },
];

function AudioLabContent({ onClose, onSave }: Omit<AudioLabProps, 'isOpen'>) {
  // Shared state
  const [activeTab, setActiveTab] = useState<ActiveTab>('steg');
  const [imageData, setImageData] = useState<ImageData | null>(null);

  // Frequency / synthesis params
  const [minFreqHz, setMinFreqHz] = useState(8000);
  const [maxFreqHz, setMaxFreqHz] = useState(18000);
  const [intensity, setIntensity] = useState(0.8);
  const [mixRatio, setMixRatio] = useState(0.5);
  const [durationSec, setDurationSec] = useState(10);
  const [colormap, setColormap] = useState<ColormapName>('cyberneon');
  const [usePinkNoise, setUsePinkNoise] = useState(true);

  // Audio state
  const [baseAudioSamples, setBaseAudioSamples] = useState<Float32Array | null>(null);
  const [generatedSamples, setGeneratedSamples] = useState<Float32Array | null>(null);
  const [generatedSampleRate, setGeneratedSampleRate] = useState(44100);

  // DSP state
  const [dspFilters, setDspFilters] = useState<DSPFilterNode[]>([]);

  // Canvas size tracking
  const centerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ w: 600, h: 200 });

  useEffect(() => {
    if (!centerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setCanvasSize({ w: Math.max(200, Math.floor(width - 24)), h: Math.max(100, Math.floor(height * 0.45)) });
      }
    });
    ro.observe(centerRef.current);
    return () => ro.disconnect();
  }, []);

  // Keyboard: Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleBaseAudioLoaded = useCallback((samples: Float32Array | null, dur: number) => {
    setBaseAudioSamples(samples);
    if (samples) {
      setUsePinkNoise(false);
      setDurationSec(dur);
    } else {
      setUsePinkNoise(true);
    }
  }, []);

  const handleGeneratedBase = useCallback((samples: Float32Array, sampleRate: number, duration: number) => {
    setBaseAudioSamples(samples);
    setUsePinkNoise(false);
    setDurationSec(duration);
  }, []);

  const handleGeneratedBuffer = useCallback((samples: Float32Array, sampleRate: number) => {
    setGeneratedSamples(samples);
    setGeneratedSampleRate(sampleRate);
  }, []);

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

        {/* Center: Preview canvas + input panel */}
        <div className="al-col-center">
          <div className="al-preview-section" ref={centerRef}>
            <span className="al-preview-label">Espectrograma Preview</span>
            <div className="al-preview-canvas-wrap">
              <SpectrogramPreviewCanvas
                imageData={imageData}
                minFreqHz={minFreqHz}
                maxFreqHz={maxFreqHz}
                durationSec={durationSec}
                colormap={colormap}
                intensity={intensity}
                mixRatio={mixRatio}
                usePinkNoise={usePinkNoise}
                hasBaseAudio={!!baseAudioSamples}
                width={canvasSize.w}
                height={canvasSize.h}
                className="al-preview-canvas"
              />
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
          />
        </div>
      </div>
    </div>
  );
}

export default function AudioLab({ isOpen, onClose, onSave }: AudioLabProps) {
  if (!isOpen) return null;
  return createPortal(
    <AudioLabContent onClose={onClose} onSave={onSave} />,
    document.body
  );
}
