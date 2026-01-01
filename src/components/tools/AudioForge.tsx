import React from 'react';

interface Props {
  spectrogramUrl?: string | null;
  triggerTime?: number;
  onClose: () => void;
  onSave: (file: File) => void;
}

export default function AudioForge({ spectrogramUrl, triggerTime, onClose, onSave }: Props) {
  const handleSave = () => {
    const blob = new Blob(['stub audio forge content'], { type: 'audio/wav' });
    const file = new File([blob], 'audio_forge_stub.wav', { type: 'audio/wav' });
    onSave(file);
  };

  return (
    <div style={{ background: '#0b1220', color: '#fff', padding: 20, borderRadius: 8 }}>
      <h3>Audio Forge (stub)</h3>
      <p style={{ color: '#9aa' }}>Spectrogram: {spectrogramUrl ? 'loaded' : 'none'}</p>
      <p style={{ color: '#9aa' }}>Trigger: {triggerTime ?? 0}s</p>
      <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
        <button onClick={onClose} style={{ padding: '8px 12px' }}>Fechar</button>
        <button onClick={handleSave} style={{ padding: '8px 12px' }}>Salvar (stub)</button>
      </div>
    </div>
  );
}
