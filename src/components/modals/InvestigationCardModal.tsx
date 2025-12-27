import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import useEscapeClose from './useEscapeClose';
import { InvestigationCard, InvestigationCardInsight, createInvestigationCard, updateInvestigationCard, deleteInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import { validateImageFile } from '../../utils/fileValidators';

interface Props {
  open: boolean;
  onClose: () => void;
  investigationId: string;
  existing?: InvestigationCard;
  onSaved?: (card: any) => void;
  isGameMaster?: boolean;
}

const emptyInsight = (): InvestigationCardInsight => ({ id: String(Date.now()), skill: '', cost: 1, text: '', visibility: 'hidden', reveal_to: [] });

export default function InvestigationCardModal({ open, onClose, investigationId, existing, onSaved, isGameMaster = false }: Props) {
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

  useEscapeClose(open, onClose);
  useEffect(() => {
    setTitle(existing?.title || '');
    setDescriptionPublic(existing?.description_public || '');
    setDescriptionHidden(existing?.description_hidden || '');
    setInsights(existing?.insights || []);
    setImageUrl(existing?.image_url || null);
    setStatus((existing as any)?.metadata?.status || null);
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
      metadata: { ...(existing as any)?.metadata || {}, status: status || undefined },
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

  const modal = (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ width: 720, maxWidth: '95vw' }}>
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
