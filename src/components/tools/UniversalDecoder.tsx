import React, { useEffect, useState, useMemo } from 'react';
import { KeyRound, Sparkles, BookOpen } from 'lucide-react';
import CipherLib from '../../utils/ciphers';
import { hexToText, xorDecodeHex, enigmaDecodeHex } from '../../utils/hexEncoders';
import {
  getUnlockedCodes,
  PLAYER_TRACKING_EVENT,
  UnlockedCodeEntry,
} from '../../utils/playerTracking';
import { useForensicDispatch } from '../../contexts/ForensicDispatchContext';
import EnigmaMachine from './EnigmaMachine';
import './UniversalDecoder.css';

export interface UniversalDecoderProps {
  initialInput?: string;
  initialMode?: string;
  investigationId?: string;
}

const VALID_MODES = ['caesar', 'atbash', 'vigenere', 'a1z26', 'binary', 'hex', 'base64', 'morse', 'enigma'];

const PT_COMMON_WORDS = /\b(DE|DO|DA|DOS|DAS|EM|NO|NA|NOS|NAS|QUE|PARA|COM|POR|UMA|UM|OS|AS|SE|NAO|SENHA|CODIGO|ORDO|ECDISE|PORTA|CHAVE|SALA)\b/i;

function detectFormatHint(raw: string): { mode: string; label: string; reason: string } | null {
  const clean = raw.trim();
  if (!clean) return null;
  if (/^[01\s]+$/.test(clean) && clean.replace(/\s+/g, '').length >= 8) {
    return { mode: 'binary', label: 'BINÁRIO', reason: 'Apenas bits 0 e 1 detectados' };
  }
  const dotDash = (clean.match(/[.\-/]/g) || []).length;
  if (dotDash > clean.length * 0.55 && /^[.\-/\s]+$/.test(clean)) {
    return { mode: 'morse', label: 'MORSE', reason: 'Padrão de pontos e traços detectado' };
  }
  if (/^[0-9A-Fa-f\s]+$/.test(clean) && clean.replace(/\s+/g, '').length >= 4 && /[A-Fa-f]/.test(clean)) {
    return { mode: 'hex', label: 'HEX', reason: 'Pares hexadecimais (0-9, A-F) detectados' };
  }
  if (/^\d{1,2}([\s,\-]+\d{1,2})+$/.test(clean)) {
    return { mode: 'a1z26', label: 'A1Z26', reason: 'Sequência numérica (1–26) detectada' };
  }
  if (clean.endsWith('=') || (/^[A-Za-z0-9+/]+={0,2}$/.test(clean) && clean.length % 4 === 0 && clean.length >= 8)) {
    return { mode: 'base64', label: 'BASE64', reason: 'Estrutura compatível com Base64' };
  }
  if (/[A-Za-z]{3,}/.test(clean)) {
    return { mode: 'caesar', label: 'CÉSAR (ROT)', reason: 'Texto alfabético — teste deslocamento ou brute-force' };
  }
  return null;
}

export default function UniversalDecoder({
  initialInput,
  initialMode,
  investigationId,
}: UniversalDecoderProps = {}) {
  const { openFieldManual } = useForensicDispatch();
  const [mode, setMode] = useState(() =>
    initialMode && VALID_MODES.includes(initialMode) ? initialMode : 'caesar'
  );
  const [input, setInput] = useState(() => initialInput ?? '');
  const [param, setParam] = useState<string | number>('1');
  const [showBruteForce, setShowBruteForce] = useState(false);

  const [hexMethod, setHexMethod] = useState<'auto' | 'utf8hex' | 'xor' | 'enigma'>('auto');
  const [hexKey, setHexKey] = useState('');
  const [showCodesDrawer, setShowCodesDrawer] = useState(false);
  const [unlockedCodes, setUnlockedCodes] = useState<UnlockedCodeEntry[]>(() =>
    investigationId ? getUnlockedCodes(investigationId) : []
  );

  useEffect(() => {
    if (initialInput !== undefined) setInput(initialInput);
  }, [initialInput]);

  useEffect(() => {
    if (initialMode && VALID_MODES.includes(initialMode)) setMode(initialMode);
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

  const formatHint = useMemo(() => detectFormatHint(input), [input]);

  const bruteForceRows = useMemo(() => {
    if (mode !== 'caesar' || !showBruteForce || !input.trim()) return [];
    return Array.from({ length: 25 }, (_, i) => {
      const shift = i + 1;
      const decoded = CipherLib.caesar(input, -shift);
      const likely = PT_COMMON_WORDS.test(decoded);
      return { shift, decoded, likely };
    });
  }, [mode, showBruteForce, input]);

  let result = '';
  if (mode === 'caesar') {
    const shift = parseInt(String(param)) || 0;
    result = `ROT+${shift}: ${CipherLib.caesar(input, shift)}\nROT-${shift}: ${CipherLib.caesar(input, -shift)}`;
  } else if (mode === 'atbash') result = CipherLib.atbash(input);
  else if (mode === 'a1z26') result = CipherLib.a1z26(input);
  else if (mode === 'vigenere') result = CipherLib.vigenere(input, String(param), true);
  else if (mode === 'binary') result = CipherLib.binaryToString(input);
  else if (mode === 'morse') result = CipherLib.morseToString(input);
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
        <button onClick={() => setMode('morse')} className={mode === 'morse' ? 'active' : ''}>MORSE</button>
        <button onClick={() => setMode('binary')} className={mode === 'binary' ? 'active' : ''}>BINÁRIO</button>
        <button onClick={() => setMode('hex')} className={mode === 'hex' ? 'active' : ''}>HEX</button>
        <button onClick={() => setMode('base64')} className={mode === 'base64' ? 'active' : ''}>BASE64</button>
        <button onClick={() => setMode('enigma')} className={`special ${mode === 'enigma' ? 'active' : ''}`}>ENIGMA M3</button>
        <button
          type="button"
          className="decoder-codes-toggle"
          onClick={() => openFieldManual('crypto')}
          title="Manual de Criptoanálise da Ordo"
        >
          <BookOpen size={14} /> Manual
        </button>
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

            {formatHint && formatHint.mode !== mode && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  padding: '6px 10px',
                  marginTop: 6,
                  borderRadius: 6,
                  background: 'rgba(0, 243, 255, 0.08)',
                  border: '1px solid rgba(0, 243, 255, 0.3)',
                  fontSize: 11.5,
                  color: '#8bf7ff',
                }}
              >
                <span>
                  <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Análise C.R.I.S.: {formatHint.reason}
                </span>
                <button
                  type="button"
                  onClick={() => setMode(formatHint.mode)}
                  style={{
                    background: '#00f3ff',
                    color: '#041019',
                    border: 'none',
                    borderRadius: 4,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Testar {formatHint.label}
                </button>
              </div>
            )}

            {mode === 'caesar' && (
              <div className="decoder-params" style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <label>Deslocamento (Shift):</label>
                <input type="number" value={param as any} onChange={(e) => setParam(e.target.value)} />
                <button
                  type="button"
                  onClick={() => setShowBruteForce((v) => !v)}
                  style={{
                    background: showBruteForce ? 'rgba(0, 243, 255, 0.2)' : 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(0, 243, 255, 0.35)',
                    color: '#00f3ff',
                    borderRadius: 5,
                    padding: '5px 10px',
                    fontSize: 11.5,
                    cursor: 'pointer',
                  }}
                >
                  {showBruteForce ? 'Ocultar Brute-Force (1–25)' : 'Testar Todos (ROT 1–25)'}
                </button>
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

            {mode === 'caesar' && showBruteForce && bruteForceRows.length > 0 ? (
              <div className="output-screen code-font" style={{ maxHeight: 220, overflowY: 'auto', fontSize: 12 }}>
                {bruteForceRows.map((row) => (
                  <div
                    key={row.shift}
                    style={{
                      padding: '3px 6px',
                      borderRadius: 4,
                      background: row.likely ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
                      color: row.likely ? '#6ee7b7' : 'inherit',
                      fontWeight: row.likely ? 700 : 400,
                    }}
                  >
                    ROT-{String(row.shift).padStart(2, '0')}: {row.decoded}
                  </div>
                ))}
              </div>
            ) : (
              <div className="output-screen code-font">{result}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
