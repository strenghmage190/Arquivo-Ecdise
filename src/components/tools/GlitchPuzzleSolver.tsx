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
  
  // ✅ FIXED: Removido shadowing - apenas debouncedConfig agora (estados desnecessários removidos)
  const [aligned, setAligned] = useState(alreadySolved || false);
  const [isAligned, setIsAligned] = useState(false); // player has aligned sliders but hasn't confirmed
  const [verified, setVerified] = useState(alreadySolved || !needsKeyword);
  const [keywordInput, setKeywordInput] = useState('');
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageLoadError, setImageLoadError] = useState(false);
  const [showUV, setShowUV] = useState(false);
  
  // Using immediate slider values for real-time feedback
  const debouncedFreq = freq;
  const debouncedShift = shift;
  const debouncedChroma = chroma;
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

  // Computed solved state (moved up so other effects can reference it)
  // Computed solved state (moved up so other effects can reference it)
  const alignmentSatisfied = !needsAlignment || aligned;
  const keywordSatisfied = !needsKeyword || verified;
  const isSolved = alreadySolved || (alignmentSatisfied && keywordSatisfied);

  useEffect(() => {
    // Fase 1: detectar quando sliders estão aproximadamente corretos,
    // mas NÃO resolver o puzzle automaticamente — apenas habilitar o botão de confirmação.
    if (isSolved) return;

    const freqCorrect = Math.abs(freq - target.f) <= tolF;
    const shiftCorrect = Math.abs(shift - target.s) <= tolS;
    const chromaCorrect = Math.abs(chroma - target.c) <= tolC;

    // Consider revealAlways: if the security layer requests always-visible, treat as aligned
    const ready = (revealAlways && imageLoaded) || (freqCorrect && shiftCorrect && chromaCorrect);
    setIsAligned(Boolean(ready));
  }, [freq, shift, chroma, target.f, target.s, target.c, revealAlways, tolF, tolS, tolC, imageLoaded, isSolved]);

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

  const validateSecurityLayer = (securityLayer) => {
    if (securityLayer?.require_keyword && !securityLayer?.keyword) {
      console.error('A camada de segurança requer uma palavra-chave, mas nenhuma foi fornecida.');
    }
    if (securityLayer?.reveal_logic === 'aligned_keyword' && !securityLayer?.keyword) {
      console.error('A lógica de revelação exige uma palavra-chave alinhada, mas nenhuma foi fornecida.');
    }
  };

  useEffect(() => {
    validateSecurityLayer(resolvedConfig.security_layer);
  }, [resolvedConfig.security_layer]);

  // Adicionar estado para monitorar nitidez
  const [clarity, setClarity] = useState(0);

  // Atualizar nitidez dinamicamente com base nos valores do GlitchImageEngine
  useEffect(() => {
    const freqCorrect = Math.abs(freq - target.f) <= tolF;
    const shiftCorrect = Math.abs(shift - target.s) <= tolS;
    const chromaCorrect = Math.abs(chroma - target.c) <= tolC;

    const normalized = clamp01((Math.abs(freq - target.f) / 50) + (Math.abs(shift - target.s) / 100) + (Math.abs(chroma - target.c) / 100));
    const newClarity = clamp01(1 - normalized * 0.85);
    setClarity(newClarity);
  }, [freq, shift, chroma, target.f, target.s, target.c, tolF, tolS, tolC]);

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
              <span className="sync-ok">Nitidez: {Math.round(clarity * 100)}%</span>
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
          {/* Botão de confirmação — jogador confirma após alinhar os sliders */}
          <div style={{marginTop:12, display:'flex', justifyContent:'center'}}>
            <button
              className="btn-submit"
              onClick={() => setAligned(true)}
              disabled={!isAligned || aligned}
              style={{ padding: '10px 14px', fontSize: 13, cursor: !isAligned || aligned ? 'not-allowed' : 'pointer' }}
            >
              {isAligned ? '✓ DECODIFICAR IMAGEM' : 'AGUARDANDO ALINHAMENTO...'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to clamp a value between 0 and 1
function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
