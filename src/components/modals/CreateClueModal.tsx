import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import useEscapeClose from './useEscapeClose';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId: string;
  onSaved?: () => void;
}

export default function CreateClueModal({ isOpen, onClose, investigationId, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEscapeClose(isOpen, onClose);
  if (!isOpen) return null;

  const handleFileChange = async (file: File | null) => {
    if (!file) return;
    setImageUploading(true);
    try {
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

  const handleSave = async () => {
    try {
      const payload: any = {
        investigation_id: investigationId,
        title: title || 'Pista sem título',
        description_public: description || null,
        x: 100,
        y: 100,
        image_url: imageUrl || undefined,
      };
      const created = await createInvestigationCard(payload);
      if (created) {
        onSaved && onSaved();
        onClose();
      }
    } catch (err) {
      console.error('Falha ao criar pista:', err);
      alert('Erro ao salvar pista. Veja o console para mais detalhes.');
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
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
          <button onClick={onClose}>Cancelar</button>
          <button onClick={handleSave}>Salvar</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
