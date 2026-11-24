import { Check, Lock } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react'
import MysteryImage from './MysteryImage'
import './EvidenceCardContent.css'

interface EvidenceCardContentProps {
  id: string
  image?: string
  hasImage?: boolean
  hiddenSrc?: string
  title?: string
  isUV?: boolean
  locked?: boolean
  hasRecord?: boolean
  fileType?: 'video' | 'audio' | 'image' | 'text' | 'glitch_puzzle' | 'mega_clue'
  cardType?: 'glitch' | 'mega-clue' | 'encrypted' | 'normal' | 'hidden'
  isGameMaster?: boolean
  playerView?: boolean
  hasUV?: boolean
  hasHiddenAudio?: boolean
  hasAudio?: boolean
  hasVideo?: boolean
  hasChat?: boolean
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
  hasImage = false,
  hiddenSrc,
  title = '',
  isUV = false,
  locked = false,
  fileType = 'image',
  cardType = 'normal',
  isGameMaster = false,
  playerView = false,
  hasUV = false,
  hasHiddenAudio = false,
  hasAudio = false,
  hasVideo = false,
  hasChat = false,
  performanceMode = false,
  blurred = false
}) => {
  // <Check className="lucide-icon inline-icon" size={16} /> LÓGICA CORRIGIDA: Ordem de precedência clara
  // 1. Se é Game Master E não está em modo player view, mostra tudo
  const isGMViewFull = isGameMaster && !playerView;
  
  // 2. Se card está locked E estamos em modo player (ou visão de teste)
  const isLockedView = locked && playerView && !isGameMaster;
  
  // 3. Se é glitch/encrypted E em modo player
  const isGlitchView = (cardType === 'glitch' || cardType === 'encrypted') && playerView && !isGameMaster;

  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const reducedMotion = performanceMode || prefersReducedMotion
  const showBlur = blurred && !isGameMaster
  const [isAudioPlaying, setIsAudioPlaying] = useState(false)

  useEffect(() => {
    const onAudioState = (ev: Event) => {
      const detail = (ev as CustomEvent<{ cardId?: string; playing?: boolean }>).detail;
      if (!detail || detail.cardId !== id) return;
      setIsAudioPlaying(Boolean(detail.playing));
    };
    window.addEventListener('ordo:card-audio-state', onAudioState);
    return () => window.removeEventListener('ordo:card-audio-state', onAudioState);
  }, [id]);

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
              <span className="lock-icon"><Lock className="lucide-icon inline-icon" size={16} /></span>
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
            <span className="lock-icon"><Lock className="lucide-icon inline-icon" size={16} /></span>
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
    if (hasImage) {
      return <div className="loading-placeholder-content" />
    }

    const isChatOrPhone = hasChat || /telefone|phone|chat|sms|whats|ligação|chamada|conversa|mensagem/i.test(title);
    const isAudioPreview = !isChatOrPhone && (fileType === 'audio' || (hasAudio && fileType !== 'video' && !hasVideo));

    if (isAudioPreview) {
      const bars = [18, 34, 24, 52, 68, 42, 76, 58, 30, 64, 82, 46, 28, 56, 70, 38, 22, 48, 32, 20];
      return (
        <div className="diegetic-preview diegetic-audio" aria-hidden="true">
          <div className="diegetic-header">
            <span className="diegetic-tag">AUDIO // WAVEFORM</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              {isAudioPlaying && !reducedMotion && (
                <span className="mini-audio-eq" aria-hidden="true">
                  <span /><span /><span /><span />
                </span>
              )}
              <span className="diegetic-code">CH-01</span>
            </span>
          </div>
          <svg className="diegetic-svg" viewBox="0 0 220 76" preserveAspectRatio="xMidYMid meet">
            <line x1="8" y1="38" x2="212" y2="38" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" strokeDasharray="3 3" />
            {bars.map((h, i) => {
              const x = 12 + i * 10;
              const y = 38 - h / 2;
              const active = i >= 5 && i <= 14;
              return (
                <rect
                  key={i}
                  x={x}
                  y={y}
                  width="5"
                  height={h}
                  rx="1"
                  fill={active ? 'rgba(56, 189, 248, 0.72)' : 'rgba(148, 163, 184, 0.38)'}
                />
              );
            })}
          </svg>
        </div>
      );
    }

    if (isChatOrPhone) {
      return (
        <div className="diegetic-preview diegetic-chat" aria-hidden="true">
          <div className="diegetic-header">
            <span className="diegetic-tag">REGISTRO // CHAT</span>
            <span className="diegetic-code">LOG</span>
          </div>
          <svg className="diegetic-svg" viewBox="0 0 220 76" preserveAspectRatio="xMidYMid meet">
            <rect x="10" y="6" width="124" height="18" rx="3" fill="rgba(30, 41, 59, 0.95)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1" />
            <line x1="18" y1="13" x2="96" y2="13" stroke="rgba(226, 232, 240, 0.65)" strokeWidth="2" strokeLinecap="round" />
            <line x1="18" y1="18" x2="68" y2="18" stroke="rgba(148, 163, 184, 0.45)" strokeWidth="1.5" strokeLinecap="round" />

            <rect x="86" y="30" width="124" height="18" rx="3" fill="rgba(23, 37, 84, 0.75)" stroke="rgba(56, 189, 248, 0.45)" strokeWidth="1" />
            <line x1="94" y1="37" x2="188" y2="37" stroke="rgba(186, 230, 253, 0.78)" strokeWidth="2" strokeLinecap="round" />
            <line x1="94" y1="42" x2="152" y2="42" stroke="rgba(125, 211, 252, 0.48)" strokeWidth="1.5" strokeLinecap="round" />

            <rect x="10" y="54" width="98" height="16" rx="3" fill="rgba(30, 41, 59, 0.95)" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="1" />
            <line x1="18" y1="62" x2="82" y2="62" stroke="rgba(226, 232, 240, 0.55)" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
      );
    }

    return (
      <div className="diegetic-preview diegetic-doc" aria-hidden="true">
        <div className="diegetic-header">
          <span className="diegetic-tag">{fileType === 'video' || hasVideo ? 'SINAL // VÍDEO' : 'ARQUIVO // CLASSIFICADO'}</span>
          <span className="diegetic-code">DOC</span>
        </div>
        <svg className="diegetic-svg" viewBox="0 0 220 76" preserveAspectRatio="xMidYMid meet">
          <rect x="12" y="6" width="196" height="64" rx="2" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(148, 163, 184, 0.25)" strokeWidth="1" />
          <line x1="22" y1="18" x2="112" y2="18" stroke="rgba(226, 232, 240, 0.68)" strokeWidth="2.5" strokeLinecap="round" />
          <rect x="148" y="13" width="48" height="10" fill="none" stroke="rgba(230, 57, 70, 0.65)" strokeWidth="1" />
          <line x1="22" y1="31" x2="188" y2="31" stroke="rgba(148, 163, 184, 0.4)" strokeWidth="2" strokeLinecap="round" />
          <line x1="22" y1="41" x2="146" y2="41" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" strokeLinecap="round" />
          <rect x="152" y="38" width="38" height="6" fill="rgba(148, 163, 184, 0.24)" />
          <line x1="22" y1="51" x2="172" y2="51" stroke="rgba(148, 163, 184, 0.35)" strokeWidth="2" strokeLinecap="round" />
          <rect x="22" y="57" width="54" height="5" fill="rgba(148, 163, 184, 0.24)" />
          <line x1="82" y1="60" x2="140" y2="60" stroke="rgba(148, 163, 184, 0.3)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
    );
  }

  // =======================================================================
  //  <Check className="lucide-icon inline-icon" size={16} /> LÓGICA DE RENDERIZAÇÃO ATUALIZADA PARA MODO PERFORMANCE
  // =======================================================================
  return (
    <>
      {hasUV && isUV ? (
        // --- Se a LUZ UV estiver LIGADA ---
        performanceMode ? (
          // MODO PERFORMANCE "LITE": Renderiza duas divs simples com mix-blend-mode via inline style.
          // Isso é à prova de falhas e ignora qualquer regra CSS externa que quebre o efeito.
          <div className="uv-layer-lite" style={{ position: 'relative', width: '100%', height: '100%', background: '#000' }}>
            {/* Imagem Base */}
            <div 
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${image})`,
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat'
              }} 
            />
            {/* Camada UV (revelação) */}
            <div 
              style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${hiddenSrc})`,
                backgroundSize: 'contain', backgroundPosition: 'center', backgroundRepeat: 'no-repeat',
                mixBlendMode: 'screen' /* Essencial para o efeito funcionar */
              }} 
            />
          </div>
        ) : (
          // MODO COMPLETO: Usa o componente MysteryImage original com todos os efeitos.
          <div className="uv-layer">
            <MysteryImage 
              baseSrc={image} 
              hiddenSrc={hiddenSrc} 
              isUVMode={true} 
              pointerLocal={undefined} 
            />
          </div>
        )
      ) : (
        // --- Se a LUZ UV estiver DESLIGADA ---
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
