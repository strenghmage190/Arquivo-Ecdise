import React from 'react';
import type { ColormapName } from './AudioLab';
import './AudioLab.css';

export interface FrequencyControlsProps {
  minFreqHz: number;
  setMinFreqHz: (v: number) => void;
  maxFreqHz: number;
  setMaxFreqHz: (v: number) => void;
  intensity: number;
  setIntensity: (v: number) => void;
  mixRatio: number;
  setMixRatio: (v: number) => void;
  durationSec: number;
  setDurationSec: (v: number) => void;
  offsetSec: number;
  setOffsetSec: (v: number) => void;
  colormap: ColormapName;
  setColormap: (v: ColormapName) => void;
  usePinkNoise: boolean;
  setUsePinkNoise: (v: boolean) => void;
  baseAudioDuration: number;
}

const COLORMAP_OPTIONS: { id: ColormapName; label: string; color: string }[] = [
  { id: 'cyberneon', label: 'Cyber Neon', color: '#00f3ff' },
  { id: 'inferno',   label: 'Inferno',    color: '#ff8c00' },
  { id: 'viridis',   label: 'Viridis',    color: '#35b778' },
];

function SliderRow({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  formatVal,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  formatVal?: (v: number) => string;
}) {
  const display = formatVal ? formatVal(value) : `${value}${unit}`;
  return (
    <div className="al-control-row">
      <div className="al-control-header">
        <span className="al-control-label">{label}</span>
        <span className="al-control-value">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="al-slider"
      />
    </div>
  );
}

export default function FrequencyControls({
  minFreqHz,
  setMinFreqHz,
  maxFreqHz,
  setMaxFreqHz,
  intensity,
  setIntensity,
  mixRatio,
  setMixRatio,
  durationSec,
  setDurationSec,
  offsetSec,
  setOffsetSec,
  colormap,
  setColormap,
  usePinkNoise,
  setUsePinkNoise,
  baseAudioDuration,
}: FrequencyControlsProps) {
  const fmtHz = (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)} kHz` : `${v} Hz`;

  return (
    <div className="al-freq-controls">
      <div className="al-section-title">Frequências</div>

      <SliderRow
        label="Hz Mínimo"
        value={minFreqHz}
        min={1000}
        max={20000}
        step={500}
        onChange={(v) => { if (v < maxFreqHz - 500) setMinFreqHz(v); }}
        formatVal={fmtHz}
      />
      <SliderRow
        label="Hz Máximo"
        value={maxFreqHz}
        min={2000}
        max={22000}
        step={500}
        onChange={(v) => { if (v > minFreqHz + 500) setMaxFreqHz(v); }}
        formatVal={fmtHz}
      />

      <div className="al-freq-range-bar">
        <div
          className="al-freq-range-fill"
          style={{
            left: `${((minFreqHz - 1000) / 21000) * 100}%`,
            width: `${((maxFreqHz - minFreqHz) / 21000) * 100}%`,
          }}
        />
      </div>

      <div className="al-section-divider" />
      <div className="al-section-title">Sinal Oculto</div>

      <SliderRow
        label="Intensidade"
        value={Math.round(intensity * 100)}
        min={1}
        max={100}
        unit="%"
        onChange={(v) => setIntensity(v / 100)}
      />
      <SliderRow
        label="Mistura"
        value={Math.round(mixRatio * 100)}
        min={0}
        max={100}
        unit="%"
        onChange={(v) => setMixRatio(v / 100)}
      />
      <div className="al-mix-hint">
        {mixRatio === 0 ? 'Só áudio base' : mixRatio === 1 ? 'Só sinal oculto' : `${Math.round((1 - mixRatio) * 100)}% base + ${Math.round(mixRatio * 100)}% oculto`}
      </div>

      <div className="al-section-divider" />
      <div className="al-section-title">Tempo e Duração</div>

      {baseAudioDuration > 0 && (
        <div className="al-control-row" style={{ marginBottom: '12px' }}>
          <div className="al-control-header">
            <span className="al-control-label">Início da injeção no áudio (s)</span>
            <span className="al-control-value">{offsetSec}s</span>
          </div>
          <div className="al-duration-row">
            <input
              type="range"
              min={0}
              max={Math.max(1, Math.floor(baseAudioDuration))}
              step={0.1}
              value={offsetSec}
              onChange={(e) => setOffsetSec(Number(e.target.value))}
              className="al-slider"
            />
            <input
              type="number"
              min={0}
              max={baseAudioDuration}
              step={0.1}
              value={offsetSec}
              onChange={(e) => setOffsetSec(Math.max(0, Math.min(baseAudioDuration, Number(e.target.value))))}
              className="al-input-num"
            />
          </div>
        </div>
      )}

      <div className="al-control-row">
        <div className="al-control-header">
          <span className="al-control-label">Duração do desenho (s)</span>
          <span className="al-control-value">{durationSec}s</span>
        </div>
        <div className="al-duration-row">
          <input
            type="range"
            min={1}
            max={baseAudioDuration > 0 ? Math.max(60, baseAudioDuration) : 60}
            step={0.1}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
            className="al-slider"
          />
          <input
            type="number"
            min={1}
            max={baseAudioDuration > 0 ? Math.max(60, baseAudioDuration) : 60}
            step={0.1}
            value={durationSec}
            onChange={(e) => setDurationSec(Math.max(1, Number(e.target.value)))}
            className="al-input-num"
          />
        </div>
      </div>

      <div className="al-section-divider" />
      <div className="al-section-title">Colormap Preview</div>

      <div className="al-colormap-btns">
        {COLORMAP_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            className={`al-colormap-btn ${colormap === opt.id ? 'active' : ''}`}
            onClick={() => setColormap(opt.id)}
            style={{ '--cm-color': opt.color } as React.CSSProperties}
          >
            <span className="al-cm-dot" style={{ background: opt.color }} />
            {opt.label}
          </button>
        ))}
      </div>

      {baseAudioDuration === 0 && (
        <>
          <div className="al-section-divider" />
          <div className="al-control-row">
            <label className="al-toggle-row">
              <span className="al-control-label">Ruído Rosa (fallback)</span>
              <div
                className={`al-toggle ${usePinkNoise ? 'on' : ''}`}
                onClick={() => setUsePinkNoise(!usePinkNoise)}
              >
                <div className="al-toggle-knob" />
              </div>
            </label>
            <span className="al-mix-hint">{usePinkNoise ? 'Ruído rosa como base' : 'Silêncio como base'}</span>
          </div>
        </>
      )}
    </div>
  );
}
