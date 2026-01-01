import React, { useState, useEffect, useRef } from 'react';
import { updateInvestigationCard } from '../../api/investigations';
import GlitchMaker from './GlitchMaker';
import { addCollectedCode, isPuzzleSolved } from '../../utils/codeTracking';
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
  hint?: string;
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
  const [playerFreq, setPlayerFreq] = useState(17);
  const [playerShift, setPlayerShift] = useState(33);
  const [playerChroma, setPlayerChroma] = useState(12);
  const [feedback, setFeedback] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const glitchMakerRef = useRef<any>(null);

  // Carregar estado salvo
  useEffect(() => {
    const alreadySolved = isPuzzleSolved(investigationId, cardId);
    if (alreadySolved || puzzleData.solved) {
      setSolved(true);
      setShowReveal(true);
    }
  }, [cardId, investigationId, puzzleData.solved]);

  const handleSubmit = async () => {
    setAttempts(prev => prev + 1);
    setFeedback('');

    // Verificar se os parâmetros estão corretos
    const freqCorrect = Math.abs(playerFreq - puzzleData.correct_frequency) <= 1;
    const shiftCorrect = Math.abs(playerShift - puzzleData.correct_shift) <= 2;
    const chromaCorrect = Math.abs(playerChroma - puzzleData.correct_chromatic) <= 2;

    if (freqCorrect && shiftCorrect && chromaCorrect) {
      // Correto!
      setFeedback('✓ DECODIFICAÇÃO BEM-SUCEDIDA!');
      setShowReveal(true);
      setSolved(true);

      // Salvar código coletado usando sistema de tracking
      addCollectedCode(investigationId, puzzleData.reward_code, cardId);

      // Salvar no Supabase
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

        // Chamar callback
        if (onSolved) {
          setTimeout(() => onSolved(puzzleData.reward_code), 800);
        }
      } catch (err) {
        console.error('Erro ao salvar solução:', err);
      } finally {
        setLoading(false);
      }
    } else {
      // Incorreto - dar feedback
      const errors = [];
      if (!freqCorrect) errors.push(`Frequência: ${puzzleData.correct_frequency} ≠ ${playerFreq}`);
      if (!shiftCorrect) errors.push(`Deslocamento: ${puzzleData.correct_shift} ≠ ${playerShift}`);
      if (!chromaCorrect) errors.push(`Cromática: ${puzzleData.correct_chromatic} ≠ ${playerChroma}`);
      
      setFeedback(`✗ Parâmetros incorretos (Tentativa ${attempts + 1})\n\n${errors.join('\n')}`);

      // Shake animation
      const elem = document.querySelector(`[data-puzzle-id="${cardId}"]`);
      if (elem) {
        elem.classList.add('shake');
        setTimeout(() => elem.classList.remove('shake'), 500);
      }
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
            <img src={puzzleData.original_image_url} alt="Original Decodificada" />
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

        {/* Imagem Corrompida */}
        <div className="corrupted-image">
          <img src={puzzleData.corrupted_image_url} alt="Imagem Corrompida" />
          <div className="corrupted-label">IMAGEM CORROMPIDA - NECESSITA DECODIFICAÇÃO</div>
        </div>

        {/* Dica */}
        {puzzleData.hint && (
          <div className="hint-section">
            <div className="hint-title">💡 DICA:</div>
            <div className="hint-text">{puzzleData.hint}</div>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <div className={`feedback-box ${feedback.startsWith('✓') ? 'success' : 'error'}`}>
            {feedback}
          </div>
        )}

        {/* Controles */}
        <div className="controls-section">
          <h3>AJUSTE OS PARÂMETROS PARA DECODIFICAR:</h3>

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
              disabled={loading}
              className="slider"
            />
            <small>Intervalo esperado: 1-50</small>
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
              disabled={loading}
              className="slider"
            />
            <small>Intervalo esperado: 0-100%</small>
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
              disabled={loading}
              className="slider"
            />
            <small>Intervalo esperado: 0-100%</small>
          </div>

          <button
            className="btn btn-submit"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'VERIFICANDO...' : 'ENVIAR DECODIFICAÇÃO'}
          </button>
        </div>

        {attempts > 0 && !solved && (
          <div className="attempts-info">
            Tentativas: {attempts}
          </div>
        )}
      </div>
    </div>
  );
}
