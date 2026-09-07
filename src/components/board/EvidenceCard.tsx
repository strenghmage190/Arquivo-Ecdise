import { Check, CircleHelp, Eye, FileText, FolderOpen, Image as ImageIcon, Link2, Lock, MessageSquare, Pencil, Thermometer, User, Video, Volume2, X } from 'lucide-react';
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
  element?: string | null
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ id, image, hiddenSrc, title = 'RELATÓRIO GÊMEOS', isUV = false, status = null, onToggleStatus, onOpen, onEdit, locked = false, hasRecord = false, fileType = 'image', hasUV = false, hasHiddenAudio = false, hasAudio = false, hasVideo = false, hasChat = false, hasThermal = false, hasStamp = false, hasExternalLink = false, isGameMaster = false, playerView = false, cardType = 'normal', performanceMode = false, blurred = false }) => {
  // DEBUG: Log de props importantes
  if (cardType !== 'normal' || locked || isUV) {
    console.log(`[EvidenceCard ${id}] cardType=${cardType}, locked=${locked}, isGameMaster=${isGameMaster}, playerView=${playerView}, isUV=${isUV}`)
  }
  const handleToggle = (s: 'verified' | 'theory' | 'false') => {
    if (!onToggleStatus) return;
    const newStatus = status === s ? null : s;
    onToggleStatus(newStatus);
  }

  const shortId = id ? (String(id).length > 10 ? `${String(id).slice(0, 8)}...` : String(id)) : '';

  // Lazy render para economizar re-renders e trabalho de imagem fora da viewport
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

  // Determinar tipo especial baseado no fileType ou cardType
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
    if (t === 'audio') return <Volume2 size={14} />;
    if (t === 'text') return <FileText size={14} />;
    return <ImageIcon size={14} />;
  };

  const rootClasses = [
    'clue-card',
    specialType,
    hasScanned ? 'scanned' : '',
    status ? `status-${(status === 'verified' ? 'true' : status)}` : '',
    locked ? 'is-locked' : '',
    performanceMode ? 'performance-mode' : ''
  ].filter(Boolean).join(' ');

  // Determinar classe do content container de forma explícita e previsível
  let contentContainerClass = 'card-content-container';

  if (playerView && !isGameMaster) {
    if (locked) {
      contentContainerClass += ' locked-view';
    } else if (cardType === 'glitch' || cardType === 'encrypted') {
      contentContainerClass += ' glitch-view';
    }
  }

  // placeholder enquanto a imagem não estiver visível; caso contrário, gm-view
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
      data-element={element || undefined}
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
          {hasUV && <div className="type-badge small uv" title="Camada UV">UV</div>}
          {hasHiddenAudio && <div className="type-badge small hidden-audio" title="Áudio oculto"><Volume2 className="lucide-icon inline-icon" size={16} /></div>}
          {hasChat && <div className="type-badge small chat" title="Chat/Conversas"><MessageSquare size={14} /></div>}
          {hasThermal && <div className="type-badge small thermal" title="Termal"><Thermometer size={14} /></div>}
          {hasStamp && <div className="type-badge small stamp" title="Carimbo"><Check size={14} /></div>}
          {hasExternalLink && <div className="type-badge small link" title="Link Externo"><Link2 size={14} /></div>}
          {cardType === 'hidden' && <div className="type-badge small hidden" title="Pista Oculta"><Eye className="lucide-icon inline-icon" size={16} /></div>}
        </div>

        {/* <Check className="lucide-icon inline-icon" size={16} /> Content container with view classes - NO NESTING */}
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
          {locked && <span className="clue-inline-icon" title="Evidência Protegida por Senha"><Lock size={14} /></span>}
          {hasRecord && <span className="clue-inline-icon" title="Prontuário / Ficha da vítima"><User size={14} /></span>}
        </div>
        <h3 style={{ marginTop: 6 }}>{locked && !isGameMaster ? '#######' : cardType === 'hidden' ? `[OCULTA] ${title}` : title}</h3>
        {status && <span className="evidence-state-stamp" aria-label="Estado da evidência">{status === 'false' ? '[ASSIGNED]' : '[VALIDADO]'}</span>}
      </div>

      <div className="decision-bar">
        <button className={`btn-decision true ${status === 'verified' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('verified'); }} title="Confirmado" aria-label="confirm">
          <Check size={16} />
        </button>

        <button className={`btn-decision theory ${status === 'theory' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('theory'); }} title="Hipótese" aria-label="theory">
          <CircleHelp size={16} />
        </button>

        <button className={`btn-decision false ${status === 'false' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('false'); }} title="Descartado" aria-label="discard">
          <X size={16} />
        </button>

        <div className="divider" />
        <button className="btn-decision open" onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }} title="Abrir Arquivo" aria-label="open">
          <FolderOpen size={16} />
        </button>
        {isGameMaster && !playerView && onEdit && (
          <button className="btn-decision edit" onClick={(e) => { e.stopPropagation(); onEdit(); }} title="Editar Pista" aria-label="edit">
            <Pencil size={16} />
          </button>
        )}
      </div>
    </div>
  )
}

const propsAreEqual = (prev: EvidenceCardProps, next: EvidenceCardProps) => {
  const keys: Array<keyof EvidenceCardProps> = [
    'id','image','hiddenSrc','title','isUV','status','locked','hasRecord','fileType','hasUV','hasHiddenAudio','hasAudio','hasVideo','hasChat','hasThermal','hasStamp','hasExternalLink','isGameMaster','playerView','cardType','performanceMode','blurred','element'
  ];
  // Nota: onEdit e onOpen são funções, comparação por referência pode causar re-renders
  return keys.every((k) => prev[k] === next[k]);
};

export default React.memo(EvidenceCard, propsAreEqual)
