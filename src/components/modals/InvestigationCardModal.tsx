import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useEscapeClose from './useEscapeClose';
import { InvestigationCard, InvestigationCardInsight, createInvestigationCard, updateInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { validateImageFile } from '../../utils/fileValidators';

interface Props {
  open: boolean;
  onClose: () => void;
  investigationId: string;
  existing?: InvestigationCard;
  onSaved?: (card: any) => void;
}

const emptyInsight = (): InvestigationCardInsight => ({ id: String(Date.now()), skill: '', cost: 1, text: '', visibility: 'hidden', reveal_to: [] });

export default function InvestigationCardModal({ open, onClose, investigationId, existing, onSaved }: Props) {
  const [title, setTitle] = useState(existing?.title || '');
  const [descriptionPublic, setDescriptionPublic] = useState(existing?.description_public || '');
  const [descriptionHidden, setDescriptionHidden] = useState(existing?.description_hidden || '');
  const [insights, setInsights] = useState<InvestigationCardInsight[]>(existing?.insights || []);
  const [uploading, setUploading] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(existing?.image_url || null);

  useEscapeClose(open, onClose);
  useEffect(() => {
    setTitle(existing?.title || '');
    setDescriptionPublic(existing?.description_public || '');
    setDescriptionHidden(existing?.description_hidden || '');
    setInsights(existing?.insights || []);
    setImageUrl(existing?.image_url || null);
  }, [existing]);
  if (!open) return null;

  const addInsight = () => setInsights((s) => [...s, emptyInsight()]);
  const updateInsight = (idx: number, patch: Partial<InvestigationCardInsight>) => setInsights((s) => s.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  const removeInsight = (idx: number) => setInsights((s) => s.filter((_, i) => i !== idx));

  const handleSave = async () => {
    const payload: any = {
      investigation_id: investigationId,
      title: title || 'Sem título',
      description_public: descriptionPublic,
      description_hidden: descriptionHidden,
      insights,
      image_url: imageUrl || undefined,
      tags: [],
    } as any;

    try {
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

  const modal = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 720, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3>{existing ? 'Editar Pista' : 'Criar Pista'}</h3>
          <button onClick={onClose}>×</button>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <label>Título</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} style={{ width: '100%' }} />
            <label>Descrição Visível</label>
            <textarea value={descriptionPublic} onChange={(e) => setDescriptionPublic(e.target.value)} style={{ width: '100%' }} />
            <label>Descrição Oculta</label>
            <textarea value={descriptionHidden} onChange={(e) => setDescriptionHidden(e.target.value)} style={{ width: '100%' }} />
          </div>
          <div style={{ width: 320 }}>
            <label>Imagem (opcional)</label>
            <input type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
            <div style={{ fontSize: 12 }}>{selectedFileName}</div>
            {uploading && <div style={{ fontSize: 12 }}>Enviando imagem...</div>}
            <div style={{ marginTop: 8 }}>
              <label>Insights</label>
              {insights.map((ins, i) => (
                <div key={ins.id} style={{ marginBottom: 8 }}>
                  <input value={ins.skill} onChange={(e) => updateInsight(i, { skill: e.target.value })} />
                  <input type="number" value={ins.cost} onChange={(e) => updateInsight(i, { cost: Number(e.target.value) })} />
                  <button onClick={() => removeInsight(i)}>Remover</button>
                </div>
              ))}
              <button onClick={addInsight}>+ Insight</button>
            </div>
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
