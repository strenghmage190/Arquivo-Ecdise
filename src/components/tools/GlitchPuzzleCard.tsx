import React, { useEffect, useRef, useState } from 'react';
import { playLockIn } from '../../utils/sound';
import { updateInvestigationCard } from '../../api/investigations';
import { addCollectedCode, isPuzzleSolved } from '../../utils/codeTracking';
import { useDisplayConfig } from '../../config/displayConfig';
import GlitchImageEngine from './GlitchImageEngine';
import { validateGlitchPuzzleData } from '../../utils/validationSchemas';
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
  onSolved?: (rewardCode: string, cardUpdates?: any) => void;
  onClose?: () => void;
  isGameMaster?: boolean;
}

export default function GlitchPuzzleCard({ 
  cardId, 
  investigationId, 
  puzzleData, 
  onSolved,
  onClose,
  isGameMaster = false
}: Props) {
  const displayConfig = useDisplayConfig();
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
  const [isAligned, setIsAligned] = useState(false);
  const [isFreqCorrect, setIsFreqCorrect] = useState(false);
  const [isShiftCorrect, setIsShiftCorrect] = useState(false);
  const [isChromaCorrect, setIsChromaCorrect] = useState(false);

  const prevFreqCorrectRef = useRef(false);
  const prevShiftCorrectRef = useRef(false);
  const prevChromaCorrectRef = useRef(false);

  // Reset correctness tracking when puzzle/card changes
  useEffect(() => {
    prevFreqCorrectRef.current = false;
    prevShiftCorrectRef.current = false;
    prevChromaCorrectRef.current = false;
    setIsFreqCorrect(false);
    setIsShiftCorrect(false);
    setIsChromaCorrect(false);
    setIsAligned(false);
  }, [cardId, puzzleData.id]);
  
  // ✅ EDIÇÃO DE PUZZLE - Estados de Edição
  const [isEditing, setIsEditing] = useState(false);
  const [editedMetadata, setEditedMetadata] = useState<any>({
    correct_frequency: puzzleData.correct_frequency,
    correct_shift: puzzleData.correct_shift,
    correct_chromatic: puzzleData.correct_chromatic,
    start_frequency: puzzleData.start_frequency ?? 17,
    start_shift: puzzleData.start_shift ?? 33,
    start_chromatic: puzzleData.start_chromatic ?? 12,
    hint: puzzleData.hint || '',
    access_instructions: puzzleData.access_instructions || '',
    difficulty: 'hard', // default
  });
  
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

  // Load saved progress from localStorage when component mounts
  useEffect(() => {
    try {
      const key = `glitch_puzzle_${cardId}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        const obj = JSON.parse(raw);
        if (typeof obj.freq === 'number') setPlayerFreq(obj.freq);
        if (typeof obj.shift === 'number') setPlayerShift(obj.shift);
        if (typeof obj.chroma === 'number') setPlayerChroma(obj.chroma);
      }
    } catch (e) {}
  }, [cardId]);

  // Persist progress when sliders change
  useEffect(() => {
    try {
      const key = `glitch_puzzle_${cardId}`;
      const payload = { freq: playerFreq, shift: playerShift, chroma: playerChroma };
      localStorage.setItem(key, JSON.stringify(payload));
    } catch (e) {}
  }, [playerFreq, playerShift, playerChroma, cardId]);

  useEffect(() => {
    if (!baseImage) return;
    if (solved || solvedOnceRef.current) return;

    const freqCorrect = Math.abs(playerFreq - puzzleData.correct_frequency) <= 1;
    const shiftCorrect = Math.abs(playerShift - puzzleData.correct_shift) <= 2;
    const chromaCorrect = Math.abs(playerChroma - puzzleData.correct_chromatic) <= 2;
    const allCorrect = freqCorrect && shiftCorrect && chromaCorrect;

    // Visual states
    setIsFreqCorrect(freqCorrect);
    setIsShiftCorrect(shiftCorrect);
    setIsChromaCorrect(chromaCorrect);

    // Play a short feedback sound when a parameter becomes correct (only once per param)
    try {
      if (freqCorrect && !prevFreqCorrectRef.current) {
        prevFreqCorrectRef.current = true;
        try { playLockIn(); } catch (e) {}
      }
      if (shiftCorrect && !prevShiftCorrectRef.current) {
        prevShiftCorrectRef.current = true;
        try { playLockIn(); } catch (e) {}
      }
      if (chromaCorrect && !prevChromaCorrectRef.current) {
        prevChromaCorrectRef.current = true;
        try { playLockIn(); } catch (e) {}
      }
    } catch (e) {}

    // Set aligned state but DO NOT auto-resolve; require player confirmation
    setIsAligned(allCorrect);
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
      const updates: any = {
        // Atualiza a imagem principal do card para a imagem resolvida
        image_url: puzzleData.original_image_url,

        // Atualiza os metadados para marcar o puzzle como resolvido
        metadata: {
          ...puzzleData,
          solved: true,
        }
      };

      // 1) Atualiza no banco de dados
      await updateInvestigationCard(cardId, updates);

      // 2) Aviso ao componente pai para atualizar a UI imediatamente
      if (onSolved) {
        setTimeout(() => onSolved(puzzleData.reward_code, updates), 500);
      }
    } catch (err) {
      console.error('Erro ao salvar solução:', err);
    } finally {
      setLoading(false);
    }
  };

  // ✅ EDIÇÃO DE PUZZLE - Handler para atualizar campos editados
  const handleEditChange = (field: string, value: any) => {
    setEditedMetadata((prev: any) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ✅ EDIÇÃO DE PUZZLE - Handler para salvar mudanças
  const handleSaveChanges = async () => {
    setLoading(true);
    try {
      // Preparar dados para validação
      const glitchData = {
        frequency: editedMetadata.correct_frequency,
        shift: editedMetadata.correct_shift,
        chromatic_aberration: editedMetadata.correct_chromatic,
        initial_frequency: editedMetadata.start_frequency,
        initial_shift: editedMetadata.start_shift,
        initial_chromatic_aberration: editedMetadata.start_chromatic,
        hint: editedMetadata.hint,
        access_instructions: editedMetadata.access_instructions,
      };

      // ✅ Validação com Zod
      const validation = validateGlitchPuzzleData(glitchData);
      if (!validation.success) {
        const errorMsg = (validation.errors || []).join('\n');
        alert(`❌ Erro de validação:\n${errorMsg}`);
        setLoading(false);
        return;
      }

      // Preparar objeto de atualização
      const updates = {
        metadata: {
          glitch_puzzle: {
            ...puzzleData,
            correct_frequency: editedMetadata.correct_frequency,
            correct_shift: editedMetadata.correct_shift,
            correct_chromatic: editedMetadata.correct_chromatic,
            start_frequency: editedMetadata.start_frequency,
            start_shift: editedMetadata.start_shift,
            start_chromatic: editedMetadata.start_chromatic,
            hint: editedMetadata.hint,
            access_instructions: editedMetadata.access_instructions,
          },
        },
      };

      // ✅ Chamada Supabase para atualizar o card
      await updateInvestigationCard(cardId, updates);
      
      console.log('📝 Mudanças salvas:', updates);
      alert('✅ Configurações salvas com sucesso!');
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao salvar mudanças:', err);
      alert('❌ Erro ao salvar mudanças. Veja o console.');
    } finally {
      setLoading(false);
    }
  };

  if (solved && showReveal) {
    return (
      <div className="glitch-puzzle-card" data-puzzle-id={cardId}>
        <div className="puzzle-header">
          <h2>{puzzleData.title}</h2>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* ✅ Botão de Edição - Visível apenas para GMs */}
            {isGameMaster && (
              <button 
                className="btn-edit" 
                onClick={() => setIsEditing(true)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  background: 'rgba(0, 150, 136, 0.8)',
                  border: '1px solid rgba(0, 200, 180, 0.3)',
                  color: '#00ff88',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                title="Editar configurações do puzzle"
              >
                ⚙️ Editar
              </button>
            )}
            {onClose && (
              <button className="close-btn" onClick={onClose}>✖</button>
            )}
          </div>
        </div>

        <div className="puzzle-content solved">
          {/* ✅ MODO DE EDIÇÃO - Renderizado quando isEditing === true */}
          {isEditing && (
            <div style={{
              background: 'rgba(0, 150, 136, 0.05)',
              border: '2px solid rgba(0, 200, 180, 0.3)',
              borderRadius: '8px',
              padding: '16px',
              marginBottom: '16px',
            }}>
              <h3 style={{ margin: '0 0 16px 0', color: '#00ff88' }}>⚙️ EDITAR CONFIGURAÇÕES</h3>
              
              {/* Parâmetros Corretos */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>PARÂMETROS CORRETOS</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                    Frequência Correta: <strong style={{ color: '#00ff88' }}>{editedMetadata.correct_frequency}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedMetadata.correct_frequency}
                    onChange={(e) => handleEditChange('correct_frequency', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedMetadata.correct_frequency}
                    onChange={(e) => handleEditChange('correct_frequency', parseInt(e.target.value))}
                    style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,180,0.2)', color: '#0f0', fontSize: '11px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                    Deslocamento Correto (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.correct_shift}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedMetadata.correct_shift}
                    onChange={(e) => handleEditChange('correct_shift', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedMetadata.correct_shift}
                    onChange={(e) => handleEditChange('correct_shift', parseInt(e.target.value))}
                    style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,180,0.2)', color: '#0f0', fontSize: '11px' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                    Cromática Correta (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.correct_chromatic}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedMetadata.correct_chromatic}
                    onChange={(e) => handleEditChange('correct_chromatic', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editedMetadata.correct_chromatic}
                    onChange={(e) => handleEditChange('correct_chromatic', parseInt(e.target.value))}
                    style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,180,0.2)', color: '#0f0', fontSize: '11px' }}
                  />
                </div>
              </div>

              {/* Parâmetros Iniciais */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>PARÂMETROS INICIAIS (Dificuldade)</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                    Frequência Inicial: <strong style={{ color: '#00ff88' }}>{editedMetadata.start_frequency}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedMetadata.start_frequency}
                    onChange={(e) => handleEditChange('start_frequency', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                    Deslocamento Inicial (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.start_shift}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedMetadata.start_shift}
                    onChange={(e) => handleEditChange('start_shift', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                    Cromática Inicial (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.start_chromatic}</strong>
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedMetadata.start_chromatic}
                    onChange={(e) => handleEditChange('start_chromatic', parseInt(e.target.value))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Textos */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>TEXTOS E PISTAS</h4>
                
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>Instruções de Acesso</label>
                  <textarea
                    value={editedMetadata.access_instructions}
                    onChange={(e) => handleEditChange('access_instructions', e.target.value)}
                    placeholder="Ex: Sintonize a frequência do sinal portador..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,180,0.2)',
                      color: '#0f0',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      borderRadius: '4px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>Dica</label>
                  <textarea
                    value={editedMetadata.hint}
                    onChange={(e) => handleEditChange('hint', e.target.value)}
                    placeholder="Ex: Preste atenção ao padrão de interferência..."
                    style={{
                      width: '100%',
                      minHeight: '60px',
                      padding: '8px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '1px solid rgba(0,200,180,0.2)',
                      color: '#0f0',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      borderRadius: '4px',
                    }}
                  />
                </div>
              </div>

              {/* Botões de Ação */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '11px',
                    background: 'rgba(200, 50, 50, 0.8)',
                    border: '1px solid rgba(255, 100, 100, 0.3)',
                    color: '#fff',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  disabled={loading}
                >
                  ✕ Cancelar
                </button>
                <button
                  onClick={handleSaveChanges}
                  style={{
                    padding: '8px 16px',
                    fontSize: '11px',
                    background: 'rgba(0, 150, 136, 0.8)',
                    border: '1px solid rgba(0, 200, 180, 0.3)',
                    color: '#00ff88',
                    cursor: 'pointer',
                    borderRadius: '4px',
                  }}
                  disabled={loading}
                >
                  💾 Salvar Mudanças
                </button>
              </div>
            </div>
          )}

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

          {displayConfig.puzzle.showCorrectAnswerWhenSolved && (
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
          )}

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
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* ✅ Botão de Edição - Visível apenas para GMs */}
          {isGameMaster && (
            <button 
              className="btn-edit" 
              onClick={() => setIsEditing(true)}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: 'rgba(0, 150, 136, 0.8)',
                border: '1px solid rgba(0, 200, 180, 0.3)',
                color: '#00ff88',
                cursor: 'pointer',
                borderRadius: '4px',
              }}
              title="Editar configurações do puzzle"
            >
              ⚙️ Editar
            </button>
          )}
          {onClose && (
            <button className="close-btn" onClick={onClose}>✖</button>
          )}
        </div>
      </div>

      <div className="puzzle-content">
        <p className="puzzle-description">{puzzleData.description}</p>

        {/* ✅ MODO DE EDIÇÃO - Renderizado quando isEditing === true */}
        {isEditing && (
          <div style={{
            background: 'rgba(0, 150, 136, 0.05)',
            border: '2px solid rgba(0, 200, 180, 0.3)',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '16px',
          }}>
            <h3 style={{ margin: '0 0 16px 0', color: '#00ff88' }}>⚙️ EDITAR CONFIGURAÇÕES</h3>
            
            {/* Parâmetros Corretos */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>PARÂMETROS CORRETOS</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                  Frequência Correta: <strong style={{ color: '#00ff88' }}>{editedMetadata.correct_frequency}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedMetadata.correct_frequency}
                  onChange={(e) => handleEditChange('correct_frequency', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedMetadata.correct_frequency}
                  onChange={(e) => handleEditChange('correct_frequency', parseInt(e.target.value))}
                  style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,180,0.2)', color: '#0f0', fontSize: '11px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                  Deslocamento Correto (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.correct_shift}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedMetadata.correct_shift}
                  onChange={(e) => handleEditChange('correct_shift', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedMetadata.correct_shift}
                  onChange={(e) => handleEditChange('correct_shift', parseInt(e.target.value))}
                  style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,180,0.2)', color: '#0f0', fontSize: '11px' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                  Cromática Correta (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.correct_chromatic}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedMetadata.correct_chromatic}
                  onChange={(e) => handleEditChange('correct_chromatic', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={editedMetadata.correct_chromatic}
                  onChange={(e) => handleEditChange('correct_chromatic', parseInt(e.target.value))}
                  style={{ marginTop: '4px', width: '100%', padding: '4px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,200,180,0.2)', color: '#0f0', fontSize: '11px' }}
                />
              </div>
            </div>

            {/* Parâmetros Iniciais */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>PARÂMETROS INICIAIS (Dificuldade)</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                  Frequência Inicial: <strong style={{ color: '#00ff88' }}>{editedMetadata.start_frequency}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedMetadata.start_frequency}
                  onChange={(e) => handleEditChange('start_frequency', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                  Deslocamento Inicial (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.start_shift}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedMetadata.start_shift}
                  onChange={(e) => handleEditChange('start_shift', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>
                  Cromática Inicial (%): <strong style={{ color: '#00ff88' }}>{editedMetadata.start_chromatic}</strong>
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={editedMetadata.start_chromatic}
                  onChange={(e) => handleEditChange('start_chromatic', parseInt(e.target.value))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Textos */}
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#ccc', fontSize: '12px' }}>TEXTOS E PISTAS</h4>
              
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>Instruções de Acesso</label>
                <textarea
                  value={editedMetadata.access_instructions}
                  onChange={(e) => handleEditChange('access_instructions', e.target.value)}
                  placeholder="Ex: Sintonize a frequência do sinal portador..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,200,180,0.2)',
                    color: '#0f0',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    borderRadius: '4px',
                  }}
                />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '12px', color: '#aaa' }}>Dica</label>
                <textarea
                  value={editedMetadata.hint}
                  onChange={(e) => handleEditChange('hint', e.target.value)}
                  placeholder="Ex: Preste atenção ao padrão de interferência..."
                  style={{
                    width: '100%',
                    minHeight: '60px',
                    padding: '8px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid rgba(0,200,180,0.2)',
                    color: '#0f0',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    borderRadius: '4px',
                  }}
                />
              </div>
            </div>

            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setIsEditing(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  background: 'rgba(200, 50, 50, 0.8)',
                  border: '1px solid rgba(255, 100, 100, 0.3)',
                  color: '#fff',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                disabled={loading}
              >
                ✕ Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                style={{
                  padding: '8px 16px',
                  fontSize: '11px',
                  background: 'rgba(0, 150, 136, 0.8)',
                  border: '1px solid rgba(0, 200, 180, 0.3)',
                  color: '#00ff88',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
                disabled={loading}
              >
                💾 Salvar Mudanças
              </button>
            </div>
          </div>
        )}

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
        {displayConfig.puzzle.showAccessInstructions && puzzleData.access_instructions && (
          <div className="hint-section">
            <div className="hint-title">▶ COMO ACESSAR</div>
            <div className="hint-text">{puzzleData.access_instructions}</div>
          </div>
        )}

        {/* Dica */}
        {displayConfig.puzzle.showHint && puzzleData.hint && (
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
              className={`slider ${isFreqCorrect ? 'correct' : ''}`}
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
              className={`slider ${isShiftCorrect ? 'correct' : ''}`}
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
              className={`slider ${isChromaCorrect ? 'correct' : ''}`}
            />
            <small>Reduza para remover a aberração de cores.</small>
          </div>
        </div>

        <div style={{marginTop:12, display:'flex', justifyContent:'center'}}>
          <button
            className="btn-submit"
            onClick={handleSolved}
            disabled={!isAligned || loading || solved}
            style={{ padding: '10px 14px', fontSize: 13, cursor: !isAligned || solved ? 'not-allowed' : 'pointer' }}
          >
            {isAligned ? (loading ? 'PROCESSANDO...' : '✓ DECODIFICAR IMAGEM') : 'AGUARDANDO ALINHAMENTO...'}
          </button>
        </div>

        <div className="terminal">
          <div className="terminal-header">LOG DE RECUPERAÇÃO</div>
          <div className="terminal-body">
            {displayConfig.puzzle.showLogs ? (
              logs.map((line, idx) => (
                <div key={`${line}-${idx}`} className="terminal-line">{line}</div>
              ))
            ) : (
              <div className="terminal-line" style={{color:'#888'}}>🔒 Logs escondidos</div>
            )}
          </div>
        </div>

        {solved && displayConfig.puzzle.showRewardCode && (
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
