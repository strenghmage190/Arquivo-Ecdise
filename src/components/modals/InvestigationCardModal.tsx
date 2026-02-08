import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useEscapeClose from './useEscapeClose';
import { InvestigationCard, InvestigationCardInsight, createInvestigationCard, updateInvestigationCard, deleteInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { validateImageFile } from '../../utils/fileValidators';
import { validateMegaClueData } from '../../utils/validationSchemas';
import GlitchPuzzleCard from '../tools/GlitchPuzzleCard';
import MegaClueCard from '../tools/MegaClueCard';
import { modalManager } from '../../utils/ModalManager';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useSwipeable } from 'react-swipeable';

interface Props {
  open: boolean;
  onClose: () => void;
  investigationId: string;
  existing?: InvestigationCard;
  onSaved?: (card?: Record<string, any> | null) => void;
  isGameMaster?: boolean;
}

const emptyInsight = (): InvestigationCardInsight => ({ id: String(Date.now()), skill: '', cost: 1, text: '', visibility: 'hidden', reveal_to: [] });

export default function InvestigationCardModal({ open, onClose, investigationId, existing, onSaved, isGameMaster = false }: Props) {
  const isMobile = useIsMobile();
  const [title, setTitle] = useState(existing?.title || '');
  const [descriptionPublic, setDescriptionPublic] = useState(existing?.description_public || '');
  const [descriptionHidden, setDescriptionHidden] = useState(existing?.description_hidden || '');
  const [insights, setInsights] = useState<InvestigationCardInsight[]>(existing?.insights || []);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(existing?.image_url || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [status, setStatus] = useState<string | null>((existing as any)?.metadata?.status || null);
  // Chat editor states (allow editing chat_data when editing a card)
  const [chatEditorOpen, setChatEditorOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[] | null>(null);
  const [newMsgText, setNewMsgText] = useState('');
  const [newMsgSender, setNewMsgSender] = useState<'me'|'them'>('them');
  // Mega-clue editing states
  const [isEditingMegaClue, setIsEditingMegaClue] = useState(false);
  const [tempMegaClueData, setTempMegaClueData] = useState<any>(null);
  const [newRequiredId, setNewRequiredId] = useState('');
  // Media layer states (UV/Thermal)
  const [layerUploading, setLayerUploading] = useState<'uv' | 'thermal' | null>(null);
  const [uvUrl, setUvUrl] = useState<string | null>((existing as any)?.metadata?.uv_layer?.url || null);
  const [thermalUrl, setThermalUrl] = useState<string | null>((existing as any)?.metadata?.thermal_layer?.url || null);
  useEscapeClose(open, onClose);

  // Ensure swipe handlers hook is always called (avoid conditional hook ordering)
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => {
      if (isMobile) onClose();
    },
    trackMouse: false,
  });
  
  // ✅ Registra modal no ModalManager
  useEffect(() => {
    modalManager.register('investigation-card-modal', 5);
  }, []);

  // ✅ Usa ModalManager para controle de abertura/fechamento
  useEffect(() => {
    if (open) {
      modalManager.open('investigation-card-modal', () => {
        // Callback de limpeza ao fechar
        setPreviewUrl(null);
        setSelectedFileName(null);
      });
    } else {
      modalManager.close('investigation-card-modal');
    }
  }, [open]);
  
  useEffect(() => {
    setTitle(existing?.title || '');
    setDescriptionPublic(existing?.description_public || '');
    setDescriptionHidden(existing?.description_hidden || '');
    setInsights(existing?.insights || []);
    setImageUrl(existing?.image_url || null);
    setStatus((existing as any)?.metadata?.status || null);
    // initialize chat editor with existing chat data if present
    try {
      const ex: any = existing as any;
      if (ex) {
        if (ex.chat_data && Array.isArray(ex.chat_data)) setChatMessages(ex.chat_data);
        else if (ex.metadata && ex.metadata.chat_data && Array.isArray(ex.metadata.chat_data)) setChatMessages(ex.metadata.chat_data);
        else setChatMessages(null);
      }
    } catch (e) { setChatMessages(null); }
  }, [existing]);
  if (!open) return null;

  const addInsight = () => setInsights((s) => [...s, emptyInsight()]);
  const updateInsight = (idx: number, patch: Partial<InvestigationCardInsight>) => setInsights((s) => s.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeInsight = (idx: number) => setInsights((s) => s.filter((_, i) => i !== idx));

  // Mega-clue editing handlers
  const initializeMegaClueEdit = () => {
    const metadata = (existing as any)?.metadata;
    const megaClueData = metadata?.mega_clue || {};
    setTempMegaClueData({
      final_truth_text: megaClueData.final_truth_text || '',
      final_image_url: megaClueData.final_image_url || '',
      required_puzzle_ids: Array.isArray(megaClueData.required_puzzle_ids) ? [...megaClueData.required_puzzle_ids] : [],
    });
    setIsEditingMegaClue(true);
  };

  const handleAddRequiredId = () => {
    if (!newRequiredId.trim()) return;
    setTempMegaClueData((prev: any) => ({
      ...prev,
      required_puzzle_ids: [...prev.required_puzzle_ids, newRequiredId.trim()],
    }));
    setNewRequiredId('');
  };

  const handleRemoveRequiredId = (index: number) => {
    setTempMegaClueData((prev: any) => ({
      ...prev,
      required_puzzle_ids: prev.required_puzzle_ids.filter((_: string, i: number) => i !== index),
    }));
  };

  const handleSaveMegaClueChanges = async () => {
    if (!existing || !existing.id) return;
    try {
      // Preparar dados para validação
      const megaClueData = {
        final_truth_text: tempMegaClueData.final_truth_text,
        final_image_url: tempMegaClueData.final_image_url,
        required_puzzle_ids: tempMegaClueData.required_puzzle_ids,
      };

      // ✅ Validação com Zod
      const validation = validateMegaClueData(megaClueData);
      if (!validation.success) {
        const errorMsg = (validation.errors || []).join('\n');
        alert(`❌ Erro de validação:\n${errorMsg}`);
        return;
      }

      const metadata = (existing as any)?.metadata || {};
      const updates = {
        metadata: {
          ...metadata,
          mega_clue: {
            ...metadata.mega_clue,
            final_truth_text: tempMegaClueData.final_truth_text,
            final_image_url: tempMegaClueData.final_image_url,
            required_puzzle_ids: tempMegaClueData.required_puzzle_ids,
          },
        },
      };
      await updateInvestigationCard(existing.id, updates);
      setIsEditingMegaClue(false);
      setTempMegaClueData(null);
      setNewRequiredId('');
      onSaved?.(existing);
    } catch (error) {
      console.error('Erro ao salvar alterações da Mega-Pista:', error);
      alert('Erro ao salvar. Veja o console para detalhes.');
    }
  };

  const handleCancelMegaClueEdit = () => {
    setIsEditingMegaClue(false);
    setTempMegaClueData(null);
    setNewRequiredId('');
  };

  const handleSave = async () => {
    const payload: any = {
      investigation_id: investigationId,
      title: title || 'Sem título',
      description_public: descriptionPublic,
      description_hidden: descriptionHidden,
      insights,
      image_url: imageUrl || undefined,
      tags: [],
      metadata: { ...(existing as any)?.metadata || {}, status: status || undefined },
    } as any;

    // Preserve existing chat data/contact if present to avoid accidental deletion when editing
    try {
      const existingAny = existing as any;
      if (existingAny) {
        if (existingAny.chat_data && !payload.chat_data) payload.chat_data = existingAny.chat_data;
        if (existingAny.chat_contact_name && !payload.chat_contact_name) payload.chat_contact_name = existingAny.chat_contact_name;
        // Also ensure metadata retains any embedded chat_data for backwards-compatibility
        payload.metadata = payload.metadata || {};
        if (existingAny.metadata && existingAny.metadata.chat_data && !payload.metadata.chat_data) payload.metadata.chat_data = existingAny.metadata.chat_data;
        if (existingAny.metadata && existingAny.metadata.chat_contact_name && !payload.metadata.chat_contact_name) payload.metadata.chat_contact_name = existingAny.metadata.chat_contact_name;
      }
    } catch (e) { /* ignore */ }

    try {
      // include chat editor data in payload if provided
      if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
        payload.chat_data = chatMessages;
        // preserve explicit contact name if present in metadata
        if (!payload.chat_contact_name && (existing as any)?.chat_contact_name) payload.chat_contact_name = (existing as any).chat_contact_name;
      }

      if (existing && existing.id) {
        const updated = await updateInvestigationCard(existing.id!, payload);
        onSaved && onSaved(updated);
      } else {
        const created = await createInvestigationCard(payload);
        onSaved && onSaved(created);
      }
      onClose();
    } catch (e) {
      console.error('Falha ao salvar card de investigação', e);
      alert('Erro ao salvar. Veja o console para detalhes.');
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    const file = event.target.files[0];
    const check = validateImageFile(file);
    if (!check.ok) {
      alert(check.reason);
      return;
    }
    setUploading(true);
    try {
      // build preview and measure dimensions
      const reader = new FileReader();
      reader.onload = () => {
        const url = String(reader.result || '');
        setPreviewUrl(url);
        const img = new Image();
        img.onload = () => setImageDims({ w: img.naturalWidth, h: img.naturalHeight });
        img.src = url;
      };
      reader.readAsDataURL(file);

      const publicUrl = await uploadInvestigationImage(file, investigationId);
      if (publicUrl) {
        setSelectedFileName(file.name);
        setImageUrl(publicUrl);
      } else {
        alert('Erro ao subir imagem');
      }
    } catch (error) {
      console.error('Falha ao enviar imagem:', error);
      alert('Erro no upload: veja o console');
    } finally {
      setUploading(false);
    }
  };

  // Handlers para upload de camadas UV/Térmica
  const handleLayerUpload = async (layer: 'uv' | 'thermal', file: File) => {
    const check = validateImageFile(file);
    if (!check.ok) {
      alert(check.reason);
      return;
    }

    setLayerUploading(layer);
    try {
      const publicUrl = await uploadInvestigationImage(file, investigationId);
      if (publicUrl) {
        // Atualizar metadata com a URL da camada
        const metadata = (existing as any)?.metadata || {};
        const layerKey = layer === 'uv' ? 'uv_layer' : 'thermal_layer';
        
        const updates = {
          metadata: {
            ...metadata,
            [layerKey]: { url: publicUrl, uploaded_at: new Date().toISOString() },
          },
        };

        await updateInvestigationCard(existing.id, updates);
        
        if (layer === 'uv') {
          setUvUrl(publicUrl);
        } else {
          setThermalUrl(publicUrl);
        }
        alert(`✅ Camada ${layer === 'uv' ? 'UV' : 'Térmica'} enviada com sucesso!`);
      } else {
        alert('Erro ao subir camada');
      }
    } catch (error) {
      console.error(`Falha ao enviar camada ${layer}:`, error);
      alert('Erro no upload: veja o console');
    } finally {
      setLayerUploading(null);
    }
  };

  const handleRemoveLayer = async (layer: 'uv' | 'thermal') => {
    if (!existing || !existing.id) return;
    if (!confirm(`Tem certeza que deseja remover a camada ${layer === 'uv' ? 'UV' : 'Térmica'}?`)) return;

    try {
      const metadata = (existing as any)?.metadata || {};
      const layerKey = layer === 'uv' ? 'uv_layer' : 'thermal_layer';
      
      const updates = {
        metadata: {
          ...metadata,
          [layerKey]: null,
        },
      };

      await updateInvestigationCard(existing.id, updates);
      
      if (layer === 'uv') {
        setUvUrl(null);
      } else {
        setThermalUrl(null);
      }
      alert(`✅ Camada removida com sucesso!`);
    } catch (error) {
      console.error(`Falha ao remover camada ${layer}:`, error);
      alert('Erro ao remover: veja o console');
    }
  };

  const handleDelete = async () => {
    if (!existing || !existing.id) return;
    if (!confirm('Tem certeza que deseja apagar esta pista?')) return;
    try {
      await deleteInvestigationCard(existing.id);
      onSaved && onSaved(null);
      onClose();
    } catch (e) {
      console.error('Falha ao deletar pista', e);
      alert('Erro ao deletar. Veja o console.');
    }
  };

  // Se é um card especial (glitch_puzzle ou mega_clue), renderizar componente específico
  const cardType = (existing as any)?.type;
  const metadata = (existing as any)?.metadata;

  if (cardType === 'glitch_puzzle' && metadata?.glitch_puzzle && existing?.id) {
    const puzzleData = {
      id: existing.id,
      title: existing.title,
      description: existing.description_public || '',
      ...metadata.glitch_puzzle,
    };

    return createPortal(
      <div className="modal-backdrop" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          <GlitchPuzzleCard
            cardId={existing.id}
            investigationId={investigationId}
            puzzleData={puzzleData}
            onClose={onClose}
            isGameMaster={isGameMaster}
            onSolved={(rewardCode) => {
              console.log('Puzzle resolvido! Código:', rewardCode);
              onSaved?.(existing);
            }}
          />
        </div>
      </div>,
      document.body
    );
  }

  if (cardType === 'mega_clue' && metadata?.mega_clue && existing?.id) {
    const megaData = metadata.mega_clue;

    return createPortal(
      <div className="modal-backdrop" onClick={onClose}>
        <div onClick={(e) => e.stopPropagation()}>
          <MegaClueCard
            cardId={existing.id}
            investigationId={investigationId}
            title={existing.title}
            description={existing.description_public || ''}
            imageUrl={existing.image_url}
            requiredCodes={megaData.required_puzzle_ids?.length || megaData.required_code_count || 3}
            finalTruthText={megaData.final_truth_text}
            collectedCodes={Array.isArray(megaData.collected_codes) ? megaData.collected_codes : []}
            metadata={metadata}
            isGameMaster={isGameMaster}
            onRefresh={() => onSaved?.(existing)}
            onClose={onClose}
          />
        </div>
      </div>,
      document.body
    );
  }

 

  const modal = (
    <div className="modal-backdrop" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        {...(isMobile ? swipeHandlers : {})}
        style={{ 
          width: isMobile ? '100vw' : 720, 
          height: isMobile ? '100vh' : 'auto',
          maxWidth: isMobile ? '100vw' : '95vw',
          maxHeight: isMobile ? '100vh' : '90vh',
          overflowY: isMobile ? 'auto' : 'visible'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{isGameMaster ? (existing ? 'EDITAR PISTA' : 'CRIAR PISTA') : 'DETALHES DA EVIDÊNCIA'}</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%', border: !isGameMaster ? 'none' : undefined }} disabled={!isGameMaster} />
            <label>Descrição Visível</label>
            <textarea value={descriptionPublic} onChange={(e) => setDescriptionPublic(e.target.value)} style={{ width: '100%', border: !isGameMaster ? 'none' : undefined }} disabled={!isGameMaster} />
            <label>Descrição Oculta</label>
            <textarea value={descriptionHidden} onChange={(e) => setDescriptionHidden(e.target.value)} style={{ width: '100%', border: !isGameMaster ? 'none' : undefined }} disabled={!isGameMaster} />

            {/* Chat editor (only for game masters) */}
            {isGameMaster && (
              <div style={{ marginTop: 12, borderTop: '1px solid #222', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>📱 Chat / Mensagens</strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setChatEditorOpen(s => !s)} style={{ padding: '4px 8px' }}>{chatEditorOpen ? 'Fechar' : 'Editar'}</button>
                  </div>
                </div>
                {chatEditorOpen && (
                  <div>
                    <div style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid #333', padding: 8, marginBottom: 8 }}>
                      {(!chatMessages || chatMessages.length === 0) && <div style={{ color: '#777', fontSize: 13 }}>Nenhuma mensagem.</div>}
                      {chatMessages && chatMessages.map((m, i) => (
                        <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ flex: 1, background: m.sender === 'me' ? '#053' : '#111', color: '#fff', padding: '6px 8px', borderRadius: 6 }}>
                            <div style={{ fontSize: 12, opacity: 0.8 }}>{m.text || m.message || m.body || ''}</div>
                            <div style={{ fontSize: 10, color: '#bbb', marginTop: 4 }}>{m.time || ''}</div>
                          </div>
                          <button type="button" onClick={() => setChatMessages(prev => (prev || []).filter((_, idx) => idx !== i))}>Remover</button>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <select value={newMsgSender} onChange={e => setNewMsgSender(e.target.value as 'me' | 'them')} style={{ width: 100 }}>
                        <option value="them">Contato</option>
                        <option value="me">Eu</option>
                      </select>
                      <input placeholder="Digite a mensagem..." value={newMsgText} onChange={e => setNewMsgText(e.target.value)} style={{ flex: 1 }} onKeyDown={e => { if (e.key === 'Enter') { const nm = newMsgText.trim(); if (!nm) return; const toAdd = { sender: newMsgSender, text: nm, time: new Date().toLocaleTimeString().slice(0,5), type: 'text' }; setChatMessages(prev => [...(prev || []), toAdd]); setNewMsgText(''); } }} />
                      <button type="button" onClick={() => { const nm = newMsgText.trim(); if (!nm) return; const toAdd = { sender: newMsgSender, text: nm, time: new Date().toLocaleTimeString().slice(0,5), type: 'text' }; setChatMessages(prev => [...(prev || []), toAdd]); setNewMsgText(''); }} style={{ padding: '6px 10px' }}>ADD</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mega-clue editor (only for game masters) */}
            {isGameMaster && (existing as any)?.metadata?.mega_clue && (
              <div style={{ marginTop: 12, borderTop: '1px solid #222', paddingTop: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong>🔐 Mega-Pista</strong>
                  <button type="button" onClick={() => { if (isEditingMegaClue) handleCancelMegaClueEdit(); else initializeMegaClueEdit(); }} style={{ padding: '4px 8px' }}>{isEditingMegaClue ? 'Cancelar' : 'Editar'}</button>
                </div>
                {!isEditingMegaClue ? (
                  <div style={{ fontSize: 13, color: '#ccc' }}>
                    <div><strong>Texto da Verdade:</strong> {((existing as any)?.metadata?.mega_clue?.final_truth_text || 'Não definido').substring(0, 100)}{((existing as any)?.metadata?.mega_clue?.final_truth_text || '').length > 100 ? '...' : ''}</div>
                    <div style={{ marginTop: 4 }}><strong>IDs Obrigatórios:</strong> {Array.isArray((existing as any)?.metadata?.mega_clue?.required_puzzle_ids) ? (existing as any)?.metadata?.mega_clue?.required_puzzle_ids.length : 0} puzzle(s)</div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', marginBottom: 8 }}>Texto da Verdade Final ({(tempMegaClueData?.final_truth_text || '').length}/2000)</label>
                    <textarea
                      value={tempMegaClueData?.final_truth_text || ''}
                      onChange={(e) => {
                        const text = e.target.value.substring(0, 2000);
                        setTempMegaClueData((prev: any) => ({ ...prev, final_truth_text: text }));
                      }}
                      style={{ width: '100%', minHeight: 80, marginBottom: 8, padding: 8, border: '1px solid #444', borderRadius: 6, background: '#111', color: '#fff', fontSize: 13 }}
                      placeholder="Escreva o texto final da verdade..."
                    />
                    
                    <label style={{ display: 'block', marginBottom: 8 }}>URL da Imagem Final (opcional)</label>
                    <input
                      type="text"
                      value={tempMegaClueData?.final_image_url || ''}
                      onChange={(e) => setTempMegaClueData((prev: any) => ({ ...prev, final_image_url: e.target.value }))}
                      style={{ width: '100%', marginBottom: 8, padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#111', color: '#fff', fontSize: 13 }}
                      placeholder="https://..."
                    />
                    
                    <label style={{ display: 'block', marginBottom: 8 }}><strong>IDs dos Puzzles Obrigatórios</strong></label>
                    <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #333', padding: 8, marginBottom: 8, borderRadius: 6, background: '#0a0a0a' }}>
                      {(!tempMegaClueData?.required_puzzle_ids || tempMegaClueData.required_puzzle_ids.length === 0) ? (
                        <div style={{ color: '#666', fontSize: 12 }}>Nenhum puzzle adicionado</div>
                      ) : (
                        tempMegaClueData.required_puzzle_ids.map((id: string, index: number) => (
                          <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6, padding: '6px', background: '#111', borderRadius: 4 }}>
                            <span style={{ flex: 1, fontSize: 12, color: '#aaa', wordBreak: 'break-all' }}>{id}</span>
                            <button type="button" onClick={() => handleRemoveRequiredId(index)} style={{ padding: '4px 8px', background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11 }}>🗑️ Remover</button>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                      <input
                        type="text"
                        value={newRequiredId}
                        onChange={(e) => setNewRequiredId(e.target.value)}
                        style={{ flex: 1, padding: '6px 8px', border: '1px solid #444', borderRadius: 6, background: '#111', color: '#fff', fontSize: 12 }}
                        placeholder="Cole o UUID do puzzle..."
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAddRequiredId(); }}
                      />
                      <button type="button" onClick={handleAddRequiredId} style={{ padding: '6px 10px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}>➕ Adicionar</button>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button type="button" onClick={handleCancelMegaClueEdit} style={{ flex: 1, padding: '8px 12px', background: '#333', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Cancelar</button>
                      <button type="button" onClick={handleSaveMegaClueChanges} style={{ flex: 1, padding: '8px 12px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✓ Salvar</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          <div style={{ width: 320 }}>
            <label>Imagem (opcional)</label>
            {isGameMaster ? (
              <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            ) : (
              <div style={{ fontSize: 12, color: '#ccc' }}>{imageUrl ? 'Imagem disponível' : 'Sem imagem'}</div>
            )}
            <div style={{ fontSize: 12 }}>{selectedFileName}</div>
            {uploading && <div style={{ fontSize: 12 }}>Enviando imagem...</div>}
            {previewUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 160, display: 'block' }} />
                {imageDims && <div style={{ fontSize: 12, color: '#ccc' }}>Dimensões: {imageDims.w}x{imageDims.h}</div>}
              </div>
            )}

            {/* Media Layer Management (UV/Thermal) - Only for Game Masters in Edit Mode */}
            {isGameMaster && (!existing || (existing as any)?.type === undefined || (existing as any)?.type === 'document') && (
              <>
                {/* UV Layer */}
                <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid #333' }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>📤 Camada UV (opcional)</span>
                    {uvUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLayer('uv')}
                        style={{ padding: '4px 8px', fontSize: 12, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        🗑️ Remover
                      </button>
                    )}
                  </label>
                  {uvUrl ? (
                    <div style={{ fontSize: 12, color: '#aaa' }}>
                      ✅ Camada UV carregada
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) handleLayerUpload('uv', file);
                          };
                          input.click();
                        }}
                        disabled={layerUploading === 'uv'}
                        style={{ marginLeft: 8, padding: '4px 8px', fontSize: 12, background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        🔄 Substituir
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) handleLayerUpload('uv', file);
                        };
                        input.click();
                      }}
                      disabled={layerUploading === 'uv'}
                      style={{ width: '100%', padding: '8px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      {layerUploading === 'uv' ? '⏳ Enviando...' : '⬆️ Fazer Upload'}
                    </button>
                  )}
                </div>

                {/* Thermal Layer */}
                <div style={{ marginTop: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span>🌡️ Camada Térmica (opcional)</span>
                    {thermalUrl && (
                      <button
                        type="button"
                        onClick={() => handleRemoveLayer('thermal')}
                        style={{ padding: '4px 8px', fontSize: 12, background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        🗑️ Remover
                      </button>
                    )}
                  </label>
                  {thermalUrl ? (
                    <div style={{ fontSize: 12, color: '#aaa' }}>
                      ✅ Camada Térmica carregada
                      <button
                        type="button"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e: any) => {
                            const file = e.target.files?.[0];
                            if (file) handleLayerUpload('thermal', file);
                          };
                          input.click();
                        }}
                        disabled={layerUploading === 'thermal'}
                        style={{ marginLeft: 8, padding: '4px 8px', fontSize: 12, background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
                      >
                        🔄 Substituir
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (file) handleLayerUpload('thermal', file);
                        };
                        input.click();
                      }}
                      disabled={layerUploading === 'thermal'}
                      style={{ width: '100%', padding: '8px', background: '#27ae60', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12 }}
                    >
                      {layerUploading === 'thermal' ? '⏳ Enviando...' : '⬆️ Fazer Upload'}
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Status control */}
            <div style={{ marginTop: 12 }}>
              <label>Status</label>
              {isGameMaster ? (
                <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                  <button type="button" onClick={() => setStatus(status === 'verified' ? null : 'verified')} style={{ padding: '6px 10px', background: status === 'verified' ? '#27ae60' : '#222', color: status === 'verified' ? '#fff' : '#ddd', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✔ Confirmado</button>
                  <button type="button" onClick={() => setStatus(status === 'theory' ? null : 'theory')} style={{ padding: '6px 10px', background: status === 'theory' ? '#f1c40f' : '#222', color: status === 'theory' ? '#222' : '#ddd', border: 'none', borderRadius: 6, cursor: 'pointer' }}>? Teoria</button>
                  <button type="button" onClick={() => setStatus(status === 'false' ? null : 'false')} style={{ padding: '6px 10px', background: status === 'false' ? '#e74c3c' : '#222', color: status === 'false' ? '#fff' : '#ddd', border: 'none', borderRadius: 6, cursor: 'pointer' }}>✖ Falso</button>
                </div>
              ) : (
                <div style={{ marginTop: 6 }}>
                  {status ? <span style={{ display: 'inline-block', padding: '6px 10px', borderRadius: 6, background: status === 'verified' ? '#27ae60' : status === 'theory' ? '#f1c40f' : '#e74c3c', color: status === 'theory' ? '#222' : '#fff' }}>{status === 'verified' ? 'Confirmado' : status === 'theory' ? 'Teoria' : 'Falso'}</span> : <span style={{ color: '#bbb' }}>Sem status</span>}
                </div>
              )}
            </div>

            <div style={{ marginTop: 8 }}>
              <label>Insights</label>
              {insights.map((ins, i) => (
                <div key={ins.id} style={{ marginBottom: 8 }}>
                  <input value={ins.skill} onChange={(e) => updateInsight(i, { skill: e.target.value })} disabled={!isGameMaster} />
                  <input type="number" value={ins.cost} onChange={(e) => updateInsight(i, { cost: Number(e.target.value) })} disabled={!isGameMaster} />
                  {isGameMaster && <button onClick={() => removeInsight(i)}>Remover</button>}
                </div>
              ))}
              {isGameMaster && <button onClick={addInsight}>+ Insight</button>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose}>FECHAR</button>
          {isGameMaster && (
            <>
              {existing && (
                <button className="btn-danger" onClick={handleDelete}>DELETAR</button>
              )}
              <button className="btn-primary" onClick={handleSave}>SALVAR ALTERAÇÕES</button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
