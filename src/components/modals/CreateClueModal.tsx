import React, { useState, useEffect } from 'react';
import { createInvestigationCard } from '../../api/investigations';
import { uploadInvestigationImage } from '../../utils/storage';
import UVEditor from '../tools/UVEditor';
import AudioDecrypter from '../tools/AudioDecrypter';
import SpectrogramCreator from '../tools/SpectrogramCreator';
import './CreateClueModal.css';

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

   const [isLocked, setIsLocked] = useState(false);
   const [lockPass, setLockPass] = useState('');
   const [filterRevealBrightness, setFilterRevealBrightness] = useState(150);
   const [filterRevealContrast, setFilterRevealContrast] = useState(150);
   const [filterRevealSaturate, setFilterRevealSaturate] = useState(100);

  const [loading, setLoading] = useState(false);

   // Reset form fields when opening the modal to avoid reusing previous values
   const resetForm = () => {
      setTitle('');
      setDescPublic('');
      setDescHidden('');
      setTags('');
      setImgFile(null);
      setUvFile(null);
      setFilterFile(null);
      setPreviewUrl(null);
      setEditorMode(null);
      setAudioBase(null);
      if (audioBasePreview) { try { URL.revokeObjectURL(audioBasePreview); } catch(e){} }
      setAudioHidden(null);
      if (audioHiddenPreview) { try { URL.revokeObjectURL(audioHiddenPreview); } catch(e){} }
      setAudioHiddenUploadedUrl(null);
      setFreq(50);
      setAudioBasePreview(null);
      setAudioHiddenPreview(null);
      setIsLocked(false);
      setLockPass('');
      setFilterRevealBrightness(150);
      setFilterRevealContrast(150);
      setFilterRevealSaturate(100);
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

         const metadata: any = ({} as any) || {};
         metadata.image_filter_reveal = {
            brightness: filterRevealBrightness,
            contrast: filterRevealContrast,
            saturate: filterRevealSaturate
         };
           // if spectrogram was uploaded by SpectrogramCreator, save its public URL
           if (audioHiddenUploadedUrl) metadata.spectrogram_url = audioHiddenUploadedUrl;
         // optional external link + qr
         if (externalLink) metadata.external_link = externalLink;

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
         // optional stamp text column (if DB has column 'stamp_text')
         if (stamp) payload.stamp_text = stamp;

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
      <div className="modal-dossier">
        <div className="dossier-header">
           <h2>REGISTRO DE EVIDÊNCIA</h2>
           <div className="top-actions">
              <button className="btn-close" onClick={onClose}>&times;</button>
           </div>
        </div>

        <div className="dossier-body">
           <div className="form-row">
              <div className="col" style={{flex:2}}>
                 <label>IDENTIFICADOR / NOME DO ARQUIVO</label>
                 <input autoFocus placeholder="Ex: Diário do Vulto" value={title} onChange={e=>setTitle(e.target.value)} />
              </div>
              <div className="col" style={{flex:1}}>
                 <label>TAGS (Separar por vírgula)</label>
                 <input placeholder="Sangue, Oculto, Morte" value={tags} onChange={e=>setTags(e.target.value)} />
              </div>
           </div>

           <div className="col">
              <label>DESCRIÇÃO PRELIMINAR (Visível a Todos)</label>
              <textarea rows={3} value={descPublic} onChange={e=>setDescPublic(e.target.value)} />
           </div>

           <div className="col">
              <label style={{color: '#c6a45f'}}>DADOS OCULTOS / OBSERVAÇÕES DO MESTRE</label>
              <textarea 
                 rows={2} 
                 style={{borderColor:'#c6a45f', background:'#18120a'}}
                 placeholder="Informações que só aparecem ao inspecionar..."
                 value={descHidden} 
                 onChange={e=>setDescHidden(e.target.value)} 
              />
           </div>

           <div className="form-row">
              <div className="col evidence-group">
                 <span className="group-title">ANEXO VISUAL & UV</span>
                 
                 <label>1. IMAGEM PADRÃO</label>
                 <label className="upload-btn">
                    📷 SELECIONAR FOTO
                    <input type="file" accept="image/*" hidden onChange={handleImgSelect} />
                 </label>
                 
                 <div className="image-preview-box" style={{backgroundImage: previewUrl ? `url(${previewUrl})` : 'none'}}>
                    {!previewUrl && <span style={{fontSize:10, opacity:0.3}}>SEM IMAGEM</span>}
                 </div>

                 {imgFile && (
                    <>
                       <div style={{height:1, background:'#333', margin:'10px 0'}} />
                       <label style={{color:'#b366ff'}}>2. CAMADA LUZ NEGRA (Efeito UV)</label>
                       
                       <div style={{display:'flex', gap:10}}>
                          <button 
                             className="upload-btn" 
                             style={{flex:1, color: editorMode === 'uv' ? '#b366ff' : ''}}
                                onClick={() => setEditorMode('uv')}
                          >
                             🖌️ DESENHAR EFEITO
                          </button>
                          
                          <label className="upload-btn" style={{flex:1}}>
                             📁 UPLOAD PNG
                             <input type="file" accept="image/png" hidden onChange={e => setUvFile(e.target.files?.[0] || null)} />
                          </label>
                       </div>
                       {uvFile && <div className="file-status" style={{color:'#b366ff'}}>✓ Camada UV Anexada</div>}
                    </>
                 )}

                         {/* CAMADA DE TRATAMENTO (PUZZLE) */}
                         {imgFile && (
                              <>
                                 <div style={{height:1, background:'#333', margin:'10px 0'}} />
                                 <label style={{color: '#c6a45f'}}>🧪 CAMADA DE TRATAMENTO (Brilho/Contraste)</label>
                                 <small style={{display:'block', fontSize:10, color:'#888', marginBottom:5}}>
                                     Aparece quando o jogador manipula os filtros da imagem.
                                 </small>

                                 <div style={{display:'flex', gap:10}}>
                                    <button
                                       className="upload-btn"
                                       style={{flex:1, color: filterFile ? '#c6a45f' : ''}}
                                       onClick={() => setEditorMode('filter')}
                                    >
                                       🖌️ DESENHAR SEGREDOS
                                    </button>

                                    <label className="upload-btn" style={{flex:1}}>
                                       📁 UPLOAD PNG
                                       <input type="file" accept="image/png" hidden onChange={e => setFilterFile(e.target.files?.[0] || null)} />
                                    </label>
                                 </div>
                                 {filterFile && <div className="file-status" style={{color:'#c6a45f'}}>✓ Anomalia Óptica Anexada</div>}
                              </>
                         )}

                               {/* CONFIGURAÇÃO DE REVELAÇÃO DA CAMADA */}
                               {imgFile && (
                                  <div style={{marginTop:10, padding:10, border:'1px dashed #333'}}>
                                     <label style={{color:'#c6a45f'}}>CONFIGURAR A APARIÇÃO (Camada de Tratamento)</label>
                                     <div style={{display:'flex', gap:10, marginTop:6}}>
                                          <div style={{flex:1}}>
                                             <label>Brilho Alvo</label>
                                             <input type="number" min={0} max={300} value={filterRevealBrightness} onChange={e=>setFilterRevealBrightness(Number(e.target.value))} />
                                          </div>
                                          <div style={{flex:1}}>
                                             <label>Contraste Alvo</label>
                                             <input type="number" min={0} max={300} value={filterRevealContrast} onChange={e=>setFilterRevealContrast(Number(e.target.value))} />
                                          </div>
                                          <div style={{flex:1}}>
                                             <label>Saturação Alvo</label>
                                             <input type="number" min={0} max={200} value={filterRevealSaturate} onChange={e=>setFilterRevealSaturate(Number(e.target.value))} />
                                          </div>
                                     </div>
                                     <small style={{color:'#666', fontSize:11}}>Defina os valores que o jogador precisa atingir para que a camada comece a aparecer.</small>
                                  </div>
                               )}
              </div>

              <div className="col" style={{flex:0.8}}>
                 <label>CARIMBO OFICIAL</label>
                 <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                    {['CONFIDENCIAL', 'ÓBITO', 'ARQUIVADO', 'EVIDÊNCIA', 'ANOMALIA'].map(s => (
                       <button 
                          key={s}
                          onClick={() => setStamp(stamp === s ? '' : s)}
                          className={stamp === s ? 'btn-stamp active' : 'btn-stamp'}
                          style={{
                             fontSize: 11, padding: '6px 10px', 
                             border: '2px solid', 
                             borderColor: stamp===s ? '#e74c3c' : '#444',
                             color: stamp===s ? '#e74c3c' : '#aaa',
                             fontWeight: '900', background: 'transparent',
                             transform: stamp===s ? 'rotate(-8deg)' : 'none',
                             cursor: 'pointer'
                          }}
                       >
                          {s}
                       </button>
                    ))}
                 </div>
              </div>

              <div className="col evidence-group" style={{minWidth:220}}>
                 <span className="group-title">LINK EXTERNO / QR</span>
                 <label>URL EXTERNA (Youtube / Drive / Site)</label>
                 <input placeholder="https://..." value={externalLink} onChange={e=>setExternalLink(e.target.value)} />
                 <div style={{display:'flex', gap:10, alignItems:'center', marginTop:6}}>
                    <button className="upload-btn" onClick={() => { if (externalLink) window.open(externalLink, '_blank'); }}>
                       🔗 ABRIR LINK
                    </button>
                    <div style={{flex:1}}>
                       <small style={{color:'#888'}}>Gere um QR abaixo para players escanearem com o celular.</small>
                    </div>
                 </div>

                 {externalLink && (
                    <div style={{marginTop:10, display:'flex', gap:12, alignItems:'center'}}>
                       <div className="qr-preview">
                          <img alt="qr" src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(externalLink)}`} />
                       </div>
                       <div style={{flex:1}}>
                          <label style={{fontSize:12, color:'#c6a45f'}}>URL SALVA</label>
                          <div style={{fontSize:12, color:'#ddd', wordBreak:'break-all'}}>{externalLink}</div>
                       </div>
                    </div>
                 )}
              </div>

              <div className="col evidence-group">
                 <span className="group-title">EVP & ÁUDIO ESPETRAL</span>
                 
                 <label>A. FAIXA DE RUÍDO (Áudio Visível)</label>
                 <label className="upload-btn">
                    🎵 ARQUIVO NORMAL
                    <input type="file" accept="audio/*" hidden onChange={handleAudioBaseSelect} />
                 </label>
                 {audioBase && <span className="file-status">{audioBase.name}</span>}

                 <div style={{height:1, background:'#333', margin:'10px 0'}} />

                 <label style={{color:'#b33'}}>B. FAIXA ESCONDIDA (Voz/Segredo)</label>
                 <div style={{display:'flex', gap:10}}>
                    <label className="upload-btn" style={{flex:1}}>
                       👻 UPLOAD ARQUIVO
                       <input type="file" accept="audio/*" hidden onChange={handleAudioHiddenSelect} />
                    </label>
                    <button
                       className="upload-btn"
                       style={{flex:1, borderColor: '#b33', color:'#b33'}}
                       onClick={() => setShowSpectroMaker(true)}
                    >
                       📝 TEXTO → ÁUDIO
                    </button>
                 </div>
                 {audioHidden && <span className="file-status">{audioHidden.name}</span>}

                 {audioBasePreview && audioHiddenPreview && (
                    <div style={{ marginTop: 15, padding: 10, background: '#0a0a0a', border: '1px solid #333' }}>
                       <label style={{color: '#c6a45f', marginBottom: 10}}>🎛️ CALIBRAGEM DE FREQUÊNCIA</label>
                       <AudioDecrypter 
                          baseAudio={audioBasePreview}
                          hiddenAudio={audioHiddenPreview}
                          targetFreq={freq}
                       />

                       <div style={{ marginTop: 15, paddingTop: 10, borderTop: '1px dashed #333' }}>
                          <label>DEFINIR FREQUÊNCIA ALVO: {freq}Hz</label>
                          <input 
                             type="range" min="0" max="100" 
                             value={freq} 
                             onChange={e => setFreq(Number(e.target.value))} 
                             style={{accentColor: '#c6a45f'}}
                          />
                          <p style={{fontSize: 10, color:'#666'}}>
                             Mova o slider acima para definir onde o segredo estará.
                             Teste no player acima se a mistura está boa.
                          </p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="col evidence-group" style={{ borderColor: isLocked ? '#e74c3c' : '#333' }}>
                 <span className="group-title" style={{ color: isLocked ? '#e74c3c' : '#888' }}>
                    🔐 CRIPTOGRAFIA / BLOQUEIO
                 </span>

                 <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                    <input 
                       type="checkbox" 
                       id="lock-check" 
                       style={{ width: 'auto' }}
                       checked={isLocked}
                       onChange={e => setIsLocked(e.target.checked)}
                    />
                    <label htmlFor="lock-check" style={{ margin: 0, cursor: 'pointer', color: isLocked ? '#e74c3c' : '#888' }}>
                       ATIVAR BLOQUEIO POR SENHA
                    </label>
                 </div>

                 {isLocked && (
                    <div>
                       <label style={{color: '#e74c3c'}}>SENHA DE DESBLOQUEIO</label>
                       <input 
                          type="text" 
                          placeholder="Ex: KIAN, 1992, MEDO"
                          value={lockPass} 
                          onChange={e => setLockPass(e.target.value)}
                          style={{ borderColor: '#e74c3c', color: '#e74c3c', fontWeight:'bold' }}
                       />
                       <small style={{ color:'#666', fontSize:10 }}>
                          O jogador verá uma tela de terminal e não terá acesso à imagem/descrição até digitar isso.
                       </small>
                    </div>
                 )}
              </div>

           </div>

        </div>

        <div className="dossier-footer">
           <button className="btn-cancel" onClick={onClose}>CANCELAR</button>
           <button className="btn-save" onClick={handleSave} disabled={loading}>
              {loading ? 'ARQUIVANDO...' : 'REGISTRAR EVIDÊNCIA'}
           </button>
        </div>

      </div>

      {editorMode && previewUrl && (
         <div style={{position:'fixed', inset:0, zIndex:11000}}>
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
      )}
      {showSpectroMaker && (
            <div style={{position:'fixed', inset:0, zIndex:12000}}>
               <SpectrogramCreator
                  investigationId={investigationId}
                  onSave={(file) => {
                     // attach to hidden audio slot (local file)
                     try { if (audioHiddenPreview) URL.revokeObjectURL(audioHiddenPreview); } catch(e){}
                     setAudioHidden(file);
                     setAudioHiddenPreview(URL.createObjectURL(file));
                     setShowSpectroMaker(false);
                  }}
                  onUploadComplete={(publicUrl) => {
                     // store uploaded public url so handleSave uses it
                     setAudioHiddenUploadedUrl(publicUrl);
                     setAudioHiddenPreview(publicUrl);
                     setShowSpectroMaker(false);
                  }}
                  onClose={() => setShowSpectroMaker(false)}
               />
            </div>
      )}
    </div>
  );
}
