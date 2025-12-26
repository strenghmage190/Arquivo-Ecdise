import React, { useState } from 'react';
import MysteryImage from '../board/MysteryImage';
import './InspectionModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  onEdit?: () => void;
  isGameMaster: boolean;
}

export default function InspectionModal({ isOpen, onClose, card, onEdit, isGameMaster }: Props) {
  const [localUV, setLocalUV] = useState(false);
  const fileRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
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

  if (!isOpen || !card) return null;

  return (
    <div className="inspect-backdrop" onClick={onClose}>
      <div className="inspect-file" ref={fileRef} onClick={(e) => e.stopPropagation()}>
        <div className="inspect-header">
          <div className="meta-info">
            <span className="case-stamp">EVIDÊNCIA #{String(card.id || '').slice(0, 4)}</span>
            {card.metadata?.type && <span className="type-tag">{card.metadata.type}</span>}
          </div>
          <div className="actions">
            <button
              className={`btn-uv-toggle ${localUV ? 'active' : ''}`}
              onClick={() => setLocalUV(!localUV)}
            >
              {localUV ? 'DESLIGAR LUZ UV' : '🔦 LIGAR LUZ UV'}
            </button>
            <button className="btn-close" onClick={onClose}>✖</button>
          </div>
        </div>

        <div className="inspect-visual-area">
          {card.image_url ? (
            <MysteryImage
              baseSrc={card.image_url}
              hiddenSrc={card.image_uv_url}
              isUVMode={localUV}
              fit="contain"
              className="large-evidence-img"
              style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
            />
          ) : (
            <div className="no-image-placeholder">SEM REGISTRO VISUAL</div>
          )}
        </div>

        <div className="inspect-details">
          <div className="text-col">
            <h2>{card.title}</h2>
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
      </div>
    </div>
  );
}
