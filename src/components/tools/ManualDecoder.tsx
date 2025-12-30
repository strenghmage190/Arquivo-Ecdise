import React, { useState } from 'react';
import './ManualDecoder.css';

interface AlgoDef {
  id: string;
  label: string;
  needsKey?: boolean;
  keyType?: 'number' | 'text';
  placeholder?: string;
}

const ALGOS: AlgoDef[] = [
  { id: 'caesar', label: 'CÉSAR (ROT)', needsKey: true, keyType: 'number', placeholder: 'Nº do Deslocamento (Shift)' },
  { id: 'atbash', label: 'ATBASH (Invertido)' },
  { id: 'vigenere', label: 'VIGENÈRE', needsKey: true, keyType: 'text', placeholder: 'Palavra-Chave' },
  { id: 'binary', label: 'BINÁRIO (Base 2)' },
  { id: 'hex', label: 'HEXADECIMAL (Base 16)' },
  { id: 'base64', label: 'BASE64' },
  { id: 'morse', label: 'MORSE' },
  { id: 'a1z26', label: 'A1Z26 (1=A,2=B)' }
];

export default function ManualDecoder() {
  const [input, setInput] = useState('');
  const [analysis, setAnalysis] = useState('');
  const [algo, setAlgo] = useState<string | null>(null);
  const [key, setKey] = useState('');
  const [output, setOutput] = useState('');

  const analyzePattern = () => {
    const raw = input || '';
    const clean = raw.trim();
    if (!clean) {
      setAnalysis('// AGUARDANDO DADOS...');
      return;
    }

    const facts: string[] = [];

    // Alphabet composition
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

    // Structural
    const noSpaces = clean.replace(/\s+/g, '');
    facts.push(`• COMPRIMENTO: ${noSpaces.length} caracteres (sem espaços).`);
    facts.push(`• BLOCO COM ESPAÇOS: ${clean.split(/\s+/).length} tokens separadas por espaços.`);

    if (clean.endsWith('=')) facts.push('• ESTRUTURA: Padding terminal "=" detectado (comum em Base64).');

    // Morse-like (dots/dashes)
    const dotDashCount = (clean.match(/[\.\-]/g) || []).length;
    const nonSpaceCount = clean.replace(/\s+/g, '').length || 1;
    if (dotDashCount > nonSpaceCount * 0.5) {
      facts.push('• ESTRUTURA: Alta densidade de pontos/traços — formato compatível com Morse.');
    }

    // Punctuation ratio
    const punctCount = (clean.match(/[^A-Za-z0-9\s]/g) || []).length;
    if (punctCount > noSpaces.length * 0.3) {
      facts.push('• ESTRUTURA: Alta presença de símbolos/pontuação.');
    }

    // Letter case and repetition
    const lettersOnly = (clean.match(/[A-Za-z]/g) || []).join('');
    if (lettersOnly) {
      const upper = (lettersOnly.match(/[A-Z]/g) || []).length;
      const lower = (lettersOnly.match(/[a-z]/g) || []).length;
      facts.push(`• CASO: ${upper} maiúsculas / ${lower} minúsculas (na porção alfabética).`);
      const uniqueLetters = new Set(lettersOnly.toUpperCase().split('')).size;
      facts.push(`• VARIABILIDADE: ${uniqueLetters} letras distintas (alfabeto aparente).`);
    }

    // Character frequency (top 5)
    const freqMap: Record<string, number> = {};
    for (const ch of noSpaces) {
      freqMap[ch] = (freqMap[ch] || 0) + 1;
    }
    const freqSorted = Object.entries(freqMap).sort((a, b) => b[1] - a[1]).slice(0, 6);
    if (freqSorted.length) {
      facts.push('• FREQUÊNCIA (top): ' + freqSorted.map(([c, n]) => `${c}:${n}`).join(', '));
    }

    // Entropy-ish heuristic
    const uniq = Object.keys(freqMap).length;
    const entropyEst = Math.round((uniq / Math.max(1, noSpaces.length)) * 100) / 100;
    facts.push(`• ENTROPIA ESTIMADA: ${entropyEst} (0-baixa .. 1-alta).`);

    setAnalysis(facts.join('\n'));
    setOutput('');
  };

  const handleDecrypt = () => {
    // Keep this primitive and explicit: the user can choose an algo and attempt decode.
    // We don't auto-identify algorithms. Implement minimal safe attempts for a few algorithms.
    if (!input || !algo) return;
    try {
      let res = '';
      const trimmed = input.trim();
      switch (algo) {
        case 'base64':
          try { res = atob(trimmed); } catch (e) { res = '// Falha: entrada inválida para Base64'; }
          break;
        case 'hex':
          try {
            const s = trimmed.replace(/\s+/g, '');
            res = decodeURIComponent(s.replace(/([0-9A-Fa-f]{2})/g, '%$1'));
          } catch (e) { res = '// Falha: entrada inválida para Hex'; }
          break;
        case 'binary':
          try {
            const bits = trimmed.replace(/\s+/g, '');
            const chunks = bits.match(/.{1,8}/g) || [];
            res = chunks.map(b => String.fromCharCode(parseInt(b, 2))).join('');
          } catch (e) { res = '// Falha: entrada inválida para Binário'; }
          break;
        case 'morse':
          try {
            const MORSE: Record<string,string> = { '.-':'A','-...':'B','-.-.':'C','-..':'D','.':'E','..-.':'F','--.':'G','....':'H','..':'I','.---':'J','-.-':'K','.-..':'L','--':'M','-.':'N','---':'O','.--.':'P','--.-':'Q','.-.':'R','...':'S','-':'T','..-':'U','...-':'V','.--':'W','-..-':'X','-.--':'Y','--..':'Z','/':' '};
            res = trimmed.split(' ').map(t => MORSE[t] || '?').join('');
          } catch (e) { res = '// Falha: entrada inválida para Morse'; }
          break;
        default:
          res = '// ERRO: ALGORITMO NÃO IMPLEMENTADO NESTA FERRAMENTA.';
      }
      setOutput(res);
    } catch (e) {
      setOutput('// ERRO INTERNO AO TENTAR DECODIFICAR');
    }
  };

  const currentAlgo = ALGOS.find(a => a.id === algo) || null;

  return (
    <div className="manual-decoder-panel">
      <div className="md-header">TERMINAL DE DECIFRAGEM</div>

      <div className="md-section">
        <label>DADOS DE ENTRADA (Cole aqui)</label>
        <textarea value={input} onChange={e => setInput(e.target.value)} rows={4} placeholder="Cole o texto a ser analisado" />
        <div style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn-action" onClick={analyzePattern}>🔍 GERAR RELATÓRIO ESTATÍSTICO</button>
          <div style={{ color: '#888', fontSize: 12 }}>Relatório técnico e frio — sem sugestões de solução.</div>
        </div>
      </div>

      <div className="md-section">
        <div className="md-subhead">SELECIONE FERRAMENTA (opcional)</div>
        <div className="algo-grid">
          {ALGOS.map(a => (
            <button
              key={a.id}
              className={algo === a.id ? 'algo-btn active' : 'algo-btn'}
              onClick={() => { setAlgo(a.id); setKey(''); setOutput(''); }}
            >{a.label}</button>
          ))}
        </div>

        {currentAlgo?.needsKey && (
          <div className="key-config-area">
            <label className="key-label">CHAVE DECRIPTOGRÁFICA</label>
            <input className="key-input" type={currentAlgo.keyType === 'number' ? 'number' : 'text'} value={key} onChange={e => setKey(e.target.value)} placeholder={currentAlgo.placeholder} />
          </div>
        )}

        <div style={{ marginTop: 8 }}>
          <button className="btn-process" onClick={handleDecrypt} disabled={!algo || !input}>⚙️ EXECUTAR ROTINA DE TRADUÇÃO</button>
        </div>
      </div>

      <div className="md-section result">
        <label>RESULTADO DO SCANNER:</label>
        <div className={"analysis-box technical"}>
          {analysis ? <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{analysis}</pre> : <div className="empty">// AGUARDANDO RELATÓRIO...</div>}
        </div>
      </div>

      <div className="md-section result">
        <label>SAÍDA DE DADOS</label>
        <div className={"output-display" + (!output ? ' empty' : '')}>{output || '// NENHUM DADO PROCESSADO'}</div>
      </div>
    </div>
  );
}
