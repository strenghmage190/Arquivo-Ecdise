

import React, { useState, useEffect } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import UVEditor from '../tools/UVEditor';
import ThermalEditor from '../tools/ThermalEditor';
import { bufferToWav } from '../../utils/audioGenerator';
import AdvancedAudioLab from '../tools/AdvancedAudioLab';
import UrlRealTimeSpectrogram from '../tools/UrlRealTimeSpectrogram';

import PhoneViewer from '../tools/PhoneViewer';
import SpectrogramCreator from '../tools/SpectrogramCreator';
import ProfessionalSpectrogram from '../tools/ProfessionalSpectrogram';
import './CreateClueModal.css';
import DiegeticWindow from '../ui/DiegeticWindow';

import { supabase } from '../../supabaseClient';
import AudioForge from '../tools/AudioForge';

async function uploadAudio(file: File, investigationId: string): Promise<string | null> {
  const path = `${investigationId}/audio_${Date.now()}_${file.name}`;
  const { data, error } = await supabase.storage.from('investigation-assets').upload(path, file);
  if (error) throw error;
  const { data: publicData } = await supabase.storage.from('investigation-assets').getPublicUrl(path);
  return (publicData as any)?.publicUrl || null;
}

interface Props {
   isOpen: boolean;
   onClose: () => void;
   investigationId: string;
   initialX?: number;
   initialY?: number;
   onSaved: (card: Record<string, any>) => void;
}

type ChatSender = 'me' | 'them' | 'system' | string;
interface EditingChatMessage {
   sender: ChatSender;
   type: string;
   text: string;
}

export default function CreateClueModal({ isOpen, onClose, investigationId, initialX, initialY, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');

  const [imgFile, setImgFile] = useState<File | null>(null);
   const [videoFile, setVideoFile] = useState<File | null>(null);
   const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
   const [videoUrl, setVideoUrl] = useState<string | null>(null);
   const [videoUploading, setVideoUploading] = useState<boolean>(false);
   const [videoUrlInput, setVideoUrlInput] = useState<string>('');
  const [uvFile, setUvFile] = useState<File | null>(null);
   const [filterFile, setFilterFile] = useState<File | null>(null);
      const [previewUrl, setPreviewUrl] = useState<string | null>(null);
      const [filterPreviewUrl, setFilterPreviewUrl] = useState<string | null>(null);
      const [filterTransform, setFilterTransform] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
      const [filterInitialImage, setFilterInitialImage] = useState<File | null>(null);
   const [editorMode, setEditorMode] = useState<'uv' | 'filter' | null>(null);

   const [audioBase, setAudioBase] = useState<File | null>(null);
  const [audioHidden, setAudioHidden] = useState<File | null>(null);
   const [audioBasePreview, setAudioBasePreview] = useState<string | null>(null);
   const [audioHiddenPreview, setAudioHiddenPreview] = useState<string | null>(null);
   
   const [audioHiddenUploadedUrl, setAudioHiddenUploadedUrl] = useState<string | null>(null);
   const [audioHiddenUploading, setAudioHiddenUploading] = useState<boolean>(false);
  const [freq, setFreq] = useState(50);
   const [triggerTime, setTriggerTime] = useState<number>(0);

   const handleAudioBaseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (audioBasePreview) {
         try { URL.revokeObjectURL(audioBasePreview); } catch (err) {}
      }
      const url = URL.createObjectURL(file);
      setAudioBase(file);
      setAudioBasePreview(url);
   };

   const handleAudioHiddenSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (audioHiddenPreview) {
         try { URL.revokeObjectURL(audioHiddenPreview); } catch (err) {}
      }
      const url = URL.createObjectURL(file);
      setAudioHidden(file);
      setAudioHiddenPreview(url);
   };
   const [stamp, setStamp] = useState('');
   const [externalLink, setExternalLink] = useState('');

      // Fake metadata fields for FileProperties / EXIF viewer
      const [fakeDate, setFakeDate] = useState('');
      const [fakeLocation, setFakeLocation] = useState('');
      const [technicalNote, setTechnicalNote] = useState('');
      const [fakeMeta, setFakeMeta] = useState<{ date?: string; cam?: string; gps?: string; owner?: string }>({});

      const [showAudioForgeFor, setShowAudioForgeFor] = useState<null | 'hidden' | 'base'>(null);
      const [showMixer, setShowMixer] = useState(false);
           const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'audio' | 'cifra'>('geral');

           // Chat / Phone viewer states
           const [showChatEditor, setShowChatEditor] = useState(false);
           const [chatJson, setChatJson] = useState<string>('');
           const [chatData, setChatData] = useState<EditingChatMessage[] | null>(null);
           const [chatContactName, setChatContactName] = useState<string>('Desconhecido');
            const [editingChatList, setEditingChatList] = useState<EditingChatMessage[]>([]);

            useEffect(() => {
               if (showChatEditor) {
                  if (chatData && Array.isArray(chatData)) {
                     setEditingChatList(chatData.map((m: any) => ({ sender: (m.sender || 'me') as ChatSender, type: m.type || 'text', text: m.text || '' })));
                  } else {
                     setEditingChatList([{ sender: 'me', type: 'text', text: '' }]);
                  }
               }
            }, [showChatEditor]);

           // Person dossier fields
           const [isPerson, setIsPerson] = useState(false);
           const [personName, setPersonName] = useState('');
           const [personDob, setPersonDob] = useState('');
           const [personStatus, setPersonStatus] = useState<'ALIVE'|'MIA'|'DEAD'|'UNKNOWN'>('UNKNOWN');
           const [personOccupation, setPersonOccupation] = useState('');

   const [isLocked, setIsLocked] = useState(false);
   const [lockPass, setLockPass] = useState('');
   const [filterRevealBrightness, setFilterRevealBrightness] = useState(150);
   const [filterRevealContrast, setFilterRevealContrast] = useState(150);
   const [filterRevealSaturate, setFilterRevealSaturate] = useState(100);
   const [showAdvancedFilterSettings, setShowAdvancedFilterSettings] = useState(false);
   // Thermal flag: whether this evidence should show a thermal overlay in inspection
   const [thermalEnabled, setThermalEnabled] = useState(false);
   const [thermalSecretText, setThermalSecretText] = useState('');
   const [thermalKeyword, setThermalKeyword] = useState('');
   const [thermalFontSize, setThermalFontSize] = useState(100);
   const [thermalPositionY, setThermalPositionY] = useState(50);
   const [showThermalEditor, setShowThermalEditor] = useState(false);

  const [loading, setLoading] = useState(false);
   const [isShredded, setIsShredded] = useState(false);
   const [shredRows, setShredRows] = useState(1);
   const [shredCols, setShredCols] = useState(8);
   const [realText, setRealText] = useState('');
   const [cipherText, setCipherText] = useState('');

   // Reset form fields when opening the modal to avoid reusing previous values
   const resetForm = () => {
      // basic fields
      setTitle('');
      setDescPublic('');
      setDescHidden('');
      setTags('');

      // files / previews
      setImgFile(null);
      setVideoFile(null);
      try { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); } catch(e){}
      setVideoPreviewUrl(null);
      setVideoUrl(null);
      setVideoUploading(false);
      setVideoUrlInput('');
      setUvFile(null);
      setFilterFile(null);
      try { if (filterPreviewUrl) URL.revokeObjectURL(filterPreviewUrl); } catch (e) {}
      setFilterPreviewUrl(null);
      setFilterTransform(null);
      setFilterInitialImage(null);
      setPreviewUrl(null);
      setEditorMode(null);

      // audio
      setAudioBase(null);
      if (audioBasePreview) { try { URL.revokeObjectURL(audioBasePreview); } catch(e){} }
      setAudioHidden(null);
      if (audioHiddenPreview) { try { URL.revokeObjectURL(audioHiddenPreview); } catch(e){} }
      setAudioHiddenUploadedUrl(null);
      setFreq(50);
      setAudioBasePreview(null);
      setAudioHiddenPreview(null);

      // basic flags
      setIsLocked(false);
      setLockPass('');
      setFilterRevealBrightness(150);
      setFilterRevealContrast(150);
      setFilterRevealSaturate(100);
      setShowAdvancedFilterSettings(false);
      setThermalEnabled(false);
      setThermalSecretText('');
      setThermalKeyword('');
      setThermalFontSize(100);
      setThermalPositionY(50);
      setShowThermalEditor(false);

      // stamp / external
      setStamp('');
      setExternalLink('');

      // fake metadata
      setFakeDate('');
      setFakeLocation('');
      setTechnicalNote('');
      setFakeMeta({});

      // audio/tools states
      setShowAudioForgeFor(null);
      setActiveTab('geral');

      // chat / phone states
      setShowChatEditor(false);
      setChatJson('');
      setChatData(null);
      setChatContactName('Desconhecido');
      setEditingChatList([]);

      // person dossier
      setIsPerson(false);
      setPersonName('');
      setPersonDob('');
      setPersonStatus('UNKNOWN');
      setPersonOccupation('');

      // shredded / cipher
      setIsShredded(false);
      setShredRows(1);
      setShredCols(8);
      setRealText('');
      setCipherText('');
   };

   useEffect(() => {
      if (isOpen) resetForm();
   }, [isOpen]);

   // Helper: sanitize metadata to ensure it's JSON-serializable before sending to server
   const sanitizeForMetadata = (input: any, maxDepth = 6) => {
      const seen = new WeakSet();
      const sanitize = (val: any, depth: number): any => {
         if (depth <= 0) return null;
         if (val === null || val === undefined) return null;
         if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') return val;
         if (val instanceof Date) return val.toISOString();
         if (val instanceof File || (typeof File !== 'undefined' && val && val.constructor && val.constructor.name === 'File')) {
            return { __file: true, name: val.name, size: val.size, type: val.type };
         }
         if (Array.isArray(val)) return val.map(v => sanitize(v, depth - 1));
         if (typeof val === 'object') {
            if (seen.has(val)) return null; // circular
            seen.add(val);
            const out: any = {};
            for (const k of Object.keys(val)) {
               try {
                  out[k] = sanitize((val as any)[k], depth - 1);
               } catch (e) {
                  out[k] = null;
               }
            }
            return out;
         }
         // fallback: stringify small values
         try { return String(val); } catch { return null; }
      };
      return sanitize(input, maxDepth);
   };

      // Hooks that must always be declared in the same order.
      // Move interactive hooks here (before any early returns) so React's
      // hook ordering is preserved and we avoid "Rendered more hooks" errors.

      // when a filterFile is set, create a preview URL and set a default transform
      useEffect(() => {
         if (!filterFile) return;
         try { if (filterPreviewUrl) URL.revokeObjectURL(filterPreviewUrl); } catch (e) {}
         const url = URL.createObjectURL(filterFile);
         setFilterPreviewUrl(url);
         // default: center overlay covering 50% width/height
         setFilterTransform({ left: 25, top: 25, width: 50, height: 50 });
         return () => { try { URL.revokeObjectURL(url); } catch (e) {} };
      }, [filterFile]);

      // drag / resize refs (must be a hook)
      const draggingRef = React.useRef<{ mode: 'move' | 'resize' | null; startX: number; startY: number; startTransform?: any } | null>(null);

      useEffect(() => {
         const onMove = (e: MouseEvent) => {
            if (!draggingRef.current || !filterTransform || !previewUrl) return;
            const rect = document.querySelector('.image-edit-canvas') as HTMLElement | null;
            if (!rect) return;
            const bounds = rect.getBoundingClientRect();
            const start = draggingRef.current;
            if (start.mode === 'move') {
               const dx = e.clientX - start.startX;
               const dy = e.clientY - start.startY;
               const newLeft = ((start.startTransform.left / 100) * bounds.width + dx) / bounds.width * 100;
               const newTop = ((start.startTransform.top / 100) * bounds.height + dy) / bounds.height * 100;
               setFilterTransform({ ...filterTransform, left: Math.max(0, Math.min(100 - filterTransform.width, newLeft)), top: Math.max(0, Math.min(100 - filterTransform.height, newTop)) });
            } else if (start.mode === 'resize') {
               const dx = e.clientX - start.startX;
               const dy = e.clientY - start.startY;
               const deltaPctW = (dx / bounds.width) * 100;
               const deltaPctH = (dy / bounds.height) * 100;
               const newW = Math.max(5, Math.min(100 - start.startTransform.left, start.startTransform.width + deltaPctW));
               const newH = Math.max(5, Math.min(100 - start.startTransform.top, start.startTransform.height + deltaPctH));
               setFilterTransform({ ...filterTransform, width: newW, height: newH });
            }
         };
         const onUp = () => { draggingRef.current = null; };
         window.addEventListener('mousemove', onMove);
         window.addEventListener('mouseup', onUp);
         return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
      }, [filterPreviewUrl, filterTransform, previewUrl]);

      if (!isOpen) return null;

   const handleSave = async () => {
    if (!title) return alert("A pista precisa de um Título/Código.");
    setLoading(true);

    try {
      let imgUrl = null;
      let uvUrl = null;
         let filterUrl = null;
      if (imgFile) imgUrl = await uploadInvestigationImage(imgFile, investigationId);
         if (uvFile) uvUrl = await uploadInvestigationImage(uvFile, investigationId);
         if (filterFile) filterUrl = await uploadInvestigationImage(filterFile, investigationId);
             // Prefer video URL input if provided, otherwise use uploaded video URL (uploaded on select). If user selected but upload didn't complete,
             // attempt a fallback upload here.
                   let finalVideoUrl: string | null = videoUrlInput || videoUrl || null;
                   if (!finalVideoUrl && videoFile) {
                      try {
                         finalVideoUrl = await uploadInvestigationFile(videoFile, investigationId, videoFile.name.split('.').pop() || 'mp4');
                      } catch (e) {
                         console.error('Video upload failed on save', e);
                         finalVideoUrl = null;
                      }
                   }

         let audUrl = null;
         let audHidUrl = null;
         if (audioBase) audUrl = await uploadAudio(audioBase, investigationId);
         // if we already uploaded hidden audio via SpectrogramCreator, use that URL
         if (audioHiddenUploadedUrl) {
            audHidUrl = audioHiddenUploadedUrl;
         } else if (audioHidden) {
            audHidUrl = await uploadAudio(audioHidden, investigationId);
         }

             const metadata: Record<string, any> = {};
             metadata.image_filter_reveal = {
                  brightness: filterRevealBrightness,
                  contrast: filterRevealContrast,
                  saturate: filterRevealSaturate
             };
             // attach fake metadata fields if provided (prefer explicit fields, fallback to fakeMeta map)
             if (fakeDate) metadata.date_created = fakeDate;
             if (fakeLocation) metadata.gps_coords = fakeLocation;
             if (technicalNote) {
                metadata.technical_note = technicalNote;
                metadata.hex_comment = technicalNote;
             }
             if (fakeMeta) {
                if (fakeMeta.date) metadata.date_created = fakeMeta.date;
                if (fakeMeta.gps) metadata.gps_coords = fakeMeta.gps;
                if (fakeMeta.owner) metadata.device_owner = fakeMeta.owner;
             }
            // spectrograms are stored via `audio_hidden_url` only; do not add to metadata
             // optional external link + qr
             if (externalLink) metadata.external_link = externalLink;
            // thermal metadata flag
            if (thermalEnabled) {
               metadata.thermal = true;
               if (thermalSecretText) metadata.thermal_secret_text = thermalSecretText;
               if (thermalKeyword) metadata.thermal_keyword = thermalKeyword;
               metadata.thermal_font_size = thermalFontSize;
               metadata.thermal_position_y = thermalPositionY;
            }
            // audio playback config: time (seconds) when hidden track should be triggered
            if (typeof triggerTime !== 'undefined') {
               metadata.audio_config = { trigger_time: Number(triggerTime) || 0 };
            }

         // sanitize metadata to avoid sending unserializable objects
         const cleanMetadata = sanitizeForMetadata(metadata);

         const payload: Record<string, any> = {
        investigation_id: investigationId,
        title,
        description_public: descPublic || null,
        description_hidden: descHidden || null,
        x: initialX ?? 100,
        y: initialY ?? 100,
        image_url: imgUrl,
        image_uv_url: uvUrl,
            image_filter_layer: filterUrl,
            image_filter_layer_transform: filterTransform || null,
            is_locked: isLocked,
            lock_password: isLocked ? lockPass : null,
            metadata,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        audio_url: audUrl,
        audio_hidden_url: audHidUrl,
            video_url: finalVideoUrl,
        audio_target_freq: freq
      };

               // attach chat data if present. If user edited messages but didn't click "Salvar Chat",
                // prefer the transient editing list so creations don't lose messages.
                const finalChatData: EditingChatMessage[] | null = chatData ?? (editingChatList && editingChatList.length > 0 ? editingChatList : null);
                const finalChatContact: string | null = chatContactName || (personName || null);
                if (finalChatData) {
                   payload.chat_data = finalChatData;
                   // save contact name alongside chat for preview in card
                   if (finalChatContact) payload.chat_contact_name = finalChatContact;
                   // also store into metadata for backwards-compatibility
                   payload.metadata = payload.metadata || {};
                   payload.metadata.chat_data = sanitizeForMetadata(finalChatData);
                   payload.metadata.chat_contact_name = finalChatContact || null;
                }

         // attach person dossier metadata
          if (isPerson) {
             payload.metadata = payload.metadata || {};
             payload.metadata.person = sanitizeForMetadata({
               name: personName || title,
               dob: personDob || null,
               status: personStatus || 'UNKNOWN',
               occupation: personOccupation || null,
             });
          }
            // shredded document fields
            if (isShredded) {
               payload.is_shredded = true;
               payload.shred_rows = shredRows;
               payload.shred_cols = shredCols;
            }
            if (realText) payload.real_text = realText;
            if (cipherText) payload.cipher_text = cipherText;
         // optional stamp text column (if DB has column 'stamp_text')
         if (stamp) payload.stamp_text = stamp;

         // debug: log payload to help diagnose missing chat_data in DB
         try {
            // eslint-disable-next-line no-console
            console.debug('CreateClueModal: sending payload', { chat_data: payload.chat_data, chat_contact_name: payload.chat_contact_name, metadata_sample: payload.metadata ? Object.keys(payload.metadata).slice(0,6) : null });
         } catch (e) {}
         const newCard = await createInvestigationCard(payload as any);
      onSaved(newCard);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Falha ao registrar evidência. Verifique conexão.");
    } finally {
      setLoading(false);
    }
  };

  const handleImgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImgFile(e.target.files[0]);
         setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
  };

   const onOverlayMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!filterTransform) return;
      // draggingRef is defined above (hook order preserved)
      draggingRef.current = { mode: 'move', startX: e.clientX, startY: e.clientY, startTransform: { ...filterTransform } };
   };

   const onHandleMouseDown = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!filterTransform) return;
      draggingRef.current = { mode: 'resize', startX: e.clientX, startY: e.clientY, startTransform: { ...filterTransform } };
   };

   const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      if (!f) return;
      setVideoFile(f);
      try { if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl); } catch(e){}
      const localUrl = URL.createObjectURL(f);
      setVideoPreviewUrl(localUrl);

      // Upload immediately
      (async () => {
         try {
            setVideoUploading(true);
            const ext = f.name.split('.').pop() || 'mp4';
            const publicUrl = await uploadInvestigationFile(f, investigationId, ext);
            if (publicUrl) {
               setVideoUrl(publicUrl);
            } else {
               alert('Falha ao enviar vídeo');
            }
         } catch (err) {
            console.error('Video upload failed', err);
            alert('Falha ao enviar vídeo');
         } finally {
            setVideoUploading(false);
         }
      })();
   };

   return (
    <div className="modal-overlay">
      <DiegeticWindow title="REGISTRO DE EVIDÊNCIA" onClose={onClose}>
        <div className="dossier-body" style={{ padding: 0 }}>

          <div className="tabs-header">
            <button className={`tab-btn ${activeTab==='geral'?'active':''}`} onClick={()=>setActiveTab('geral')}>📄 GERAL & DADOS</button>
            <button className={`tab-btn ${activeTab==='visual'?'active':''}`} onClick={()=>setActiveTab('visual')}>👁️ VISUAL / UV / FX</button>
            <button className={`tab-btn ${activeTab==='audio'?'active':''}`} onClick={()=>setActiveTab('audio')}>🔊 ÁUDIO & EVP</button>
            <button className={`tab-btn ${activeTab==='cifra'?'active':''}`} onClick={()=>setActiveTab('cifra')}>🧩 CIFRAS & PUZZLES</button>
          </div>

          <div className="tab-content">

            {activeTab === 'geral' && (
              <>
                <div className="field-block">
                   <span className="field-title">IDENTIFICAÇÃO</span>
                   <div style={{display:'flex', gap:15, marginBottom:10}}>
                      <div style={{flex:2}}>
                         <label>TÍTULO DO ARQUIVO</label>
                         <input autoFocus value={title} onChange={e=>setTitle(e.target.value)} />
                      </div>
                      <div style={{flex:1}}>
                         <label>TAGS</label>
                         <input value={tags} onChange={e=>setTags(e.target.value)} placeholder="Sangue, Oculto..." />
                      </div>
                   </div>
                   <label>DESCRIÇÃO PÚBLICA</label>
                   <textarea rows={3} value={descPublic} onChange={e=>setDescPublic(e.target.value)} />
                   <div style={{marginTop:15}}>
                      <label className="field-title" style={{display:'block', marginBottom:6}}>OBSERVAÇÕES DO MESTRE (Oculto)</label>
                      <textarea rows={2} value={descHidden} onChange={e=>setDescHidden(e.target.value)} style={{borderColor:'#c6a45f', background:'#1a1710'}} />
                   </div>
                </div>

                <div style={{display:'flex', gap:15}}>
                   <div className="field-block" style={{flex:1}}>
                      <span className="field-title">🔐 CRIPTOGRAFIA / BLOQUEIO</span>
                      <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:10}}>
                         <input type="checkbox" checked={isLocked} onChange={e=>setIsLocked(e.target.checked)} />
                         <label>ATIVAR SENHA DE ACESSO</label>
                      </div>
                      <div style={{marginTop:12, display:'flex', gap:10, alignItems:'center'}}>
                         <label style={{display:'flex', alignItems:'center', gap:8}}>
                            <input type="checkbox" checked={isPerson} onChange={e=>setIsPerson(e.target.checked)} />
                            <span>Tipo: Dossiê de Pessoa</span>
                         </label>
                         <button className="upload-btn" onClick={() => setShowChatEditor(!showChatEditor)}>💬 Gerar Chat Falso</button>
                      </div>

                      {showChatEditor && (
                         <div style={{marginTop:10}}>
                            <label>Contato (nome)</label>
                            <input value={chatContactName} onChange={e=>setChatContactName(e.target.value)} placeholder="Nome do contato" />

                            <div style={{marginTop:8}}>
                               <label>Mensagens</label>
                               {editingChatList.map((m, idx) => (
                                  <div key={idx} style={{display:'grid', gridTemplateColumns:'120px 1fr 72px', gap:8, marginBottom:8, alignItems:'start'}}>
                                     <select value={m.sender} onChange={e => { const copy = [...editingChatList]; copy[idx] = { ...copy[idx], sender: e.target.value }; setEditingChatList(copy); }}>
                                        <option value="me">Eu</option>
                                        <option value="them">Contato</option>
                                        <option value="system">Sistema</option>
                                     </select>
                                     <textarea rows={2} value={m.text} onChange={e => { const copy = [...editingChatList]; copy[idx] = { ...copy[idx], text: e.target.value }; setEditingChatList(copy); }} />
                                     <div style={{display:'flex', flexDirection:'column', gap:6}}>
                                        <button className="upload-btn" onClick={() => { const copy = [...editingChatList]; copy.splice(idx,1); setEditingChatList(copy); }}>Remover</button>
                                        <button className="upload-btn" onClick={() => { const copy = [...editingChatList]; copy.splice(idx+1,0,{ sender:'me', type:'text', text:'' }); setEditingChatList(copy); }}>Adicionar</button>
                                     </div>
                                  </div>
                               ))}

                               <div style={{display:'flex', gap:8, marginTop:6, alignItems:'center'}}>
                                  <button className="upload-btn" onClick={() => { setChatData(editingChatList); setShowChatEditor(false); }}>Salvar Chat</button>
                                  <button className="upload-btn" onClick={() => { setChatJson(''); setShowChatEditor(false); }}>Cancelar</button>
                                  <button className="upload-btn" onClick={() => {
                                     try {
                                        const parsed = JSON.parse(chatJson || '[]');
                                        if (Array.isArray(parsed)) {
                                           setEditingChatList(parsed.map((m: any) => ({ sender: m.sender || 'me', type: m.type || 'text', text: m.text || '' })));
                                        } else alert('JSON inválido');
                                     } catch (e) { alert('JSON inválido'); }
                                  }}>Importar JSON</button>
                                  <input placeholder='Colar JSON aqui' value={chatJson} onChange={e=>setChatJson(e.target.value)} style={{flex:1}} />
                               </div>

                               {editingChatList && editingChatList.length > 0 && (
                                  <div style={{marginTop:8}}><small style={{color:'#ccc'}}>Pré-visualização:</small><div style={{marginTop:8}}><PhoneViewer chatData={editingChatList} contactName={chatContactName} /></div></div>
                               )}
                            </div>
                         </div>
                      )}

                      {isPerson && (
                         <div style={{marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8}}>
                            <div>
                               <label>Nome Completo</label>
                               <input value={personName} onChange={e=>setPersonName(e.target.value)} />
                            </div>
                            <div>
                               <label>Data Nasc</label>
                               <input value={personDob} onChange={e=>setPersonDob(e.target.value)} placeholder="YYYY-MM-DD" />
                            </div>
                            <div>
                               <label>Status</label>
                               <select value={personStatus} onChange={e=>setPersonStatus(e.target.value as any)}>
                                 <option value="UNKNOWN">DESCONHECIDO</option>
                                 <option value="ALIVE">VIVO</option>
                                 <option value="MIA">DESAPARECIDO</option>
                                 <option value="DEAD">MORTO</option>
                               </select>
                            </div>
                            <div>
                               <label>Ocupação</label>
                               <input value={personOccupation} onChange={e=>setPersonOccupation(e.target.value)} />
                            </div>
                         </div>
                      )}
                      {isLocked && (
                         <input placeholder="SENHA (Ex: KIAN)" value={lockPass} onChange={e=>setLockPass(e.target.value)} style={{borderColor:'red', color:'red', fontWeight:'bold'}} />
                      )}
                   </div>

                      <div className="field-block" style={{flex:1}}>
                      <span className="field-title">🗃️ METADADOS FALSOS (HACKING)</span>
                      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:5}}>
                         <input placeholder="Data Fake" value={fakeMeta.date} onChange={e=>setFakeMeta({...fakeMeta, date:e.target.value})} />
                         <input placeholder="GPS Coords" value={fakeMeta.gps} onChange={e=>setFakeMeta({...fakeMeta, gps:e.target.value})} />
                         <input placeholder="Device Owner" value={fakeMeta.owner} onChange={e=>setFakeMeta({...fakeMeta, owner:e.target.value})} style={{gridColumn:'span 2'}} />
                      </div>
                      <div style={{ marginTop: 8 }}>
                         <label style={{ display: 'block', marginBottom: 6 }}>Nota Técnica / Comentário HEX (visível em INSPECIONAR CÓDIGO)</label>
                         <textarea rows={3} value={technicalNote} onChange={e => setTechnicalNote(e.target.value)} placeholder="Ex: 00 4F 52 44 4F 00 00 ou anotações técnicas" style={{ width: '100%', fontFamily: 'monospace', fontSize: 12, padding: 8 }} />
                      </div>
                   </div>
                </div>
              </>
            )}

            {activeTab === 'visual' && (
              <>
                <div className="field-block">
                   <span className="field-title">1. IMAGEM PRINCIPAL</span>
                      <div style={{display:'flex', gap:8, alignItems:'center'}}>
                         <label className="upload-btn">📷 SELECIONAR FOTO<input type="file" accept="image/*" hidden onChange={handleImgSelect} /></label>
                         <label className="upload-btn">🎬 SELECIONAR VÍDEO<input type="file" accept="video/*" hidden onChange={handleVideoSelect} /></label>
                         {videoUploading && <span style={{color:'#c6a45f', fontSize:12}}>Enviando vídeo...</span>}
                      </div>
                      <div style={{marginTop:8}}>
                         <label>OU URL DO VÍDEO (YouTube, Vimeo, etc.)</label>
                         <input value={videoUrlInput} onChange={e=>setVideoUrlInput(e.target.value)} placeholder="https://..." />
                      </div>
                            <div className="image-preview-box" style={{backgroundImage: previewUrl ? `url(${previewUrl})` : 'none'}}>
                                 {!previewUrl && <span style={{fontSize:10, opacity:0.3}}>SEM IMAGEM</span>}
                                 {previewUrl && (
                                    <div className="image-edit-canvas" style={{position:'relative', width:'100%', height:'100%', backgroundImage: `url(${previewUrl})`, backgroundSize:'contain', backgroundPosition:'center', backgroundRepeat:'no-repeat'}}>
                                       {filterPreviewUrl && filterTransform && (
                                          <div
                                             className="filter-overlay"
                                             onMouseDown={onOverlayMouseDown}
                                             style={{
                                                position:'absolute',
                                                left:`${filterTransform.left}%`,
                                                top:`${filterTransform.top}%`,
                                                width:`${filterTransform.width}%`,
                                                height:`${filterTransform.height}%`,
                                                  backgroundImage:`url(${filterPreviewUrl})`,
                                                backgroundSize:'cover',
                                                backgroundPosition:'center',
                                                border:'2px dashed rgba(198,164,95,0.9)',
                                                boxSizing:'border-box',
                                                cursor:'move',
                                                zIndex: 30,
                                                pointerEvents: 'auto'
                                             }}
                                          >
                                             <div style={{position:'absolute', right:6, top:6, zIndex:40, display:'flex', gap:6}}>
                                                <button className="upload-btn" onClick={(e)=>{ e.stopPropagation(); try { URL.revokeObjectURL(filterPreviewUrl); } catch(e){} setFilterPreviewUrl(null); setFilterFile(null); setFilterTransform(null); }}>Remover</button>
                                             </div>
                                             <div
                                                onMouseDown={onHandleMouseDown}
                                                style={{position:'absolute', right:4, bottom:4, width:18, height:18, background:'rgba(0,0,0,0.4)', borderRadius:3, cursor:'nwse-resize', zIndex:40}}
                                             />
                                          </div>
                                       )}
                                    </div>
                                 )}
                            </div>
                      {videoPreviewUrl && (
                         <div style={{marginTop:8}}>
                            <small style={{color:'#c6a45f'}}>Pré-visualização de vídeo:</small>
                            <div style={{marginTop:6}}>
                              <video src={videoPreviewUrl} controls style={{maxWidth:'100%', maxHeight:160, display:'block', background:'#000'}} />
                            </div>
                         </div>
                      )}
                </div>

                {imgFile && (
                  <div style={{display:'flex', gap:15}}>
                     <div className="field-block" style={{flex:1, borderColor:'#b366ff'}}>
                        <span className="field-title" style={{color:'#b366ff'}}>2. LUZ NEGRA (UV)</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Desenhe segredos visíveis apenas com lanterna.</p>
                        <div style={{display:'flex', flexDirection:'column', gap:10}}>
                           <button onClick={()=>setEditorMode('uv')} className="upload-btn">🖌️ DESENHAR EFEITO</button>
                           <label className="upload-btn">📂 UPLOAD PNG<input type="file" accept="image/png" hidden onChange={e => setUvFile(e.target.files?.[0] || null)} /></label>
                        </div>
                     </div>
                     <div className="field-block" style={{flex:1, borderColor:'#3498db'}}>
                        <span className="field-title" style={{color:'#3498db'}}>3. CAMADAS SECRETAS</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Diferentes técnicas para esconder informações.</p>
                        
                        {/* FILTRO DE REVELAÇÃO */}
                        <div style={{marginBottom:15, padding:12, background:'rgba(52,152,219,0.05)', borderRadius:6, border:'1px solid rgba(52,152,219,0.2)'}}>
                           <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                              <span style={{fontSize:11, fontWeight:'bold', color:'#3498db'}}>🔍 FILTRO DE REVELAÇÃO</span>
                           </div>
                           <p style={{fontSize:9, color:'#777', marginBottom:8}}>Desenhe segredos que aparecem ao ajustar brilho/contraste</p>
                           <button onClick={()=>setEditorMode('filter')} className="upload-btn" style={{fontSize:11, padding:'8px 12px'}}>
                              🖌️ DESENHAR CAMADA OCULTA
                           </button>
                           
                           {/* Advanced settings */}
                           <div style={{marginTop:8}}>
                              <button 
                                 onClick={() => setShowAdvancedFilterSettings(!showAdvancedFilterSettings)}
                                 style={{
                                    background: showAdvancedFilterSettings ? 'rgba(52, 152, 219, 0.2)' : 'rgba(50,50,50,0.3)',
                                    border: '1px solid rgba(100,100,100,0.5)',
                                    color: '#888',
                                    padding: '6px 10px',
                                    fontSize: '9px',
                                    cursor: 'pointer',
                                    borderRadius: '4px',
                                    width: '100%',
                                    textAlign: 'left',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                 }}
                              >
                                 <span>⚙️ Configurações Avançadas</span>
                                 <span style={{fontSize:'12px'}}>{showAdvancedFilterSettings ? '▼' : '▶'}</span>
                              </button>
                              
                              {showAdvancedFilterSettings && (
                                 <div style={{
                                    marginTop:8, 
                                    background:'rgba(0,0,0,0.6)', 
                                    padding:10,
                                    borderRadius: '4px',
                                    border: '1px solid rgba(52, 152, 219, 0.3)'
                                 }}>
                                    <label style={{fontSize:9, color:'#888', display:'block', marginBottom:6}}>
                                       GATILHOS DE REVELAÇÃO (BRILHO / CONTRASTE / SATURAÇÃO)
                                    </label>
                                    <div style={{display:'flex', gap:5, marginBottom:8}}>
                                       <div style={{flex:1}}>
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>BRILHO</label>
                                          <input 
                                             type="number" 
                                             placeholder="150" 
                                             value={filterRevealBrightness} 
                                             onChange={e=>setFilterRevealBrightness(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                       <div style={{flex:1}}>
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>CONTRASTE</label>
                                          <input 
                                             type="number" 
                                             placeholder="150" 
                                             value={filterRevealContrast} 
                                             onChange={e=>setFilterRevealContrast(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                       <div style={{flex:1}}>
                                          <label style={{fontSize:8, color:'#666', display:'block'}}>SAT</label>
                                          <input 
                                             type="number" 
                                             placeholder="100" 
                                             value={filterRevealSaturate} 
                                             onChange={e=>setFilterRevealSaturate(Number(e.target.value))}
                                             style={{width:'100%', fontSize:'11px'}}
                                          />
                                       </div>
                                    </div>
                                    <div style={{fontSize:8, color:'#555', fontStyle:'italic'}}>
                                       💡 Valores mais altos = mais difícil revelar
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                        
                        {/* TERMAL */}
                        <div style={{marginBottom:0, padding:12, background:'rgba(255,100,0,0.05)', borderRadius:6, border:'1px solid rgba(255,100,0,0.2)'}}>
                           <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
                              <span style={{fontSize:11, fontWeight:'bold', color:'#ff6400'}}>🌡️ VISÃO TÉRMICA</span>
                           </div>
                           <p style={{fontSize:9, color:'#777', marginBottom:8}}>Simula câmera termográfica ao inspecionar</p>
                           <label style={{display:'flex', alignItems:'center', gap:8, cursor:'pointer', padding:'8px', background:'rgba(0,0,0,0.3)', borderRadius:4, marginBottom:8}}>
                              <input 
                                 type="checkbox" 
                                 checked={thermalEnabled} 
                                 onChange={e => setThermalEnabled(e.target.checked)}
                                 style={{cursor:'pointer'}}
                              />
                              <span style={{fontSize:11, color:'#ccc'}}>Ativar modo termal na inspeção</span>
                           </label>
                           
                           {thermalEnabled && (
                              <div style={{marginTop:12, padding:10, background:'rgba(0,0,0,0.4)', borderRadius:4, border:'1px solid rgba(255,100,0,0.3)'}}>
                                 <div style={{marginBottom:8}}>
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>TEXTO SECRETO (visível apenas no modo termal)</label>
                                    <textarea 
                                       value={thermalSecretText}
                                       onChange={e => setThermalSecretText(e.target.value)}
                                       placeholder="Digite o texto que só aparece com visão térmica..."
                                       rows={3}
                                       style={{width:'100%', background:'#111', border:'1px solid #444', color:'#ff6400', padding:8, fontSize:11, borderRadius:4, fontFamily:'monospace'}}
                                    />
                                 </div>
                                 <div style={{marginBottom:8}}>
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>TAMANHO DA FONTE: {thermalFontSize}%</label>
                                    <input 
                                       type="range"
                                       min="50"
                                       max="200"
                                       value={thermalFontSize}
                                       onChange={e => setThermalFontSize(Number(e.target.value))}
                                       style={{width:'100%', accentColor:'#ff6400'}}
                                    />
                                    <p style={{fontSize:9, color:'#666', marginTop:2}}>50% = Pequeno | 100% = Normal | 200% = Gigante</p>
                                 </div>
                                 <div style={{marginBottom:8}}>
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>POSIÇÃO VERTICAL: {thermalPositionY}%</label>
                                    <input 
                                       type="range"
                                       min="0"
                                       max="100"
                                       value={thermalPositionY}
                                       onChange={e => setThermalPositionY(Number(e.target.value))}
                                       style={{width:'100%', accentColor:'#ff6400'}}
                                    />
                                    <p style={{fontSize:9, color:'#666', marginTop:2}}>0% = Topo | 50% = Meio | 100% = Fundo</p>
                                 </div>
                                 {imgFile && (
                                    <div style={{marginBottom:8}}>
                                       <button 
                                          onClick={() => setShowThermalEditor(true)}
                                          style={{width:'100%', padding:'10px', background:'linear-gradient(135deg, #ff6400, #ff9500)', color:'#fff', border:'none', borderRadius:4, cursor:'pointer', fontSize:11, fontWeight:'bold', transition:'all 0.2s'}}
                                          onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 0 15px rgba(255,100,0,0.6)'}
                                          onMouseOut={(e) => e.currentTarget.style.boxShadow = 'none'}
                                       >
                                          🎨 ABRIR EDITOR DE POSIÇÃO
                                       </button>
                                    </div>
                                 )}
                                 <div>
                                    <label style={{fontSize:10, color:'#ff9', display:'block', marginBottom:4}}>PALAVRA-CHAVE PARA ATIVAR (opcional)</label>
                                    <input 
                                       type="text"
                                       value={thermalKeyword}
                                       onChange={e => setThermalKeyword(e.target.value)}
                                       placeholder="Ex: CALOR, TERMOGRAFIA, etc."
                                       style={{width:'100%', background:'#111', border:'1px solid #444', color:'#ff6400', padding:8, fontSize:11, borderRadius:4, fontFamily:'monospace'}}
                                    />
                                    <p style={{fontSize:9, color:'#666', marginTop:4, fontStyle:'italic'}}>Se definida, o jogador precisará digitar esta palavra no Terminal C.R.I.S. para desbloquear o modo termal.</p>
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>
                )}
              </>
            )}

                  {activeTab === 'audio' && (
                     <div className="form-row">
                        <div className="col">
                           {/* CAMADA A - ÁUDIO AMBIENTE */}
                           <div className="evidence-group" style={{borderColor: audioBase ? 'rgba(0,243,255,0.3)' : 'rgba(0,243,255,0.08)'}}>
                              <span className="group-title">🎵 CAMADA A: ÁUDIO AMBIENTE</span>
                              <p style={{fontSize:11, color:'#888', marginBottom:12, lineHeight:1.5}}>
                                 Som principal que o jogador ouve ao reproduzir a evidência (ex: música, conversa, ruído branco).
                              </p>
                              <div style={{display:'flex', gap:10, marginBottom:12, flexWrap:'wrap'}}>
                                 <label className="upload-btn" style={{flex:1, minWidth:'180px'}}>
                                    📂 Selecionar Áudio
                                    <input type="file" accept="audio/*" hidden onChange={handleAudioBaseSelect} />
                                 </label>
                                 <button className="upload-btn" onClick={() => setShowMixer(true)} style={{minWidth:'180px'}}>
                                    🎛️ Estação de Mixagem
                                 </button>
                              </div>
                              {audioBase && (
                                 <div style={{padding:'10px', background:'rgba(0,243,255,0.05)', borderRadius:'6px', border:'1px solid rgba(0,243,255,0.15)'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:8}}>
                                       <span style={{fontSize:18}}>✓</span>
                                       <span className="file-status" style={{margin:0}}>{audioBase.name}</span>
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* CAMADA B - SINAL OCULTO */}
                           <div className="evidence-group" style={{borderColor: audioHidden ? 'rgba(198,164,95,0.4)' : 'rgba(198,164,95,0.1)', background: audioHidden ? 'linear-gradient(145deg, rgba(198,164,95,0.05), rgba(0,0,0,0.3))' : undefined}}>
                              <span className="group-title" style={{color:'#c6a45f'}}>👻 CAMADA B: SINAL OCULTO (EVP)</span>
                              <p style={{fontSize:11, color:'#888', marginBottom:12, lineHeight:1.5}}>
                                 Informação secreta escondida no áudio. Pode ser voz reversa, espectrograma com imagem, ou sinal codificado.
                              </p>
                              <div style={{display:'flex', gap:10, flexWrap:'wrap', marginBottom:12}}>
                                 <label className="upload-btn" style={{flex:1, minWidth:'180px', borderColor:'rgba(198,164,95,0.3)', color:'#c6a45f'}}>
                                    📂 Upload de Áudio
                                    <input type="file" accept="audio/*" hidden onChange={handleAudioHiddenSelect} />
                                 </label>
                                 <button 
                                    className="upload-btn" 
                                    onClick={() => setShowAudioForgeFor('hidden')}
                                    style={{minWidth:'180px', borderColor:'rgba(198,164,95,0.3)', color:'#c6a45f'}}
                                 >
                                    🛠️ Forja de FX
                                 </button>
                              </div>
                              {audioHidden && (
                                 <div style={{padding:'10px', background:'rgba(198,164,95,0.08)', borderRadius:'6px', border:'1px solid rgba(198,164,95,0.2)'}}>
                                    <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                                       <span style={{fontSize:18}}>✓</span>
                                       <span className="file-status" style={{margin:0, background:'rgba(198,164,95,0.15)', color:'#c6a45f'}}>{audioHidden.name}</span>
                                       {audioHiddenUploading && (
                                          <span style={{fontSize:11, color:'#c6a45f', padding:'4px 8px', background:'rgba(198,164,95,0.1)', borderRadius:'4px'}}>
                                             ⏳ Enviando...
                                          </span>
                                       )}
                                       {audioHiddenUploadedUrl && !audioHiddenUploading && (
                                          <a 
                                             href={audioHiddenUploadedUrl} 
                                             target="_blank" 
                                             rel="noreferrer" 
                                             style={{fontSize:11, color:'#9cf', textDecoration:'underline'}}
                                          >
                                             🔗 Ver arquivo enviado
                                          </a>
                                       )}
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* CONFIGURAÇÃO DO ENIGMA */}
                           {audioBase && audioHidden && (
                              <div className="evidence-group" style={{borderColor:'rgba(179,51,51,0.4)', background:'linear-gradient(145deg, rgba(179,51,51,0.05), rgba(0,0,0,0.3))'}}>
                                 <span className="group-title" style={{color:'#ff003c'}}>⚙️ CONFIGURAÇÃO DO ENIGMA</span>
                                 <p style={{fontSize:11, color:'#888', marginBottom:12, lineHeight:1.5}}>
                                    Defina a frequência que o jogador precisa sintonizar para revelar o sinal oculto.
                                 </p>
                                 <div className="evp-config-row">
                                    <label>FREQUÊNCIA ALVO</label>
                                    <input 
                                       type="range" 
                                       min="0" 
                                       max="100" 
                                       value={freq} 
                                       onChange={e => setFreq(Number(e.target.value))} 
                                       style={{accentColor:'#ff003c', flex:1}} 
                                    />
                                    <span>{freq} Hz</span>
                                 </div>
                                 <div style={{marginTop:10, padding:'10px', background:'rgba(0,0,0,0.3)', borderRadius:'6px', border:'1px solid rgba(179,51,51,0.2)'}}>
                                    <small style={{fontSize:10, color:'#888', display:'block', lineHeight:1.4}}>
                                       💡 <strong style={{color:'#ff003c'}}>Dica:</strong> O jogador precisará mover o dial de sintonia até <strong>{freq} Hz</strong> para ouvir/visualizar o Sinal Oculto. Valores mais altos = mais difícil de encontrar.
                                    </small>
                                 </div>
                              </div>
                           )}
                        </div>

                        {/* PAINEL DE TESTE */}
                        <div className="col">
                           <div className="evidence-group" style={{minHeight: '600px', display: 'flex', flexDirection: 'column', borderColor:'rgba(0,243,255,0.15)'}}>
                              <span className="group-title">🎧 PAINEL DE TESTE E PREVIEW</span>
                              {audioBasePreview ? (
                                 <div className="flex-1 flex flex-col gap-3">
                                   <p style={{fontSize:11, color:'#888', marginBottom:8, lineHeight:1.5}}>
                                      Use as ferramentas abaixo para testar como o áudio ficará no jogo.
                                   </p>
                                   
                                   {/* Advanced Audio Lab */}
                                   <div className="flex-1">
                                      <AdvancedAudioLab 
                                        baseSrc={audioBasePreview} 
                                        hiddenSrc={audioHiddenPreview} 
                                        targetFreq={freq} 
                                        triggerTime={triggerTime} 
                                        onTriggerChange={setTriggerTime} 
                                      />
                                   </div>

                                   {/* Spectrogram Creator */}
                                   <div style={{marginTop:12, padding:'12px', background:'rgba(0,0,0,0.3)', borderRadius:'6px', border:'1px solid rgba(0,243,255,0.1)'}}>
                                      <SpectrogramCreator onGenerated={async (wavBlob, buffer) => {
                                          try {
                                             if (audioHiddenPreview) { try { URL.revokeObjectURL(audioHiddenPreview); } catch (e) {} }
                                             const file = new File([wavBlob], `spectrogram_${Date.now()}.wav`, { type: 'audio/wav' });
                                             setAudioHidden(file);
                                             const localUrl = URL.createObjectURL(file);
                                             setAudioHiddenPreview(localUrl);
                                             setAudioHiddenUploadedUrl(null);

                                             setAudioHiddenUploading(true);
                                             try {
                                                const publicUrl = await uploadAudio(file, investigationId);
                                                if (publicUrl) {
                                                   setAudioHiddenUploadedUrl(publicUrl);
                                                   try { URL.revokeObjectURL(localUrl); } catch (e) {}
                                                   setAudioHiddenPreview(publicUrl);
                                                } else {
                                                   console.warn('Upload returned no publicUrl');
                                                }
                                             } catch (uploadErr) {
                                                console.error('Upload failed', uploadErr);
                                                alert('Falha ao enviar áudio gerado.');
                                             } finally {
                                                setAudioHiddenUploading(false);
                                             }
                                          } catch (e) {
                                             console.error('Failed to process generated audio', e);
                                          }
                                      }} />
                                   </div>
                                 </div>
                              ) : (
                                 <div style={{
                                    flex:1, 
                                    display:'flex', 
                                    alignItems:'center', 
                                    justifyContent:'center', 
                                    textAlign:'center',
                                    padding:'40px',
                                    background:'rgba(0,0,0,0.2)',
                                    borderRadius:'8px',
                                    border:'1px dashed rgba(255,255,255,0.05)'
                                 }}>
                                    <div>
                                       <div style={{fontSize:48, marginBottom:16, opacity:0.3}}>🎵</div>
                                       <p style={{fontSize:13, color:'#666', lineHeight:1.6}}>
                                          Selecione um áudio ambiente<br/>
                                          <span style={{fontSize:11}}>(Camada A) para iniciar o teste</span>
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                     </div>
                  )}

            {activeTab === 'cifra' && (
              <div className="field-block">
                 <span className="field-title">DOCUMENTO / TRADUÇÃO</span>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <input type="checkbox" id="shred-check" checked={isShredded} onChange={e => setIsShredded(e.target.checked)} />
                    <label htmlFor="shred-check" style={{ margin: 0, cursor: 'pointer' }}>Documento Triturado (Puzzle)</label>
                 </div>
                 {isShredded && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                       <div style={{ flex: 1 }}>
                          <label>Formato</label>
                          <div style={{ display: 'flex', gap: 6 }}>
                             <button className={shredRows === 1 && shredCols === 8 ? 'btn-stamp active' : 'btn-stamp'} onClick={() => { setShredRows(1); setShredCols(8); }}>Tiras</button>
                             <button className={shredRows === 4 && shredCols === 4 ? 'btn-stamp active' : 'btn-stamp'} onClick={() => { setShredRows(4); setShredCols(4); }}>Grid 4x4</button>
                          </div>
                       </div>
                    </div>
                 )}
                 <div style={{ marginTop: 8 }}>
                    <label>TEXTO REAL (opcional)</label>
                    <textarea rows={2} value={realText} onChange={e => setRealText(e.target.value)} placeholder="Texto em Português que aparecerá com a lente." />
                 </div>
                 <div style={{ marginTop: 8 }}>
                    <label>TEXTO CIFRADO (opcional)</label>
                    <input value={cipherText} onChange={e => setCipherText(e.target.value)} placeholder="Deixe vazio para gerar símbolos automáticos" />
                 </div>
              </div>
            )}

          </div>

      </div>

      <div className="dossier-footer">
           <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
           <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? 'ARQUIVANDO...' : 'REGISTRAR EVIDÊNCIA'}
           </button>
        </div>

      {showMixer && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 16000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
            <div style={{ width: 'min(1000px,96%)', background: '#0b0b0b', borderRadius: 8, padding: 12 }}>
               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <strong style={{ color: '#fff' }}>Estação de Mixagem — Visualizador de Espectrograma</strong>
                  <button className="btn-cancel" onClick={() => setShowMixer(false)}>Fechar</button>
               </div>
               <div style={{background: '#000', padding: 8, borderRadius: 6 }}>
                  <UrlRealTimeSpectrogram audioUrl={audioBasePreview} />
               </div>
            </div>
         </div>
      )}

      </DiegeticWindow>

      {editorMode && previewUrl && (
         <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
            <div style={{width:'min(1200px,96%)'}}>
              <UVEditor 
                 baseImageUrl={previewUrl}
                 mode={editorMode || 'uv'}
                 initialImageFile={editorMode === 'filter' ? filterInitialImage : undefined}
                 onSave={(file) => { 
                    if (editorMode === 'uv') setUvFile(file);
                    if (editorMode === 'filter') setFilterFile(file);
                    setEditorMode(null);
                    setFilterInitialImage(null);
                 }}
                 onClose={() => { setEditorMode(null); setFilterInitialImage(null); }}
              />
            </div>
         </div>
      )}
      
      {showAudioForgeFor && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div style={{ width: 'min(940px,96%)' }}>
               <AudioForge
                  spectrogramUrl={audioHiddenPreview}
                  triggerTime={triggerTime}
                  onClose={() => setShowAudioForgeFor(null)}
                  onSave={(file) => {
                     if (showAudioForgeFor === 'hidden') {
                        setAudioHidden(file);
                        try { if (audioHiddenPreview) URL.revokeObjectURL(audioHiddenPreview); } catch(e){}
                        setAudioHiddenPreview(URL.createObjectURL(file));
                     } else {
                        setAudioBase(file);
                        try { if (audioBasePreview) URL.revokeObjectURL(audioBasePreview); } catch(e){}
                        setAudioBasePreview(URL.createObjectURL(file));
                     }
                     setShowAudioForgeFor(null);
                  }}
               />
            </div>
         </div>
      )}

      {showThermalEditor && imgFile && (
         <ThermalEditor
            baseImageUrl={previewUrl}
            thermalText={thermalSecretText}
            initialFontSize={thermalFontSize}
            initialPositionY={thermalPositionY}
            onSave={(config) => {
               setThermalFontSize(config.fontSize);
               setThermalPositionY(config.positionY);
               setShowThermalEditor(false);
            }}
            onClose={() => setShowThermalEditor(false)}
         />
      )}

    </div>
  );
}
