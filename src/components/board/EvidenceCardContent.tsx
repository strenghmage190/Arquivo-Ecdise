import React from 'react'
import MysteryImage from './MysteryImage'

interface EvidenceCardContentProps {
  id: string
  image?: string
  hiddenSrc?: string
  title?: string
  isUV?: boolean
  locked?: boolean
  hasRecord?: boolean
  fileType?: 'video' | 'audio' | 'image' | 'text' | 'glitch_puzzle' | 'mega_clue'
  cardType?: 'glitch' | 'mega-clue' | 'encrypted' | 'normal'
  isGameMaster?: boolean
  playerView?: boolean
  hasUV?: boolean
  hasHiddenAudio?: boolean
}

/**
 * EvidenceCardContent
 * Componente que encapsula a lógica de visão GM vs Player
 * Facilita a implementação e torna o código mais limpo
 */
const EvidenceCardContent: React.FC<EvidenceCardContentProps> = ({
  id,
  image,
  hiddenSrc,
  isUV = false,
  locked = false,
  cardType = 'normal',
  isGameMaster = false,
  playerView = false,
  hasUV = false,
  hasHiddenAudio = false
}) => {
  // Determina se deve mostrar conteúdo ou restrição
  const isPlayerViewingLockedContent = playerView && locked && !isGameMaster
  const isPlayerViewingEncrypted = playerView && cardType === 'encrypted' && !isGameMaster
  const isPlayerViewingGlitch = playerView && cardType === 'glitch' && !isGameMaster

  // ===== GM VIEW (Normal - Pode ver tudo) =====
  if (isGameMaster || !playerView) {
    return (
      <div className="card-content-container gm-view">
        {hasUV && isUV ? (
          <div className="uv-layer">
            <MysteryImage 
              baseSrc={image} 
              hiddenSrc={hiddenSrc} 
              isUVMode={true} 
              pointerLocal={undefined} 
            />
          </div>
        ) : (
          <>
            <MysteryImage 
              baseSrc={image} 
              hiddenSrc={hiddenSrc} 
              isUVMode={false} 
              pointerLocal={undefined} 
            />
            <div className="overlay-scan" />
          </>
        )}
      </div>
    )
  }

  // ===== PLAYER VIEW - LOCKED CONTENT (Com Senha) =====
  if (isPlayerViewingLockedContent) {
    return (
      <div className="card-content-container player-view locked-view">
        <div className="lock-overlay encrypted-full">
          <div className="encryption-grid" />
          <div className="encryption-text-wrapper">
            <div className="lock-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17 8V7a5 5 0 10-10 0v1" stroke="#ff003c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <rect x="3" y="8" width="18" height="13" rx="2" stroke="#ff003c" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span className="access-denied">ACESSO NEGADO</span>
            <span className="encryption-code">ERR_ACCESS_LEVEL_INSUFFICIENT</span>
          </div>
        </div>
      </div>
    )
  }

  // ===== PLAYER VIEW - ENCRYPTED/GLITCH (Sem conseguir ver) =====
  if (isPlayerViewingEncrypted || isPlayerViewingGlitch) {
    return (
      <div className="card-content-container player-view glitch-view">
        {/* Múltiplas camadas de glitch para efeito intenso */}
        <div className="glitch-corruption">
          <div className="glitch-layer-1" style={{ animationDelay: '0s' }} />
          <div className="glitch-layer-2" style={{ animationDelay: '0.15s' }} />
          <div className="glitch-layer-3" style={{ animationDelay: '0.3s' }} />
        </div>
        
        <div className="data-corruption-overlay">
          <svg className="corruption-pattern" viewBox="0 0 200 200" preserveAspectRatio="none">
            <defs>
              <pattern id="corruption" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="20" height="20" fill="rgba(255,0,60,0.1)" />
                <circle cx="10" cy="10" r="2" fill="rgba(255,0,255,0.3)" />
              </pattern>
            </defs>
            <rect width="200" height="200" fill="url(#corruption)" />
          </svg>
        </div>

        <div className="glitch-text-overlay">
          <div className="glitch-chars glitch-1">DATA CORRUPTED</div>
          <div className="glitch-chars glitch-2">∆ ◊ ▯ ◊ ∆</div>
          <div className="glitch-chars glitch-3">ACCESS DENIED</div>
        </div>

        {/* Efeito de scanlines */}
        <div className="scanlines" />
      </div>
    )
  }

  // Default - Normal view
  return (
    <div className="card-content-container normal-view">
      <MysteryImage 
        baseSrc={image} 
        hiddenSrc={hiddenSrc} 
        isUVMode={false} 
        pointerLocal={undefined} 
      />
      <div className="overlay-scan" />
    </div>
  )
}

export default EvidenceCardContent
