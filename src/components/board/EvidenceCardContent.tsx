import React, { useMemo } from 'react'
import MysteryImage from './MysteryImage'
import './EvidenceCardContent.css'

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
 * 
 * GM View: Vê conteúdo normal
 * Player View (Locked): "ACESSO NEGADO" com grid de encriptação
 * Player View (Glitch/Encrypted): Heavy glitch corruption effects
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

  // Gera código de encriptação único
  const encryptionCode = useMemo(() => {
    return `RND-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  }, [id])

  // ===== PLAYER VIEW - LOCKED CONTENT (Com Senha) =====
  if (isPlayerViewingLockedContent) {
    return (
      <div className="card-content-container locked-view">
        <div className="encryption-grid" />
        <div className="lock-overlay encrypted-full">
          <div className="encryption-text-wrapper">
            <span className="lock-icon">🔐</span>
            <div className="access-denied">ACESSO NEGADO</div>
            <div className="encryption-code">{encryptionCode}</div>
          </div>
        </div>
      </div>
    )
  }

  // ===== PLAYER VIEW - ENCRYPTED/GLITCH (Sem conseguir ver) =====
  if (isPlayerViewingEncrypted || isPlayerViewingGlitch) {
    return (
      <div className="card-content-container glitch-view">
        {/* Múltiplas camadas de glitch para efeito intenso */}
        <div className="glitch-corruption">
          <div className="glitch-layer-1" style={{ animationDelay: '0s' }} />
          <div className="glitch-layer-2" style={{ animationDelay: '0.15s' }} />
          <div className="glitch-layer-3" style={{ animationDelay: '0.3s' }} />
        </div>

        {/* Padrão de corrupção com SVG */}
        <div className="data-corruption-overlay">
          <div className="corruption-pattern">
            <svg 
              width="100%" 
              height="100%" 
              style={{ position: 'absolute', inset: 0 }}
              viewBox="0 0 300 300"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="corrupt" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="50" height="50" fill="none" stroke="#ff003c" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="25" cy="25" r="4" fill="#00f3ff" opacity="0.3" />
                  <line x1="0" y1="25" x2="50" y2="25" stroke="#ffff00" strokeWidth="0.5" opacity="0.15" />
                  <text x="10" y="35" fontSize="8" fill="#ff00ff" opacity="0.2" fontFamily="monospace">X</text>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#corrupt)" />
            </svg>
          </div>
        </div>

        {/* Texto de glitch em múltiplas camadas */}
        <div className="glitch-text-overlay">
          <div className="glitch-chars">
            <div className="glitch-1">▓░▓ DATA</div>
            <div className="glitch-2">CØRRÜPT</div>
            <div className="glitch-3">░▓░ LOCKED</div>
          </div>
        </div>

        {/* Efeito de scanlines */}
        <div className="scanlines" />
      </div>
    )
  }

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
      <div className="card-content-container locked-view">
        <div className="encryption-grid" />
        <div className="lock-overlay encrypted-full">
          <div className="encryption-text-wrapper">
            <span className="lock-icon">🔐</span>
            <div className="access-denied">ACESSO NEGADO</div>
            <div className="encryption-code">{encryptionCode}</div>
          </div>
        </div>
      </div>
    )
  }

  // ===== PLAYER VIEW - ENCRYPTED/GLITCH (Sem conseguir ver) =====
  if (isPlayerViewingEncrypted || isPlayerViewingGlitch) {
    return (
      <div className="card-content-container glitch-view">
        {/* Múltiplas camadas de glitch para efeito intenso */}
        <div className="glitch-corruption">
          <div className="glitch-layer-1" style={{ animationDelay: '0s' }} />
          <div className="glitch-layer-2" style={{ animationDelay: '0.15s' }} />
          <div className="glitch-layer-3" style={{ animationDelay: '0.3s' }} />
        </div>

        {/* Padrão de corrupção com SVG */}
        <div className="data-corruption-overlay">
          <div className="corruption-pattern">
            <svg 
              width="100%" 
              height="100%" 
              style={{ position: 'absolute', inset: 0 }}
              viewBox="0 0 300 300"
              preserveAspectRatio="xMidYMid slice"
            >
              <defs>
                <pattern id="corrupt" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
                  <rect x="0" y="0" width="50" height="50" fill="none" stroke="#ff003c" strokeWidth="0.5" opacity="0.4" />
                  <circle cx="25" cy="25" r="4" fill="#00f3ff" opacity="0.3" />
                  <line x1="0" y1="25" x2="50" y2="25" stroke="#ffff00" strokeWidth="0.5" opacity="0.15" />
                  <text x="10" y="35" fontSize="8" fill="#ff00ff" opacity="0.2" fontFamily="monospace">X</text>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#corrupt)" />
            </svg>
          </div>
        </div>

        {/* Texto de glitch em múltiplas camadas */}
        <div className="glitch-text-overlay">
          <div className="glitch-chars">
            <div className="glitch-1">▓░▓ DATA</div>
            <div className="glitch-2">CØRRÜPT</div>
            <div className="glitch-3">░▓░ LOCKED</div>
          </div>
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
