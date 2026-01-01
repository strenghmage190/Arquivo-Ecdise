import React, { useState } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import './GlitchMegaClueCreator.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  initialX?: number;
  initialY?: number;
  requiredCodeCount?: number;
  onSaved: () => void;
}

interface MegaClueConfig {
  title: string;
  description: string;
  finalTruthText: string;
  imageFile: File | null;
  imagePreview: string | null;
  requiredCodeCount: number;
}

export default function GlitchMegaClueCreator({ 
  isOpen, 
  onClose, 
  investigationId, 
  initialX, 
  initialY,
  requiredCodeCount = 3,
  onSaved 
}: Props) {
  const [config, setConfig] = useState<MegaClueConfig>({
    title: 'A VERDADE FINAL',
    description: 'Todos os quebra-cabeças resolvidos. A verdade aguarda quem conseguir desbloquear os 3 códigos necessários.',
    finalTruthText: 'A investigação revelou que... [Insira aqui o texto final da verdade que será revelado]',
    imageFile: null,
    imagePreview: null,
    requiredCodeCount: requiredCodeCount,
  });

  const [loading, setLoading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const url = URL.createObjectURL(file);
    setConfig(prev => ({
      ...prev,
      imageFile: file,
      imagePreview: url,
    }));
  };

  const handleSave = async () => {
    if (!config.title.trim()) {
      alert('Defina um título para a mega-pista');
      return;
    }

    if (!config.finalTruthText.trim()) {
      alert('Defina o texto da verdade final');
      return;
    }

    setLoading(true);

    try {
      let imageUrl: string | undefined;

      if (config.imageFile) {
        imageUrl = await uploadInvestigationImage(config.imageFile, investigationId);
        if (!imageUrl) {
          throw new Error('Falha ao fazer upload da imagem');
        }
      }

      const cardData = {
        investigation_id: investigationId,
        title: config.title,
        description: config.description,
        type: 'mega_clue',
        image_url: imageUrl,
        x: initialX ?? 100,
        y: initialY ?? 100,
        metadata: {
          mega_clue: {
            final_truth_text: config.finalTruthText,
            required_code_count: config.requiredCodeCount,
            collected_codes: [],
          },
        },
      };

      await createInvestigationCard(cardData);

      alert(`✓ Mega-Pista criada com sucesso!\n\nCódigos necessários: ${config.requiredCodeCount}`);

      onSaved();
      onClose();
      resetForm();
    } catch (err) {
      console.error('Erro ao criar mega-pista', err);
      alert('Erro ao criar mega-pista: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setConfig({
      title: 'A VERDADE FINAL',
      description: 'Todos os quebra-cabeças resolvidos. A verdade aguarda quem conseguir desbloquear os 3 códigos necessários.',
      finalTruthText: 'A investigação revelou que... [Insira aqui o texto final da verdade que será revelado]',
      imageFile: null,
      imagePreview: null,
      requiredCodeCount: requiredCodeCount,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="mega-clue-creator-overlay" onClick={onClose}>
      <div className="mega-clue-creator-modal" onClick={e => e.stopPropagation()}>
        <div className="mega-clue-header">
          <h2>🔐 CRIAR MEGA-PISTA (VERDADE FINAL)</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="mega-clue-body">
          {/* Seção 1: Básico */}
          <div className="section">
            <h3>📌 INFORMAÇÕES BÁSICAS</h3>
            
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
              <label>Descrição (exibida antes do desbloqueio):</label>
              <textarea
                value={config.description}
                onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={3}
                maxLength={500}
              />
            </div>
          </div>

          {/* Seção 2: Requisitos */}
          <div className="section">
            <h3>🎯 REQUISITOS DE DESBLOQUEIO</h3>
            
            <div className="form-group">
              <label>Quantos códigos são necessários? (padrão: {requiredCodeCount})</label>
              <input
                type="number"
                value={config.requiredCodeCount}
                onChange={e => setConfig(prev => ({ ...prev, requiredCodeCount: Math.max(1, parseInt(e.target.value) || 1) }))}
                disabled={loading}
                min="1"
                max="20"
              />
              <small>
                Este número deve corresponder ao total de Glitch Puzzles criados.
              </small>
            </div>
          </div>

          {/* Seção 3: Verdade */}
          <div className="section">
            <h3>🌟 A VERDADE FINAL (revelada ao desbloquear)</h3>
            
            <div className="form-group">
              <label>Texto da Verdade:</label>
              <textarea
                value={config.finalTruthText}
                onChange={e => setConfig(prev => ({ ...prev, finalTruthText: e.target.value }))}
                disabled={loading}
                rows={6}
                maxLength={2000}
                placeholder="Insira aqui o texto completo da verdade que será revelada quando todos os códigos forem coletados..."
              />
              <small>Caracteres: {config.finalTruthText.length}/2000</small>
            </div>
          </div>

          {/* Seção 4: Imagem */}
          <div className="section">
            <h3>🖼 IMAGEM DA VERDADE (opcional)</h3>
            
            <div className="image-upload">
              <label>Upload da imagem final:</label>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageSelect}
                disabled={loading}
              />
              {config.imagePreview && (
                <div className="image-preview">
                  <img src={config.imagePreview} alt="Verdade" />
                  <span>✓ Carregada</span>
                </div>
              )}
            </div>
          </div>

          {/* Seção 5: Resumo */}
          <div className="section summary">
            <h3>✓ RESUMO</h3>
            <div className="summary-content">
              <p>📌 <strong>Tipo:</strong> Mega-Pista (Verdade Final)</p>
              <p>🔒 <strong>Desbloqueio:</strong> Requer {config.requiredCodeCount} código{config.requiredCodeCount !== 1 ? 's' : ''}</p>
              <p>📝 <strong>Texto:</strong> {config.finalTruthText.substring(0, 50)}...</p>
              <p>🖼 <strong>Imagem:</strong> {config.imageFile ? '✓ Será incluída' : '✗ Nenhuma'}</p>
            </div>
          </div>
        </div>

        <div className="mega-clue-footer">
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
            disabled={loading}
          >
            {loading ? 'CRIANDO...' : '✓ CRIAR MEGA-PISTA'}
          </button>
        </div>
      </div>
    </div>
  );
}
