import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import MysteryImage from '../board/MysteryImage';
import HackingTerminal from '../tools/HackingTerminal';
import AudioDecrypter from '../tools/AudioDecrypter';
import './InspectionModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  onEdit?: () => void;
  isGameMaster: boolean;
}

export default function InspectionModal({ isOpen, onClose, card, onEdit, isGameMaster }: Props) {
  const isCardLocked = (c: any) => {
    const v = c?.is_locked;
    if (v === true || v === 1) return true;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === 'true' || s === 't' || s === '1';
    }
    // If a lock_password exists, treat the card as locked for safety
    if (c?.lock_password) return true;
    return false;
  };

  const [isUnlocked, setIsUnlocked] = useState(!isCardLocked(card) || isGameMaster);

  React.useEffect(() => {
    setIsUnlocked(!isCardLocked(card) || isGameMaster);
  }, [card, isGameMaster]);

  const [localUV, setLocalUV] = useState(false);
  const [localThermal, setLocalThermal] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  const fileRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      // Debug: show card payload when opening modal to inspect lock fields
      console.debug('InspectionModal opened for card:', card);
      // ensure the page and modal scroll positions are reset so content is visible and centered
      setTimeout(() => {
        try {
          window.scrollTo(0, 0);
          fileRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
          const visual = fileRef.current?.querySelector('.inspect-visual-area') as HTMLElement | null;
          visual?.scrollTo?.(0, 0);
        } catch (e) {
          // ignore
        }
      }, 0);
    }
  }, [isOpen]);

  // Lock body scroll while the modal is open and focus the modal for accessibility
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // focus the modal container so screen readers and keyboard users land inside it
      setTimeout(() => { fileRef.current?.focus(); }, 0);
    } else {
      document.body.style.overflow = prevOverflow;
    }
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

  if (!isOpen || !card) return null;

  const modal = (
    <div className="inspect-backdrop" onClick={onClose}>
      <div
        className="inspect-file"
        ref={fileRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-title"
        tabIndex={-1}
      >
        {/* Header: hide metadata and action buttons when locked; keep only close button so user can exit */}
        <div className="inspect-header">
          {(!isCardLocked(card) || isUnlocked || isGameMaster) ? (
            <>
              <div className="meta-info">
                <span className="case-stamp">EVIDÊNCIA #{String(card.id || '').slice(0, 4)}</span>
                {card.metadata?.type && <span className="type-tag">{card.metadata.type}</span>}
              </div>
              <div className="actions">
                {card.audio_url && <span style={{fontSize:12, color:'#b33', marginRight:8}}>🔊 ÁUDIO ANEXADO</span>}

                <button onClick={() => setShowFilters(!showFilters)} className={`btn-uv-toggle ${showFilters ? 'active' : ''}`}>
                  🧪 TRATAR IMAGEM
                </button>

                <button
                  className={`btn-uv-toggle ${localUV ? 'active' : ''}`}
                  onClick={() => setLocalUV(!localUV)}
                >
                  {localUV ? 'DESLIGAR LUZ UV' : '🔦 LIGAR LUZ UV'}
                </button>

                <button
                  className={`btn-uv-toggle ${localThermal ? 'active' : ''}`}
                  onClick={() => setLocalThermal(!localThermal)}
                  title="Visão Térmica"
                >
                  {localThermal ? 'DESLIGAR TERMAL' : '🌡️ SCANNER TERMAL'}
                </button>

                <button className="btn-close" onClick={onClose}>✖</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn-close" onClick={onClose}>✖</button>
            </div>
          )}
        </div>

        {/* --- CONTEÚDO PRINCIPAL --- */}
        {!isUnlocked ? (
          <div style={{ flex: 1, display: 'flex', background: '#000' }}>
            <HackingTerminal
              correctPassword={card.lock_password}
              onUnlock={() => setIsUnlocked(true)}
              hint={card.description_public}
            />
          </div>
        ) : (
          <>
            <div className="inspect-visual-area" style={{ position: 'relative' }}>
              {card.image_url ? (
                <MysteryImage
                  baseSrc={card.image_url}
                  hiddenSrc={card.image_uv_url}
                  filterLayerSrc={card.image_filter_layer}
                  filters={{ brightness, contrast, saturate: saturation }}
                  revealTarget={card?.metadata?.image_filter_reveal}
                  isUVMode={localUV}
                  fit="contain"
                  className="large-evidence-img"
                  style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
                />
              ) : (
                <div className="no-image-placeholder">SEM REGISTRO VISUAL</div>
              )}

              {showFilters && (
                <div className="filters-overlay-panel">
                  <div className="filter-row">
                    <label>BRILHO {brightness}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>CONTRASTE {contrast}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>SATURAÇÃO {saturation}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
                    </div>
                  </div>
                  <button className="btn-reset-filters" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>RESET</button>
                </div>
              )}

              {localThermal && (
                <div className="thermal-overlay" aria-hidden />
              )}

              {card.audio_url && (
                <div className="audio-overlay-panel">
                  <AudioDecrypter
                    baseAudio={card.audio_url}
                    hiddenAudio={card.audio_hidden_url}
                    targetFreq={card.audio_target_freq || 50}
                  />
                </div>
              )}
            </div>

            <div className="inspect-details">
              <div className="text-col">
                <h2 id="inspection-title">{card.title}</h2>
                <p className="public-desc">{card.description_public || 'Sem descrição disponível.'}</p>

                {isGameMaster && card.description_hidden && (
                  <div className="gm-note">
                    <strong>NOTAS DO MESTRE:</strong>
                    <p>{card.description_hidden}</p>
                  </div>
                )}
              </div>

              <div className="controls-col">
                {isGameMaster && (
                  <button className="btn-edit-ref" onClick={() => { onClose(); onEdit && onEdit(); }}>
                    ✎ EDITAR DADOS
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
