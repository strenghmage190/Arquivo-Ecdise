import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Music } from 'lucide-react';

export default function TabAudio() {
  const { mediaState, setMediaState } = useClueModal();

  return (
    <div className="field-block">
      <span className="field-title">
        CONFIGURAÇÕES DE ÁUDIO
        <Info size={16} color="#666" style={{ marginLeft: 8 }} />
      </span>

      <div style={{ marginTop: 16 }}>
        <h4 style={{ color: 'var(--cc-text)', marginBottom: 12 }}>Áudio Base</h4>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)' }}>
          {mediaState.audioBasePreview ? (
            <span style={{ color: '#00ff00' }}>[ ✓ ] Áudio Base carregado.</span>
          ) : (
            <span>[ - ] Nenhum áudio base.</span>
          )}
        </p>
        <button
          className="cc-btn cc-btn-cancel"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => {
            // Placeholder para abrir o AudioLab para Áudio Base
            // Na integração final, setamos setShowAudioForgeFor('base')
          }}
        >
          <Music size={16} /> Abrir AudioLab (Base)
        </button>
      </div>

      <div style={{ marginTop: 24 }}>
        <h4 style={{ color: 'var(--cc-text)', marginBottom: 12 }}>Áudio Oculto</h4>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)' }}>
          {mediaState.audioHiddenPreview ? (
            <span style={{ color: '#00ff00' }}>[ ✓ ] Áudio Oculto carregado.</span>
          ) : (
            <span>[ - ] Nenhum áudio oculto.</span>
          )}
        </p>
        <button
          className="cc-btn cc-btn-cancel"
          style={{ width: '100%', marginTop: 8 }}
          onClick={() => {
            // Placeholder para abrir o AudioLab para Áudio Oculto
          }}
        >
          <Music size={16} /> Abrir AudioLab (Oculto)
        </button>
      </div>
    </div>
  );
}
