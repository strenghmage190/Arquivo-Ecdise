import React, { useEffect } from 'react';
import './SecureFrameViewer.css';

interface SecureFrameViewerProps {
  imageUrl: string;
  title?: string;
  onClose: () => void;
}

export default function SecureFrameViewer({ 
  imageUrl, 
  title = "REGISTRO DE EVIDÊNCIA", 
  onClose 
}: SecureFrameViewerProps) {

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="secure-frame-overlay" onClick={onClose}>
      <div className="secure-frame-panel" onClick={(e) => e.stopPropagation()}>
        <div className="frame-border-glow" />
        <div className="frame-corner-brackets" />

        <div className="frame-header">
          <div className="header-title">
            <span className="title-indicator" />
            {title}
          </div>
          <button className="frame-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="frame-content">
          <img src={imageUrl} alt="Evidência" />
        </div>

        <div className="frame-grid-footer" />
      </div>
    </div>
  );
}
