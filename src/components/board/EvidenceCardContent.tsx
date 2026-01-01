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
  performanceMode?: boolean
  blurred?: boolean
}

/**
 * EvidenceCardContent
 * Componente que encapsula a lógica de visão GM vs Player
 * 
 * Renderiza apenas o conteúdo DENTRO do container
 * O container (.card-content-container) é gerenciado por EvidenceCard
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
  hasHiddenAudio = false,
  performanceMode = false,
  blurred = false
}) => {
  // ✅ LÓGICA CORRIGIDA: Ordem de precedência clara
  // 1. Se é Game Master E não está em modo player view, mostra tudo
  const isGMViewFull = isGameMaster && !playerView;
  
  // 2. Se card está locked E estamos em modo player (ou visão de teste)
  const isLockedView = locked && playerView && !isGameMaster;
  
  // 3. Se é glitch/encrypted E em modo player
  const isGlitchView = (cardType === 'glitch' || cardType === 'encrypted') && playerView && !isGameMaster;

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const reducedMotion = performanceMode || prefersReducedMotion
  const showBlur = blurred && !isGameMaster

  // Gera código de encriptação único
  const encryptionCode = useMemo(() => {
    return `RND-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
  }, [id])

  // ===== PLAYER VIEW - LOCKED CONTENT (Com Senha) =====
  if (isLockedView) {
    if (reducedMotion) {
      return (
        <>
          <div className="lock-overlay encrypted-full">
            <div className="encryption-text-wrapper">
              <span className="lock-icon">🔐</span>
              <div className="access-denied">ACESSO NEGADO</div>
              <div className="encryption-code">MODO ECONÔMICO</div>
            </div>
          </div>
        </>
      )
    }
    return (
      <>
        <div className="encryption-grid" />
        <div className="lock-overlay encrypted-full">
          <div className="encryption-text-wrapper">
            <span className="lock-icon">🔐</span>
            <div className="access-denied">ACESSO NEGADO</div>
            <div className="encryption-code">{encryptionCode}</div>
          </div>
        </div>
      </>
    )
  }

  // ===== PLAYER VIEW - ENCRYPTED/GLITCH (Sem conseguir ver) =====
  if (isGlitchView) {
    if (reducedMotion) {
      return (
        <>
          <div className="glitch-text-overlay" style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,0.6)' }}>
            <div className="glitch-chars" style={{ textAlign: 'center', color: '#ddd', letterSpacing: 1 }}>
              <div style={{ fontSize: 12, opacity: 0.9 }}>MODO PERFORMANCE</div>
              <div style={{ fontWeight: 700 }}>CONTEÚDO BLOQUEADO</div>
            </div>
          </div>
        </>
      )
    }
    return (
      <>
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
      </>
    )
  }

  if (!image) {
    return <div className="loading-placeholder-content" />
  }

  // ===== VISÃO COMPLETA / NORMAL (FALLBACK) =====
  return (
    <>
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
          {!reducedMotion && <div className="overlay-scan" />}
          {showBlur && <div className="blur-overlay" aria-hidden />}
        </>
      )}
    </>
  )
}

export default EvidenceCardContent
