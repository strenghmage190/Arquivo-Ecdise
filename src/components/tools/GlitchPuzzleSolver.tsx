import React, { useState, useEffect } from 'react';
import GlitchImageEngine from './GlitchImageEngine';
import { addCollectedCode } from '../../utils/codeTracking';
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
  onSolved?: () => void;
}

export default function GlitchPuzzleSolver({ config, investigationId, cardId, onSolved }: Props) {
  const [freq, setFreq] = useState(config.start_frequency ?? 50);
  const [shift, setShift] = useState(config.start_shift ?? 50);
  const [chroma, setChroma] = useState(config.start_chromatic ?? 50);
  const [aligned, setAligned] = useState(false);
  const [verified, setVerified] = useState(false);
  const [keywordInput, setKeywordInput] = useState('');
  const unlockMode = (config.unlock_mode as any) || (config.require_keyword_validation ? 'code_plus_keyword' : 'code');
  const revealLogic = config.security_layer?.reveal_logic;
  const revealAlways = revealLogic === 'always_visible';
  const securityRequiresKeyword = config.security_layer?.require_keyword === true;
  const requireKeyword = unlockMode === 'code_plus_keyword' || unlockMode === 'media_and_code' || !!config.require_keyword_validation || securityRequiresKeyword;
  const [showUV, setShowUV] = useState(false);
  const tolF = typeof config.tolerance_frequency === 'number' ? config.tolerance_frequency : 1;
  const tolS = typeof config.tolerance_shift === 'number' ? config.tolerance_shift : 2;
  const tolC = typeof config.tolerance_chromatic === 'number' ? config.tolerance_chromatic : 2;

  // Valores corretos definidos pelo Mestre no Criador
  const target = {
    f: config.correct_frequency,
    s: config.correct_shift,
    c: config.correct_chromatic
  };

  useEffect(() => {
    // Fase 1: estabilização pelos sliders
    const isAligned =
      Math.abs(freq - target.f) <= tolF &&
      Math.abs(shift - target.s) <= tolS &&
      Math.abs(chroma - target.c) <= tolC;

    if ((isAligned || revealAlways) && !aligned) {
      setAligned(true);
    }
  }, [freq, shift, chroma, target.f, target.s, target.c, aligned, revealAlways, tolF, tolS, tolC]);

  const handleVerifyKeyword = () => {
    if (!requireKeyword) return;
    const expected = (config.security_layer?.keyword || config.correct_keyword || '').trim().toLowerCase();
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
      if (config.reward_code) {
        addCollectedCode(investigationId, config.reward_code, cardId);
      }
      onSolved?.();
    } else {
      alert('Assinatura incorreta. Revise a imagem.');
    }
  };

  const isSolved = requireKeyword ? verified : aligned;
  const baseImage = isSolved && config.focused_image_url ? config.focused_image_url : config.original_image_url;
  const currentImage = showUV && config.hidden_uv_url ? config.hidden_uv_url : baseImage;
  const showMedia = !!config.hidden_audio_url || !!config.hidden_video_url;
  const shouldShowReward = unlockMode === 'code' || unlockMode === 'code_plus_keyword' || unlockMode === 'media_and_code';

  const handleCopyCode = () => {
    navigator.clipboard.writeText(config.reward_code);
    alert('✓ Chave copiada para a área de transferência!');
  };

  return (
    <div className="solver-container">
      {/* AREA DA IMAGEM - Ela se conserta conforme os valores chegam no alvo */}
      <div className="glitch-display">
        <GlitchImageEngine
          imageUrl={currentImage}
          targetFrequency={target.f}
          targetShift={target.s}
          targetChromatic={target.c}
          playerFrequency={freq}
          playerShift={shift}
          playerChromatic={chroma}
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
                <h2 className="reward-pass">{config.reward_code}</h2>
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
              {config.hidden_audio_url && (
                <div style={{marginBottom:8}}>
                  <audio controls src={config.hidden_audio_url} style={{width:'100%'}} />
                </div>
              )}
              {config.hidden_video_url && (
                <div>
                  <video controls src={config.hidden_video_url} style={{width:'100%', maxHeight:240}} />
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
              {aligned ? 'ASSINATURA DIGITAL PENDENTE' : 'CALIBRANDO SISTEMA DE SINCRONIZAÇÃO'}
            </div>
            {config.hint && (
              <div className="solver-hint">💡 {config.hint}</div>
            )}
          </div>

          {aligned && config.hidden_uv_url && (
            <div className="uv-toggle">
              <button className={`btn-uv ${showUV ? 'active' : ''}`} onClick={() => setShowUV(prev => !prev)}>
                {showUV ? 'DESATIVAR UV' : 'ATIVAR UV'}
              </button>
              <small>Algumas assinaturas podem aparecer apenas na camada UV.</small>
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
              disabled={aligned}
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
              disabled={aligned}
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
              disabled={aligned}
            />
            <div className="slider-track-bg"></div>
          </div>

          <div className="solver-footer">
            <div className="sync-status">
              {Math.abs(freq - target.f) <= tolF && <span className="sync-ok">✓ FREQ</span>}
              {Math.abs(shift - target.s) <= tolS && <span className="sync-ok">✓ SHIFT</span>}
              {Math.abs(chroma - target.c) <= tolC && <span className="sync-ok">✓ CHROMA</span>}
            </div>
            {aligned && requireKeyword && (
              <div className="keyword-panel">
                <div className="keyword-label">VERIFICAR ASSINATURA DIGITAL</div>
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Digite a palavra/número extraído da imagem"
                />
                <button className="btn-verify" onClick={handleVerifyKeyword}>Validar</button>
              </div>
            )}
            {aligned && !requireKeyword && showMedia && (
              <div className="keyword-panel" style={{marginTop:12}}>
                <div className="keyword-label">MÍDIA OCULTA</div>
                {config.hidden_audio_url && (
                  <div style={{marginBottom:8}}>
                    <audio controls src={config.hidden_audio_url} style={{width:'100%'}} />
                  </div>
                )}
                {config.hidden_video_url && (
                  <div>
                    <video controls src={config.hidden_video_url} style={{width:'100%', maxHeight:220}} />
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
