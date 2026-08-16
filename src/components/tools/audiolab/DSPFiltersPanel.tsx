import React from 'react';
import { Plus, Trash2, Sliders } from 'lucide-react';
import type { DSPFilterNode } from '../../../utils/dspAudioEngine';
import './DSPFiltersPanel.css';

interface DSPFiltersPanelProps {
  filters: DSPFilterNode[];
  onChange: (filters: DSPFilterNode[]) => void;
}

export default function DSPFiltersPanel({ filters, onChange }: DSPFiltersPanelProps) {
  const addFilter = () => {
    const newFilter: DSPFilterNode = {
      id: Math.random().toString(36).substring(7),
      type: 'lowpass',
      frequency: 2000,
      Q: 1,
      detune: 0,
    };
    onChange([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    onChange(filters.filter(f => f.id !== id));
  };

  const updateFilter = (id: string, updates: Partial<DSPFilterNode>) => {
    onChange(filters.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  return (
    <div className="al-dsp-panel">
      <div className="al-dsp-header">
        <div className="al-dsp-title">
          <Sliders size={14} /> Efeitos & DSP
        </div>
        <button className="al-dsp-add-btn" onClick={addFilter}>
          <Plus size={14} /> Adicionar
        </button>
      </div>

      <div className="al-dsp-list">
        {filters.length === 0 ? (
          <div className="al-dsp-empty">Nenhum filtro aplicado.</div>
        ) : (
          filters.map(filter => (
            <div key={filter.id} className="al-dsp-card">
              <div className="al-dsp-card-header">
                <select
                  value={filter.type}
                  onChange={(e) => updateFilter(filter.id, { type: e.target.value as BiquadFilterType })}
                  className="al-dsp-select"
                >
                  <option value="lowpass">Lowpass</option>
                  <option value="highpass">Highpass</option>
                  <option value="bandpass">Bandpass</option>
                  <option value="notch">Notch</option>
                </select>
                <button className="al-dsp-remove-btn" onClick={() => removeFilter(filter.id)}>
                  <Trash2 size={14} />
                </button>
              </div>

              <div className="al-dsp-controls">
                <div className="al-dsp-control">
                  <label>Frequency ({filter.frequency} Hz)</label>
                  <input
                    type="range"
                    min={20}
                    max={20000}
                    step={10}
                    value={filter.frequency}
                    onChange={(e) => updateFilter(filter.id, { frequency: Number(e.target.value) })}
                  />
                </div>
                <div className="al-dsp-control">
                  <label>Q Factor ({filter.Q})</label>
                  <input
                    type="range"
                    min={0.0001}
                    max={100}
                    step={0.1}
                    value={filter.Q}
                    onChange={(e) => updateFilter(filter.id, { Q: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
