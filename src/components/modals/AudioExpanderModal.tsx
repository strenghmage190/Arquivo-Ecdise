import React, { useState } from 'react';
import AdvancedAudioLab from '../tools/AdvancedAudioLab';
import './AudioExpanderModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  audioSrc: string;
  audioHidden?: string | null;
  triggerTime?: number;
  title?: string;
}

export default function AudioExpanderModal({ 
  isOpen, 
  onClose, 
  audioSrc, 
  audioHidden, 
  triggerTime,
  title = 'ANALISADOR ESPECTRAL'
}: Props) {
  console.log('🎵 AudioExpanderModal render:', { isOpen, audioSrc });
  
  if (!isOpen) return null;

  return (
    <div className="audio-expander-backdrop" onClick={onClose}>
      <div className="audio-expander-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="audio-expander-header">
          <div className="audio-expander-title">🎙️ {title}</div>
          <button 
            className="audio-expander-close" 
            onClick={onClose}
            title="Fechar (ESC)"
          >
            ✕
          </button>
        </div>

        {/* Content - Audio Lab em tela cheia */}
        <div className="audio-expander-content">
          <AdvancedAudioLab 
            baseSrc={audioSrc}
            hiddenSrc={audioHidden}
            triggerTime={triggerTime}
          />
        </div>
      </div>
    </div>
  );
}
