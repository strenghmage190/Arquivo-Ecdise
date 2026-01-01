import React, { useState } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { generateGlitchPlaceholder } from '../../utils/glitchPlaceholder';
import GlitchImageEngine from '../tools/GlitchImageEngine';
import './GlitchPuzzleCreator.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSaved: () => void;
}

interface GlitchPuzzleConfig {
  // Imagem original (revelada quando correto)
  originalImageFile: File | null;
  originalImagePreview: string | null;
  
  // Imagem corrompida (o que o jogador vê)
  corruptedImageFile: File | null;
  corruptedImagePreview: string | null;
  
  // Parâmetros corretos para resolver
  correctFrequency: number;
  correctShift: number;
  correctChromatic: number;
  
  // Metadados
  title: string;
  description: string;
  hint: string;
  
  // Código de recompensa que o jogador ganha ao resolver
  rewardCode: string;
}

export default function GlitchPuzzleCreator({ isOpen, onClose, investigationId, initialX, initialY, onSaved }: Props) {
  const [config, setConfig] = useState<GlitchPuzzleConfig>({
    originalImageFile: null,
    originalImagePreview: null,
    corruptedImageFile: null,
    corruptedImagePreview: null,
    correctFrequency: 17,
    correctShift: 33,
    correctChromatic: 12,
    title: 'Quebra-cabeça: Imagem Misteriosa',
    description: 'Uma imagem corrompida aguarda decodificação',
    hint: '',
    rewardCode: 'ALPHA-01',
  });

  const [loading, setLoading] = useState(false);

  const handleOriginalImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setConfig(prev => ({
      ...prev,
      originalImageFile: file,
      originalImagePreview: url,
    }));
  };

  const handleCorruptedImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setConfig(prev => ({
      ...prev,
      corruptedImageFile: file,
      corruptedImagePreview: url,
    }));
  };

  const handleSave = async () => {
    if (!config.originalImageFile) {
      alert('Envie a imagem ORIGINAL (a versão limpa). A corrupção será simulada pelo motor de glitch.');
      return;
    }

    if (!config.title.trim()) {
      alert('Defina um título para o quebra-cabeça');
      return;
    }

    setLoading(true);

    try {
      // Upload das imagens (a original é sempre a fonte verdadeira)
      const originalUrl = await uploadInvestigationImage(config.originalImageFile!, investigationId);
      let corruptedUrl = config.corruptedImageFile
        ? await uploadInvestigationImage(config.corruptedImageFile, investigationId)
        : null;

      if (!corruptedUrl) {
        const generated = await generateGlitchPlaceholder(config.originalImageFile!);
        if (generated) {
          corruptedUrl = await uploadInvestigationImage(generated, investigationId);
        }
      }

      if (!originalUrl) {
        throw new Error('Falha ao fazer upload da imagem original');
      }

      // Criar a pista como GLITCH_PUZZLE
      // IMPORTANTE: image_url recebe a imagem corrompida (ou vazia se não houver)
      // A imagem ORIGINAL é guardada exclusivamente no metadata para ser usada pelo Solver
      const cardData = {
        investigation_id: investigationId,
        title: config.title,
        description: config.description,
        type: 'glitch_puzzle', // Tipo especial
        image_url: corruptedUrl || '', // Mostra a imagem corrompida NO TABULEIRO (ou vazio se não houver)
        x: initialX ?? 100,
        y: initialY ?? 100,
        metadata: {
          glitch_puzzle: {
            original_image_url: originalUrl, // A imagem VERDADEIRA fica aqui, protegida no metadata
            corrupted_image_url: corruptedUrl || null,
            correct_frequency: config.correctFrequency,
            correct_shift: config.correctShift,
            correct_chromatic: config.correctChromatic,
            hint: config.hint,
            reward_code: config.rewardCode,
            solved: false,
          },
        },
      };

      await createInvestigationCard(cardData);

      alert(`✓ Quebra-cabeça criado com sucesso!\n\nParâmetros corretos:\nFrequência: ${config.correctFrequency}\nDeslocamento: ${config.correctShift}%\nCromática: ${config.correctChromatic}%`);

      onSaved();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Erro ao criar quebra-cabeça', err);
      alert('Erro ao criar quebra-cabeça: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfig({
      originalImageFile: null,
      originalImagePreview: null,
      corruptedImageFile: null,
      corruptedImagePreview: null,
      correctFrequency: 17,
      correctShift: 33,
      correctChromatic: 12,
      title: 'Quebra-cabeça: Imagem Misteriosa',
      description: 'Uma imagem corrompida aguarda decodificação',
      hint: '',
      rewardCode: 'ALPHA-01',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="glitch-puzzle-overlay" onClick={onClose}>
      <div className="glitch-puzzle-modal" onClick={e => e.stopPropagation()}>
        <div className="glitch-puzzle-header">
          <h2>🧩 CRIAR QUEBRA-CABEÇA DE GLITCH</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="glitch-puzzle-body">
          {/* Seção 1: Imagens */}
          <div className="section">
            <h3>📸 IMAGENS</h3>
            
            <div className="image-group">
              <label>Imagem ORIGINAL (será revelada ao resolver):</label>
              <div className="image-upload">
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleOriginalImageSelect}
                  disabled={loading}
                />
                {config.originalImagePreview && (
                  <div className="image-preview">
                    <img src={config.originalImagePreview} alt="Original" />
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
                {config.corruptedImagePreview && (
                  <div className="image-preview">
                    <img src={config.corruptedImagePreview} alt="Corrompida" />
                    <span>✓ Carregada</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Seção 2: Parâmetros Corretos */}
          <div className="section">
            <h3>⚙️ PARÂMETROS CORRETOS PARA RESOLVER</h3>
            
            <div className="param-group">
              <label>
                Frequência de Fatias: <strong>{config.correctFrequency}</strong>
              </label>
              <input
                type="range"
                min="1"
                max="50"
                value={config.correctFrequency}
                onChange={e => setConfig(prev => ({ ...prev, correctFrequency: parseInt(e.target.value) }))}
                disabled={loading}
              />
            </div>

            <div className="param-group">
              <label>
                Intensidade de Deslocamento: <strong>{config.correctShift}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.correctShift}
                onChange={e => setConfig(prev => ({ ...prev, correctShift: parseInt(e.target.value) }))}
                disabled={loading}
              />
            </div>

            <div className="param-group">
              <label>
                Corrupção Cromática: <strong>{config.correctChromatic}%</strong>
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={config.correctChromatic}
                onChange={e => setConfig(prev => ({ ...prev, correctChromatic: parseInt(e.target.value) }))}
                disabled={loading}
              />
            </div>

            <div className="hint-box">
              💡 <strong>Memorize ou anote estes valores!</strong> Você precisará deles para verificar.
            </div>
          </div>

          {config.originalImagePreview && (
            <div className="section">
              <h3>👁️ PREVIEW DINÂMICO</h3>
              <GlitchImageEngine
                imageUrl={config.originalImagePreview}
                targetFrequency={config.correctFrequency}
                targetShift={config.correctShift}
                targetChromatic={config.correctChromatic}
                playerFrequency={Math.min(50, Math.max(1, config.correctFrequency - 8))}
                playerShift={Math.min(100, Math.max(0, config.correctShift + 18))}
                playerChromatic={Math.min(100, Math.max(0, config.correctChromatic + 22))}
                height={260}
              />
              <small style={{ display: 'block', marginTop: 8, color: '#999' }}>
                A prévia mostra a imagem limpa sendo corrompida pelo motor. Ajuste os valores-alvo para calibrar a dificuldade.
              </small>
            </div>
          )}

          {/* Seção 3: Metadados */}
          <div className="section">
            <h3>📝 METADADOS DO QUEBRA-CABEÇA</h3>
            
            <div className="form-group">
              <label>Título:</label>
              <input
                type="text"
                value={config.title}
                onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                disabled={loading}
                maxLength={100}
              />
            </div>

            <div className="form-group">
              <label>Descrição:</label>
              <textarea
                value={config.description}
                onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={3}
                maxLength={300}
              />
            </div>

            <div className="form-group">
              <label>Dica (opcional):</label>
              <textarea
                value={config.hint}
                onChange={e => setConfig(prev => ({ ...prev, hint: e.target.value }))}
                disabled={loading}
                rows={2}
                placeholder="Ex: 'Procure por números nas pistas anteriores'"
                maxLength={200}
              />
            </div>
          </div>

          {/* Seção 3.5: Código de Recompensa */}
          <div className="section">
            <h3>🎁 RECOMPENSA AO RESOLVER</h3>
            
            <div className="form-group">
              <label>Código de Recompensa (ex: ALPHA-01, BETA-02):</label>
              <input
                type="text"
                value={config.rewardCode}
                onChange={e => setConfig(prev => ({ ...prev, rewardCode: e.target.value.toUpperCase() }))}
                disabled={loading}
                maxLength={20}
                placeholder="ALPHA-01"
              />
              <small style={{ display: 'block', marginTop: 6, color: '#999' }}>
                Este código será revelado quando o jogador resolver corretamente o quebra-cabeça
              </small>
            </div>
          </div>

          {/* Seção 4: Resumo */}
          <div className="section summary">
            <h3>✓ RESUMO</h3>
            <div className="summary-content">
              <p>📌 <strong>Tipo:</strong> Quebra-cabeça de Glitch</p>
              <p>🎯 <strong>Objetivo:</strong> Jogador descobre parâmetros e decodifica</p>
              <p>🔧 <strong>Parâmetros corretos:</strong> {config.correctFrequency} fatias, {config.correctShift}% deslocamento, {config.correctChromatic}% cromática</p>
              <p>🎨 <strong>Imagens:</strong> {config.originalImageFile ? '✓' : '✗'} Original | {config.corruptedImageFile ? '✓' : '✗'} Corrompida (opcional)</p>
              <p>🎁 <strong>Recompensa:</strong> <code style={{ background: '#333', padding: '2px 6px', borderRadius: 3, color: '#c6a45f' }}>{config.rewardCode}</code></p>

            </div>
          </div>
        </div>

        <div className="glitch-puzzle-footer">
          <button 
            className="btn btn-cancel" 
            onClick={onClose}
            disabled={loading}
          >
            CANCELAR
          </button>
          <button 
            className="btn btn-save" 
            onClick={handleSave}
            disabled={loading || !config.originalImageFile}
          >
            {loading ? 'CRIANDO...' : '✓ CRIAR QUEBRA-CABEÇA'}
          </button>
        </div>
      </div>
    </div>
  );
}
