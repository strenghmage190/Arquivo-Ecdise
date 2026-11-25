import React, { useEffect, useState, useMemo } from 'react';
import { BarChart3, BookOpen, KeyRound, Sparkles } from 'lucide-react';
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

interface FreqItem {
  char: string;
  count: number;
  pct: number;
}

function analyzePatternData(raw: string): { facts: string[]; freqData: FreqItem[] } {
  const clean = (raw || '').trim();
  if (!clean) {
    return { facts: ['// AGUARDANDO DADOS...'], freqData: [] };
  }

  const facts: string[] = [];
  const hasLetters = /[A-Za-z]/.test(clean);
  const hasNumbers = /[0-9]/.test(clean);
  const hasSpecial = /[^A-Za-z0-9\s]/.test(clean);
  const isHexRange = /^[0-9A-Fa-f\s]+$/.test(clean);
  const isBinaryRange = /^[01\s]+$/.test(clean);

  if (isBinaryRange) {
    facts.push('• ALFABETO: Binário estrito (2 estados).');
  } else if (isHexRange && hasNumbers) {
    facts.push('• ALFABETO: Hexadecimal (0-9, A-F).');
  } else if (hasLetters && !hasNumbers && !hasSpecial) {
    facts.push('• ALFABETO: Apenas alfabético (A-Z).');
  } else if (hasLetters && hasNumbers) {
    facts.push('• ALFABETO: Alfanumérico misto.');
  } else if (!hasLetters && !hasNumbers) {
    facts.push('• ALFABETO: Apenas símbolos/pontuação.');
  } else {
    facts.push('• ALFABETO: Misto / não categórico.');
  }

  const noSpaces = clean.replace(/\s+/g, '');
  facts.push(`• COMPRIMENTO: ${noSpaces.length} caracteres (sem espaços).`);
  facts.push(`• BLOCO COM ESPAÇOS: ${clean.split(/\s+/).length} tokens separados por espaços.`);

  if (clean.endsWith('=')) {
    facts.push('• ESTRUTURA: Padding terminal "=" detectado (comum em Base64).');
  }

  const dotDashCount = (clean.match(/[.-]/g) || []).length;
  const nonSpaceCount = noSpaces.length || 1;
  if (dotDashCount > nonSpaceCount * 0.5) {
    facts.push('• ESTRUTURA: Alta densidade de pontos/traços — formato compatível com Morse.');
  }

  const punctCount = (clean.match(/[^A-Za-z0-9\s]/g) || []).length;
  if (punctCount > noSpaces.length * 0.3) {
    facts.push('• ESTRUTURA: Alta presença de símbolos/pontuação.');
  }

  const lettersOnly = (clean.match(/[A-Za-z]/g) || []).join('');
  if (lettersOnly) {
    const upper = (lettersOnly.match(/[A-Z]/g) || []).length;
    const lower = (lettersOnly.match(/[a-z]/g) || []).length;
    facts.push(`• CASO: ${upper} maiúsculas / ${lower} minúsculas (na porção alfabética).`);
    const uniqueLetters = new Set(lettersOnly.toUpperCase().split('')).size;
    facts.push(`• VARIABILIDADE: ${uniqueLetters} letras distintas (alfabeto aparente).`);
  }

  const freqMap: Record<string, number> = {};
  for (const ch of noSpaces) {
    freqMap[ch] = (freqMap[ch] || 0) + 1;
  }
  const freqSorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const totalChars = Math.max(1, noSpaces.length);
  const freqData: FreqItem[] = freqSorted.map(([ch, count]) => ({
    char: ch,
    count,
    pct: Math.round((count / totalChars) * 100),
  }));

  if (freqSorted.length) {
    facts.push('• FREQUÊNCIA (top): ' + freqSorted.map(([c, n]) => `${c}:${n}`).join(', '));
  }

  const uniq = Object.keys(freqMap).length;
  const entropyEst = Math.round((uniq / Math.max(1, noSpaces.length)) * 100) / 100;
  facts.push(`• ENTROPIA ESTIMADA: ${entropyEst} (0-baixa .. 1-alta).`);

  return { facts, freqData };
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
  const [showAnalysis, setShowAnalysis] = useState(false);
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
  const patternAnalysis = useMemo(
    () => (showAnalysis ? analyzePatternData(input) : { facts: [], freqData: [] }),
    [showAnalysis, input]
  );

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
          className={`decoder-codes-toggle ${showAnalysis ? 'active' : ''}`}
          onClick={() => setShowAnalysis((v) => !v)}
          title="Análise estatística e frequência de caracteres"
        >
          <BarChart3 size={14} /> Frequência
        </button>
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
              <div className="decoder-hint-banner">
                <span>
                  <Sparkles size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                  Análise C.R.I.S.: {formatHint.reason}
                </span>
                <button
                  type="button"
                  className="decoder-hint-btn"
                  onClick={() => setMode(formatHint.mode)}
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
                  className={`decoder-bruteforce-btn ${showBruteForce ? 'active' : ''}`}
                  onClick={() => setShowBruteForce((v) => !v)}
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

            {showAnalysis && (
              <div className="decoder-analysis-panel">
                <div className="freq-table-title">RELATÓRIO ESTATÍSTICO & FREQUÊNCIA</div>
                <div className="analysis-box technical">
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{patternAnalysis.facts.join('\n')}</pre>
                </div>
                {patternAnalysis.freqData.length > 0 && (
                  <div className="freq-table-container">
                    <div className="freq-table-title">DISTRIBUIÇÃO DE FREQUÊNCIAS</div>
                    <div className="freq-table-grid">
                      {patternAnalysis.freqData.map((item) => (
                        <div key={item.char} className="freq-table-card">
                          <div className="freq-char-badge">{item.char === ' ' ? 'SPACE' : item.char}</div>
                          <div className="freq-char-stats">
                            <span className="freq-pct">{item.pct}%</span>
                            <span className="freq-count">({item.count}x)</span>
                          </div>
                          <div className="freq-bar-bg">
                            <div className="freq-bar-fill" style={{ width: `${Math.min(100, item.pct * 2.5)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
