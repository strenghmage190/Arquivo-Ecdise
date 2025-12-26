import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useEscapeClose from './useEscapeClose';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { validateImageFile } from '../../utils/fileValidators';
import UVEditor from '../tools/UVEditor';
import '../tools/UVEditor.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  onSaved?: (created?: any) => void;
  initialX?: number;
  initialY?: number;
}

export default function CreateClueModal({ isOpen, onClose, investigationId, onSaved, initialX, initialY }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDims, setImageDims] = useState<{ w: number; h: number } | null>(null);
  // UV / secret layer states
  const [uvFile, setUvFile] = useState<File | null>(null);
  const [uvUploading, setUvUploading] = useState(false);
  const [uvUrl, setUvUrl] = useState<string | null>(null);
  const [showUvEditor, setShowUvEditor] = useState(false);

  useEscapeClose(isOpen, onClose);
  if (!isOpen) return null;

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    const check = validateImageFile(file);
    if (!check.ok) {
      alert(check.reason);
      return;
    }
    setImageUploading(true);
    try {
      // build preview and dimensions before upload
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
        setImageUrl(publicUrl);
        setSelectedFileName(file.name);
      } else {
        alert('Erro ao subir imagem.');
      }
    } catch (e) {
      console.error(e);
      alert('Erro ao subir imagem.');
    } finally {
      setImageUploading(false);
    }
  };

  const handleUvFileChange = async (file: File | null) => {
    if (!file) return;
    setUvUploading(true);
    try {
      const url = await uploadInvestigationImage(file, investigationId);
      setUvUrl(url);
      setUvFile(file);
    } catch (e) {
      console.error(e);
      alert('Erro ao subir imagem UV.');
    } finally {
      setUvUploading(false);
    }
  };

  const handleSaveFromEditor = async (file: File) => {
    setUvUploading(true);
    try {
      const url = await uploadInvestigationImage(file, investigationId);
      setUvUrl(url);
      setShowUvEditor(false);
    } catch (e) {
      console.error(e);
      alert('Erro ao salvar arte UV.');
    } finally {
      setUvUploading(false);
    }
  };

  const handleSave = async () => {
    if (imageUploading) {
      alert('Ainda a enviar imagem. Aguarde até concluir o upload antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        investigation_id: investigationId,
        title: title || 'Pista sem título',
        description_public: description || null,
        x: (typeof initialX === 'number' ? Math.round(initialX) : 100),
        y: (typeof initialY === 'number' ? Math.round(initialY) : 100),
        image_url: imageUrl || undefined,
        image_uv_url: uvUrl || null,
      };
      console.debug('CreateClueModal: creating card with payload', payload);
      const created = await createInvestigationCard(payload);
      console.debug('CreateClueModal: createInvestigationCard response', created);
      if (created) {
        onSaved && onSaved(created);
        onClose();
      } else {
        alert('Resposta inesperada do servidor. Veja o console para detalhes.');
      }
    } catch (err: any) {
      console.error('Falha ao criar pista:', err);
      const msg = err?.message || String(err);
      alert('Erro ao salvar pista: ' + msg + '. Veja o console para mais detalhes.');
    } finally {
      setSaving(false);
    }
  };

  const modal = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 720, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>Registrar Nova Evidência</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
            <label>Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ width: 320 }}>
            <label>Anexar Imagem</label>
            <input type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files ? e.target.files[0] : null)} />
            <div style={{ fontSize: 12 }}>{selectedFileName}</div>
            {imageUploading && <div style={{ fontSize: 12 }}>Enviando imagem...</div>}
            {previewUrl && (
              <div style={{ marginTop: 8 }}>
                <img src={previewUrl} alt="preview" style={{ maxWidth: '100%', maxHeight: 160, display: 'block' }} />
                {imageDims && <div style={{ fontSize: 12, color: '#ccc' }}>Dimensões: {imageDims.w}x{imageDims.h}</div>}
              </div>
            )}
          </div>
        </div>

        <div style={{ borderTop: '1px dashed #444', paddingTop: 10, marginTop: 10 }}>
          <label style={{color: '#b366ff'}}>🔦 Camada Oculta (Luz UV)</label>
          {imageUrl ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {uvUrl ? <span style={{ color: '#39ff14' }}>✔ Segredo Criado!</span> : <small style={{ color: '#777' }}>Nenhum segredo definido.</small>}
              <button className="btn-retro" onClick={() => setShowUvEditor(true)} style={{ fontSize: 12, padding: '5px 10px' }}>
                {uvUrl ? '✏️ EDITAR NOVAMENTE' : '✨ DESENHAR SIGILO / PISTA'}
              </button>
              <div style={{ marginLeft: 'auto' }}>
                <input id="uv-upload-input" type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => handleUvFileChange(e.target.files ? e.target.files[0] : null)} />
                <label htmlFor="uv-upload-input" style={{ border: '1px dashed #b366ff', color: '#d8b3ff', padding: '6px 8px', cursor: 'pointer' }}>{uvUrl ? 'Substituir UV' : 'Anexar UV'}</label>
              </div>
            </div>
          ) : (
            <small style={{ color: '#b33' }}>Faça upload da imagem principal primeiro.</small>
          )}
          {uvUploading && <div style={{ fontSize: 12 }}>Enviando UV...</div>}
        </div>

        {showUvEditor && imageUrl && (
          <UVEditor baseImageUrl={imageUrl} onSave={handleSaveFromEditor} onClose={() => setShowUvEditor(false)} />
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose} disabled={saving || imageUploading}>Cancelar</button>
          <button onClick={handleSave} disabled={saving || imageUploading}>{saving ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
