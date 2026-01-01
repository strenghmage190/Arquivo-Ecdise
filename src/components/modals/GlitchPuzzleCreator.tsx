import React, { useState } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
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
  
  // Quantos códigos são necessários para desbloquear a mega-pista
  requiredCodeCount: number;
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
    requiredCodeCount: 3,
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
    if (!config.originalImageFile || !config.corruptedImageFile) {
      alert('Você precisa de ambas as imagens: Original e Corrompida');
      return;
    }

    if (!config.title.trim()) {
      alert('Defina um título para o quebra-cabeça');
      return;
    }

    setLoading(true);

    try {
      // Upload das imagens
      const originalUrl = await uploadInvestigationImage(config.originalImageFile!, investigationId);
      const corruptedUrl = await uploadInvestigationImage(config.corruptedImageFile!, investigationId);

      if (!originalUrl || !corruptedUrl) {
        throw new Error('Falha ao fazer upload das imagens');
      }

      // Criar a pista como GLITCH_PUZZLE
      const cardData = {
        investigation_id: investigationId,
        title: config.title,
        description: config.description,
        type: 'glitch_puzzle', // Tipo especial
        image_url: corruptedUrl, // Mostra a imagem corrompida
        x: initialX ?? 100,
        y: initialY ?? 100,
        metadata: {
          glitch_puzzle: {
            original_image_url: originalUrl,
            corrupted_image_url: corruptedUrl,
            correct_frequency: config.correctFrequency,
            correct_shift: config.correctShift,
            correct_chromatic: config.correctChromatic,
            hint: config.hint,
            reward_code: config.rewardCode,
            required_code_count: config.requiredCodeCount,
            solved: false,
            collected_codes: [],
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
      requiredCodeCount: 3,
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

            <div className="form-group">
              <label>Quantos códigos são necessários para desbloquear a MEGA-PISTA?</label>
              <input
                type="number"
                value={config.requiredCodeCount}
                onChange={e => setConfig(prev => ({ ...prev, requiredCodeCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                disabled={loading}
                min="1"
                max="20"
              />
              <small style={{ display: 'block', marginTop: 6, color: '#999' }}>
                Se houver 5 quebra-cabeças, defina como 5. O jogador precisa resolver todos para acessar a verdade final.
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
              <p>🎨 <strong>Imagens:</strong> {config.originalImageFile ? '✓' : '✗'} Original | {config.corruptedImageFile ? '✓' : '✗'} Corrompida</p>
              <p>🎁 <strong>Recompensa:</strong> <code style={{ background: '#333', padding: '2px 6px', borderRadius: 3, color: '#c6a45f' }}>{config.rewardCode}</code></p>
              <p>🔓 <strong>Códigos necessários para mega-pista:</strong> {config.requiredCodeCount}</p>
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
            disabled={loading || !config.originalImageFile || !config.corruptedImageFile}
          >
            {loading ? 'CRIANDO...' : '✓ CRIAR QUEBRA-CABEÇA'}
          </button>
        </div>
      </div>
    </div>
  );
}
