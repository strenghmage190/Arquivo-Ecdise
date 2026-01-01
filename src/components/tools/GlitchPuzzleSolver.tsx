import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import GlitchImageEngine from './GlitchImageEngine';
import { addCollectedCode } from '../../utils/codeTracking';
import { updateInvestigationCard } from '../../api/investigations';
import './GlitchPuzzleSolver.css';

interface Config {
  original_image_url: string;
  corrupted_image_url?: string;
  correct_frequency: number;
  correct_shift: number;
  correct_chromatic: number;
  tolerance_frequency?: number;
  tolerance_shift?: number;
  tolerance_chromatic?: number;
  start_frequency?: number;
  start_shift?: number;
  start_chromatic?: number;
  reward_code: string;
  correct_keyword?: string | null;
  require_keyword_validation?: boolean;
  variant?: string | null;
  unlock_mode?: 'code' | 'code_plus_keyword' | 'media' | 'media_and_code' | string | null;
  hidden_uv_url?: string | null;
  hidden_audio_url?: string | null;
  hidden_video_url?: string | null;
  focused_image_url?: string | null;
  hint?: string;
  solved?: boolean;
  security_layer?: {
    enabled?: boolean;
    reveal_logic?: 'always_visible' | 'aligned_only' | 'aligned_keyword' | string;
    require_keyword?: boolean;
    keyword?: string | null;
  } | null;
}

interface Props {
  config: Config;
  investigationId: string;
  cardId: string;
  fullMetadata?: any;
  onSolved?: () => void;
}

export default function GlitchPuzzleSolver({ config, investigationId, cardId, fullMetadata, onSolved }: Props) {
  const parsedMetadata = useMemo(() => {
    if (!fullMetadata) return null;
    if (typeof fullMetadata === 'string') {
      try {
        return JSON.parse(fullMetadata);
      } catch (err) {
        console.error('Falha ao parsear metadata completo no solver', err);
        return null;
      }
    }
    return fullMetadata;
  }, [fullMetadata]);

  const configFromMeta = useMemo(() => {
    if (!parsedMetadata || typeof parsedMetadata !== 'object') return null;
    return parsedMetadata.glitch_puzzle || null;
  }, [parsedMetadata]);

  const resolvedConfig: Config = useMemo(() => {
    const merged = { ...(configFromMeta || config) } as Config;
    const security = merged.security_layer || parsedMetadata?.security_layer;
    if (security) merged.security_layer = security;
    if (!merged.reward_code && parsedMetadata?.reward_code) {
      merged.reward_code = parsedMetadata.reward_code;
    }
    return merged;
  }, [config, configFromMeta, parsedMetadata]);

  const securityLayer = resolvedConfig.security_layer;
  const unlockMode = (resolvedConfig.unlock_mode as any) || (resolvedConfig.require_keyword_validation ? 'code_plus_keyword' : 'code');
  const revealLogic = securityLayer?.reveal_logic;
  const revealAlways = revealLogic === 'always_visible';
  const securityRequiresKeyword = securityLayer?.require_keyword === true;
  const requireKeyword = unlockMode === 'code_plus_keyword' || unlockMode === 'media_and_code' || !!resolvedConfig.require_keyword_validation || securityRequiresKeyword;
  const needsAlignment = revealLogic !== 'always_visible';
  const needsKeyword = requireKeyword || revealLogic === 'aligned_keyword';
  const alreadySolved = resolvedConfig.solved === true;

  const [freq, setFreq] = useState(resolvedConfig.start_frequency ?? 50);
  const [shift, setShift] = useState(resolvedConfig.start_shift ?? 50);
  const [chroma, setChroma] = useState(resolvedConfig.start_chromatic ?? 50);
  
  // Debounced values para performance (evita 100+ re-renders por segundo)
  const [debouncedFreq, setDebouncedFreq] = useState(freq);
  const [debouncedShift, setDebouncedShift] = useState(shift);
  const [debouncedConfig, setDebouncedConfig] = useState({ freq, shift, chroma });
  
  const [aligned, setAligned] = useState(alreadySolved || false);
  const [verified, setVerified] = useState(alreadySolved || !needsKeyword);
  const [keywordInput, setKeywordInput] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showUV, setShowUV] = useState(false);
  
  // ✅ Debounce ALL slider values together (50ms delay) - prevents desync
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedConfig({ freq, shift, chroma });
    }, 50);
    return () => clearTimeout(timer);
  }, [freq, shift, chroma]);
  
  const debouncedFreq = debouncedConfig.freq;
  const debouncedShift = debouncedConfig.shift;
  const debouncedChroma = debouncedConfig.chroma;
  const tolF = typeof resolvedConfig.tolerance_frequency === 'number' ? resolvedConfig.tolerance_frequency : 1;
  const tolS = typeof resolvedConfig.tolerance_shift === 'number' ? resolvedConfig.tolerance_shift : 2;
  const tolC = typeof resolvedConfig.tolerance_chromatic === 'number' ? resolvedConfig.tolerance_chromatic : 2;

  // Valores corretos definidos pelo Mestre no Criador
  const target = {
    f: resolvedConfig.correct_frequency,
    s: resolvedConfig.correct_shift,
    c: resolvedConfig.correct_chromatic
  };

  const rewardCapturedRef = useRef(false);
  const persistedRef = useRef(false);
  const solvedNotifiedRef = useRef(false);

  // Preload focused image
  useEffect(() => {
    if (!resolvedConfig.focused_image_url) {
      setImageLoaded(true);
      return;
    }
    
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageLoadError(false);
    };
    img.onerror = () => {
      console.error('Falha ao carregar focused_image_url:', resolvedConfig.focused_image_url);
      setImageLoaded(true);
      setImageLoadError(true);
    };
    img.src = resolvedConfig.focused_image_url;
  }, [resolvedConfig.focused_image_url]);

  const persistSolved = useCallback(async () => {
    if (persistedRef.current || alreadySolved) return;
    if (!parsedMetadata || typeof parsedMetadata !== 'object') return;

    const solvedAt = new Date().toISOString();
    const nextMetadata: Record<string, any> = { ...parsedMetadata };
    const nextGlitch = {
      ...(parsedMetadata.glitch_puzzle || resolvedConfig || {}),
      solved: true,
      solved_at: solvedAt,
    };
    nextMetadata.glitch_puzzle = nextGlitch;
    if (securityLayer) {
      nextMetadata.security_layer = { ...securityLayer, solved: true, solved_at: solvedAt };
    }

    try {
      await updateInvestigationCard(cardId, { metadata: nextMetadata } as any);
      persistedRef.current = true;
    } catch (err) {
      console.error('Falha ao persistir conclusão do glitch', err);
    }
  }, [alreadySolved, cardId, parsedMetadata, resolvedConfig, securityLayer]);

  useEffect(() => {
    // Fase 1: estabilização pelos sliders
    const isAligned =
      Math.abs(freq - target.f) <= tolF &&
      Math.abs(shift - target.s) <= tolS &&
      Math.abs(chroma - target.c) <= tolC;

    // Só marcar como alinhado após imagem carregar
    if ((isAligned || revealAlways) && !aligned && imageLoaded) {
      setAligned(true);
    }
  }, [freq, shift, chroma, target.f, target.s, target.c, aligned, revealAlways, tolF, tolS, tolC, imageLoaded]);

  const alignmentSatisfied = !needsAlignment || aligned;
  const keywordSatisfied = !needsKeyword || verified;
  const isSolved = alreadySolved || (alignmentSatisfied && keywordSatisfied);

  // Verificar proximidade para revelar pistas sem exigir alinhamento perfeito
  const isNearlyAligned = 
    Math.abs(freq - target.f) <= tolF + 3 &&
    Math.abs(shift - target.s) <= tolS + 5 &&
    Math.abs(chroma - target.c) <= tolC + 5;

  useEffect(() => {
    if (!isSolved) return;

    if (!rewardCapturedRef.current && resolvedConfig.reward_code) {
      addCollectedCode(investigationId, resolvedConfig.reward_code, cardId);
      rewardCapturedRef.current = true;
    }

    if (!solvedNotifiedRef.current) {
      solvedNotifiedRef.current = true;
      onSolved?.();
    }

    persistSolved();
  }, [isSolved, resolvedConfig.reward_code, investigationId, cardId, persistSolved, onSolved]);

  const handleVerifyKeyword = () => {
    if (!requireKeyword) return;
    const expected = (securityLayer?.keyword || resolvedConfig.correct_keyword || '').trim().toLowerCase();
    const given = keywordInput.trim().toLowerCase();
    if (!expected) {
      alert('Nenhuma assinatura configurada. Fale com o Mestre.');
      return;
    }
    if (!given) {
      alert('Digite a assinatura digital encontrada.');
      return;
    }
    if (expected === given) {
      setVerified(true);
    } else {
      alert('Assinatura incorreta. Revise a imagem.');
    }
  };

  // Revelar focused_image quando alinhado OU próximo (evita lógica de morte)
  const baseImage = (alignmentSatisfied || isNearlyAligned) && resolvedConfig.focused_image_url 
    ? resolvedConfig.focused_image_url 
    : resolvedConfig.original_image_url;
  
  // Fallback chain para UV: buscar em múltiplos caminhos possíveis
  const uvUrl = resolvedConfig.hidden_uv_url 
    || parsedMetadata?.unified_media?.uv_layer_url 
    || parsedMetadata?.image_uv_url;
  
  const currentImage = showUV && uvUrl ? uvUrl : baseImage;
  const showMedia = !!resolvedConfig.hidden_audio_url || !!resolvedConfig.hidden_video_url;
  const shouldShowReward = unlockMode === 'code' || unlockMode === 'code_plus_keyword' || unlockMode === 'media_and_code';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(resolvedConfig.reward_code || '');
    alert('✓ Chave copiada para a área de transferência!');
  };

  return (
    <div className="solver-container">
      {/* AREA DA IMAGEM - Ela se conserta conforme os valores chegam no alvo */}
      {imageLoadError && (
        <div style={{padding: 12, background: 'rgba(255,0,0,0.1)', border: '1px solid red', color: 'red', fontSize: 11, marginBottom: 8}}>
          ⚠️ Falha ao carregar imagem do puzzle. Verifique sua conexão.
        </div>
      )}
      <div className="glitch-display">
        <GlitchImageEngine
          imageUrl={currentImage}
          targetFrequency={target.f}
          targetShift={target.s}
          targetChromatic={target.c}
          playerFrequency={debouncedFreq}
          playerShift={debouncedShift}
          playerChromatic={debouncedChroma}
          solved={isSolved}
        />

        {isSolved && shouldShowReward && (
          <div className="success-overlay">
            <div className="scanline"></div>
            <div className="reward-terminal">
              <p className="terminal-log">&gt; SINCRONIZAÇÃO COMPLETA</p>
              <p className="terminal-log">&gt; ACESSO À CAMADA DE DADOS CONCEDIDO</p>
              <p className="terminal-log">&gt; EXTRAINDO CÓDIGO FONTE...</p>
              <div className="reward-code-box">
                <div className="reward-label">CHAVE DE DESCRIPTOGRAFIA:</div>
                <h2 className="reward-pass">{resolvedConfig.reward_code}</h2>
                <button className="btn-copy-key" onClick={handleCopyCode}>
                  📋 COPIAR CHAVE
                </button>
                <small className="usage-hint">Use esta chave na Mega-Pista para desbloquear o enigma final</small>
              </div>
            </div>
          </div>
        )}
        {isSolved && !shouldShowReward && showMedia && (
          <div className="success-overlay">
            <div className="reward-terminal">
              <p className="terminal-log">&gt; CONTEÚDO LIBERADO</p>
              {resolvedConfig.hidden_audio_url && (
                <div style={{marginBottom:8}}>
                  <audio controls src={resolvedConfig.hidden_audio_url} style={{width:'100%'}} />
                </div>
              )}
              {resolvedConfig.hidden_video_url && (
                <div>
                  <video controls src={resolvedConfig.hidden_video_url} style={{width:'100%', maxHeight:240}} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CONTROLES ESTILO TERMINAL */}
      {!isSolved && (
        <div className="solver-controls">
          <div className="controls-header">
            <div className="status-indicator">
              <span className="pulse-dot"></span>
              {alignmentSatisfied ? (needsKeyword ? 'ASSINATURA DIGITAL PENDENTE' : 'CAMADA DE DADOS PRONTA') : 'CALIBRANDO SISTEMA DE SINCRONIZAÇÃO'}
            </div>
            {resolvedConfig.hint && (
              <div className="solver-hint">💡 {resolvedConfig.hint}</div>
            )}
          </div>

          {alignmentSatisfied && uvUrl && (
            <div className="uv-toggle">
              <button className={`btn-uv ${showUV ? 'active' : ''}`} onClick={() => setShowUV(prev => !prev)}>
                {showUV ? 'DESATIVAR UV' : 'ATIVAR UV'}
              </button>
              <small>Algumas assinaturas podem aparecer apenas na camada UV.</small>
            </div>
          )}

          {alignmentSatisfied && needsKeyword && (
            <div className="keyword-panel attention">
              <div className="keyword-label">VERIFICAR ASSINATURA DIGITAL</div>
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                placeholder="Digite a palavra/número extraído da imagem"
                autoFocus
              />
              <button className="upload-btn" onClick={handleVerifyKeyword}>Validar</button>
            </div>
          )}

          <div className="slider-group">
            <label>
              <span className="slider-label-text">CALIBRAGEM DE SINAL (FREQ)</span>
              <span className="slider-value">{freq}</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={freq} 
              onChange={e => setFreq(+e.target.value)} 
              className="glitch-slider"
              disabled={alignmentSatisfied && !needsKeyword}
            />
            <div className="slider-track-bg"></div>
          </div>

          <div className="slider-group">
            <label>
              <span className="slider-label-text">ESTABILIZADOR DE IMAGEM (SHIFT)</span>
              <span className="slider-value">{shift}</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={shift} 
              onChange={e => setShift(+e.target.value)} 
              className="glitch-slider"
              disabled={alignmentSatisfied && !needsKeyword}
            />
            <div className="slider-track-bg"></div>
          </div>

          <div className="slider-group">
            <label>
              <span className="slider-label-text">ALINHAMENTO DE LENTES (CHROMA)</span>
              <span className="slider-value">{chroma}</span>
            </label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={chroma} 
              onChange={e => setChroma(+e.target.value)} 
              className="glitch-slider"
              disabled={alignmentSatisfied && !needsKeyword}
            />
            <div className="slider-track-bg"></div>
          </div>

          <div className="solver-footer">
            <div className="sync-status">
              {Math.abs(freq - target.f) <= tolF && <span className="sync-ok">✓ FREQ</span>}
              {Math.abs(shift - target.s) <= tolS && <span className="sync-ok">✓ SHIFT</span>}
              {Math.abs(chroma - target.c) <= tolC && <span className="sync-ok">✓ CHROMA</span>}
            </div>
            {alignmentSatisfied && !needsKeyword && showMedia && (
              <div className="keyword-panel" style={{marginTop:12}}>
                <div className="keyword-label">MÍDIA OCULTA</div>
                {resolvedConfig.hidden_audio_url && (
                  <div style={{marginBottom:8}}>
                    <audio controls src={resolvedConfig.hidden_audio_url} style={{width:'100%'}} />
                  </div>
                )}
                {resolvedConfig.hidden_video_url && (
                  <div>
                    <video controls src={resolvedConfig.hidden_video_url} style={{width:'100%', maxHeight:220}} />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
