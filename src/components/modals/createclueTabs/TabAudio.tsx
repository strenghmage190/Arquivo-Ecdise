import React, { useRef } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import { Info, Music } from 'lucide-react';
import { Tooltip } from 'react-tooltip';

export default function TabAudio() {
  const { mediaState, setMediaState, setEditorState, registerUrl, revokeUrl } = useClueModal();
  const baseAudioRef = useRef<HTMLInputElement>(null);
  const hiddenAudioRef = useRef<HTMLInputElement>(null);

  const handleBaseAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
       revokeUrl(mediaState.audioBasePreview);
       const newUrl = URL.createObjectURL(file);
       registerUrl(newUrl);
       setMediaState(s => ({ ...s, audioBase: file, audioBasePreview: newUrl }));
    }
  };

  const handleHiddenAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
       revokeUrl(mediaState.audioHiddenPreview);
       const newUrl = URL.createObjectURL(file);
       registerUrl(newUrl);
       setMediaState(s => ({ ...s, audioHidden: file, audioHiddenPreview: newUrl }));
    }
  };

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
        <input
          type="file"
          accept="audio/*"
          hidden
          ref={baseAudioRef}
          onChange={handleBaseAudioSelect}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="cc-btn cc-btn-cancel"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => baseAudioRef.current?.click()}
          >
            <Music size={16} /> Selecionar Áudio Base
          </button>
          <button
            className={mediaState.audioBasePreview ? "cc-btn cc-btn-save" : "cc-btn cc-btn-cancel"}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setEditorState(s => ({ ...s, showAudioForgeFor: 'base' }))}
          >
            <Music size={16} /> Abrir AudioLab
          </button>
        </div>
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
        <input
          type="file"
          accept="audio/*"
          hidden
          ref={hiddenAudioRef}
          onChange={handleHiddenAudioSelect}
        />
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            className="cc-btn cc-btn-cancel"
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => hiddenAudioRef.current?.click()}
          >
            <Music size={16} /> Selecionar Áudio Oculto
          </button>
          <button
            className={mediaState.audioHiddenPreview ? "cc-btn cc-btn-save" : "cc-btn cc-btn-cancel"}
            style={{ flex: 1, justifyContent: 'center' }}
            onClick={() => setEditorState(s => ({ ...s, showAudioForgeFor: 'hidden' }))}
          >
            <Music size={16} /> Abrir AudioLab
          </button>
        </div>
      </div>
    </div>
  );
}
