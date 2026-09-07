import { Volume2, Eye, Check, Thermometer, Lock, Video, FileText, Image, Music, MessageSquare, Tag, Link as LinkIcon, HelpCircle, X, FolderOpen, Pencil } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react'
import './EvidenceCard.css'
import EvidenceCardContent from './EvidenceCardContent'

export interface EvidenceCardProps {
  id: string
  image?: string
  hiddenSrc?: string
  title?: string
  isUV?: boolean
  status?: string | null // 'verified' | 'theory' | 'false' | null
  onToggleStatus?: (newStatus: string | null) => void
  onOpen?: () => void
  onEdit?: () => void
  locked?: boolean
  hasRecord?: boolean
  fileType?: 'video' | 'audio' | 'image' | 'text' | 'glitch_puzzle' | 'mega_clue'
  isGameMaster?: boolean
  playerView?: boolean
  hasUV?: boolean
  hasHiddenAudio?: boolean
  hasAudio?: boolean
  hasVideo?: boolean
  hasChat?: boolean
  hasThermal?: boolean
  hasStamp?: boolean
  hasExternalLink?: boolean
  cardType?: 'glitch' | 'mega-clue' | 'encrypted' | 'normal' | 'hidden'
  performanceMode?: boolean
  blurred?: boolean
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ id, image, hiddenSrc, title = 'RELATÓRIO GÊMEOS', isUV = false, status = null, onToggleStatus, onOpen, onEdit, locked = false, hasRecord = false, fileType = 'image', hasUV = false, hasHiddenAudio = false, hasAudio = false, hasVideo = false, hasChat = false, hasThermal = false, hasStamp = false, hasExternalLink = false, isGameMaster = false, playerView = false, cardType = 'normal', performanceMode = false, blurred = false }) => {
  const handleToggle = (s: 'verified' | 'theory' | 'false') => {
    if (!onToggleStatus) return;
    const newStatus = status === s ? null : s;
    onToggleStatus(newStatus);
  }

  const shortId = id ? (String(id).length > 10 ? `${String(id).slice(0, 8)}...` : String(id)) : '';

  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (!hasScanned) setHasScanned(true);
        } else {
          setIsVisible(false);
        }
      });
    }, { rootMargin: '200px', threshold: 0.01 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  let specialType = '';
  if (cardType === 'glitch' || fileType === 'glitch_puzzle') {
    specialType = 'type-glitch';
  } else if (cardType === 'mega-clue' || fileType === 'mega_clue') {
    specialType = 'type-mega-clue';
  } else if (locked || cardType === 'encrypted') {
    specialType = 'type-encrypted';
  }

  const getTypeIcon = (t: string) => {
    if (t === 'locked') return <Lock size={14} />;
    if (t === 'video') return <Video size={14} />;
    if (t === 'audio') return <Music size={14} />;
    if (t === 'text') return <FileText size={14} />;
    return <Image size={14} />;
  }

  const rootClasses = [
    'clue-card',
    specialType,
    hasScanned ? 'scanned' : '',
    status ? `status-${(status === 'verified' ? 'true' : status)}` : '',
    locked ? 'is-locked' : '',
    performanceMode ? 'performance-mode' : ''
  ].filter(Boolean).join(' ');

  let contentContainerClass = 'card-content-container';

  if (playerView && !isGameMaster) {
    if (locked) {
      contentContainerClass += ' locked-view';
    } else if (cardType === 'glitch' || cardType === 'encrypted') {
      contentContainerClass += ' glitch-view';
    }
  }

  if (!isVisible) {
    contentContainerClass += ' loading-placeholder';
  } else {
    contentContainerClass += ' gm-view';
  }

  return (
    <div
      ref={cardRef}
      className={rootClasses}
      id={`card-${id}`}
      data-testid={`card-${id}`}
      data-card-type={cardType}
      data-locked={locked}
      data-player-view={playerView}
      style={{
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        WebkitTapHighlightColor: 'transparent'
      }}
    >
      <div className="scanner-line" />

      <div className="clue-image-container">
        <div className="badges-container" aria-hidden>
          <div className={`type-badge small ${locked ? 'locked' : fileType}`} title={locked ? 'Protegido' : fileType}>{getTypeIcon(locked ? 'locked' : fileType)}</div>
          {hasUV && <div className="type-badge small uv" title="Camada UV"><Eye size={14} /></div>}
          {hasHiddenAudio && <div className="type-badge small hidden-audio" title="Áudio oculto"><Volume2 size={14} /></div>}
          {hasChat && <div className="type-badge small chat" title="Chat/Conversas"><MessageSquare size={14} /></div>}
          {hasThermal && <div className="type-badge small thermal" title="Termal"><Thermometer size={14} /></div>}
          {hasStamp && <div className="type-badge small stamp" title="Carimbo"><Tag size={14} /></div>}
          {hasExternalLink && <div className="type-badge small link" title="Link Externo"><LinkIcon size={14} /></div>}
          {cardType === 'hidden' && <div className="type-badge small hidden" title="Pista Oculta"><Eye size={14} /></div>}
        </div>

        <div className={contentContainerClass}>
          <EvidenceCardContent
            id={id}
            image={isVisible ? image : undefined}
            hiddenSrc={hiddenSrc}
            isUV={isUV}
            locked={locked}
            cardType={cardType}
            isGameMaster={isGameMaster}
            playerView={playerView}
            hasUV={hasUV}
            hasHiddenAudio={hasHiddenAudio}
            fileType={fileType}
            performanceMode={performanceMode}
            blurred={blurred}
          />
        </div>
      </div>

      <div className="clue-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="clue-uuid">ID: {shortId}</span>
          {locked && (
            <span title="Evidência Protegida por Senha" style={{ color: 'var(--institutional-red)', display: 'inline-flex', alignItems: 'center' }}>
              <Lock size={14} />
            </span>
          )}
          {hasRecord && (
            <span title="Prontuário / Ficha da vítima" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center' }}>
              <FileText size={14} />
            </span>
          )}
        </div>
        <h3 style={{ marginTop: 6 }}>{locked && !isGameMaster ? '#######' : cardType === 'hidden' ? `[OCULTA] ${title}` : title}</h3>
      </div>

      <div className="decision-bar">
        <button className={`btn-decision true ${status === 'verified' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('verified'); }} title="Confirmado" aria-label="confirm">
          <Check size={18} />
        </button>

        <button className={`btn-decision theory ${status === 'theory' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('theory'); }} title="Hipótese" aria-label="theory">
          <HelpCircle size={18} />
        </button>

        <button className={`btn-decision false ${status === 'false' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('false'); }} title="Descartado" aria-label="discard">
          <X size={18} />
        </button>

        <div className="divider" />
        <button className="btn-decision open" onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }} title="Abrir Arquivo" aria-label="open">
          <FolderOpen size={18} />
        </button>
        {isGameMaster && !playerView && onEdit && (
          <button className="btn-decision edit" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Editar Pista" aria-label="edit">
            <Pencil size={18} />
          </button>
        )}
      </div>
    </div>
  )
}

const propsAreEqual = (prev: EvidenceCardProps, next: EvidenceCardProps) => {
  const keys: Array<keyof EvidenceCardProps> = [
    'id','image','hiddenSrc','title','isUV','status','locked','hasRecord','fileType','hasUV','hasHiddenAudio','hasAudio','hasVideo','hasChat','hasThermal','hasStamp','hasExternalLink','isGameMaster','playerView','cardType','performanceMode','blurred'
  ];
  return keys.every((k) => prev[k] === next[k]);
};

export default React.memo(EvidenceCard, propsAreEqual)
