import React from 'react';

interface Props {
  spectrogramUrl?: string | null;
  onClose?: () => void;
}

export default function AudioDecrypter({ spectrogramUrl, onClose }: Props) {
  return (
    <div style={{ background: '#071018', color: '#fff', padding: 16, borderRadius: 8 }}>
      <h3>Audio Decrypter (stub)</h3>
      <p style={{ color: '#9aa' }}>Spectrogram: {spectrogramUrl ? 'available' : 'none'}</p>
      <div style={{ marginTop: 8 }}>
        <button onClick={onClose} style={{ padding: '6px 10px' }}>Fechar</button>
      </div>
    </div>
  );
}
