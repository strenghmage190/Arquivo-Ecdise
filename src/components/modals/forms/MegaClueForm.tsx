import React, { useState, useEffect } from 'react';
import { createInvestigationCard, fetchCardsForInvestigation } from '../../../api/investigations';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../../utils/storage';
import { supabase } from '../../../supabaseClient';
import './MegaClueForm.css';
import { validateCreateClue } from '../../../utils/validateClue';

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
  requiredCodeCount?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface GlitchPuzzleOption {
  id: string;
  title: string;
  rewardCode: string;
}

interface MegaClueConfig {
  title: string;
  description: string;
  descPublic: string;
  descHidden: string;
  finalTruthText: string;
  imageFile: File | null;
  imagePreview: string | null;
  selectedPuzzleIds: string[];
  requiredCodeCount: number;
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

export default function MegaClueForm({ 
  investigationId, 
  initialX, 
  initialY, 
  requiredCodeCount = 3,
  onSuccess, 
  onCancel 
}: Props) {
  const [config, setConfig] = useState<MegaClueConfig>({
    title: 'A VERDADE FINAL',
    description: 'Todos os quebra-cabeças resolvidos. A verdade aguarda quem conseguir desbloquear todos os códigos necessários.',
    descPublic: '',
    descHidden: '',
    finalTruthText: 'A investigação revelou que... [Insira aqui o texto final da verdade que será revelado]',
    imageFile: null,
    imagePreview: null,
    selectedPuzzleIds: [],
    requiredCodeCount: requiredCodeCount,
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
  const [availablePuzzles, setAvailablePuzzles] = useState<GlitchPuzzleOption[]>([]);
  const [loadingPuzzles, setLoadingPuzzles] = useState(true);
  const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'audio'>('geral');

  // Carregar os puzzles disponíveis quando o componente montar
  useEffect(() => {
    loadAvailablePuzzles();
  }, [investigationId]);

  const loadAvailablePuzzles = async () => {
    setLoadingPuzzles(true);
    try {
      const cards = await fetchCardsForInvestigation(investigationId);
      
      console.log('🔍 Cards retornados:', cards);
      console.log('📊 Total de cards:', cards.length);
      
      // Mostrar tipos de cada card
      cards.forEach((card: any, index: number) => {
        console.log(`Card ${index + 1}:`, {
          id: card.id,
          title: card.title,
          type: card.type,
          hasMetadata: !!card.metadata,
          hasGlitchPuzzleMetadata: !!card.metadata?.glitch_puzzle,
        });
      });
      
      // Filtrar apenas os glitch_puzzles
      const puzzles: GlitchPuzzleOption[] = cards
        .filter((card: any) => {
          const isGlitchPuzzle = card.type === 'glitch_puzzle';
          console.log(`Filtro - Card "${card.title}": type="${card.type}", isGlitchPuzzle=${isGlitchPuzzle}`);
          return isGlitchPuzzle;
        })
        .map((card: any) => ({
          id: card.id,
          title: card.title || 'Quebra-cabeça sem título',
          rewardCode: card.metadata?.glitch_puzzle?.reward_code || 'SEM-CÓDIGO',
        }));
      
      console.log('✅ Puzzles filtrados:', puzzles);
      console.log('📈 Total de puzzles:', puzzles.length);
      
      setAvailablePuzzles(puzzles);
    } catch (err) {
      console.error('❌ Erro ao carregar puzzles', err);
    } finally {
      setLoadingPuzzles(false);
    }
  };

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

  const handlePuzzleToggle = (puzzleId: string) => {
    setConfig(prev => {
      const isSelected = prev.selectedPuzzleIds.includes(puzzleId);
      
      if (isSelected) {
        // Remover
        return {
          ...prev,
          selectedPuzzleIds: prev.selectedPuzzleIds.filter(id => id !== puzzleId),
        };
      } else {
        // Adicionar
        return {
          ...prev,
          selectedPuzzleIds: [...prev.selectedPuzzleIds, puzzleId],
        };
      }
    });
  };

  const handleSave = async () => {
    const errors = validateCreateClue({
      title: config.title,
      isHidden: false,
      discoveryCode: '',
      securityLayerEnabled: false,
      evidenceType: 'mega_clue',
      megaFinalTruthText: config.finalTruthText,
      megaRequiredPuzzleIds: config.selectedPuzzleIds,
      imgFile: config.imageFile,
      videoFile: config.videoFile,
      videoUrlInput: config.videoUrlInput || null,
      audioBase: config.audioBase,
    });

    if (errors.length > 0) {
      alert('Erros de validação:\n' + errors.map((e, i) => `${i + 1}. ${e}`).join('\n'));
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
        mega_clue: {
          final_truth_text: config.finalTruthText,
          required_puzzle_ids: config.selectedPuzzleIds,
          solved_puzzle_ids: [],
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
        type: 'mega_clue',
        image_url: imageUrl,
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

      await createInvestigationCard(cardData);

      alert(`✓ Mega-Pista criada com sucesso!\n\nQuebra-cabeças vinculados: ${config.selectedPuzzleIds.length}\n\nO jogador precisará resolver todos esses puzzles para desbloquear a verdade final.`);

      onSuccess();
    } catch (err) {
      console.error('Erro ao criar mega-pista', err);
      alert('Erro ao criar mega-pista: ' + (err instanceof Error ? err.message : 'Desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mega-clue-form">
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
          {/* Seção 1: Básico */}
          <div className="form-section">
        <h3>📌 INFORMAÇÕES BÁSICAS</h3>
        
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

      {/* Seção 2: Vincular Quebra-Cabeças */}
      <div className="form-section">
        <h3>🧩 VINCULAR QUEBRA-CABEÇAS NECESSÁRIOS</h3>
        
        {loadingPuzzles ? (
          <div className="loading-puzzles">
            <p>Carregando quebra-cabeças disponíveis...</p>
          </div>
        ) : availablePuzzles.length === 0 ? (
          <div className="no-puzzles">
            <p>⚠️ <strong>Nenhum quebra-cabeça encontrado!</strong></p>
            <p>Você precisa criar pelo menos um Glitch Puzzle antes de criar uma Mega-Pista.</p>
            <p>Feche este formulário e crie os quebra-cabeças primeiro.</p>
          </div>
        ) : (
          <>
            <p className="puzzle-selection-hint">
              Selecione os quebra-cabeças que o jogador deve resolver para desbloquear esta mega-pista.
              A ordem não importa - todos devem ser resolvidos.
            </p>
            
            <div className="puzzles-list">
              {availablePuzzles.map(puzzle => (
                <label key={puzzle.id} className="puzzle-checkbox-item">
                  <input
                    type="checkbox"
                    checked={config.selectedPuzzleIds.includes(puzzle.id)}
                    onChange={() => handlePuzzleToggle(puzzle.id)}
                    disabled={loading}
                  />
                  <div className="puzzle-info">
                    <span className="puzzle-title">{puzzle.title}</span>
                    <code className="puzzle-code">Código: {puzzle.rewardCode}</code>
                  </div>
                </label>
              ))}
            </div>
            
            <div className="selection-summary">
              <strong>Quebra-cabeças selecionados:</strong> {config.selectedPuzzleIds.length}
              {config.selectedPuzzleIds.length === 0 && (
                <span className="warning-text"> (Selecione pelo menos um!)</span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Seção 3: Verdade */}
      <div className="form-section">
        <h3>🌟 A VERDADE FINAL (revelada ao desbloquear)</h3>
        
        <div className="field-group">
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
      <div className="form-section">
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
      <div className="form-section summary">
        <h3>✓ RESUMO</h3>
        <div className="summary-content">
          <p>📌 <strong>Tipo:</strong> Mega-Pista (Verdade Final)</p>
          <p>🔒 <strong>Desbloqueio:</strong> Requer resolver {config.selectedPuzzleIds.length} quebra-cabeça{config.selectedPuzzleIds.length !== 1 ? 's' : ''} vinculado{config.selectedPuzzleIds.length !== 1 ? 's' : ''}</p>
          <p>📝 <strong>Texto:</strong> {config.finalTruthText.substring(0, 50)}...</p>
          <p>🖼 <strong>Imagem:</strong> {config.imageFile ? '✓ Será incluída' : '✗ Nenhuma'}</p>
          {config.selectedPuzzleIds.length > 0 && (
            <div className="selected-puzzles-summary">
              <strong>Puzzles vinculados:</strong>
              <ul>
                {config.selectedPuzzleIds.map(id => {
                  const puzzle = availablePuzzles.find(p => p.id === id);
                  return puzzle ? (
                    <li key={id}>
                      <span className="puzzle-icon">🧩</span> {puzzle.title} 
                      <code className="mini-code">({puzzle.rewardCode})</code>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
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
              <label>Descrição Pública (visível antes de desbloquear):</label>
              <textarea
                value={config.descPublic}
                onChange={e => setConfig(prev => ({ ...prev, descPublic: e.target.value }))}
                disabled={loading}
                rows={3}
                placeholder="O que todos veem ao inspecionar a pista"
              />
            </div>

            <div className="field-group">
              <label>Descrição Oculta (visível após desbloquear):</label>
              <textarea
                value={config.descHidden}
                onChange={e => setConfig(prev => ({ ...prev, descHidden: e.target.value }))}
                disabled={loading}
                rows={3}
                placeholder="Revelado após desbloquear todos os quebra-cabeças"
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
                placeholder="Ex: verdade-final, revelação, mega-pista"
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
                placeholder="Ex: ULTRA SECRETO, NÍVEL 5"
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
                <span>Bloquear com senha adicional</span>
              </label>
              <small>Além de resolver os quebra-cabeças, exigir uma senha extra</small>
            </div>

            {config.isLocked && (
              <div className="field-group">
                <label>Senha de desbloqueio:</label>
                <input
                  type="text"
                  value={config.lockPass}
                  onChange={e => setConfig(prev => ({ ...prev, lockPass: e.target.value.toUpperCase() }))}
                  disabled={loading}
                  placeholder="Ex: REVELAÇÃO, VERDADE-FINAL"
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
          disabled={loading}
        >
          {loading ? 'CRIANDO...' : '✓ CRIAR MEGA-PISTA'}
        </button>
      </div>
    </div>
  );
}
