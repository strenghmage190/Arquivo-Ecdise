import React, { useState } from 'react';
import CipherLib from '../../utils/ciphers';
import { hexToText, hexToBytes, textToHex, xorDecodeHex, enigmaDecodeHex } from '../../utils/hexEncoders';
import EnigmaMachine from './EnigmaMachine';
import './UniversalDecoder.css';

export default function UniversalDecoder() {
  const [mode, setMode] = useState('caesar');
  const [input, setInput] = useState('');
  const [param, setParam] = useState<string | number>('1');
  const [enigmaOutput, setEnigmaOutput] = useState('');
  const [hexMethod, setHexMethod] = useState<'auto' | 'utf8hex' | 'xor' | 'enigma'>('auto');
  const [hexKey, setHexKey] = useState('');

  let result = '';
  if (mode === 'caesar') {
    const shift = parseInt(String(param)) || 0;
    result = `ROT+${shift}: ${CipherLib.caesar(input, shift)}\nROT-${shift}: ${CipherLib.caesar(input, -shift)}`;
  } else if (mode === 'atbash') result = CipherLib.atbash(input);
  else if (mode === 'a1z26') result = CipherLib.a1z26(input);
  else if (mode === 'vigenere') result = CipherLib.vigenere(input, String(param), true);
  else if (mode === 'binary') result = CipherLib.binaryToString(input);
  else if (mode === 'hex') {
    try {
      if (hexMethod === 'auto') result = CipherLib.hexToString(input);
      else if (hexMethod === 'utf8hex') result = hexToText(input);
      else if (hexMethod === 'xor') result = xorDecodeHex(input, hexKey);
      else if (hexMethod === 'enigma') result = enigmaDecodeHex(input, hexKey);
    } catch (e) { result = `Erro ao decodificar: ${String(e)}`; }
  }
  else if (mode === 'base64') result = CipherLib.base64ToString(input);

  return (
    <div className="decoder-station">
      <div className="decoder-tabs">
        <button onClick={() => setMode('caesar')} className={mode === 'caesar' ? 'active' : ''}>CÉSAR (ROT)</button>
        <button onClick={() => setMode('atbash')} className={mode === 'atbash' ? 'active' : ''}>ATBASH</button>
        <button onClick={() => setMode('vigenere')} className={mode === 'vigenere' ? 'active' : ''}>VIGENÈRE</button>
        <button onClick={() => setMode('a1z26')} className={mode === 'a1z26' ? 'active' : ''}>A1Z26</button>
        <button onClick={() => setMode('binary')} className={mode === 'binary' ? 'active' : ''}>BINÁRIO</button>
        <button onClick={() => setMode('hex')} className={mode === 'hex' ? 'active' : ''}>HEX</button>
        <button onClick={() => setMode('base64')} className={mode === 'base64' ? 'active' : ''}>BASE64</button>
        <button onClick={() => setMode('enigma')} className={`special ${mode === 'enigma' ? 'active' : ''}`}>ENIGMA M3</button>
      </div>

      <div className="decoder-body">
        {mode === 'enigma' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EnigmaMachine onOutput={(char) => setEnigmaOutput(prev => prev + char)} />
            <div className="output-screen">
              <div style={{ color: '#666', fontSize: 10 }}>OUTPUT (FITAMENTO):</div>
              <div style={{ color: '#ff0', fontSize: 18, marginTop: 5, wordBreak: 'break-all' }}>{enigmaOutput}</div>
              <button onClick={() => setEnigmaOutput('')} style={{ marginTop: 10, fontSize: 10 }}>LIMPAR FITA</button>
            </div>
          </div>
        ) : (
          <>
            <textarea className="decoder-input" placeholder="Cole o código cifrado aqui..." value={input} onChange={e => setInput(e.target.value)} />

            {mode === 'caesar' && (
              <div className="decoder-params">
                <label>Deslocamento (Shift):</label>
                <input type="number" value={param as any} onChange={e => setParam(e.target.value)} />
              </div>
            )}
              {mode === 'hex' && (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8 }}>
                  <label>Método:</label>
                  <select value={hexMethod} onChange={e => setHexMethod(e.target.value as any)}>
                    <option value="auto">Detectar/Texto</option>
                    <option value="utf8hex">Hex (UTF-8)</option>
                    <option value="xor">XOR + Hex</option>
                    <option value="enigma">Enigma-simples + Hex</option>
                  </select>
                  {(hexMethod === 'xor' || hexMethod === 'enigma') && (
                    <input placeholder="Chave" value={hexKey} onChange={e => setHexKey(e.target.value)} style={{ marginLeft: 8 }} />
                  )}
                </div>
              )}
            {mode === 'vigenere' && (
              <div className="decoder-params">
                <label>Palavra-Chave (Key):</label>
                <input type="text" value={param as any} onChange={e => setParam(e.target.value)} />
              </div>
            )}

            <div className="output-screen code-font">{result}</div>
          </>
        )}
      </div>
    </div>
  );
}
