import React, { useEffect, useState } from 'react';
import './HexViewer.css';

interface Props {
  hiddenMessage?: string;
}

export default function HexViewer({ hiddenMessage = '' }: Props) {
  const [content, setContent] = useState<string>('');

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

    let rawData = generateHex();

    if (hiddenMessage) {
      const insertIndex = Math.floor(rawData.length / 2);
      const prefix = '\n000F4A0 [DATA]: ';
      const suffix = ' [END]\n';
      rawData = rawData.slice(0, insertIndex) + prefix + hiddenMessage + suffix + rawData.slice(insertIndex);
    }

    setContent(rawData);
  }, [hiddenMessage]);

  return (
    <div className="hex-viewer" style={{ ['--hex-height' as any]: '300px' }}>
      <div className="hex-title">VISUALIZADOR HEXADECIMAL v1.0</div>
      <div className="hex-content">{content}</div>
    </div>
  );
}
