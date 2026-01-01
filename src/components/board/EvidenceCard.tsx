import React from 'react'
import './EvidenceCard.css'
import MysteryImage from './MysteryImage'

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
  fileType?: 'video' | 'audio' | 'image' | 'text'
  isGameMaster?: boolean
  hasUV?: boolean
  hasHiddenAudio?: boolean
  hasAudio?: boolean
  hasVideo?: boolean
  hasChat?: boolean
  hasThermal?: boolean
  hasStamp?: boolean
  hasExternalLink?: boolean
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ id, image, hiddenSrc, title = 'RELATÓRIO GÊMEOS', isUV = false, status = null, onToggleStatus, onOpen, locked = false, hasRecord = false, fileType = 'image', hasUV = false, hasHiddenAudio = false, hasAudio = false, hasVideo = false, hasChat = false, hasThermal = false, hasStamp = false, hasExternalLink = false, isGameMaster = false }) => {
  const handleToggle = (s: 'verified' | 'theory' | 'false') => {
    if (!onToggleStatus) return;
    const newStatus = status === s ? null : s;
    onToggleStatus(newStatus);
  }

  const shortId = id ? (String(id).length > 10 ? `${String(id).slice(0, 8)}...` : String(id)) : '';

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

  const rootClass = `clue-card ${(status ? `status-${(status === 'verified' ? 'true' : status)}` : '')} ${locked ? 'is-locked' : ''}`.trim();

  return (
    <div className={rootClass} id={`card-${id}`}>
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
        </div>

        {locked && !isGameMaster ? (
          <div className="lock-overlay">
            <div className="lock-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 8V7a5 5 0 10-10 0v1" stroke="#ff003c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/><rect x="3" y="8" width="18" height="13" rx="2" stroke="#ff003c" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <span className="lock-text">ENCRIPTADO</span>
          </div>
        ) : (
          <>
            <MysteryImage baseSrc={image} hiddenSrc={hiddenSrc} isUVMode={isUV} pointerLocal={undefined} />
            <div className="overlay-scan" />
          </>
        )}
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
        <h3 style={{ marginTop: 6 }}>{locked && !isGameMaster ? '#######' : title}</h3>
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

export default EvidenceCard
