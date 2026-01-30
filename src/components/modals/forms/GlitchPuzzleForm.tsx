import React, { useState } from 'react';
import { createInvestigationCard } from '../../../api/investigations';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../../utils/storage';
import { supabase } from '../../../supabaseClient';
import './GlitchPuzzleForm.css';

async function uploadAudio(file: File, investigationId: string): Promise<string | null> {
  const originalName = file.name || 'audio';
  const ext = originalName.split('.').pop() || '';
  const base = originalName.replace(/\.[^/.]+$/, '')
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 120);
  const safeName = `audio_${Date.now()}_${base}${ext ? '.' + ext : ''}`;
  const path = `${investigationId}/${safeName}`;
  const { data, error } = await supabase.storage.from('investigation-assets').upload(path, file);
  if (error) throw error;
  const { data: publicData } = await supabase.storage.from('investigation-assets').getPublicUrl(path);
  return (publicData as any)?.publicUrl || null;
}

interface Props {
  investigationId: string;
  initialX?: number;
  initialY?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface GlitchPuzzleConfig {
  originalImageFile: File | null;
  originalImagePreview: string | null;
  corruptedImageFile: File | null;
  corruptedImagePreview: string | null;
  correctFrequency: number;
  correctShift: number;
  correctChromatic: number;
  title: string;
  description: string;
  descPublic: string;
  descHidden: string;
  hint: string;
  rewardCode: string;
  tags: string;
  isLocked: boolean;
  lockPass: string;
  stamp: string;
  externalLink: string;
  fakeDate: string;
  fakeLocation: string;
  technicalNote: string;
  // Vídeo
  videoFile: File | null;
  videoPreviewUrl: string | null;
  videoUrlInput: string;
  // Áudio
  audioBase: File | null;
  audioHidden: File | null;
  audioBasePreview: string | null;
  audioHiddenPreview: string | null;
  // UV e Filtros
  uvFile: File | null;
  filterFile: File | null;
  // Thermal
  thermalEnabled: boolean;
  thermalSecretText: string;
  thermalKeyword: string;
}

export default function GlitchPuzzleForm({ 
  investigationId, 
  initialX, 
  initialY, 
  onSuccess, 
  onCancel 
}: Props) {
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
    descPublic: '',
    descHidden: '',
    hint: '',
    rewardCode: 'ALPHA-01',
    tags: '',
    isLocked: false,
    lockPass: '',
    stamp: '',
    externalLink: '',
    fakeDate: '',
    fakeLocation: '',
    technicalNote: '',
    videoFile: null,
    videoPreviewUrl: null,
    videoUrlInput: '',
    audioBase: null,
    audioHidden: null,
    audioBasePreview: null,
    audioHiddenPreview: null,
    uvFile: null,
    filterFile: null,
    thermalEnabled: false,
    thermalSecretText: '',
    thermalKeyword: '',
  });

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'audio'>('geral');

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

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setConfig(prev => ({ ...prev, videoFile: file, videoPreviewUrl: url }));
  };

  const handleAudioBaseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setConfig(prev => ({ ...prev, audioBase: file, audioBasePreview: url }));
  };

  const handleAudioHiddenSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setConfig(prev => ({ ...prev, audioHidden: file, audioHiddenPreview: url }));
  };

  const handleSave = async () => {
    if (!config.originalImageFile) {
      alert('Envie a imagem ORIGINAL. A versão corrompida será simulada pelo motor de glitch.');
      return;
    }

    if (!config.title.trim()) {
      alert('Defina um título para o quebra-cabeça');
      return;
    }

    setLoading(true);

    try {
      const originalUrl = await uploadInvestigationImage(config.originalImageFile!, investigationId);
      const corruptedUrl = config.corruptedImageFile
        ? await uploadInvestigationImage(config.corruptedImageFile, investigationId)
        : null;

      if (!originalUrl) {
        throw new Error('Falha ao fazer upload da imagem original');
      }

      // Upload opcional de vídeo
      let finalVideoUrl: string | null = config.videoUrlInput || null;
      if (!finalVideoUrl && config.videoFile) {
        try {
          finalVideoUrl = await uploadInvestigationFile(config.videoFile, investigationId, config.videoFile.name.split('.').pop() || 'mp4');
        } catch (e) {
          console.error('Video upload failed', e);
        }
      }

      // Upload opcional de áudio
      let audioBaseUrl: string | null = null;
      let audioHiddenUrl: string | null = null;
      if (config.audioBase) audioBaseUrl = await uploadAudio(config.audioBase, investigationId);
      if (config.audioHidden) audioHiddenUrl = await uploadAudio(config.audioHidden, investigationId);

      // Upload opcional de UV e filtros
      let uvUrl: string | null = null;
      let filterUrl: string | null = null;
      if (config.uvFile) uvUrl = await uploadInvestigationImage(config.uvFile, investigationId);
      if (config.filterFile) filterUrl = await uploadInvestigationImage(config.filterFile, investigationId);

      const metadata: Record<string, any> = {
        glitch_puzzle: {
          original_image_url: originalUrl,
          corrupted_image_url: corruptedUrl || null,
          correct_frequency: config.correctFrequency,
          correct_shift: config.correctShift,
          correct_chromatic: config.correctChromatic,
          hint: config.hint,
          reward_code: config.rewardCode,
          solved: false,
        },
      };

      // Vídeo
      if (finalVideoUrl) metadata.video_url = finalVideoUrl;

      // Áudio
      if (audioBaseUrl) metadata.audio_base_url = audioBaseUrl;
      if (audioHiddenUrl) metadata.audio_hidden_url = audioHiddenUrl;

      // UV e Filtros
      if (uvUrl) metadata.uv_reveal_url = uvUrl;
      if (filterUrl) metadata.filter_reveal_url = filterUrl;

      // Thermal
      if (config.thermalEnabled) {
        metadata.thermal = true;
        if (config.thermalSecretText) metadata.thermal_secret_text = config.thermalSecretText;
        if (config.thermalKeyword) metadata.thermal_keyword = config.thermalKeyword;
      }

      // Metadados falsos
      if (config.fakeDate) metadata.date_created = config.fakeDate;
      if (config.fakeLocation) metadata.gps_coords = config.fakeLocation;
      if (config.technicalNote) {
        metadata.technical_note = config.technicalNote;
        metadata.hex_comment = config.technicalNote;
      }
      if (config.externalLink) metadata.external_link = config.externalLink;

      const cardData = {
        investigation_id: investigationId,
        title: config.title,
        description_public: config.descPublic || config.description || null,
        description_hidden: config.descHidden || null,
        type: 'glitch_puzzle',
        image_url: originalUrl,
        x: initialX ?? 100,
        y: initialY ?? 100,
        tags: config.tags ? config.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        visibility: config.isLocked ? 'locked' : 'visible',
        metadata,
      };

      if (config.isLocked && config.lockPass) {
        (cardData.metadata as any).lock_pass = config.lockPass;
      }
      if (config.stamp) {
        (cardData.metadata as any).stamp_text = config.stamp;
      }

      console.log('📦 Criando Glitch Puzzle com dados:', cardData);

      await createInvestigationCard(cardData);

      console.log('✅ Glitch Puzzle criado com sucesso!');

      alert(`✓ Quebra-cabeça criado com sucesso!\n\nParâmetros corretos:\nFrequência: ${config.correctFrequency}\nDeslocamento: ${config.correctShift}%\nCromática: ${config.correctChromatic}%\n\nCódigo de Recompensa: ${config.rewardCode}`);

      onSuccess();
    } catch (err) {
      console.error('Erro ao criar quebra-cabeça', err);
      alert('Erro ao criar quebra-cabeça: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glitch-puzzle-form">
      {/* Abas */}
      <div className="tabs-header">
        <button 
          className={`tab-btn ${activeTab === 'geral' ? 'active' : ''}`}
          onClick={() => setActiveTab('geral')}
        >
          📝 GERAL
        </button>
        <button 
          className={`tab-btn ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => setActiveTab('visual')}
        >
          🎨 VISUAL
        </button>
        <button 
          className={`tab-btn ${activeTab === 'audio' ? 'active' : ''}`}
          onClick={() => setActiveTab('audio')}
        >
          🎵 ÁUDIO
        </button>
      </div>

      {activeTab === 'geral' && (
        <>
          {/* Seção 1: Imagens */}
          <div className="form-section">
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
      <div className="form-section">
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
      <div className="form-section">
        <h3>📝 METADADOS DO QUEBRA-CABEÇA</h3>
        
        <div className="field-group">
          <label>Título:</label>
          <input
            type="text"
            value={config.title}
            onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
            disabled={loading}
            maxLength={100}
          />
        </div>

        <div className="field-group">
          <label>Descrição:</label>
          <textarea
            value={config.description}
            onChange={e => setConfig(prev => ({ ...prev, description: e.target.value }))}
            disabled={loading}
            rows={3}
            maxLength={300}
          />
        </div>

        <div className="field-group">
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

      {/* Seção 4: Código de Recompensa */}
      <div className="form-section">
        <h3>🎁 RECOMPENSA AO RESOLVER</h3>
        
        <div className="field-group">
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

          {/* Seção 5: Resumo */}
          <div className="form-section summary">
        <h3>✓ RESUMO</h3>
        <div className="summary-content">
          <p>📌 <strong>Tipo:</strong> Quebra-cabeça de Glitch</p>
          <p>🎯 <strong>Objetivo:</strong> Jogador descobre parâmetros e decodifica</p>
          <p>🔧 <strong>Parâmetros corretos:</strong> {config.correctFrequency} fatias, {config.correctShift}% deslocamento, {config.correctChromatic}% cromática</p>
          <p>🎨 <strong>Imagens:</strong> {config.originalImageFile ? '✓' : '✗'} Original | {config.corruptedImageFile ? '✓' : '✗'} Corrompida (opcional)</p>
          <p>🎁 <strong>Recompensa:</strong> <code style={{ background: '#333', padding: '2px 6px', borderRadius: 3, color: '#c6a45f' }}>{config.rewardCode}</code></p>
          </div>
        </div>
      </>
      )}

      {activeTab === 'visual' && (
        <>
          {/* Descrições Públicas e Ocultas */}
          <div className="form-section">
            <h3>📝 DESCRIÇÕES</h3>
            
            <div className="field-group">
              <label>Descrição Pública (visível antes de resolver):</label>
              <textarea
                value={config.descPublic}
                onChange={e => setConfig(prev => ({ ...prev, descPublic: e.target.value }))}
                disabled={loading}
                rows={3}
                placeholder="O que todos veem ao inspecionar a pista"
              />
            </div>

            <div className="field-group">
              <label>Descrição Oculta (visível após resolver):</label>
              <textarea
                value={config.descHidden}
                onChange={e => setConfig(prev => ({ ...prev, descHidden: e.target.value }))}
                disabled={loading}
                rows={3}
                placeholder="Revelado após desbloquear"
              />
            </div>
          </div>

          {/* Tags e Organização */}
          <div className="form-section">
            <h3>🏷️ TAGS E ORGANIZAÇÃO</h3>
            
            <div className="field-group">
              <label>Tags (separadas por vírgula):</label>
              <input
                type="text"
                value={config.tags}
                onChange={e => setConfig(prev => ({ ...prev, tags: e.target.value }))}
                disabled={loading}
                placeholder="Ex: tecnologia, criptografia, alpha"
              />
              <small>Use tags para organizar e filtrar pistas no quadro</small>
            </div>

            <div className="field-group">
              <label>Carimbo Visual (aparece no canto):</label>
              <input
                type="text"
                value={config.stamp}
                onChange={e => setConfig(prev => ({ ...prev, stamp: e.target.value.toUpperCase() }))}
                disabled={loading}
                maxLength={20}
                placeholder="Ex: CONFIDENCIAL, URGENTE"
              />
            </div>
          </div>

          {/* Vídeo */}
          <div className="form-section">
            <h3>🎬 VÍDEO (opcional)</h3>
            
            <div className="field-group">
              <label>Upload de vídeo:</label>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                disabled={loading}
              />
            </div>

            <div className="field-group">
              <label>OU URL do vídeo (YouTube, Vimeo, etc.):</label>
              <input
                type="url"
                value={config.videoUrlInput}
                onChange={e => setConfig(prev => ({ ...prev, videoUrlInput: e.target.value }))}
                disabled={loading}
                placeholder="https://..."
              />
            </div>

            {config.videoPreviewUrl && (
              <div style={{marginTop:8}}>
                <video src={config.videoPreviewUrl} controls style={{maxWidth:'100%', maxHeight:160, background:'#000'}} />
              </div>
            )}
          </div>

          {/* Áudio */}
          <div className="form-section">
            <h3>🎵 ÁUDIO (opcional)</h3>
            
            <div className="field-group">
              <label>Áudio Base (ouvido normalmente):</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioBaseSelect}
                disabled={loading}
              />
              {config.audioBasePreview && (
                <audio src={config.audioBasePreview} controls style={{width:'100%', marginTop:8}} />
              )}
            </div>

            <div className="field-group">
              <label>Áudio Oculto (espectrograma/revelação):</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioHiddenSelect}
                disabled={loading}
              />
              {config.audioHiddenPreview && (
                <audio src={config.audioHiddenPreview} controls style={{width:'100%', marginTop:8}} />
              )}
            </div>
          </div>

          {/* Ferramentas Visuais */}
          <div className="form-section">
            <h3>🎨 FERRAMENTAS VISUAIS (opcional)</h3>
            
            <div className="field-group">
              <label>Camada UV (Luz Negra):</label>
              <input
                type="file"
                accept="image/png"
                onChange={e => setConfig(prev => ({ ...prev, uvFile: e.target.files?.[0] || null }))}
                disabled={loading}
              />
              <small>Upload de PNG com desenho revelado apenas com lanterna UV</small>
            </div>

            <div className="field-group">
              <label>Filtro de Revelação:</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => setConfig(prev => ({ ...prev, filterFile: e.target.files?.[0] || null }))}
                disabled={loading}
              />
              <small>Imagem revelada ao ajustar brilho/contraste/saturação</small>
            </div>

            <div className="field-group">
              <label style={{display:'flex', alignItems:'center', gap:8}}>
                <input
                  type="checkbox"
                  checked={config.thermalEnabled}
                  onChange={e => setConfig(prev => ({ ...prev, thermalEnabled: e.target.checked }))}
                  disabled={loading}
                />
                <span>Ativar Modo Thermal</span>
              </label>
              <small>Texto secreto visível apenas com câmera térmica</small>
            </div>

            {config.thermalEnabled && (
              <>
                <div className="field-group">
                  <label>Texto Secreto (thermal):</label>
                  <input
                    type="text"
                    value={config.thermalSecretText}
                    onChange={e => setConfig(prev => ({ ...prev, thermalSecretText: e.target.value }))}
                    disabled={loading}
                    placeholder="Ex: PROJETO NEXUS"
                  />
                </div>

                <div className="field-group">
                  <label>Palavra-chave para ativar thermal:</label>
                  <input
                    type="text"
                    value={config.thermalKeyword}
                    onChange={e => setConfig(prev => ({ ...prev, thermalKeyword: e.target.value.toUpperCase() }))}
                    disabled={loading}
                    placeholder="Ex: CALOR, TEMPERATURA"
                  />
                </div>
              </>
            )}
          </div>

          {/* Segurança */}
          <div className="form-section">
            <h3>🔒 SEGURANÇA</h3>
            
            <div className="field-group">
              <label style={{display:'flex', alignItems:'center', gap:8}}>
                <input
                  type="checkbox"
                  checked={config.isLocked}
                  onChange={e => setConfig(prev => ({ ...prev, isLocked: e.target.checked }))}
                  disabled={loading}
                />
                <span>Bloquear com senha</span>
              </label>
            </div>

            {config.isLocked && (
              <div className="field-group">
                <label>Senha de desbloqueio:</label>
                <input
                  type="text"
                  value={config.lockPass}
                  onChange={e => setConfig(prev => ({ ...prev, lockPass: e.target.value.toUpperCase() }))}
                  disabled={loading}
                  placeholder="Ex: KIAN, PROJETO-X"
                  style={{borderColor:'red', color:'red', fontWeight:'bold'}}
                />
              </div>
            )}
          </div>

          {/* Metadados Falsos */}
          <div className="form-section">
            <h3>🗃️ METADADOS FALSOS (HACKING)</h3>
            
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:10}}>
              <div className="field-group">
                <label>Data Fake:</label>
                <input
                  type="text"
                  value={config.fakeDate}
                  onChange={e => setConfig(prev => ({ ...prev, fakeDate: e.target.value }))}
                  disabled={loading}
                  placeholder="2024-12-25 14:30:00"
                />
              </div>

              <div className="field-group">
                <label>Coordenadas GPS Fake:</label>
                <input
                  type="text"
                  value={config.fakeLocation}
                  onChange={e => setConfig(prev => ({ ...prev, fakeLocation: e.target.value }))}
                  disabled={loading}
                  placeholder="40.7128° N, 74.0060° W"
                />
              </div>
            </div>

            <div className="field-group">
              <label>Nota Técnica / Comentário HEX:</label>
              <textarea
                value={config.technicalNote}
                onChange={e => setConfig(prev => ({ ...prev, technicalNote: e.target.value }))}
                disabled={loading}
                rows={3}
                placeholder="Ex: 00 4F 52 44 4F 00 ou anotações técnicas"
                style={{fontFamily:'monospace', fontSize:12}}
              />
              <small>Visível ao inspecionar código fonte da evidência</small>
            </div>
          </div>

          {/* Links Externos */}
          <div className="form-section">
            <h3>🔗 LINKS EXTERNOS</h3>
            
            <div className="field-group">
              <label>Link Externo (QR Code):</label>
              <input
                type="url"
                value={config.externalLink}
                onChange={e => setConfig(prev => ({ ...prev, externalLink: e.target.value }))}
                disabled={loading}
                placeholder="https://..."
              />
              <small>Será convertido em QR Code visível na pista</small>
            </div>
          </div>
        </>
      )}

      {activeTab === 'audio' && (
        <>
          {/* Áudio */}
          <div className="form-section">
            <h3>🎵 ÁUDIO</h3>
            
            <div className="field-group">
              <label>Áudio Base (ouvido normalmente):</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioBaseSelect}
                disabled={loading}
              />
              {config.audioBasePreview && (
                <audio src={config.audioBasePreview} controls style={{width:'100%', marginTop:8}} />
              )}
            </div>

            <div className="field-group">
              <label>Áudio Oculto (espectrograma/revelação):</label>
              <input
                type="file"
                accept="audio/*"
                onChange={handleAudioHiddenSelect}
                disabled={loading}
              />
              {config.audioHiddenPreview && (
                <audio src={config.audioHiddenPreview} controls style={{width:'100%', marginTop:8}} />
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer com botões */}
      <div className="form-footer">
        <button 
          className="btn btn-cancel" 
          onClick={onCancel}
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
  );
}
