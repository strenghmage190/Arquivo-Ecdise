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

const EvidenceCard: React.FC<EvidenceCardProps> = ({ id, image, hiddenSrc, title = 'RELATÓRIO GÊMEOS', isUV = false, status = null, onToggleStatus, onOpen, locked = false, hasRecord = false, fileType = 'image', hasUV = false, hasHiddenAudio = false, hasAudio = false, hasVideo = false, hasChat = false, hasThermal = false, hasStamp = false, hasExternalLink = false, isGameMaster = false, playerView = false, cardType = 'normal', performanceMode = false, blurred = false }) => {
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
    if (t === 'locked') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 8V7a5 5 0 10-10 0v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="8" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
    if (t === 'video') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="5" width="14" height="14" rx="2" stroke="currentColor" strokeWidth="1.6"/><path d="M21 8l-4 3.5V9.5L21 6v2z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
    if (t === 'audio') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 12h3v6H3z" fill="currentColor"/><path d="M10 9v9a2 2 0 002 2h6v-2h-6v-9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
    if (t === 'text') return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 7h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 15h6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/><rect x="3" y="3" width="18" height="18" rx="2" stroke="currentColor" strokeWidth="1.2"/></svg>
    );
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.4"/><path d="M4 16h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
    );
  }

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
      style={{
        touchAction: 'auto',
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
          {hasHiddenAudio && <div className="type-badge small hidden-audio" title="Áudio oculto">🔊</div>}
          {hasChat && <div className="type-badge small chat" title="Chat/Conversas">💬</div>}
          {hasThermal && <div className="type-badge small thermal" title="Termal">🌡️</div>}
          {hasStamp && <div className="type-badge small stamp" title="Carimbo">🏷️</div>}
          {hasExternalLink && <div className="type-badge small link" title="Link Externo">🔗</div>}
          {cardType === 'hidden' && <div className="type-badge small hidden" title="Pista Oculta">👁️‍🗨️</div>}
        </div>

        {/* ✅ Content container with view classes - NO NESTING */}
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
            <span title="Evidência Protegida por Senha" style={{ color: '#f39c12', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 8V7a5 5 0 10-10 0v1" stroke="#f39c12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="8" width="18" height="13" rx="2" stroke="#f39c12" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          )}
          {hasRecord && (
            <span title="Prontuário / Ficha da vítima" style={{ color: '#9ee7c8', display: 'inline-flex', alignItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="#9ee7c8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="#9ee7c8" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </span>
          )}
        </div>
        <h3 style={{ marginTop: 6 }}>{locked && !isGameMaster ? '#######' : cardType === 'hidden' ? `[OCULTA] ${title}` : title}</h3>
      </div>

      <div className="decision-bar">
        <button className={`btn-decision true ${status === 'verified' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('verified'); }} title="Confirmado" aria-label="confirm">
          <svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" /></svg>
        </button>

        <button className={`btn-decision theory ${status === 'theory' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('theory'); }} title="Hipótese" aria-label="theory">
          <svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M11 18h2v-2h-2v2zm1-16C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm1.07-7.75l-.9.92C12.45 11.9 12 12.5 12 14h2v-.5c0-.8.45-1.3 1.07-1.92l1.2-1.22c.37-.36.73-.86.73-1.66 0-1.1-.9-2-2-2s-2 .9-2 2H9c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.22-.7 2.08-1.93 3.25z" /></svg>
        </button>

        <button className={`btn-decision false ${status === 'false' ? 'active' : ''}`} onClick={(e) => { e.stopPropagation(); handleToggle('false'); }} title="Descartado" aria-label="discard">
          <svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
        </button>

        <div className="divider" />
        <button className="btn-decision open" onClick={(e) => { e.stopPropagation(); if (onOpen) onOpen(); }} title="Abrir Arquivo" aria-label="open">
          <svg viewBox="0 0 24 24" aria-hidden focusable="false"><path d="M10 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" /></svg>
        </button>
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
