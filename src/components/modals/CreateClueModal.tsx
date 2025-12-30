import React, { useState, useEffect } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import UVEditor from '../tools/UVEditor';
import AudioDecrypter from '../tools/AudioDecrypter';
import SpectrogramCreator from '../tools/SpectrogramCreator';
import AudioForge from '../tools/AudioForge';
import GlitchMaker from '../tools/GlitchMaker';
import PhoneViewer from '../tools/PhoneViewer';
import './CreateClueModal.css';
import DiegeticWindow from '../ui/DiegeticWindow';

import { supabase } from '../../supabaseClient';

async function uploadAudio(file: File, investigationId: string) {
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
  onSaved: (card: any) => void;
}

export default function CreateClueModal({ isOpen, onClose, investigationId, initialX, initialY, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [uvFile, setUvFile] = useState<File | null>(null);
   const [filterFile, setFilterFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
   const [editorMode, setEditorMode] = useState<'uv' | 'filter' | null>(null);

   const [audioBase, setAudioBase] = useState<File | null>(null);
  const [audioHidden, setAudioHidden] = useState<File | null>(null);
   const [audioBasePreview, setAudioBasePreview] = useState<string | null>(null);
   const [audioHiddenPreview, setAudioHiddenPreview] = useState<string | null>(null);
   const [showSpectroMaker, setShowSpectroMaker] = useState(false);
   const [audioHiddenUploadedUrl, setAudioHiddenUploadedUrl] = useState<string | null>(null);
  const [freq, setFreq] = useState(50);
   const [stamp, setStamp] = useState('');
   const [externalLink, setExternalLink] = useState('');

      // Fake metadata fields for FileProperties / EXIF viewer
      const [fakeDate, setFakeDate] = useState('');
      const [fakeLocation, setFakeLocation] = useState('');
      const [technicalNote, setTechnicalNote] = useState('');
      const [fakeMeta, setFakeMeta] = useState<{ date?: string; cam?: string; gps?: string; owner?: string }>({});

      const [showAudioForgeFor, setShowAudioForgeFor] = useState<null | 'hidden' | 'base'>(null);
      const [showGlitchMaker, setShowGlitchMaker] = useState(false);
           const [activeTab, setActiveTab] = useState<'geral' | 'visual' | 'audio' | 'cifra'>('geral');

           // Chat / Phone viewer states
           const [showChatEditor, setShowChatEditor] = useState(false);
           const [chatJson, setChatJson] = useState('');
           const [chatData, setChatData] = useState<any[] | null>(null);
           const [chatContactName, setChatContactName] = useState('Desconhecido');
            const [editingChatList, setEditingChatList] = useState<Array<{sender:string; type:string; text:string}>>([]);

            useEffect(() => {
               if (showChatEditor) {
                  if (chatData && Array.isArray(chatData)) {
                     setEditingChatList(chatData.map((m: any) => ({ sender: m.sender || 'me', type: m.type || 'text', text: m.text || '' })));
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
   // Thermal flag: whether this evidence should show a thermal overlay in inspection
   const [thermalEnabled, setThermalEnabled] = useState(false);

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
      setUvFile(null);
      setFilterFile(null);
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
      setShowSpectroMaker(false);

      // basic flags
      setIsLocked(false);
      setLockPass('');
      setFilterRevealBrightness(150);
      setFilterRevealContrast(150);
      setFilterRevealSaturate(100);

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
      setShowGlitchMaker(false);
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

         let audUrl = null;
         let audHidUrl = null;
         if (audioBase) audUrl = await uploadAudio(audioBase, investigationId);
         // if we already uploaded hidden audio via SpectrogramCreator, use that URL
         if (audioHiddenUploadedUrl) {
            audHidUrl = audioHiddenUploadedUrl;
         } else if (audioHidden) {
            audHidUrl = await uploadAudio(audioHidden, investigationId);
         }

             const metadata: any = {};
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
             // if spectrogram was uploaded by SpectrogramCreator, save its public URL
             if (audioHiddenUploadedUrl) metadata.spectrogram_url = audioHiddenUploadedUrl;
             // optional external link + qr
             if (externalLink) metadata.external_link = externalLink;
            // thermal metadata flag
            if (thermalEnabled) metadata.thermal = true;

         const payload: any = {
        investigation_id: investigationId,
        title,
        description_public: descPublic || null,
        description_hidden: descHidden || null,
        x: initialX ?? 100,
        y: initialY ?? 100,
        image_url: imgUrl,
        image_uv_url: uvUrl,
            image_filter_layer: filterUrl,
            is_locked: isLocked,
            lock_password: isLocked ? lockPass : null,
            metadata,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        audio_url: audUrl,
        audio_hidden_url: audHidUrl,
        audio_target_freq: freq
      };

                // attach chat data if present. If user edited messages but didn't click "Salvar Chat",
                // prefer the transient editing list so creations don't lose messages.
                const finalChatData = chatData ?? (editingChatList && editingChatList.length > 0 ? editingChatList : null);
                const finalChatContact = chatContactName || (personName || null);
                if (finalChatData) {
                   payload.chat_data = finalChatData;
                   // save contact name alongside chat for preview in card
                   if (finalChatContact) payload.chat_contact_name = finalChatContact;
                   // also store into metadata for backwards-compatibility
                   payload.metadata = payload.metadata || {};
                   payload.metadata.chat_data = finalChatData;
                   payload.metadata.chat_contact_name = finalChatContact || null;
                }

         // attach person dossier metadata
         if (isPerson) {
             payload.metadata = payload.metadata || {};
             payload.metadata.person = {
                name: personName || title,
                dob: personDob || null,
                status: personStatus || 'UNKNOWN',
                occupation: personOccupation || null,
             };
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
         const newCard = await createInvestigationCard(payload);
      onSaved(newCard);
      onClose();
    } catch (error) {
      console.error(error);
      alert("Falha ao registrar evidência. Verifique conexão.");
    } finally {
      setLoading(false);
    }
  };

   // handle audio previews
   const handleAudioBaseSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      if (f) {
         setAudioBase(f);
         try { if (audioBasePreview) URL.revokeObjectURL(audioBasePreview); } catch(e){}
         setAudioBasePreview(URL.createObjectURL(f));
      }
   };

   const handleAudioHiddenSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0] || null;
      if (f) {
         setAudioHidden(f);
         try { if (audioHiddenPreview) URL.revokeObjectURL(audioHiddenPreview); } catch(e){}
         setAudioHiddenPreview(URL.createObjectURL(f));
      }
   };

  const handleImgSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImgFile(e.target.files[0]);
      setPreviewUrl(URL.createObjectURL(e.target.files[0]));
    }
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
                   <label className="upload-btn">📷 SELECIONAR FOTO<input type="file" accept="image/*" hidden onChange={handleImgSelect} /></label>
                   <div className="image-preview-box" style={{backgroundImage: previewUrl ? `url(${previewUrl})` : 'none'}}>{!previewUrl && <span style={{fontSize:10, opacity:0.3}}>SEM IMAGEM</span>}</div>
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
                        <span className="field-title" style={{color:'#3498db'}}>3. TRATAMENTO (BRILHO/CONTRASTE)</span>
                        <p style={{fontSize:10, color:'#aaa'}}>Segredos que aparecem ao estourar a imagem.</p>
                        <button onClick={()=>setEditorMode('filter')} className="upload-btn">🖌️ DESENHAR CAMADA</button>
                        <div style={{marginTop:10, background:'#000', padding:5}}>
                           <label style={{fontSize:9}}>GATILHOS (BRILHO / CONTRASTE / SAT)</label>
                           <div style={{display:'flex', gap:5}}>
                              <input type="number" placeholder="150" value={filterRevealBrightness} onChange={e=>setFilterRevealBrightness(Number(e.target.value))} />
                              <input type="number" placeholder="150" value={filterRevealContrast} onChange={e=>setFilterRevealContrast(Number(e.target.value))} />
                              <input type="number" placeholder="100" value={filterRevealSaturate} onChange={e=>setFilterRevealSaturate(Number(e.target.value))} />
                           </div>
                        </div>
                          <div style={{marginTop:10}}>
                             <label style={{display:'flex', alignItems:'center', gap:8}}>
                                <input type="checkbox" checked={thermalEnabled} onChange={e => setThermalEnabled(e.target.checked)} />
                                <span style={{fontSize:12}}>🌡️ Ativar TERMAL (simular termografia no INSPECIONAR)</span>
                             </label>
                          </div>
                     </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'audio' && (
              <div className="field-block">
                 <span className="field-title">EVP & ÁUDIO ESPETRAL</span>
                 <label>A. FAIXA DE RUÍDO (Áudio Visível)</label>
                 <label className="upload-btn">🎵 ARQUIVO NORMAL<input type="file" accept="audio/*" hidden onChange={handleAudioBaseSelect} /></label>
                 {audioBase && <span className="file-status">{audioBase.name}</span>}
                 <div style={{height:1, background:'#333', margin:'10px 0'}} />
                 <label style={{color:'#b33'}}>B. FAIXA ESCONDIDA (Voz/Segredo)</label>
                 <div style={{display:'flex', gap:10}}>
                    <label className="upload-btn" style={{flex:1}}>👻 UPLOAD ARQUIVO<input type="file" accept="audio/*" hidden onChange={handleAudioHiddenSelect} /></label>
                    <button className="upload-btn" style={{flex:1}} onClick={() => setShowAudioForgeFor('hidden')}>🛠️ FORJA DE FX</button>
                    <button className="upload-btn" style={{flex:1, borderColor: '#b33', color:'#b33'}} onClick={() => setShowSpectroMaker(true)}>📝 TEXTO → ÁUDIO</button>
                 </div>
                 {audioHidden && <span className="file-status">{audioHidden.name}</span>}
                 {audioBasePreview && audioHiddenPreview && (
                    <div style={{ marginTop: 15, padding: 10, background: '#0a0a0a', border: '1px solid #333' }}>
                       <label style={{color: '#c6a45f', marginBottom: 10}}>🎛️ CALIBRAGEM DE FREQUÊNCIA</label>
                       {/* Preview Compacto: escala para que o painel não quebre o modal */}
                       <div style={{ transform: 'scale(0.78)', transformOrigin: 'top left', width: '128%', overflow: 'hidden' }}>
                         <AudioDecrypter baseAudio={audioBasePreview} hiddenAudio={audioHiddenPreview} targetFreq={freq} />
                       </div>
                       <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px dashed #333' }}>
                          <label>DEFINIR FREQUÊNCIA ALVO: {freq}Hz</label>
                          <input type="range" min="0" max="100" value={freq} onChange={e => setFreq(Number(e.target.value))} style={{accentColor: '#c6a45f'}} />
                       </div>
                    </div>
                 )}
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

      </DiegeticWindow>

      {editorMode && previewUrl && (
         <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
            <div style={{width:'min(1200px,96%)'}}>
              <UVEditor 
                 baseImageUrl={previewUrl}
                 mode={editorMode || 'uv'}
                 onSave={(file) => { 
                    if (editorMode === 'uv') setUvFile(file);
                    if (editorMode === 'filter') setFilterFile(file);
                    setEditorMode(null);
                 }}
                 onClose={() => setEditorMode(null)}
              />
            </div>
         </div>
      )}
      {showSpectroMaker && (
            <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
               <div style={{width:'min(1200px,96%)'}}>
                 <SpectrogramCreator
                    investigationId={investigationId}
                    onSave={(file) => {
                       try { if (audioHiddenPreview) URL.revokeObjectURL(audioHiddenPreview); } catch(e){}
                       setAudioHidden(file);
                       setAudioHiddenPreview(URL.createObjectURL(file));
                       setShowSpectroMaker(false);
                    }}
                    onUploadComplete={(publicUrl) => {
                       setAudioHiddenUploadedUrl(publicUrl);
                       setAudioHiddenPreview(publicUrl);
                       setShowSpectroMaker(false);
                    }}
                    onClose={() => setShowSpectroMaker(false)}
                 />
               </div>
            </div>
      )}
      {showGlitchMaker && (
            <div style={{position:'fixed', inset:0, zIndex:16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24}}>
               <div style={{width:'min(1000px,96%)'}}>
                 <GlitchMaker
                    onSave={(file) => {
                       setFilterFile(file);
                       setShowGlitchMaker(false);
                    }}
                    onClose={() => setShowGlitchMaker(false)}
                 />
               </div>
            </div>
      )}

      {showAudioForgeFor && (
         <div style={{ position: 'fixed', inset: 0, zIndex: 16000, display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
            <div style={{ width: 'min(940px,96%)' }}>
               <AudioForge
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

    </div>
  );
}
