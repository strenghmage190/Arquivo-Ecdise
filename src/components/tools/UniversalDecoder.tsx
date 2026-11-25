import React, { useEffect, useState } from 'react';
import { KeyRound } from 'lucide-react';
import CipherLib from '../../utils/ciphers';
import { hexToText, xorDecodeHex, enigmaDecodeHex } from '../../utils/hexEncoders';
import {
  getUnlockedCodes,
  PLAYER_TRACKING_EVENT,
  UnlockedCodeEntry,
} from '../../utils/playerTracking';
import EnigmaMachine from './EnigmaMachine';
import './UniversalDecoder.css';

export interface UniversalDecoderProps {
  initialInput?: string;
  initialMode?: string;
  investigationId?: string;
}

const VALID_MODES = ['caesar', 'atbash', 'vigenere', 'a1z26', 'binary', 'hex', 'base64', 'enigma'];

export default function UniversalDecoder({
  initialInput,
  initialMode,
  investigationId,
}: UniversalDecoderProps = {}) {
  const [mode, setMode] = useState(() =>
    initialMode && VALID_MODES.includes(initialMode) ? initialMode : 'caesar'
  );
  const [input, setInput] = useState(() => initialInput ?? '');
  const [param, setParam] = useState<string | number>('1');

  const [hexMethod, setHexMethod] = useState<'auto' | 'utf8hex' | 'xor' | 'enigma'>('auto');
  const [hexKey, setHexKey] = useState('');
  const [showCodesDrawer, setShowCodesDrawer] = useState(false);
  const [unlockedCodes, setUnlockedCodes] = useState<UnlockedCodeEntry[]>(() =>
    investigationId ? getUnlockedCodes(investigationId) : []
  );

  useEffect(() => {
    if (initialInput !== undefined) {
      setInput(initialInput);
    }
  }, [initialInput]);

  useEffect(() => {
    if (initialMode && VALID_MODES.includes(initialMode)) {
      setMode(initialMode);
    }
  }, [initialMode]);

  useEffect(() => {
    if (!investigationId) {
      setUnlockedCodes([]);
      return;
    }
    const refresh = () => setUnlockedCodes(getUnlockedCodes(investigationId));
    refresh();
    window.addEventListener(PLAYER_TRACKING_EVENT, refresh);
    return () => window.removeEventListener(PLAYER_TRACKING_EVENT, refresh);
  }, [investigationId]);

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
    } catch (e) {
      result = `Erro ao decodificar: ${String(e)}`;
    }
  } else if (mode === 'base64') result = CipherLib.base64ToString(input);

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
        {investigationId && (
          <button
            type="button"
            className={`decoder-codes-toggle ${showCodesDrawer ? 'active' : ''}`}
            onClick={() => setShowCodesDrawer((v) => !v)}
            title="Códigos e senhas já desbloqueados"
          >
            <KeyRound size={14} /> Códigos ({unlockedCodes.length})
          </button>
        )}
      </div>

      {investigationId && showCodesDrawer && (
        <div className="decoder-codes-drawer">
          <div className="decoder-codes-header">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><KeyRound size={14} /> CÓDIGOS DESCOBERTOS ({unlockedCodes.length})</span>
            <button type="button" className="decoder-codes-close" onClick={() => setShowCodesDrawer(false)}>
              Fechar
            </button>
          </div>
          {unlockedCodes.length === 0 ? (
            <div className="decoder-codes-empty">
              Nenhum código ou senha desbloqueado nesta investigação ainda.
            </div>
          ) : (
            <div className="decoder-codes-list">
              {unlockedCodes.map((entry) => (
                <div key={`${entry.cardId}-${entry.lockType}-${entry.code}`} className="decoder-code-item">
                  <div className="decoder-code-meta">
                    <strong>{entry.cardTitle}</strong>
                    <span>{entry.lockType}</span>
                  </div>
                  <div className="decoder-code-actions">
                    <code>{entry.code}</code>
                    <button
                      type="button"
                      onClick={() => {
                        setInput(entry.code);
                        setShowCodesDrawer(false);
                      }}
                    >
                      Usar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="decoder-body">
        {mode === 'enigma' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <EnigmaMachine onOutput={() => {}} />
          </div>
        ) : (
          <>
            <textarea
              className="decoder-input"
              placeholder="Cole o código cifrado aqui..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />

            {mode === 'caesar' && (
              <div className="decoder-params">
                <label>Deslocamento (Shift):</label>
                <input type="number" value={param as any} onChange={(e) => setParam(e.target.value)} />
              </div>
            )}
            {mode === 'hex' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
                <label>Método:</label>
                <select value={hexMethod} onChange={(e) => setHexMethod(e.target.value as any)}>
                  <option value="auto">Detectar/Texto</option>
                  <option value="utf8hex">Hex (UTF-8)</option>
                  <option value="xor">XOR + Hex</option>
                  <option value="enigma">Enigma-simples + Hex</option>
                </select>
                {(hexMethod === 'xor' || hexMethod === 'enigma') && (
                  <input
                    placeholder="Chave"
                    value={hexKey}
                    onChange={(e) => setHexKey(e.target.value)}
                    style={{ marginLeft: 8 }}
                  />
                )}
              </div>
            )}
            {mode === 'vigenere' && (
              <div className="decoder-params">
                <label>Palavra-Chave (Key):</label>
                <input type="text" value={param as any} onChange={(e) => setParam(e.target.value)} />
              </div>
            )}

            <div className="output-screen code-font">{result}</div>
          </>
        )}
      </div>
    </div>
  );
}
