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

class Rotor {
  wiring: string;
  notch: string;
  position: number; // 0-25
  ring: number; // 0-25

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

  // encode from right->left (entry to exit)
  forward(c: string) {
    const idx = ALPHABET.indexOf(c);
    const shifted = (idx + this.position - this.ring + 26) % 26;
    const wired = this.wiring[shifted];
    const out = (ALPHABET.indexOf(wired) - this.position + this.ring + 26) % 26;
    return ALPHABET[out];
  }

  // encode from left->right (return path)
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

export default function EnigmaMachine({ onOutput }: { onOutput: (s: string) => void }) {
  // rotorOrder is left->right as user sees it
  const [rotorOrder, setRotorOrder] = useState(['I', 'II', 'III']);
  const [positions, setPositions] = useState(['A', 'A', 'A']); // letters left->right
  const [ringSettings, setRingSettings] = useState([1, 1, 1]); // 1-26 shown to user
  const [reflector, setReflector] = useState('B');
  const [plugPairs, setPlugPairs] = useState('');
  const [inputText, setInputText] = useState('');
  const [lamp, setLamp] = useState('');

  const makeRotors = () => {
    // rotorOrder: [left, middle, right]
    // internal rotors array: [right, middle, left]
    const leftLabel = rotorOrder[0];
    const middleLabel = rotorOrder[1];
    const rightLabel = rotorOrder[2];

    const left = new Rotor(ROTOR_SPECS[leftLabel], ALPHABET.indexOf(positions[0]), Math.max(0, (ringSettings[0] - 1)));
    const middle = new Rotor(ROTOR_SPECS[middleLabel], ALPHABET.indexOf(positions[1]), Math.max(0, (ringSettings[1] - 1)));
    const right = new Rotor(ROTOR_SPECS[rightLabel], ALPHABET.indexOf(positions[2]), Math.max(0, (ringSettings[2] - 1)));
    return [right, middle, left];
  };

  const stepRotors = (rotors: Rotor[]) => {
    // rotors array: [right, middle, left]
    const right = rotors[0];
    const middle = rotors[1];
    const left = rotors[2];

    // double-stepping behaviour (notch detection uses rotor's current position)
    if (middle.atNotch()) {
      middle.rotate();
      left.rotate();
    } else if (right.atNotch()) {
      middle.rotate();
    }
    right.rotate();
  };

  const encodeChar = (ch: string) => {
    if (!ALPHABET.includes(ch)) return ch;

    const rotors = makeRotors();
    stepRotors(rotors);

    // plugboard in
    let c = applyPlugboard(ch, plugPairs);

    // forward through rotors (right -> left)
    c = rotors[0].forward(c);
    c = rotors[1].forward(c);
    c = rotors[2].forward(c);

    // reflector
    c = (REFLECTORS[reflector] || REFLECTORS.B)[ALPHABET.indexOf(c)];

    // backward through rotors (left -> right)
    c = rotors[2].backward(c);
    c = rotors[1].backward(c);
    c = rotors[0].backward(c);

    // plugboard out
    c = applyPlugboard(c, plugPairs);
    // set lamp and return
    setLamp(c);
    return c;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    if (val.length > inputText.length) {
      const char = val.slice(-1);
      const out = encodeChar(char);
      onOutput(out);
    }
    setInputText(val);
  };

  return (
    <div className="enigma-chassis">
      <div className="rotors-display">
        {positions.map((p, i) => (
          <div key={i} className="rotor-window">
            <select className="rotor-select" value={rotorOrder[i]} onChange={e => { const ro = [...rotorOrder]; ro[i] = e.target.value; setRotorOrder(ro); }}>
              {Object.keys(ROTOR_SPECS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div className="rotor-controls">
              <button onClick={() => { const newP = [...positions]; const idx = (ALPHABET.indexOf(newP[i]) + 1) % 26; newP[i] = ALPHABET[idx]; setPositions(newP); }}>▲</button>
              <button onClick={() => { const newP = [...positions]; const idx = (ALPHABET.indexOf(newP[i]) - 1 + 26) % 26; newP[i] = ALPHABET[idx]; setPositions(newP); }}>▼</button>
            </div>
            <div className="rotor-wheel">
              <div className="rotor-letter">{p}</div>
            </div>
            <div className="rotor-number">{p}</div>
            <input className="ring-input" type="number" min={1} max={26} value={ringSettings[i]} onChange={e => { const v = Math.max(1, Math.min(26, parseInt(e.target.value || '1'))); const r = [...ringSettings]; r[i] = v; setRingSettings(r); }} />
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <label className="reflector-label">Reflector</label>
            <select className="reflector-select" value={reflector} onChange={e => setReflector(e.target.value)}>
              {Object.keys(REFLECTORS).map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <div style={{ flex: 1 }} />
          </div>
          <input className="plugboard-input" placeholder="Pareamentos plugboard (ex: HL MO AJ)" value={plugPairs} onChange={e => setPlugPairs(e.target.value)} />
        </div>
        <div style={{ width: 72, textAlign: 'center' }}>
          <div style={{ color: '#999', fontSize: 12 }}>Lamp</div>
          <div className="lampboard" style={{ marginTop: 6 }}>{lamp}</div>
        </div>
      </div>

      <input className="enigma-keyboard" value={inputText} onChange={handleInput} placeholder="DIGITE AQUI PARA CIFRAR..." />
    </div>
  );
}
