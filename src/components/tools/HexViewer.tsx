import React, { useEffect, useRef, useState } from 'react';
import './HexViewer.css';

interface Props {
  hiddenMessage?: string;
  focused?: boolean;
  onSendToDecoder?: (text: string) => void;
}

export default function HexViewer({ hiddenMessage = '', focused = false, onSendToDecoder }: Props) {
  const [content, setContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const dataMarkerRef = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    const generateHex = () => {
      let hex = '';
      const possible = '0123456789ABCDEF';
      for (let i = 0; i < 800; i++) {
        hex += possible.charAt(Math.floor(Math.random() * possible.length));
        if (i % 2 === 1) hex += ' ';
        if (i % 16 === 15) hex += '\n';
      }
      return hex;
    };

    const rawData = generateHex();
    setContent(rawData);
  }, [hiddenMessage]);

  useEffect(() => {
    if ((focused || hiddenMessage) && dataMarkerRef.current) {
      try {
        dataMarkerRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
      } catch {
        // ignore in jsdom
      }
    }
  }, [focused, hiddenMessage, content]);

  const handleCopy = async () => {
    const textToCopy = hiddenMessage || content;
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // fallback
      try {
        const ta = document.createElement('textarea');
        ta.value = textToCopy;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      } catch {
        // ignore
      }
    }
  };

  const mid = Math.floor(content.length / 2);
  const before = content.slice(0, mid);
  const after = content.slice(mid);

  return (
    <div className="hex-viewer" ref={viewerRef} style={{ ['--hex-height' as any]: '300px' }}>
      <div className="hex-header-bar">
        <div className="hex-title">VISUALIZADOR HEXADECIMAL v1.0</div>
        <div className="hex-actions">
          <button
            type="button"
            className="hex-action-btn"
            onClick={handleCopy}
            title="Copiar mensagem ou conteúdo hex"
          >
            {copied ? '✓ Copiado' : '📋 Copiar Mensagem / Hex'}
          </button>
          {onSendToDecoder && (hiddenMessage || content) && (
            <button
              type="button"
              className="hex-action-btn primary"
              onClick={() => onSendToDecoder(hiddenMessage || content)}
              title="Enviar para o Universal Decoder"
            >
              🔐 Decoder
            </button>
          )}
        </div>
      </div>
      <div className="hex-content">
        {before}
        {hiddenMessage ? (
          <span ref={dataMarkerRef} className="hex-hidden">
            {`\n000F4A0 [DATA]: ${hiddenMessage} [END]\n`}
          </span>
        ) : null}
        {after}
      </div>
    </div>
  );
}
