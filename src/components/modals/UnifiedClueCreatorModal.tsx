import React, { useState, useEffect } from 'react';
import { createInvestigationCard, fetchCardsForInvestigation } from '../../api/investigations';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import UVEditor from '../tools/UVEditor';
import ThermalEditor from '../tools/ThermalEditor';
import AdvancedAudioLab from '../tools/AdvancedAudioLab';
import UrlRealTimeSpectrogram from '../tools/UrlRealTimeSpectrogram';
import AudioForge from '../tools/AudioForge';
import DiegeticWindow from '../ui/DiegeticWindow';
import { supabase } from '../../supabaseClient';
import './UnifiedClueCreatorModal.css';

async function uploadAudio(file: File, investigationId: string): Promise<string | null> {
  const path = `${investigationId}/audio_${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('investigation-assets').upload(path, file);
  if (error) throw error;
  const { data: publicData } = await supabase.storage.from('investigation-assets').getPublicUrl(path);
  return (publicData as any)?.publicUrl || null;
}

type ClueType = 'glitch_puzzle' | 'mega_clue';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: (card: Record<string, any>) => void;
}

/**
 * UnifiedClueCreatorModal: Um único modal inteligente que:
 * 1. Permite escolher entre criar um Glitch Puzzle ou uma Mega-Pista
 * 2. Muda dinamicamente o formulário baseado na seleção
 * 3. Para Mega-Pista: permite vincular os Glitch Puzzles necessários
 */
export default function UnifiedClueCreatorModal({
  isOpen,
  onClose,
  investigationId,
  initialX,
  initialY,
  onSaved,
}: Props) {
  // ============================================
  // Estado Global do Modal
  // ============================================
  const [clueType, setClueType] = useState<ClueType>('glitch_puzzle');
  const [loading, setLoading] = useState(false);

  // ============================================
  // Estado Compartilhado (Básico)
  // ============================================
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // ============================================
  // Estado para Glitch Puzzle
  // ============================================
  const [originalImageFile, setOriginalImageFile] = useState<File | null>(null);
  const [originalImagePreview, setOriginalImagePreview] = useState<string | null>(null);
  const [corruptedImageFile, setCorruptedImageFile] = useState<File | null>(null);
  const [corruptedImagePreview, setCorruptedImagePreview] = useState<string | null>(null);
  const [correctFrequency, setCorrectFrequency] = useState(17);
  const [correctShift, setCorrectShift] = useState(33);
  const [correctChromatic, setCorrectChromatic] = useState(12);
  const [hint, setHint] = useState('');
  const [rewardCode, setRewardCode] = useState('ALPHA-01');

  // ============================================
  // Estado para Mega-Clue
  // ============================================
  const [finalTruthText, setFinalTruthText] = useState('');
  const [megaClueImageFile, setMegaClueImageFile] = useState<File | null>(null);
  const [megaClueImagePreview, setMegaClueImagePreview] = useState<string | null>(null);
  const [requiredCodeCount, setRequiredCodeCount] = useState(3);

  // ============================================
  // Estado para Vínculo de Puzzles (Mega-Clue)
  // ============================================
  const [availablePuzzles, setAvailablePuzzles] = useState<Array<{ id: string; title: string }>>([]);
  const [selectedPuzzleIds, setSelectedPuzzleIds] = useState<Set<string>>(new Set());
  const [loadingPuzzles, setLoadingPuzzles] = useState(false);

  // ============================================
  // Efeitos: Carregar Puzzles ao Abrir Modal
  // ============================================
  useEffect(() => {
    if (isOpen && clueType === 'mega_clue') {
      loadAvailablePuzzles();
    }
  }, [isOpen, clueType, investigationId]);

  const loadAvailablePuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const cards = await fetchCardsForInvestigation(investigationId);
      const puzzles = cards
        .filter((c: any) => c.type === 'glitch_puzzle')
        .map((c: any) => ({
          id: c.id,
          title: c.title || `Puzzle ${c.id.slice(0, 8)}`,
        }));
      setAvailablePuzzles(puzzles);
    } catch (err) {
      console.error('Erro ao carregar quebra-cabeças:', err);
    } finally {
      setLoadingPuzzles(false);
    }
  };

  // ============================================
  // Handlers: Upload de Imagens
  // ============================================
  const handleOriginalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setOriginalImageFile(file);
    setOriginalImagePreview(url);
  };

  const handleCorruptedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCorruptedImageFile(file);
    setCorruptedImagePreview(url);
  };

  const handleMegaClueImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setMegaClueImageFile(file);
    setMegaClueImagePreview(url);
  };

  // ============================================
  // Handlers: Vínculo de Puzzles
  // ============================================
  const togglePuzzleSelection = (puzzleId: string) => {
    const newSelected = new Set(selectedPuzzleIds);
    if (newSelected.has(puzzleId)) {
      newSelected.delete(puzzleId);
    } else {
      newSelected.add(puzzleId);
    }
    setSelectedPuzzleIds(newSelected);
  };

  // ============================================
  // Handler: Salvar
  // ============================================
  const handleSave = async () => {
    try {
      if (!title.trim()) {
        alert('Defina um título para a pista');
        return;
      }

      setLoading(true);

      if (clueType === 'glitch_puzzle') {
        await saveGlitchPuzzle();
      } else if (clueType === 'mega_clue') {
        await saveMegaClue();
      }

      onSaved({ id: 'new' });
      resetForm();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar pista:', err);
      alert(`Erro ao salvar pista: ${err instanceof Error ? err.message : 'Desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // Save: Glitch Puzzle
  // ============================================
  const saveGlitchPuzzle = async () => {
    if (!originalImageFile || !corruptedImageFile) {
      throw new Error('Você precisa de ambas as imagens: Original e Corrompida');
    }

    const originalUrl = await uploadInvestigationImage(
      originalImageFile,
      investigationId
    );
    const corruptedUrl = await uploadInvestigationImage(
      corruptedImageFile,
      investigationId
    );

    if (!originalUrl || !corruptedUrl) {
      throw new Error('Falha ao fazer upload das imagens');
    }

    const cardData = {
      investigation_id: investigationId,
      title,
      description,
      type: 'glitch_puzzle',
      image_url: corruptedUrl,
      x: initialX ?? 100,
      y: initialY ?? 100,
      metadata: {
        glitch_puzzle: {
          original_image_url: originalUrl,
          corrupted_image_url: corruptedUrl,
          correct_frequency: correctFrequency,
          correct_shift: correctShift,
          correct_chromatic: correctChromatic,
          hint,
          reward_code: rewardCode,
          solved: false,
        },
      },
    };

    await createInvestigationCard(cardData);

    alert(
      `✓ Quebra-cabeça criado com sucesso!\n\nParâmetros corretos:\nFrequência: ${correctFrequency}\nDeslocamento: ${correctShift}%\nCromática: ${correctChromatic}%`
    );
  };

  // ============================================
  // Save: Mega-Clue
  // ============================================
  const saveMegaClue = async () => {
    if (!finalTruthText.trim()) {
      throw new Error('Defina o texto da verdade final');
    }

    if (selectedPuzzleIds.size === 0) {
      throw new Error('Selecione pelo menos um quebra-cabeça para vincular');
    }

    let megaClueImageUrl: string | undefined;
    if (megaClueImageFile) {
      megaClueImageUrl = await uploadInvestigationImage(
        megaClueImageFile,
        investigationId
      );
      if (!megaClueImageUrl) {
        throw new Error('Falha ao fazer upload da imagem');
      }
    }

    const cardData = {
      investigation_id: investigationId,
      title,
      description,
      type: 'mega_clue',
      image_url: megaClueImageUrl,
      x: initialX ?? 100,
      y: initialY ?? 100,
      metadata: {
        mega_clue: {
          final_truth_text: finalTruthText,
          required_puzzle_ids: Array.from(selectedPuzzleIds),
          collected_codes: [],
        },
      },
    };

    await createInvestigationCard(cardData);

    alert(
      `✓ Mega-Pista criada com sucesso!\n\nQuebra-cabeças vinculados: ${selectedPuzzleIds.size}`
    );
  };

  // ============================================
  // Reset Form
  // ============================================
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setClueType('glitch_puzzle');

    // Glitch Puzzle
    setOriginalImageFile(null);
    setOriginalImagePreview(null);
    setCorruptedImageFile(null);
    setCorruptedImagePreview(null);
    setCorrectFrequency(17);
    setCorrectShift(33);
    setCorrectChromatic(12);
    setHint('');
    setRewardCode('ALPHA-01');

    // Mega-Clue
    setFinalTruthText('');
    setMegaClueImageFile(null);
    setMegaClueImagePreview(null);
    setRequiredCodeCount(3);
    setSelectedPuzzleIds(new Set());
  };

  if (!isOpen) return null;

  return (
    <div className="unified-clue-overlay" onClick={onClose}>
      <div className="unified-clue-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="unified-clue-header">
          <h2>🎯 CRIAR PISTA</h2>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        {/* Body */}
        <div className="unified-clue-body">
          {/* Seção 1: Tipo de Pista */}
          <div className="section">
            <h3>📋 TIPO DE PISTA</h3>
            <div className="clue-type-selector">
              <button
                className={`type-btn ${clueType === 'glitch_puzzle' ? 'active' : ''}`}
                onClick={() => setClueType('glitch_puzzle')}
                disabled={loading}
              >
                <div className="type-icon">🧩</div>
                <div className="type-label">Quebra-cabeça de Glitch</div>
                <div className="type-desc">Imagem corrompida para decodificar</div>
              </button>

              <button
                className={`type-btn ${clueType === 'mega_clue' ? 'active' : ''}`}
                onClick={() => setClueType('mega_clue')}
                disabled={loading}
              >
                <div className="type-icon">🔐</div>
                <div className="type-label">Mega-Pista Final</div>
                <div className="type-desc">Verdade final que requer puzzles</div>
              </button>
            </div>
          </div>

          {/* Seção 2: Informações Básicas */}
          <div className="section">
            <h3>📌 INFORMAÇÕES BÁSICAS</h3>

            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={loading}
                maxLength={100}
                placeholder="Defina um título descritivo"
              />
            </div>

            <div className="form-group">
              <label>Descrição:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                maxLength={500}
                rows={3}
                placeholder="Descrição da pista (opcional)"
              />
            </div>
          </div>

          {/* Seção 3: Formulário Dinâmico */}
          {clueType === 'glitch_puzzle' && (
            <>
              {/* 3A: Imagens do Glitch Puzzle */}
              <div className="section">
                <h3>📸 IMAGENS DO GLITCH PUZZLE</h3>

                <div className="image-group">
                  <label>Imagem ORIGINAL (revelada ao resolver):</label>
                  <div className="image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleOriginalImageSelect}
                      disabled={loading}
                    />
                    {originalImagePreview && (
                      <div className="image-preview">
                        <img src={originalImagePreview} alt="Original" />
                        <span>✓ Carregada</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="image-group">
                  <label>Imagem CORROMPIDA (o que o jogador vê):</label>
                  <div className="image-upload">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCorruptedImageSelect}
                      disabled={loading}
                    />
                    {corruptedImagePreview && (
                      <div className="image-preview">
                        <img src={corruptedImagePreview} alt="Corrompida" />
                        <span>✓ Carregada</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 3B: Parâmetros do Glitch */}
              <div className="section">
                <h3>🎛️ PARÂMETROS DE CORREÇÃO</h3>

                <div className="form-group">
                  <label>
                    Frequência Correta: {correctFrequency}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={correctFrequency}
                    onChange={(e) => setCorrectFrequency(Number(e.target.value))}
                    disabled={loading}
                  />
                  <small>Frequência da onda de distorção (0-100)</small>
                </div>

                <div className="form-group">
                  <label>
                    Deslocamento Correto: {correctShift}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={correctShift}
                    onChange={(e) => setCorrectShift(Number(e.target.value))}
                    disabled={loading}
                  />
                  <small>Deslocamento de pixels (0-100%)</small>
                </div>

                <div className="form-group">
                  <label>
                    Cromática Correta: {correctChromatic}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={correctChromatic}
                    onChange={(e) => setCorrectChromatic(Number(e.target.value))}
                    disabled={loading}
                  />
                  <small>Separação de canais RGB (0-100%)</small>
                </div>
              </div>

              {/* 3C: Recompensa e Dica */}
              <div className="section">
                <h3>🎁 RECOMPENSA E DICA</h3>

                <div className="form-group">
                  <label>Código de Recompensa:</label>
                  <input
                    type="text"
                    value={rewardCode}
                    onChange={(e) => setRewardCode(e.target.value)}
                    disabled={loading}
                    maxLength={50}
                    placeholder="ex: ALPHA-01"
                  />
                  <small>
                    Este código será desbloqueado quando o jogador resolver o puzzle
                  </small>
                </div>

                <div className="form-group">
                  <label>Dica (opcional):</label>
                  <textarea
                    value={hint}
                    onChange={(e) => setHint(e.target.value)}
                    disabled={loading}
                    maxLength={200}
                    rows={2}
                    placeholder="Uma dica para ajudar o jogador"
                  />
                </div>
              </div>
            </>
          )}

          {clueType === 'mega_clue' && (
            <>
              {/* 3D: Verdade Final */}
              <div className="section">
                <h3>🌟 A VERDADE FINAL</h3>

                <div className="form-group">
                  <label>Texto da Verdade (revelado ao desbloquear):</label>
                  <textarea
                    value={finalTruthText}
                    onChange={(e) => setFinalTruthText(e.target.value)}
                    disabled={loading}
                    rows={6}
                    maxLength={2000}
                    placeholder="Insira aqui o texto completo da verdade que será revelada quando todos os códigos forem coletados..."
                  />
                  <small>Caracteres: {finalTruthText.length}/2000</small>
                </div>
              </div>

              {/* 3E: Imagem da Verdade */}
              <div className="section">
                <h3>🖼 IMAGEM DA VERDADE (opcional)</h3>

                <div className="image-upload">
                  <label>Upload da imagem final:</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleMegaClueImageSelect}
                    disabled={loading}
                  />
                  {megaClueImagePreview && (
                    <div className="image-preview">
                      <img src={megaClueImagePreview} alt="Verdade" />
                      <span>✓ Carregada</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 3F: Vínculo de Puzzles */}
              <div className="section">
                <h3>🔗 VINCULAR QUEBRA-CABEÇAS NECESSÁRIOS</h3>

                {loadingPuzzles ? (
                  <div className="loading-msg">Carregando quebra-cabeças...</div>
                ) : availablePuzzles.length === 0 ? (
                  <div className="no-puzzles-msg">
                    Nenhum quebra-cabeça de Glitch disponível. Crie um quebra-cabeça
                    antes de criar a mega-pista.
                  </div>
                ) : (
                  <>
                    <div className="puzzle-list">
                      {availablePuzzles.map((puzzle) => (
                        <div key={puzzle.id} className="puzzle-item">
                          <input
                            type="checkbox"
                            id={`puzzle-${puzzle.id}`}
                            checked={selectedPuzzleIds.has(puzzle.id)}
                            onChange={() => togglePuzzleSelection(puzzle.id)}
                            disabled={loading}
                          />
                          <label htmlFor={`puzzle-${puzzle.id}`}>
                            <span className="puzzle-title">{puzzle.title}</span>
                          </label>
                        </div>
                      ))}
                    </div>

                    <div className="puzzle-counter">
                      Quebra-cabeças vinculados:{' '}
                      <strong>{selectedPuzzleIds.size}</strong> de{' '}
                      <strong>{availablePuzzles.length}</strong>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="unified-clue-footer">
          <button
            className="btn btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn btn-save"
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? '⏳ Salvando...' : '💾 SALVAR PISTA'}
          </button>
        </div>
      </div>
    </div>
  );
}
