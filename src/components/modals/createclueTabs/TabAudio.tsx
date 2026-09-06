import React from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Music } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabAudio() {
  const { mediaState, setMediaState } = useClueModal();

  return (
    <div className="cc-tab-content">
      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Áudio Base
          <span data-tooltip-id="base-audio-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-text-muted, #666)" />
          </span>
        </h3>
        <Tooltip id="base-audio-tip" className="cyber-tooltip">
          O áudio principal que será reproduzido quando a pista for analisada.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)', marginBottom: 8 }}>
          {mediaState.audioBasePreview ? (
            <span style={{ color: '#00ff00' }}>[ ✓ ] Áudio Base carregado.</span>
          ) : (
            <span>[ - ] Nenhum áudio base.</span>
          )}
        </p>
        <button
          className={mediaState.audioBasePreview ? "cc-btn cc-btn-save" : "cc-btn cc-btn-cancel"}
          style={{ width: '100%', justifyContent: 'center' }}
          onClick={() => {
            // Placeholder para abrir o AudioLab para Áudio Base
          }}
        >
          <Music size={16} /> Abrir AudioLab (Base)
        </button>
      </div>

      <hr className="cc-divider" />

      <div className="cc-section-header">
        <h3 className="cc-section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          Áudio Oculto (Esteganografia)
          <span data-tooltip-id="hidden-audio-tip" style={{ cursor: 'help' }}>
            <Info size={16} color="var(--nexus-neon, #00ffff)" />
          </span>
        </h3>
        <Tooltip id="hidden-audio-tip" className="cyber-tooltip">
          <span className="cyber-tooltip-title">[ AUDIO FORGE ]</span>
          Oculte frequências, senhas ou imagens dentro do espectrograma. O áudio oculto será revelado apenas quando analisado no modo Espectrograma.
        </Tooltip>
      </div>

      <div style={{ marginBottom: 16 }}>
        <p style={{ fontSize: 13, color: 'var(--cc-text-muted)', marginBottom: 8 }}>
          {mediaState.audioHiddenPreview ? (
            <span style={{ color: '#00ff00' }}>[ ✓ ] Áudio Oculto carregado.</span>
          ) : (
            <span>[ - ] Nenhum áudio oculto.</span>
          )}
        </p>
        <button
          className={mediaState.audioHiddenPreview ? "cc-btn cc-btn-save" : "cc-btn cc-btn-cancel"}
          style={{ width: '100%', justifyContent: 'center' }}
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
