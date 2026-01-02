import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useEscapeClose from './useEscapeClose';
import { InvestigationCard, createInvestigationCard, updateInvestigationCard, deleteInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { validateImageFile } from '../../utils/fileValidators';
import { validateMegaClueData } from '../../utils/validationSchemas';
import GlitchPuzzleCard from '../tools/GlitchPuzzleCard';
import MegaClueCard from '../tools/MegaClueCard';
import { modalManager } from '../../utils/ModalManager';

// Tab imports
import InvestigationBasicsTab from './investigationTabs/InvestigationBasicsTab';
import InvestigationMediaTab from './investigationTabs/InvestigationMediaTab';
import InvestigationChatTab from './investigationTabs/InvestigationChatTab';
import InvestigationMegaClueTab from './investigationTabs/InvestigationMegaClueTab';
import InvestigationStatusTab from './investigationTabs/InvestigationStatusTab';

interface Props {
  open: boolean;
  onClose: () => void;
  investigationId: string;
  existing?: InvestigationCard;
  onSaved?: (card?: Record<string, any> | null) => void;
  isGameMaster?: boolean;
}

type TabKey = 'basics' | 'media' | 'chat' | 'megaclue' | 'status';

const TABS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'basics', label: 'Básicos', icon: '📝' },
  { key: 'media', label: 'Mídia', icon: '📷' },
  { key: 'chat', label: 'Chat', icon: '💬' },
  { key: 'megaclue', label: 'Mega-Pista', icon: '🔐' },
  { key: 'status', label: 'Status', icon: '📊' },
];

export default function InvestigationCardModal_Refactored({
  open,
  onClose,
  investigationId,
  existing,
  onSaved,
  isGameMaster = false,
}: Props) {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabKey>('basics');

  // Basics tab state
  const [title, setTitle] = useState(existing?.title || '');
  const [descriptionPublic, setDescriptionPublic] = useState(existing?.description_public || '');
  const [descriptionHidden, setDescriptionHidden] = useState(existing?.description_hidden || '');
  const [insights, setInsights] = useState(existing?.insights || []);

  // Media tab state
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(existing?.image_url || null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  const [layerUploading, setLayerUploading] = useState<'uv' | 'thermal' | null>(null);
  const [uvUrl, setUvUrl] = useState<string | null>((existing as any)?.metadata?.uv_layer?.url || null);
  const [thermalUrl, setThermalUrl] = useState<string | null>((existing as any)?.metadata?.thermal_layer?.url || null);

  // Chat tab state
  const [chatMessages, setChatMessages] = useState<any[] | null>(null);
  const [newMsgText, setNewMsgText] = useState('');
  const [newMsgSender, setNewMsgSender] = useState<'me' | 'them'>('them');

  // Mega-clue tab state
  const [isEditingMegaClue, setIsEditingMegaClue] = useState(false);
  const [tempMegaClueData, setTempMegaClueData] = useState<any>(null);
  const [newRequiredId, setNewRequiredId] = useState('');

  // Status tab state
  const [status, setStatus] = useState<string | null>((existing as any)?.metadata?.status || null);

  useEscapeClose(open, onClose);

  useEffect(() => {
    modalManager.register('investigation-card-modal', 5);
  }, []);

  useEffect(() => {
    if (open) {
      modalManager.open('investigation-card-modal', () => {
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
    try {
      const ex: any = existing as any;
      if (ex) {
        if (ex.chat_data && Array.isArray(ex.chat_data)) setChatMessages(ex.chat_data);
        else if (ex.metadata && ex.metadata.chat_data && Array.isArray(ex.metadata.chat_data)) setChatMessages(ex.metadata.chat_data);
        else setChatMessages(null);
      }
    } catch (e) {
      setChatMessages(null);
    }
  }, [existing]);

  if (!open) return null;

  // Handle file upload
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

  // Handle layer uploads
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

  // Handle layer removal
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

  // Handle mega-clue save
  const handleSaveMegaClueChanges = async () => {
    if (!existing || !existing.id) return;
    try {
      const megaClueData = {
        final_truth_text: tempMegaClueData.final_truth_text,
        final_image_url: tempMegaClueData.final_image_url,
        required_puzzle_ids: tempMegaClueData.required_puzzle_ids,
      };

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

  // Handle save
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
    };

    try {
      const existingAny = existing as any;
      if (existingAny) {
        if (existingAny.chat_data && !payload.chat_data) payload.chat_data = existingAny.chat_data;
        if (existingAny.chat_contact_name && !payload.chat_contact_name) payload.chat_contact_name = existingAny.chat_contact_name;
        payload.metadata = payload.metadata || {};
        if (existingAny.metadata && existingAny.metadata.chat_data && !payload.metadata.chat_data) payload.metadata.chat_data = existingAny.metadata.chat_data;
        if (existingAny.metadata && existingAny.metadata.chat_contact_name && !payload.metadata.chat_contact_name) payload.metadata.chat_contact_name = existingAny.metadata.chat_contact_name;
      }
    } catch (e) {
      /* ignore */
    }

    try {
      if (chatMessages && Array.isArray(chatMessages) && chatMessages.length > 0) {
        payload.chat_data = chatMessages;
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

  // Handle delete
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

  // Handle special card types
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
        style={{ width: 1000, maxWidth: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 12 }}>
          <h3>
            {isGameMaster ? (existing ? '✏️ EDITAR PISTA' : '➕ CRIAR PISTA') : '📋 DETALHES DA EVIDÊNCIA'}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: 24,
              cursor: 'pointer',
            }}
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid #333', paddingBottom: 8 }}>
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '10px 16px',
                background: activeTab === tab.key ? '#27ae60' : '#222',
                color: activeTab === tab.key ? '#fff' : '#aaa',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                transition: 'all 0.2s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ flex: 1, overflowY: 'auto', marginBottom: 16, display: 'flex' }}>
          {activeTab === 'basics' && (
            <InvestigationBasicsTab
              title={title}
              setTitle={setTitle}
              descriptionPublic={descriptionPublic}
              setDescriptionPublic={setDescriptionPublic}
              descriptionHidden={descriptionHidden}
              setDescriptionHidden={setDescriptionHidden}
              insights={insights}
              setInsights={setInsights}
              isGameMaster={isGameMaster}
            />
          )}

          {activeTab === 'media' && (
            <InvestigationMediaTab
              imageUrl={imageUrl}
              setImageUrl={setImageUrl}
              previewUrl={previewUrl}
              setPreviewUrl={setPreviewUrl}
              selectedFileName={selectedFileName}
              setSelectedFileName={setSelectedFileName}
              imageDims={imageDims}
              setImageDims={setImageDims}
              uploading={uploading}
              setUploading={setUploading}
              uvUrl={uvUrl}
              setUvUrl={setUvUrl}
              thermalUrl={thermalUrl}
              setThermalUrl={setThermalUrl}
              layerUploading={layerUploading}
              setLayerUploading={setLayerUploading}
              handleFileChange={handleFileChange}
              handleLayerUpload={handleLayerUpload}
              handleRemoveLayer={handleRemoveLayer}
              isGameMaster={isGameMaster}
              cardType={cardType}
            />
          )}

          {activeTab === 'chat' && (
            <InvestigationChatTab
              chatMessages={chatMessages}
              setChatMessages={setChatMessages}
              newMsgText={newMsgText}
              setNewMsgText={setNewMsgText}
              newMsgSender={newMsgSender}
              setNewMsgSender={setNewMsgSender}
              isGameMaster={isGameMaster}
            />
          )}

          {activeTab === 'megaclue' && (
            <InvestigationMegaClueTab
              existing={existing}
              isEditingMegaClue={isEditingMegaClue}
              setIsEditingMegaClue={setIsEditingMegaClue}
              tempMegaClueData={tempMegaClueData}
              setTempMegaClueData={setTempMegaClueData}
              newRequiredId={newRequiredId}
              setNewRequiredId={setNewRequiredId}
              isGameMaster={isGameMaster}
              onSaveMegaClue={handleSaveMegaClueChanges}
            />
          )}

          {activeTab === 'status' && (
            <InvestigationStatusTab
              status={status}
              setStatus={setStatus}
              isGameMaster={isGameMaster}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid #333', paddingTop: 12 }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#333',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            FECHAR
          </button>
          {isGameMaster && (
            <>
              {existing && (
                <button
                  onClick={handleDelete}
                  style={{
                    padding: '10px 20px',
                    background: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    cursor: 'pointer',
                  }}
                >
                  🗑️ DELETAR
                </button>
              )}
              <button
                onClick={handleSave}
                style={{
                  padding: '10px 20px',
                  background: '#27ae60',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                ✓ SALVAR ALTERAÇÕES
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
