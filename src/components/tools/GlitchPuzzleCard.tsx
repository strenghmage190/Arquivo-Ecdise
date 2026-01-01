import React, { useEffect, useRef, useState } from 'react';
import { updateInvestigationCard } from '../../api/investigations';
import { addCollectedCode, isPuzzleSolved } from '../../utils/codeTracking';
import GlitchImageEngine from './GlitchImageEngine';
import './GlitchPuzzleCard.css';

interface GlitchPuzzleData {
  id: string;
  title: string;
  description: string;
  original_image_url: string;
  corrupted_image_url: string;
  correct_frequency: number;
  correct_shift: number;
  correct_chromatic: number;
  start_frequency?: number;
  start_shift?: number;
  start_chromatic?: number;
  hint?: string;
  access_instructions?: string;
  reward_code: string;
  solved: boolean;
}

interface Props {
  cardId: string;
  investigationId: string;
  puzzleData: GlitchPuzzleData;
  onSolved?: (rewardCode: string) => void;
  onClose?: () => void;
}

export default function GlitchPuzzleCard({ 
  cardId, 
  investigationId, 
  puzzleData, 
  onSolved,
  onClose 
}: Props) {
  const [solved, setSolved] = useState(puzzleData.solved);
  const [showReveal, setShowReveal] = useState(false);
  const [playerFreq, setPlayerFreq] = useState(puzzleData.start_frequency ?? 17);
  const [playerShift, setPlayerShift] = useState(puzzleData.start_shift ?? 33);
  const [playerChroma, setPlayerChroma] = useState(puzzleData.start_chromatic ?? 12);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([
    '[LOG]: Decodificador iniciado. Ajuste os sliders até estabilizar a imagem.'
  ]);
  const [justSolved, setJustSolved] = useState(false);
  const baseImage = puzzleData.original_image_url || puzzleData.corrupted_image_url;
  const solvedOnceRef = useRef(false);

  // Carregar estado salvo
  useEffect(() => {
    const alreadySolved = isPuzzleSolved(investigationId, cardId);
    if (alreadySolved || puzzleData.solved) {
      setSolved(true);
      setShowReveal(true);
    }
    // refresh starting values if the metadata was updated
    setPlayerFreq(puzzleData.start_frequency ?? 17);
    setPlayerShift(puzzleData.start_shift ?? 33);
    setPlayerChroma(puzzleData.start_chromatic ?? 12);
  }, [cardId, investigationId, puzzleData.solved, puzzleData.start_chromatic, puzzleData.start_frequency, puzzleData.start_shift]);

  useEffect(() => {
    if (!baseImage) return;
    if (solved || solvedOnceRef.current) return;

    const freqCorrect = Math.abs(playerFreq - puzzleData.correct_frequency) <= 1;
    const shiftCorrect = Math.abs(playerShift - puzzleData.correct_shift) <= 2;
    const chromaCorrect = Math.abs(playerChroma - puzzleData.correct_chromatic) <= 2;
    const allCorrect = freqCorrect && shiftCorrect && chromaCorrect;

    if (allCorrect) {
      solvedOnceRef.current = true;
      handleSolved();
    }
  }, [baseImage, playerFreq, playerShift, playerChroma, puzzleData.correct_frequency, puzzleData.correct_shift, puzzleData.correct_chromatic, solved]);

  useEffect(() => {
    if (solved && !solvedOnceRef.current) {
      solvedOnceRef.current = true;
      setLogs(prev => [
        ...prev,
        '[LOG]: Sistema já restaurado.',
        `[LOG]: Código de acesso: ${puzzleData.reward_code}`
      ]);
    }
  }, [puzzleData.reward_code, solved]);

  const handleSolved = async () => {
    if (solved) return;
    setSolved(true);
    setShowReveal(true);
    setJustSolved(true);
    setLogs(prev => [
      ...prev,
      '[LOG]: SISTEMA RESTAURADO — imagem estabilizada.',
      `[LOG]: Fragmento recuperado. Código de acesso gerado: ${puzzleData.reward_code}`
    ]);

    // Salvar código coletado usando sistema de tracking
    addCollectedCode(investigationId, puzzleData.reward_code, cardId);

    setLoading(true);
    try {
      const newMetadata = {
        glitch_puzzle: {
          ...puzzleData,
          solved: true,
        }
      };

      await updateInvestigationCard(cardId, {
        metadata: newMetadata,
      });

      if (onSolved) {
        setTimeout(() => onSolved(puzzleData.reward_code), 500);
      }
    } catch (err) {
      console.error('Erro ao salvar solução:', err);
    } finally {
      setLoading(false);
    }
  };

  if (solved && showReveal) {
    return (
      <div className="glitch-puzzle-card" data-puzzle-id={cardId}>
        <div className="puzzle-header">
          <h2>{puzzleData.title}</h2>
          {onClose && (
            <button className="close-btn" onClick={onClose}>✖</button>
          )}
        </div>

        <div className="puzzle-content solved">
          <div className="success-banner">
            <div className="success-animation">✓</div>
            <div className="success-text">DECODIFICAÇÃO COMPLETA</div>
          </div>

          <div className="image-reveal">
            <img src={puzzleData.original_image_url || baseImage} alt="Original Decodificada" />
            <div className="decode-label">IMAGEM ORIGINAL REVELADA</div>
          </div>

          <div className="reward-section">
            <h3>🎁 CÓDIGO DE RECOMPENSA DESBLOQUEADO</h3>
            <div className="reward-code">
              {puzzleData.reward_code}
            </div>
            <p className="reward-message">
              Você desbloqueou este código. Use-o na MEGA-PISTA para avançar no desbloqueio final.
            </p>
          </div>

          <div className="solution-display">
            <h3>⚙️ PARÂMETROS QUE FUNCIONARAM:</h3>
            <div className="params-grid">
              <div className="param-item">
                <div className="param-label">Frequência</div>
                <div className="param-value">{puzzleData.correct_frequency}</div>
              </div>
              <div className="param-item">
                <div className="param-label">Deslocamento</div>
                <div className="param-value">{puzzleData.correct_shift}%</div>
              </div>
              <div className="param-item">
                <div className="param-label">Cromática</div>
                <div className="param-value">{puzzleData.correct_chromatic}%</div>
              </div>
            </div>
          </div>

          {onClose && (
            <button className="btn btn-close" onClick={onClose}>
              FECHAR
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="glitch-puzzle-card" data-puzzle-id={cardId}>
      <div className="puzzle-header">
        <h2>{puzzleData.title}</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>✖</button>
        )}
      </div>

      <div className="puzzle-content">
        <p className="puzzle-description">{puzzleData.description}</p>

        <div className="glitch-visual">
          <div className="glitch-visual-header">
            <span>Imagem alvo</span>
            <span className="hint-chip">Ajuste para limpar</span>
          </div>
          {baseImage ? (
            <GlitchImageEngine
              imageUrl={baseImage}
              targetFrequency={puzzleData.correct_frequency}
              targetShift={puzzleData.correct_shift}
              targetChromatic={puzzleData.correct_chromatic}
              playerFrequency={solved ? puzzleData.correct_frequency : playerFreq}
              playerShift={solved ? puzzleData.correct_shift : playerShift}
              playerChromatic={solved ? puzzleData.correct_chromatic : playerChroma}
              solved={solved}
            />
          ) : (
            <div className="glitch-visual-placeholder">Nenhuma imagem encontrada.</div>
          )}
          {justSolved && (
            <div className="restored-banner">
              <div className="restored-icon">✓</div>
              <div>
                <div className="restored-title">SISTEMA RESTAURADO</div>
                <div className="restored-sub">Imagem estabilizada</div>
              </div>
            </div>
          )}
        </div>

        {/* Como jogar */}
        {puzzleData.access_instructions && (
          <div className="hint-section">
            <div className="hint-title">▶ COMO ACESSAR</div>
            <div className="hint-text">{puzzleData.access_instructions}</div>
          </div>
        )}

        {/* Dica */}
        {puzzleData.hint && (
          <div className="hint-section">
            <div className="hint-title">💡 DICA:</div>
            <div className="hint-text">{puzzleData.hint}</div>
          </div>
        )}

        <div className="controls-section">
          <h3>⚙️ CALIBRAÇÃO DO DECODIFICADOR</h3>
          <p className="calibration-hint">Ajuste os controles até a imagem estabilizar. Quando os valores coincidirem com os da transmissão original, o sistema será restaurado.</p>

          <div className="param-control">
            <label>
              Frequência de Fatias: <strong>{playerFreq}</strong>
            </label>
            <input
              type="range"
              min="1"
              max="50"
              value={playerFreq}
              onChange={e => setPlayerFreq(parseInt(e.target.value))}
              disabled={loading || solved}
              className="slider"
            />
            <small>Alinhe para reduzir as fatias horizontais.</small>
          </div>

          <div className="param-control">
            <label>
              Intensidade de Deslocamento: <strong>{playerShift}%</strong>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={playerShift}
              onChange={e => setPlayerShift(parseInt(e.target.value))}
              disabled={loading || solved}
              className="slider"
            />
            <small>Quanto mais longe, mais a imagem se desloca lateralmente.</small>
          </div>

          <div className="param-control">
            <label>
              Corrupção Cromática: <strong>{playerChroma}%</strong>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={playerChroma}
              onChange={e => setPlayerChroma(parseInt(e.target.value))}
              disabled={loading || solved}
              className="slider"
            />
            <small>Reduza para remover a aberração de cores.</small>
          </div>
        </div>

        <div className="terminal">
          <div className="terminal-header">LOG DE RECUPERAÇÃO</div>
          <div className="terminal-body">
            {logs.map((line, idx) => (
              <div key={`${line}-${idx}`} className="terminal-line">{line}</div>
            ))}
          </div>
        </div>

        {solved && (
          <div className="reward-section">
            <h3>🎁 CÓDIGO DE RECOMPENSA DESBLOQUEADO</h3>
            <div className="reward-code">
              {puzzleData.reward_code}
            </div>
            <p className="reward-message">
              Copie este código e utilize na MEGA-PISTA.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
