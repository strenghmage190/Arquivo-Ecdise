import React, { useEffect, useState } from 'react';
import './HexViewer.css';

interface Props {
  hiddenMessage?: string;
}

interface HexRow {
  offset: string;
  bytes: string[];
  ascii: string;
}

export default function HexViewer({ hiddenMessage = '' }: Props) {
  const [rows, setRows] = useState<HexRow[]>([]);
  const [bytesPerRow, setBytesPerRow] = useState<number>(16);

  useEffect(() => {
    const checkOrientation = () => {
      // 8 bytes in portrait mobile (< 640px), 16 in landscape / desktop
      if (window.innerWidth < 640) {
        setBytesPerRow(8);
      } else {
        setBytesPerRow(16);
      }
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    return () => window.removeEventListener('resize', checkOrientation);
  }, []);

  useEffect(() => {
    // Generate pseudo-random bytes or inject hiddenMessage
    const totalBytes = 256;
    const rawBytes: number[] = [];
    for (let i = 0; i < totalBytes; i++) {
      rawBytes.push(Math.floor(Math.random() * 256));
    }

    if (hiddenMessage) {
      const msgBytes: number[] = [];
      const prefix = '[DATA]: ';
      const suffix = ' [END]';
      const fullText = prefix + hiddenMessage + suffix;
      for (let i = 0; i < fullText.length; i++) {
        msgBytes.push(fullText.charCodeAt(i));
      }
      const insertAt = Math.min(64, Math.max(0, totalBytes - msgBytes.length - 16));
      for (let i = 0; i < msgBytes.length && (insertAt + i) < rawBytes.length; i++) {
        rawBytes[insertAt + i] = msgBytes[i];
      }
    }

    const calculatedRows: HexRow[] = [];
    for (let i = 0; i < rawBytes.length; i += bytesPerRow) {
      const slice = rawBytes.slice(i, i + bytesPerRow);
      const offset = i.toString(16).toUpperCase().padStart(8, '0');
      const hexList: string[] = slice.map(b => b.toString(16).toUpperCase().padStart(2, '0'));
      const ascii = slice.map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.')).join('');
      calculatedRows.push({ offset, bytes: hexList, ascii });
    }

    setRows(calculatedRows);
  }, [hiddenMessage, bytesPerRow]);

  return (
    <div className="hex-viewer" style={{ ['--hex-height' as any]: '300px' }}>
      <div className="hex-title">
        VISUALIZADOR HEXADECIMAL v2.0 ({bytesPerRow} BYTES/LINHA)
      </div>
      <div className="hex-table" role="table" aria-label="Hex Dump">
        <div className="hex-table-header" role="row">
          <span className="hex-col-offset">OFFSET</span>
          <span className="hex-col-bytes">HEX</span>
          <span className="hex-col-ascii">ASCII</span>
        </div>
        <div className="hex-table-body">
          {rows.map((row) => (
            <div className="hex-row" key={row.offset} role="row">
              <span className="hex-col-offset">{row.offset}</span>
              <span className="hex-col-bytes">
                {row.bytes.map((byte, idx) => (
                  <span key={idx} className="hex-byte">{byte}</span>
                ))}
              </span>
              <span className="hex-col-ascii">{row.ascii}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
