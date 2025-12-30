import React, { useState } from 'react';
import './EnigmaMachine.css';

// Simplified Enigma M3 wiring (three rotors + reflector)
const ROTORS: Record<string,string> = {
  I:   'EKMFLGDQVZNTOWYHXUSPAIBRCJ',
  II:  'AJDKSIRUXBLHWTMCQGZNPYFVOE',
  III: 'BDFHJLCPRTXVZNYEIWGAKMUSQO'
};
const REFLECTOR_B = 'YRUHQSLDPXNGOKMIEBFZCWVJAT';
const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function EnigmaMachine({ onOutput }: { onOutput: (s: string) => void }) {
  const [positions, setPositions] = useState([0, 0, 0]);
  const [inputText, setInputText] = useState('');

  const rotateRotors = (currentPos: number[]) => {
    let [l, m, r] = currentPos;
    r = (r + 1) % 26;
    if (r === 0) {
      m = (m + 1) % 26;
      if (m === 0) l = (l + 1) % 26;
    }
    return [l, m, r];
  };

  const mapChar = (char: string, map: string, offset: number, reverse = false) => {
    const idx = ALPHABET.indexOf(char);
    if (idx === -1) return char;
    const innerIdx = (idx + offset) % 26;
    if (!reverse) {
      const mappedChar = map[innerIdx];
      const outIdx = (ALPHABET.indexOf(mappedChar) - offset + 26) % 26;
      return ALPHABET[outIdx];
    } else {
      const shiftChar = ALPHABET[innerIdx];
      const wireIdx = map.indexOf(shiftChar);
      const outIdx = (wireIdx - offset + 26) % 26;
      return ALPHABET[outIdx];
    }
  };

  const typeCharacter = (char: string) => {
    if (!ALPHABET.includes(char)) return char;
    const newPos = rotateRotors(positions);
    setPositions(newPos);

    let signal = char;
    // Right -> Middle -> Left
    signal = mapChar(signal, ROTORS.III, newPos[2], false);
    signal = mapChar(signal, ROTORS.II, newPos[1], false);
    signal = mapChar(signal, ROTORS.I, newPos[0], false);
    // Reflector
    signal = mapChar(signal, REFLECTOR_B, 0, false);
    // Backwards
    signal = mapChar(signal, ROTORS.I, newPos[0], true);
    signal = mapChar(signal, ROTORS.II, newPos[1], true);
    signal = mapChar(signal, ROTORS.III, newPos[2], true);

    return signal;
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    if (val.length > inputText.length) {
      const char = val.slice(-1);
      if (ALPHABET.includes(char)) {
        const cypher = typeCharacter(char);
        onOutput(cypher);
      } else {
        onOutput(char);
      }
    }
    setInputText(val);
  };

  return (
    <div className="enigma-chassis">
      <div className="rotors-display">
        {positions.map((p, i) => (
          <div key={i} className="rotor-window">
            <button onClick={() => { const newP = [...positions]; newP[i] = (newP[i] + 1) % 26; setPositions(newP); }}>▲</button>
            <div className="rotor-letter">{ALPHABET[p]}</div>
            <div className="rotor-number">{(p + 1).toString().padStart(2, '0')}</div>
            <button onClick={() => { const newP = [...positions]; newP[i] = (newP[i] - 1 + 26) % 26; setPositions(newP); }}>▼</button>
          </div>
        ))}
      </div>
      <div className="enigma-plate">ENIGMA M3 - SIMULADOR</div>
      <input className="enigma-keyboard" value={inputText} onChange={handleInput} placeholder="DIGITE AQUI PARA CIFRAR..." />
    </div>
  );
}
