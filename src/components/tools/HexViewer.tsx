import React, { useMemo, useState } from 'react';
import { Check, Copy, KeyRound, Search } from 'lucide-react';
import './HexViewer.css';

interface Props {
  hiddenMessage?: string;
  focused?: boolean;
  onSendToDecoder?: (text: string) => void;
}

interface DumpRow {
  offset: string;
  hexBytes: string[];
  ascii: string;
  isMatch: boolean;
}

function deterministicByte(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  const val = Math.floor((x - Math.floor(x)) * 256);
  // Keep filler mostly non-printable or fragmented so real ASCII strings stand out on inspection
  return val;
}

export default function HexViewer({ hiddenMessage = '', onSendToDecoder }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const { rows, fullHexText } = useMemo(() => {
    const totalBytes = 512;
    const bytes = new Uint8Array(totalBytes);
    // Realistic PNG-like header at 0x0000
    const header = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52];
    for (let i = 0; i < totalBytes; i++) {
      bytes[i] = i < header.length ? header[i] : deterministicByte(i + hiddenMessage.length * 7);
    }

    // Embed hiddenMessage bytes naturally inside the binary dump at offset 0x00F0
    if (hiddenMessage) {
      const encoded = new TextEncoder().encode(hiddenMessage);
      const embedStart = 0x00f0;
      for (let i = 0; i < encoded.length && embedStart + i < totalBytes; i++) {
        bytes[embedStart + i] = encoded[i];
      }
    }

    const q = searchQuery.trim().toLowerCase();
    const outRows: DumpRow[] = [];
    const hexLines: string[] = [];

    for (let offset = 0; offset < totalBytes; offset += 16) {
      const slice = bytes.slice(offset, offset + 16);
      const hexBytes = Array.from(slice, (b) => b.toString(16).padStart(2, '0').toUpperCase());
      const ascii = Array.from(slice, (b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      const hexStr = hexBytes.join(' ');
      const offsetStr = `0x${offset.toString(16).padStart(4, '0').toUpperCase()}`;
      const isMatch = Boolean(q && (ascii.toLowerCase().includes(q) || hexStr.toLowerCase().includes(q)));
      outRows.push({ offset: offsetStr, hexBytes, ascii, isMatch });
      hexLines.push(`${offsetStr}  ${hexStr}  |${ascii}|`);
    }

    return { rows: outRows, fullHexText: hexLines.join('\n') };
  }, [hiddenMessage, searchQuery]);

  const matchedText = useMemo(() => {
    const matches = rows.filter((r) => r.isMatch);
    if (matches.length > 0) {
      return matches.map((m) => m.ascii.replace(/\.+/g, ' ').trim()).join(' ');
    }
    return '';
  }, [rows]);

  const handleCopy = async () => {
    const textToCopy = matchedText || fullHexText;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="hex-viewer" style={{ ['--hex-height' as any]: '320px' }}>
      <div className="hex-header-bar">
        <div className="hex-title">INSPETOR BINÁRIO (HEX / ASCII)</div>
        <div className="hex-actions" style={{ gap: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#05080d', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 4, padding: '2px 6px' }}>
            <Search size={12} color="#00f3ff" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ASCII ou Hex..."
              style={{ background: 'none', border: 'none', color: '#fff', fontSize: 11, outline: 'none', width: 130 }}
            />
          </div>
          <button
            type="button"
            className="hex-action-btn"
            onClick={handleCopy}
            title="Copiar trecho encontrado ou dump completo"
          >
            {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> {matchedText ? 'Copiar Match' : 'Copiar Dump'}</>}
          </button>
          {onSendToDecoder && (
            <button
              type="button"
              className="hex-action-btn primary"
              disabled={!matchedText}
              onClick={() => matchedText && onSendToDecoder(matchedText)}
              title={matchedText ? 'Enviar trecho encontrado para o Decodificador' : 'Busque um trecho ASCII/Hex primeiro'}
            >
              <KeyRound size={13} /> Enviar Match
            </button>
          )}
        </div>
      </div>

      <div className="hex-content" style={{ fontFamily: 'monospace', fontSize: 11.5, lineHeight: 1.55 }}>
        {rows.map((r) => (
          <div
            key={r.offset}
            style={{
              display: 'grid',
              gridTemplateColumns: '64px 1fr 140px',
              gap: 10,
              padding: '1px 6px',
              background: r.isMatch ? 'rgba(0, 243, 255, 0.16)' : 'transparent',
              color: r.isMatch ? '#8bf7ff' : '#94a3b8',
              borderRadius: 3,
            }}
          >
            <span style={{ color: '#64748b' }}>{r.offset}</span>
            <span>{r.hexBytes.join(' ')}</span>
            <span style={{ color: r.isMatch ? '#ffffff' : '#cbd5e1', letterSpacing: '0.06em' }}>{r.ascii}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
