import React, { useState } from 'react';
import { Play, Square, Activity, Type } from 'lucide-react';
import './SignalGeneratorPanel.css';

interface SignalGeneratorPanelProps {
  onGenerateBase: (samples: Float32Array, sampleRate: number, durationSec: number) => void;
}

export default function SignalGeneratorPanel({ onGenerateBase }: SignalGeneratorPanelProps) {
  const [type, setType] = useState<'sine' | 'noise' | 'morse'>('sine');
  const [durationSec, setDurationSec] = useState(5);
  const [frequency, setFrequency] = useState(440);
  const [morseText, setMorseText] = useState('VITE ROCKS');

  const generateSignal = () => {
    const sampleRate = 44100;
    const length = Math.floor(sampleRate * durationSec);
    const samples = new Float32Array(length);

    if (type === 'sine') {
      const angularFreq = (2 * Math.PI * frequency) / sampleRate;
      for (let i = 0; i < length; i++) {
        samples[i] = Math.sin(i * angularFreq) * 0.5; // 50% volume
      }
    } else if (type === 'noise') {
      for (let i = 0; i < length; i++) {
        samples[i] = (Math.random() * 2 - 1) * 0.5;
      }
    } else if (type === 'morse') {
      // Basic morse code generation (simplified)
      // Dot = 1 unit, Dash = 3 units, Gap between dots/dashes = 1 unit
      // Gap between letters = 3 units, Gap between words = 7 units
      const morseMap: Record<string, string> = {
        'A': '.-', 'B': '-...', 'C': '-.-.', 'D': '-..', 'E': '.', 'F': '..-.',
        'G': '--.', 'H': '....', 'I': '..', 'J': '.---', 'K': '-.-', 'L': '.-..',
        'M': '--', 'N': '-.', 'O': '---', 'P': '.--.', 'Q': '--.-', 'R': '.-.',
        'S': '...', 'T': '-', 'U': '..-', 'V': '...-', 'W': '.--', 'X': '-..-',
        'Y': '-.--', 'Z': '--..', '0': '-----', '1': '.----', '2': '..---',
        '3': '...--', '4': '....-', '5': '.....', '6': '-....', '7': '--...',
        '8': '---..', '9': '----.'
      };
      
      const angularFreq = (2 * Math.PI * frequency) / sampleRate;
      const dotDuration = 0.08; // 80ms per dot
      const dotSamples = Math.floor(dotDuration * sampleRate);
      
      let cursor = 0;
      const text = morseText.toUpperCase();
      
      const writeTone = (units: number) => {
        const len = units * dotSamples;
        for (let i = 0; i < len; i++) {
          if (cursor < length) {
            // Apply simple envelope to avoid clicks
            let env = 1;
            if (i < 100) env = i / 100;
            if (i > len - 100) env = (len - i) / 100;
            samples[cursor++] = Math.sin(i * angularFreq) * 0.5 * env;
          }
        }
      };
      
      const writeSilence = (units: number) => {
        cursor += units * dotSamples;
      };

      for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (char === ' ') {
          writeSilence(7); // word gap
        } else if (morseMap[char]) {
          const code = morseMap[char];
          for (let j = 0; j < code.length; j++) {
            if (code[j] === '.') writeTone(1);
            else writeTone(3);
            if (j < code.length - 1) writeSilence(1); // symbol gap
          }
          if (i < text.length - 1 && text[i+1] !== ' ') {
            writeSilence(3); // letter gap
          }
        }
      }
    }

    onGenerateBase(samples, sampleRate, durationSec);
  };

  return (
    <div className="al-synth-panel">
      <div className="al-synth-header">
        <Activity size={14} /> Gerador de Sinais Base
      </div>

      <div className="al-synth-controls">
        <div className="al-synth-control">
          <label>Tipo de Sinal</label>
          <select value={type} onChange={(e) => setType(e.target.value as any)}>
            <option value="sine">Onda Senoidal (Tom)</option>
            <option value="noise">Ruído Branco</option>
            <option value="morse">Código Morse</option>
          </select>
        </div>

        <div className="al-synth-control">
          <label>Duração Total (s): {durationSec}</label>
          <input
            type="range"
            min={1} max={30} step={1}
            value={durationSec}
            onChange={(e) => setDurationSec(Number(e.target.value))}
          />
        </div>

        {(type === 'sine' || type === 'morse') && (
          <div className="al-synth-control">
            <label>Frequência (Hz): {frequency}</label>
            <input
              type="range"
              min={100} max={2000} step={10}
              value={frequency}
              onChange={(e) => setFrequency(Number(e.target.value))}
            />
          </div>
        )}

        {type === 'morse' && (
          <div className="al-synth-control">
            <label>Texto para Morse</label>
            <input
              type="text"
              value={morseText}
              onChange={(e) => setMorseText(e.target.value)}
              placeholder="Digite o texto secreto..."
              maxLength={30}
              className="al-synth-input"
            />
          </div>
        )}
      </div>

      <button className="al-synth-generate-btn" onClick={generateSignal}>
        <Play size={14} /> Gerar e Injetar na Base
      </button>
    </div>
  );
}
