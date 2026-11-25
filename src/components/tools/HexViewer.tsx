import React, { useMemo, useState } from 'react';
import { Check, Copy, Search } from 'lucide-react';
import './HexViewer.css';

interface Props {
  hiddenMessage?: string;
  xorKey?: string;
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
  return Math.floor((x - Math.floor(x)) * 256);
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export default function HexViewer({ hiddenMessage = '', xorKey }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  const { rows, fullHexText, matchedHexText } = useMemo(() => {
    const encoder = new TextEncoder();
    const rawEncoded = hiddenMessage ? encoder.encode(hiddenMessage) : new Uint8Array(0);
    const keyBytes = xorKey ? encoder.encode(xorKey) : new Uint8Array(0);
    const payload = new Uint8Array(rawEncoded.length);
    for (let i = 0; i < rawEncoded.length; i++) {
      payload[i] = keyBytes.length > 0 ? rawEncoded[i] ^ keyBytes[i % keyBytes.length] : rawEncoded[i];
    }

    const totalBytes = Math.max(512, Math.ceil((payload.length + 96) / 16) * 16);
    const bytes = new Uint8Array(totalBytes);
    // Realistic PNG-like header at 0x0000
    const header = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52];
    for (let i = 0; i < totalBytes; i++) {
      bytes[i] = i < header.length ? header[i] : deterministicByte(i + hiddenMessage.length * 7);
    }

    // Embed payload at a deterministic non-fixed offset derived from message + key
    if (payload.length > 0) {
      const minOffset = 0x0020;
      const maxOffset = Math.max(minOffset, totalBytes - payload.length - 8);
      const span = maxOffset - minOffset + 1;
      const embedStart = minOffset + (hashString(`${hiddenMessage}:${xorKey || ''}`) % span);
      for (let i = 0; i < payload.length && embedStart + i < totalBytes; i++) {
        bytes[embedStart + i] = payload[i];
      }
    }

    const q = searchQuery.trim().toLowerCase();
    const outRows: DumpRow[] = [];
    const hexLines: string[] = [];
    const matchedLines: string[] = [];

    for (let offset = 0; offset < totalBytes; offset += 16) {
      const slice = bytes.slice(offset, offset + 16);
      const hexBytes = Array.from(slice, (b) => b.toString(16).padStart(2, '0').toUpperCase());
      const ascii = Array.from(slice, (b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      const hexStr = hexBytes.join(' ');
      const offsetStr = `0x${offset.toString(16).padStart(4, '0').toUpperCase()}`;
      const isMatch = Boolean(q && (ascii.toLowerCase().includes(q) || hexStr.toLowerCase().includes(q)));
      outRows.push({ offset: offsetStr, hexBytes, ascii, isMatch });
      const line = `${offsetStr}  ${hexStr}  |${ascii}|`;
      hexLines.push(line);
      if (isMatch) matchedLines.push(hexStr);
    }

    return {
      rows: outRows,
      fullHexText: hexLines.join('\n'),
      matchedHexText: matchedLines.join(' '),
    };
  }, [hiddenMessage, xorKey, searchQuery]);

  const handleCopy = async () => {
    const textToCopy = matchedHexText || fullHexText;
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
          <div className="hex-search-box">
            <Search size={12} color="#94a3b8" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar ASCII ou Hex..."
            />
          </div>
          <button
            type="button"
            className="hex-action-btn"
            onClick={handleCopy}
            title="Copiar bytes encontrados ou dump completo"
          >
            {copied ? <><Check size={13} /> Copiado</> : <><Copy size={13} /> {matchedHexText ? 'Copiar Hex' : 'Copiar Dump'}</>}
          </button>
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
