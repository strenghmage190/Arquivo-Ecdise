import React, { useState } from 'react';
import './EnigmaMachine.css';

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

type RotorSpec = { wiring: string; notch: string };

const ROTOR_SPECS: Record<string, RotorSpec> = {
  I: { wiring: 'EKMFLGDQVZNTOWYHXUSPAIBRCJ', notch: 'Q' },
  II: { wiring: 'AJDKSIRUXBLHWTMCQGZNPYFVOE', notch: 'E' },
  III: { wiring: 'BDFHJLCPRTXVZNYEIWGAKMUSQO', notch: 'V' },
  IV: { wiring: 'ESOVPZJAYQUIRHXLNFTGKDCMWB', notch: 'J' },
  V: { wiring: 'VZBRGITYUPSDNHLXAWMJQOFECK', notch: 'Z' },
  BETA: { wiring: 'LEYJVCNIXWPBQMDRTAKZGFUHOS', notch: '' },
  GAMMA: { wiring: 'FSOKANUERHMBTIYCWLQPZXVGJD', notch: '' },
};

const REFLECTORS: Record<string, string> = {
  A: 'EJMZALYXVBWFCRQUONTSPIKHGD',
  B: 'YRUHQSLDPXNGOKMIEBFZCWVJAT',
  C: 'FVPJIAOYEDRZXWGCTKUQSBNMHL',
};

export default function EnigmaMachine({ onOutput }: { onOutput: (s: string) => void }) {
  const [model, setModel] = useState('Enigma M3');
  const [rotorOrder, setRotorOrder] = useState(['I', 'II', 'III']);
  const [positions, setPositions] = useState(['A', 'A', 'A']);
  const [ringSettings, setRingSettings] = useState([1, 1, 1]);
  const [reflector, setReflector] = useState('B');
  const [plugPairs, setPlugPairs] = useState('');
  const [foreignChars, setForeignChars] = useState('Include');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');

  const encodeText = (text: string) => {
    const rotors = rotorOrder.map((label, i) => {
      const position = ALPHABET.indexOf(positions[i]);
      const ring = ringSettings[i] - 1;
      return new Rotor(ROTOR_SPECS[label], position, ring);
    });

    const stepRotors = () => {
      const [right, middle, left] = rotors;
      if (middle.atNotch()) {
        middle.rotate();
        left.rotate();
      } else if (right.atNotch()) {
        middle.rotate();
      }
      right.rotate();
    };

    return text
      .toUpperCase()
      .split('')
      .map(char => {
        if (!ALPHABET.includes(char)) {
          return foreignChars === 'Include' ? char : '';
        }
        stepRotors();
        let c = applyPlugboard(char, plugPairs);
        c = rotors.reduce((acc, rotor) => rotor.forward(acc), c);
        c = (REFLECTORS[reflector] || REFLECTORS.B)[ALPHABET.indexOf(c)];
        c = rotors.reduceRight((acc, rotor) => rotor.backward(acc), c);
        return applyPlugboard(c, plugPairs);
      })
      .join('');
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const val = e.target.value;
    setInputText(val);
    const encoded = encodeText(val);
    setOutputText(encoded);
    onOutput(encoded);
  };

  const resetMachine = () => {
    setRotorOrder(['I', 'II', 'III']);
    setPositions(['A', 'A', 'A']);
    setRingSettings([1, 1, 1]);
    setReflector('B');
    setPlugPairs('');
    setForeignChars('Include');
    setInputText('');
    setOutputText('');
  };

  return (
    <div className="enigma-machine">
      <div className="machine-settings">
        <label>Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}>
          <option>Enigma M3</option>
          <option>Enigma M4</option>
        </select>

        <label>Reflector</label>
        <select value={reflector} onChange={e => setReflector(e.target.value)}>
          {Object.keys(REFLECTORS).map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <label>Foreign Characters</label>
        <select value={foreignChars} onChange={e => setForeignChars(e.target.value)}>
          <option>Include</option>
          <option>Ignore</option>
        </select>
      </div>

      <div className="rotor-settings">
        {rotorOrder.map((rotor, i) => (
          <div key={i} className="rotor">
            <label>Rotor {i + 1}</label>
            <select
              value={rotor}
              onChange={e => {
                const newOrder = [...rotorOrder];
                newOrder[i] = e.target.value;
                setRotorOrder(newOrder);
              }}
            >
              {Object.keys(ROTOR_SPECS).map(r => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <label>Position</label>
            <input
              type="text"
              value={positions[i]}
              onChange={e => {
                const newPositions = [...positions];
                newPositions[i] = e.target.value.toUpperCase();
                setPositions(newPositions);
              }}
            />

            <label>Ring</label>
            <input
              type="number"
              min={1}
              max={26}
              value={ringSettings[i]}
              onChange={e => {
                const newSettings = [...ringSettings];
                newSettings[i] = Math.max(1, Math.min(26, parseInt(e.target.value || '1')));
                setRingSettings(newSettings);
              }}
            />
          </div>
        ))}
      </div>

      <div className="plugboard">
        <label>Plugboard</label>
        <input
          type="text"
          value={plugPairs}
          onChange={e => setPlugPairs(e.target.value)}
          placeholder="Enter pairs (e.g., AB CD EF)"
        />
      </div>

      <div className="text-areas">
        <div>
          <label>Plaintext</label>
          <textarea value={inputText} onChange={handleInput} placeholder="Enter text to encode" />
        </div>
        <div>
          <label>Ciphertext</label>
          <textarea value={outputText} readOnly />
        </div>
      </div>

      <button onClick={resetMachine}>Reset</button>
    </div>
  );
}

class Rotor {
  wiring: string;
  notch: string;
  position: number;
  ring: number;

  constructor(spec: RotorSpec, position = 0, ring = 0) {
    this.wiring = spec.wiring;
    this.notch = spec.notch;
    this.position = position % 26;
    this.ring = ring % 26;
  }

  atNotch() {
    return this.notch.includes(ALPHABET[this.position]);
  }

  rotate() {
    this.position = (this.position + 1) % 26;
  }

  forward(c: string) {
    const idx = ALPHABET.indexOf(c);
    const shifted = (idx + this.position - this.ring + 26) % 26;
    const wired = this.wiring[shifted];
    const out = (ALPHABET.indexOf(wired) - this.position + this.ring + 26) % 26;
    return ALPHABET[out];
  }

  backward(c: string) {
    const idx = ALPHABET.indexOf(c);
    const shifted = (idx + this.position - this.ring + 26) % 26;
    const wireIndex = this.wiring.indexOf(ALPHABET[shifted]);
    const out = (wireIndex - this.position + this.ring + 26) % 26;
    return ALPHABET[out];
  }
}

function applyPlugboard(c: string, pairs: string) {
  if (!pairs) return c;
  const mapping: Record<string, string> = {};
  pairs.split(/\s+/).forEach(pair => {
    if (pair.length === 2) {
      const a = pair[0].toUpperCase();
      const b = pair[1].toUpperCase();
      mapping[a] = b;
      mapping[b] = a;
    }
  });
  return mapping[c] || c;
}
