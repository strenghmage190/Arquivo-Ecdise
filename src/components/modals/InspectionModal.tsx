import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import MysteryImage from '../board/MysteryImage';
import HackingTerminal from '../tools/HackingTerminal';
import AdvancedAudioLab from '../tools/AdvancedAudioLab';
import ChannelIsolator from '../tools/ChannelIsolator';
import HexViewer from '../tools/HexViewer';
import PhoneViewer from '../tools/PhoneViewer';
import CCTVPlayer from '../tools/CCTVPlayer';
import DecipherLens from '../tools/DecipherLens';
import ShredderPuzzle from '../tools/ShredderPuzzle';
import UniversalDecoder from '../tools/UniversalDecoder';
import './InspectionModal.css';
import { supabase } from '../../supabaseClient';
import { uploadInvestigationFile } from '../../utils/storage';
import { updateInvestigationCard } from '../../api/investigations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  card: any;
  onEdit?: () => void;
  isGameMaster: boolean;
  externalBaseId?: string;
  externalHiddenId?: string;
}

export default function InspectionModal({ isOpen, onClose, card, onEdit, isGameMaster, externalBaseId, externalHiddenId }: Props) {
  const isCardLocked = (c: any) => {
    const v = c?.is_locked;
    if (v === true || v === 1) return true;
    if (typeof v === 'string') {
      const s = v.toLowerCase();
      return s === 'true' || s === 't' || s === '1';
    }
    // If a lock_password exists, treat the card as locked for safety
    if (c?.lock_password) return true;
    return false;
  };

  const [isUnlocked, setIsUnlocked] = useState(!isCardLocked(card) || isGameMaster);

  React.useEffect(() => {
    setIsUnlocked(!isCardLocked(card) || isGameMaster);
  }, [card, isGameMaster]);

  const [localUV, setLocalUV] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenOnlyTreatment, setFullscreenOnlyTreatment] = useState(false);
  // audio handled as a visual mode tab now
  const [localThermal, setLocalThermal] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [showFilters, setShowFilters] = useState(false);
  const [forensicMode, setForensicMode] = useState<'none' | 'channel' | 'hex' | 'lens' | 'decoder'>('none');
  const [forensicChannel, setForensicChannel] = useState<'all' | 'r' | 'g' | 'b'>('all');
  
  const disableAllBut = (mode: string) => {
    // filters
    if (mode === 'filters') setShowFilters(prev => !prev);
    else setShowFilters(false);

    // forensic submodes: channel / hex / lens
    if (mode === 'forense') {
      setForensicMode(prev => prev === 'channel' ? 'none' : 'channel');
    } else if (mode === 'hex') {
      setForensicMode(prev => prev === 'hex' ? 'none' : 'hex');
    } else if (mode === 'decoder') {
      setForensicMode(prev => prev === 'decoder' ? 'none' : 'decoder');
    } else if (mode === 'lens') {
      setForensicMode(prev => prev === 'lens' ? 'none' : 'lens');
    } else {
      // if selecting another mode, close forensic panel
      if (forensicMode !== 'none') setForensicMode('none');
    }
  };
  const [puzzleSolved, setPuzzleSolved] = useState(false);
  const fileRef = React.useRef<HTMLDivElement | null>(null);
  const thermalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showPhoneDetails, setShowPhoneDetails] = useState(false);
  const [serverCard, setServerCard] = useState<any | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [videoUploadingInspection, setVideoUploadingInspection] = useState(false);
  // Novo estado: expande a área de áudio (modo "cinema")
  const [audioExpanded, setAudioExpanded] = useState(false);

  // Controle de qual ferramenta visual está ativa
  // 'image' | 'phone' | 'forense' | ...
  const [visualMode, setVisualMode] = useState<string>('image');

  // Atualiza o modo visual quando o cartão muda (garante que PhoneViewer apareça se houver chat)
  React.useEffect(() => {
    try {
      if (card?.metadata?.type === 'phone' || card?.metadata?.chat_data) setVisualMode('phone');
      else if (card?.video_url) setVisualMode('video');
      else if ((card?.audio_url || (card?.metadata && (card.metadata.audio || card.metadata.audio_url))) && !card?.image_url) setVisualMode('audio');
      else setVisualMode('image');
    } catch (e) { setVisualMode('image'); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  // Se o usuário mudar de aba visual ou fechar o modal, assegura que o modo de áudio expandido seja resetado
  React.useEffect(() => {
    if (!isOpen && audioExpanded) setAudioExpanded(false);
  }, [isOpen, audioExpanded]);

  React.useEffect(() => {
    if (visualMode !== 'audio' && audioExpanded) setAudioExpanded(false);
  }, [visualMode, audioExpanded]);

  // initialize localThermal from card metadata when card changes
  React.useEffect(() => {
    try {
      const meta = card?.metadata;
      const hasThermal = Boolean(meta && (meta.thermal === true || meta.thermal_enabled === true || meta.thermal_overlay === true));
      // Check if thermal is unlocked (no keyword or already unlocked)
      const thermalKeyword = meta?.thermal_keyword;
      const thermalUnlocked = meta?.thermal_unlocked === true;
      const canUseThermal = hasThermal && (!thermalKeyword || thermalUnlocked);
      setLocalThermal(canUseThermal);
    } catch (e) {}
  }, [card]);

  React.useEffect(() => {
    if (isOpen) {
      // Modal opened
      // ensure the page and modal scroll positions are reset so content is visible and centered
      setTimeout(() => {
        try {
          window.scrollTo(0, 0);
          fileRef.current?.scrollTo?.({ top: 0, left: 0, behavior: 'auto' });
          const visual = fileRef.current?.querySelector('.inspect-visual-area') as HTMLElement | null;
          visual?.scrollTo?.(0, 0);
        } catch (e) {
          // ignore
        }
      }, 0);
    }
  }, [isOpen]);

  // Render thermal canvas when enabled
  React.useEffect(() => {
    const canvas = thermalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    if (!localThermal) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    // Use the visible base image for thermal rendering; fall back to UV-only layer if base missing
    const imgSrc = (card && (card.image_url || card.image_uv_url)) || null;
    if (!imgSrc) return;

    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imgSrc;
    img.onload = () => {
      if (cancelled) return;
      try {
        const visual = fileRef.current?.querySelector('.inspect-visual-area') as HTMLElement | null;
        // Use intrinsic image resolution for canvas backing store to preserve aspect ratio and detail
        const naturalW = img.naturalWidth || img.width || 1024;
        const naturalH = img.naturalHeight || img.height || 768;
        canvas.width = Math.max(1, naturalW);
        canvas.height = Math.max(1, naturalH);
        // Ensure canvas element scales to fit the visual container without distorting
        try {
          canvas.style.maxWidth = '100%';
          canvas.style.maxHeight = '100%';
          canvas.style.width = 'auto';
          canvas.style.height = '100%';
          canvas.style.left = '50%';
          canvas.style.top = '50%';
          canvas.style.transform = 'translate(-50%, -50%)';
        } catch (e) {}
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // IRONBOW mapping (tactical thermal palette)
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          const val = (r + g + b) / 3; // 0..255

          let red = 0, green = 0, blue = 0;

          if (val < 85) {
            // 0-85: Preto -> Roxo escuro
            const t = val / 85; // 0..1
            red = Math.round((t * 70));
            green = 0;
            blue = Math.round((t * 100));
          } else if (val < 170) {
            // 86-170: Roxo -> Vermelho/Vermelho forte
            const t = (val - 85) / 85; // 0..1
            red = Math.round(70 + (t * (255 - 70)));
            green = 0;
            blue = Math.round(100 - (t * 100));
          } else {
            // 171-255: Vermelho -> Amarelo -> Branco
            const t = (val - 170) / 85; // 0..1
            red = 255;
            green = Math.round(t * 255);
            blue = Math.round(t * 255);
          }

          // clamp and write back
          data[i] = Math.max(0, Math.min(255, red));
          data[i + 1] = Math.max(0, Math.min(255, green));
          data[i + 2] = Math.max(0, Math.min(255, blue));
          // keep alpha untouched (data[i+3])
        }
        ctx.putImageData(imageData, 0, 0);
        ctx.globalCompositeOperation = 'lighter';
        const grad = ctx.createLinearGradient(0, canvas.height, 0, 0);
        grad.addColorStop(0, 'rgba(255,80,20,0.06)');
        grad.addColorStop(1, 'rgba(255,255,255,0.02)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        
        // Render secret thermal text if present
        try {
          const thermalText = card?.metadata?.thermal_secret_text;
          if (thermalText && typeof thermalText === 'string' && thermalText.trim()) {
            // Calculate responsive font size based on canvas dimensions
            let baseFontSize = Math.max(48, Math.min(canvas.width, canvas.height) / 12);
            
            // Apply user-configured font size multiplier
            const fontSizeMultiplier = (card?.metadata?.thermal_font_size || 100) / 100;
            baseFontSize = baseFontSize * fontSizeMultiplier;
            
            ctx.font = `bold ${Math.round(baseFontSize)}px 'Courier New', monospace`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            
            // Split text into lines if too long (wrap at ~40 chars or by newlines)
            const maxLineLength = 40;
            const lines: string[] = [];
            const paragraphs = thermalText.split('\n');
            
            paragraphs.forEach(paragraph => {
              if (paragraph.length <= maxLineLength) {
                lines.push(paragraph);
              } else {
                // Simple word wrap
                const words = paragraph.split(' ');
                let currentLine = '';
                words.forEach(word => {
                  if ((currentLine + ' ' + word).length <= maxLineLength) {
                    currentLine += (currentLine ? ' ' : '') + word;
                  } else {
                    if (currentLine) lines.push(currentLine);
                    currentLine = word;
                  }
                });
                if (currentLine) lines.push(currentLine);
              }
            });
            
            // Position text based on user-configured vertical position
            const lineHeight = baseFontSize * 1.3;
            const totalHeight = lines.length * lineHeight;
            const positionYPercent = (card?.metadata?.thermal_position_y || 50) / 100;
            const startY = (canvas.height * positionYPercent) - (totalHeight / 2) + (lineHeight / 2);
            const centerX = canvas.width / 2;
            
            lines.forEach((line, index) => {
              const y = startY + (index * lineHeight);
              
              // Outer glow (multiple layers for intensity)
              ctx.shadowBlur = 30;
              ctx.shadowColor = 'rgba(255, 255, 0, 0.8)';
              ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
              ctx.fillText(line, centerX, y);
              
              // Mid glow
              ctx.shadowBlur = 15;
              ctx.shadowColor = 'rgba(255, 200, 0, 1)';
              ctx.fillStyle = 'rgba(255, 220, 0, 0.6)';
              ctx.fillText(line, centerX, y);
              
              // Core text (hot white)
              ctx.shadowBlur = 5;
              ctx.shadowColor = 'rgba(255, 255, 255, 1)';
              ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
              ctx.fillText(line, centerX, y);
            });
            
            // Reset shadow
            ctx.shadowBlur = 0;
          }
        } catch (e) {
          // ignore thermal text rendering errors
        }
      } catch (e) {
        // ignore
      }
    };
    return () => { cancelled = true; };
  }, [localThermal, card]);

  // Lock body scroll while the modal is open and focus the modal for accessibility
  React.useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // focus the modal container so screen readers and keyboard users land inside it
      setTimeout(() => { fileRef.current?.focus(); }, 0);
    } else {
      document.body.style.overflow = prevOverflow;
    }
    return () => { document.body.style.overflow = prevOverflow; };
  }, [isOpen]);

    if (!isOpen || !(card || serverCard)) return null;

    const currentCard = serverCard || card;

    const cardLocked = isCardLocked(currentCard);
    const hasRecord = Boolean(currentCard?.metadata && (currentCard.metadata.type === 'person' || currentCard.metadata.person || currentCard.metadata.person_meta));

    // Renderizador inteligente da Área Visual
    const renderVisualContent = () => {
      const chatRaw = currentCard.chat_data ?? currentCard.metadata?.chat_data ?? currentCard.metadata?.chat ?? null;
      let chatList: any[] = [];
      if (chatRaw) {
        if (typeof chatRaw === 'string') {
          try {
            const parsed = JSON.parse(chatRaw);
            if (Array.isArray(parsed)) chatList = parsed;
            else if (parsed && typeof parsed === 'object') {
              // try to find an array inside common keys
              if (Array.isArray(parsed.messages)) chatList = parsed.messages;
              else if (Array.isArray(parsed.chat)) chatList = parsed.chat;
              else if (Array.isArray(parsed.data)) chatList = parsed.data;
              else {
                // fallback: pick the first array value found
                for (const k of Object.keys(parsed)) {
                  if (Array.isArray((parsed as any)[k])) { chatList = (parsed as any)[k]; break; }
                }
              }
            }
          } catch {}
        } else if (Array.isArray(chatRaw)) chatList = chatRaw;
        else if (chatRaw && typeof chatRaw === 'object') {
          if (Array.isArray(chatRaw.messages)) chatList = chatRaw.messages;
          else if (Array.isArray((chatRaw as any).chat)) chatList = (chatRaw as any).chat;
          else if (Array.isArray((chatRaw as any).data)) chatList = (chatRaw as any).data;
          else {
            for (const k of Object.keys(chatRaw)) {
              if (Array.isArray((chatRaw as any)[k])) { chatList = (chatRaw as any)[k]; break; }
            }
          }
        }
      }

      if (visualMode === 'phone') {
        return (
          <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1f'}}>
            <PhoneViewer chatData={chatList} contactName={currentCard.title} />
          </div>
        );
      }

      // If shredded, show puzzle
      if (currentCard.is_shredded) {
        return (
          <ShredderPuzzle
            imgSrc={currentCard.image_url}
            rows={currentCard.metadata?.shred_rows || 1}
            cols={currentCard.metadata?.shred_cols || 8}
            onSolved={() => setPuzzleSolved(true)}
            isGameMaster={isGameMaster}
          />
        );
      }

      // visualMode === 'image'
      if (visualMode === 'video' && currentCard.video_url) {
        // Handlers to replace/remove video attached to this card
        const handleReplaceVideo = async (file: File) => {
          try {
            if (!currentCard || !currentCard.investigation_id) return alert('Investigation id ausente');
            setVideoUploadingInspection(true);
            const ext = file.name.split('.').pop() || 'mp4';
            const publicUrl = await uploadInvestigationFile(file, currentCard.investigation_id, ext);
            if (!publicUrl) throw new Error('Falha ao enviar vídeo');
            const updated = await updateInvestigationCard(currentCard.id, { video_url: publicUrl });
            setServerCard(updated);
          } catch (err) {
            console.error('Erro substituindo vídeo', err);
            alert('Falha ao substituir vídeo');
          } finally {
            setVideoUploadingInspection(false);
          }
        };

        const handleRemoveVideo = async () => {
          try {
            if (!currentCard) return;
            if (!confirm('Remover vídeo anexado deste cartão?')) return;
            setVideoUploadingInspection(true);
            const updated = await updateInvestigationCard(currentCard.id, { video_url: null });
            setServerCard(updated);
          } catch (err) {
            console.error('Erro removendo vídeo', err);
            alert('Falha ao remover vídeo');
          } finally {
            setVideoUploadingInspection(false);
          }
        };

        return (
          <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#000'}}>
            <CCTVPlayer src={currentCard.video_url} allowManage={isGameMaster} onReplace={handleReplaceVideo} onRemove={handleRemoveVideo} />
          </div>
        );
      }

      // audio visual mode
      if (visualMode === 'audio') {
        const meta = (currentCard.metadata && typeof currentCard.metadata === 'object')
          ? currentCard.metadata
          : (typeof currentCard.metadata === 'string' ? (() => { try { return JSON.parse(currentCard.metadata); } catch { return {}; } })() : {});
        const audioSrc = currentCard.audio_url || meta?.audio_url || meta?.audio || meta?.audioUrl || null;
        const audioHidden = currentCard.audio_hidden_url || meta?.audio_hidden_url || meta?.audio_hidden || null;
        const audioFreq = currentCard.audio_target_freq || meta?.audio_target_freq || meta?.audio_target_freq_hz || 50;

        if (!audioSrc) {
          return (<div style={{ color:'#ccc', padding:20 }}>Nenhum arquivo de áudio encontrado para esta evidência.</div>);
        }

        return (
          <div style={{width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'stretch', justifyContent:'flex-start', background:'#000', padding:20, boxSizing:'border-box'}}>
            <div style={{marginBottom:12, display:'flex', alignItems:'center', gap:12}}>
              <div style={{color:'#ccc', fontSize:13}}>Clique em ▶ para reproduzir; use o painel abaixo para análise avançada.</div>
            </div>
            <div style={{flex:1, minHeight:220}}>
              <AdvancedAudioLab 
                baseSrc={String(audioSrc)}
                hiddenSrc={audioHidden ? String(audioHidden) : undefined}
                triggerTime={meta?.audio_config?.trigger_time}
              />
            </div>
          </div>
        );
      }

      if (currentCard.image_url) {
        return (
          <div className={`evidence-display-area ${localThermal ? 'termal-mode' : ''}`}>
            <div className="grid-overlay" aria-hidden />

            {(() => {
              // safe-parse metadata.image_filter_reveal which may be stored as object or JSON string
              let reveal: any = null;
              try {
                const m = currentCard.metadata && typeof currentCard.metadata === 'object'
                  ? currentCard.metadata
                  : (typeof currentCard.metadata === 'string' ? JSON.parse(currentCard.metadata) : {});
                reveal = m?.image_filter_reveal ?? null;
              } catch (e) { reveal = null; }
              return (
                <>
                  <MysteryImage
                    baseSrc={currentCard.image_url}
                    hiddenSrc={currentCard.image_uv_url}
                    filterLayerSrc={currentCard.image_filter_layer}
                    filters={{ brightness, contrast, saturate: saturation }}
                    revealSettings={fullscreenOnlyTreatment ? null : reveal}
                    isUVMode={localUV}
                    fit="contain"
                    className="large-evidence-img"
                    style={{ height: '100%', width: '100%' }}
                    forensicChannel={forensicChannel}
                  />
                  {fullscreenOpen && createPortal(
                    <div style={{position:'fixed', inset:0, zIndex:30000, background:'rgba(0,0,0,0.95)', display:'flex', flexDirection:'column'}} onClick={() => setFullscreenOpen(false)}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:12}} onClick={(e)=>e.stopPropagation()}>
                        <div style={{color:'#fff'}}>EVIDÊNCIA #{String(currentCard.id || '').slice(0,6)}</div>
                        <div style={{display:'flex', gap:8}}>
                          <button className="btn-tool-tab" onClick={e=>{ e.stopPropagation(); setLocalUV(prev=>!prev); }}>{localUV? 'UV ON':'UV OFF'}</button>
                          <button className={`btn-tool-tab ${localThermal ? 'active-green' : ''}`} onClick={e=>{ e.stopPropagation(); setLocalThermal(prev=>!prev); }}>{localThermal ? 'TERMAL ON' : 'TERMAL'}</button>
                          <button className={`btn-tool-tab ${forensicMode !== 'none' ? 'active-green' : ''}`} onClick={e=>{ e.stopPropagation(); setForensicMode(prev => prev === 'channel' ? 'none' : 'channel'); }}>{forensicMode !== 'none' ? 'FORENSE ON' : 'FORENSE'}</button>
                          <select value={forensicChannel} onChange={e=>setForensicChannel(e.target.value as any)} style={{marginLeft:6}} onClick={e=>e.stopPropagation()}>
                            <option value="all">ALL</option>
                            <option value="r">R</option>
                            <option value="g">G</option>
                            <option value="b">B</option>
                          </select>
                          <button className={`btn-tool-tab ${fullscreenOnlyTreatment ? 'active-green' : ''}`} onClick={e=>{ e.stopPropagation(); setFullscreenOnlyTreatment(prev=>!prev); }}>{fullscreenOnlyTreatment ? 'TRATAR SÓ NA EXPANSÃO' : 'TRATAR NA TELA'}</button>
                          <button className="btn-tool-tab" onClick={e=>{ e.stopPropagation(); setBrightness(100); setContrast(100); setSaturation(100); }}>RESET</button>
                          <button className="btn-tool-tab" onClick={e=>{ e.stopPropagation(); setFullscreenOpen(false); }}>FECHAR</button>
                        </div>
                      </div>
                      <div style={{flex:1, display:'flex', alignItems:'center', justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
                        <div style={{width:'90%', height:'90%', position:'relative'}}>
                          <MysteryImage
                            baseSrc={currentCard.image_url}
                            hiddenSrc={currentCard.image_uv_url}
                            filterLayerSrc={currentCard.image_filter_layer}
                            filters={{ brightness, contrast, saturate: saturation }}
                            revealSettings={reveal}
                            isUVMode={localUV}
                            fit="contain"
                            className="large-evidence-img"
                            style={{ height: '100%', width: '100%' }}
                            forensicChannel={forensicChannel}
                          />
                          {localThermal && (
                            <canvas ref={thermalCanvasRef} style={{position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:40}} />
                          )}
                        </div>
                      </div>
                      <div style={{padding:12, display:'flex', gap:12, alignItems:'center', justifyContent:'center'}} onClick={e=>e.stopPropagation()}>
                        <label style={{color:'#fff'}}>BRILHO {brightness}%</label>
                        <input type="range" min={0} max={300} value={brightness} onChange={e=>setBrightness(Number(e.target.value))} />
                        <label style={{color:'#fff'}}>CONTRASTE {contrast}%</label>
                        <input type="range" min={0} max={300} value={contrast} onChange={e=>setContrast(Number(e.target.value))} />
                        <label style={{color:'#fff'}}>SAT {saturation}%</label>
                        <input type="range" min={0} max={300} value={saturation} onChange={e=>setSaturation(Number(e.target.value))} />
                      </div>
                    </div>, document.body)}
                </>
              );
            })()}

            {localThermal && !fullscreenOpen && (
              <div className="thermal-overlay" aria-hidden>
                <canvas className="thermal-canvas" ref={thermalCanvasRef} />
              </div>
            )}

            <div className="ui-corners" aria-hidden />

            {localThermal && (
              <div className="thermal-scale" aria-hidden>
                <span className="temp-high">42°C</span>
                <div className="gradient-bar" />
                <span className="temp-low">12°C</span>
              </div>
            )}
          </div>
        );
      }

      // Fallback: if no image but have chat, show phone
      if (chatList && chatList.length > 0) {
        return (
          <div style={{width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', background:'#1a1a1f'}}>
            <PhoneViewer chatData={chatList} contactName={currentCard.title} />
          </div>
        );
      }

      // Nothing to show
      return <div style={{ color: '#888', padding: 20 }}>Nenhuma mídia disponível.</div>;
    };

  // If modal is open but card is missing, show a helpful placeholder to aid debugging
  if (!card) {
    const placeholder = (
      <div className="inspect-backdrop" onClick={onClose}>
        <div className="inspect-file" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="inspect-header">
            <div className="meta-info"><span className="case-stamp">EVIDÊNCIA — N/D</span></div>
            <div className="actions"><button className="btn-close-modal" onClick={onClose}>&times;</button></div>
          </div>
          <div style={{ padding: 20, color: '#ccc' }}>
            <h3>Sem dados do cartão</h3>
            <p>O modal foi aberto, mas o objeto <strong>card</strong> está ausente ou indefinido.</p>
            <p>Verifique o fluxo que chama <strong>InspectionModal</strong> e confirme que está passando um objeto válido.</p>
          </div>
        </div>
      </div>
    );
    // modal opened without card — silently return placeholder
    return createPortal(placeholder, document.body);
  }

  // Pre-parse metadata and chat so header can show a toggle when both image+chat exist
  const _maybeMeta = currentCard.metadata && typeof currentCard.metadata === 'object'
    ? currentCard.metadata
    : (typeof currentCard.metadata === 'string' ? (() => { try { return JSON.parse(currentCard.metadata); } catch { return {}; } })() : {});
  const _rawChat = currentCard.chat_data ?? _maybeMeta?.chat_data ?? _maybeMeta?.chat ?? null;
  let _headerChatList: any[] | null = null;
  if (_rawChat) {
    if (typeof _rawChat === 'string') {
      try {
        const parsed = JSON.parse(_rawChat);
        if (Array.isArray(parsed)) _headerChatList = parsed;
        else if (parsed && typeof parsed === 'object') {
          if (Array.isArray(parsed.messages)) _headerChatList = parsed.messages;
          else if (Array.isArray(parsed.chat)) _headerChatList = parsed.chat;
          else if (Array.isArray(parsed.data)) _headerChatList = parsed.data;
          else {
            for (const k of Object.keys(parsed)) { if (Array.isArray((parsed as any)[k])) { _headerChatList = (parsed as any)[k]; break; } }
          }
        }
      } catch { _headerChatList = null; }
    } else if (Array.isArray(_rawChat)) {
      _headerChatList = _rawChat;
    } else if (_rawChat && typeof _rawChat === 'object') {
      if (Array.isArray((_rawChat as any).messages)) _headerChatList = (_rawChat as any).messages;
      else if (Array.isArray((_rawChat as any).chat)) _headerChatList = (_rawChat as any).chat;
      else if (Array.isArray((_rawChat as any).data)) _headerChatList = (_rawChat as any).data;
      else {
        for (const k of Object.keys(_rawChat)) { if (Array.isArray((_rawChat as any)[k])) { _headerChatList = (_rawChat as any)[k]; break; } }
      }
    }
  }

  // Robust check for presence of chat content in various shapes
  const hasChatContent = (c: any) => {
    try {
      const raw = c?.chat_data ?? c?.metadata?.chat_data ?? c?.metadata?.chat ?? c?.chat ?? null;
      if (!raw) return false;
      if (Array.isArray(raw)) return raw.length > 0;
      if (typeof raw === 'string') {
        // try parse JSON
        try {
          const p = JSON.parse(raw);
          if (Array.isArray(p)) return p.length > 0;
          if (p && typeof p === 'object') return Object.keys(p).length > 0;
          return String(raw).trim().length > 0;
        } catch {
          return String(raw).trim().length > 0;
        }
      }
      if (typeof raw === 'object') return Object.keys(raw).length > 0;
      return Boolean(raw);
    } catch (e) {
      return false;
    }
  };
  const effectiveHasChat = hasChatContent(currentCard);

  // Auto-switch visual mode when image/chat availability changes
  React.useEffect(() => {
    // if currently showing image but image was removed and chat exists, switch to phone
    if (visualMode === 'image' && !currentCard.image_url && effectiveHasChat) {
      setVisualMode('phone');
    }
    // if currently showing phone but there's no chat data, and an image exists, switch to image
    if (visualMode === 'phone' && !effectiveHasChat && currentCard.image_url) {
      setVisualMode('image');
    }
  // only run when these change
  }, [visualMode, currentCard.image_url, effectiveHasChat]);

  // derive contact name for header/meta display (prefer explicit column, then metadata, then chat payload)
  const contactNameFromPayload = currentCard.chat_contact_name ?? _maybeMeta?.chat_contact_name ?? null;
  let contactNameInferred: string | null = contactNameFromPayload;
  if (!contactNameInferred && _headerChatList && _headerChatList.length > 0) {
    const first = _headerChatList[0];
    contactNameInferred = first?.contact || first?.name || first?.sender || null;
  }

  const modal = (
    <div className="inspect-backdrop" onClick={onClose}>
      <div
        className={`inspect-file ${audioExpanded ? 'audio-expanded' : ''}`}
        ref={fileRef}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="inspection-title"
        tabIndex={-1}
      >
        {/* Header: hide metadata and action buttons when locked; keep only close button so user can exit */}
        <div className="inspect-header">
          {(!isCardLocked(card) || isUnlocked || isGameMaster) ? (
            <>
              <div className="meta-info">
                <span className="case-stamp">EVIDÊNCIA #{String(currentCard.id || '').slice(0, 4)}</span>
                {cardLocked && (
                  <span title="Evidência protegida" style={{ marginLeft: 8, color: '#f39c12', fontWeight: 700 }}>🔒</span>
                )}
                {hasRecord && (
                  <span title="Prontuário disponível" style={{ marginLeft: 8, color: '#9ee7c8', fontWeight: 700 }}>🧾</span>
                )}
                {currentCard.metadata?.type && <span className="type-tag">{currentCard.metadata.type}</span>}
                {contactNameInferred && (
                  <span className="chat-contact">{contactNameInferred}</span>
                )}

                {/* Toggle buttons for available media types */}
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                    {card.image_url && <button className={`btn-tool-tab ${visualMode === 'image' ? 'active-green' : ''}`} onClick={() => setVisualMode('image')}>FOTO</button>}
                    {currentCard.video_url && <button className={`btn-tool-tab ${visualMode === 'video' ? 'active-green' : ''}`} onClick={() => setVisualMode('video')}>VÍDEO</button>}
                    {currentCard.audio_url && <button className={`btn-tool-tab ${visualMode === 'audio' ? 'active-green' : ''}`} onClick={() => setVisualMode('audio')}>ÁUDIO</button>}
                    {_headerChatList && _headerChatList.length > 0 && <button className={`btn-tool-tab ${visualMode === 'phone' ? 'active-green' : ''}`} onClick={() => setVisualMode('phone')}>CHATS</button>}
                </div>
              </div>
              <div className="actions">
                <button className="btn-tool-tab" title="Expandir imagem" onClick={(e)=>{ e.stopPropagation(); setFullscreenOpen(true); }}>🔍 EXPANDIR</button>

                <button className={`btn-tool-tab ${showFilters ? 'active-green' : ''}`} onClick={() => disableAllBut('filters')}>🧪 TRATAMENTO</button>

                <button className={`btn-tool-tab ${localUV ? 'active-purple' : ''}`} onClick={() => setLocalUV(!localUV)}>🔦 LUZ UV</button>

                {/* Group less-used tools under "Mais" */}
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <button
                    className="btn-tool-tab"
                    onClick={(e) => { e.stopPropagation(); setShowMoreTools(s => !s); }}
                    aria-expanded={showMoreTools}
                  >
                    MAIS ▾
                  </button>
                  {showMoreTools && (
                    <div style={{ position: 'absolute', right: 0, top: '100%', background: '#111', border: '1px solid #222', padding: 8, zIndex: 200, minWidth: 200 }} onClick={e => e.stopPropagation()}>
                      {card.audio_url && (
                          <button type="button" className={`btn-tool-tab ${visualMode === 'audio' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setVisualMode('audio'); setShowMoreTools(false); }}>📻 INVESTIGAR ÁUDIO</button>
                        )}
                        {(() => {
                          const meta = currentCard?.metadata;
                          const hasThermal = Boolean(meta && (meta.thermal === true || meta.thermal_enabled === true || meta.thermal_overlay === true));
                          const thermalKeyword = meta?.thermal_keyword;
                          const thermalUnlocked = meta?.thermal_unlocked === true;
                          const canUseThermal = hasThermal && (!thermalKeyword || thermalUnlocked);
                          const isLocked = hasThermal && thermalKeyword && !thermalUnlocked;
                          
                          return (
                            <button 
                              type="button" 
                              className={`btn-tool-tab ${localThermal ? 'active-blue' : ''}`} 
                              style={{ 
                                display: 'block', 
                                width: '100%', 
                                textAlign: 'left',
                                opacity: isLocked ? 0.5 : 1,
                                cursor: isLocked ? 'not-allowed' : 'pointer'
                              }} 
                              onClick={() => { 
                                if (isLocked) {
                                  alert(`🔒 Modo Termal bloqueado. Use o Terminal de Busca para encontrar a palavra-chave.`);
                                  return;
                                }
                                setLocalThermal(!localThermal); 
                                setShowMoreTools(false); 
                              }}
                              title={isLocked ? 'Use o Terminal de Busca para desbloquear' : 'Ativar visão termográfica'}
                            >
                              🌡️ TERMAL {isLocked ? '🔒' : ''}
                            </button>
                          );
                        })()}
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'channel' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('forense'); setShowMoreTools(false); }}>🔬 FORENSE</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'hex' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('hex'); setShowMoreTools(false); }}>⌨ INSPECIONAR CÓDIGO</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'decoder' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('decoder'); setShowMoreTools(false); }}>🔐 DECODIFICADOR</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'lens' ? 'active-purple' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('lens'); setShowMoreTools(false); }}>🧿 TRADUZIR</button>
                    </div>
                  )}
                </div>

                {/* Phone open/close button removed per request */}

                {/* Botão para expandir/compactar a visualização de áudio (Modo Cinema) */}
                {visualMode === 'audio' && (
                  <button
                    className={`btn-tool-tab ${audioExpanded ? 'active-green' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setAudioExpanded(prev => !prev); }}
                    title="Ocultar detalhes para focar no espectrograma"
                  >
                    {audioExpanded ? 'COMPACTAR' : 'EXPANDIR ÁUDIO'}
                  </button>
                )}

                <button className="btn-close-modal" onClick={onClose}>&times;</button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
              <button className="btn-close" onClick={onClose}>✖</button>
            </div>
          )}
        </div>

        {/* debug overlay removed */}

        {/* --- CONTEÚDO PRINCIPAL --- */}
        {!(isUnlocked || isGameMaster) ? (
          <div style={{ flex: 1, display: 'flex', background: '#000' }}>
            <HackingTerminal
              correctPassword={card.lock_password}
              onUnlock={() => setIsUnlocked(true)}
              hint={card.description_public}
            />
          </div>
        ) : (
          <React.Fragment>
            <div className="inspect-visual-area" style={{ position: 'relative' }}>
              {renderVisualContent()}
              {visualMode === 'phone' && (
                <button
                  onClick={() => setShowPhoneDetails(s => !s)}
                  style={{
                    position: 'absolute', right: 12, top: 12, zIndex: 80,
                    background: 'rgba(0,0,0,0.45)', color: '#fff', border: '1px solid rgba(255,255,255,0.06)',
                    padding: '6px 8px', borderRadius: 6, cursor: 'pointer', fontSize: 12
                  }}
                >
                  {showPhoneDetails ? 'Ocultar Metadados' : 'Mostrar Metadados'}
                </button>
              )}

              {showFilters && (
                <div className="filters-overlay-panel">
                  <div className="filter-row">
                    <label>BRILHO {brightness}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="300" value={brightness} onChange={e => setBrightness(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>CONTRASTE {contrast}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="300" value={contrast} onChange={e => setContrast(Number(e.target.value))} />
                    </div>
                  </div>
                  <div className="filter-row">
                    <label>SATURAÇÃO {saturation}%</label>
                    <div className="filter-controls">
                      <input className="filter-range" type="range" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
                      <input className="filter-number" type="number" min="0" max="200" value={saturation} onChange={e => setSaturation(Number(e.target.value))} />
                    </div>
                  </div>
                  <button className="btn-reset-filters" onClick={() => { setBrightness(100); setContrast(100); setSaturation(100); }}>RESET</button>
                </div>
              )}

              {forensicMode === 'channel' && (
                <div className="tools-hud-panel">
                  <div className="hud-title">ISOLAMENTO DE ESPECTRO</div>
                  <div className="forensic-controls">
                    <button
                      className={`btn-channel ${forensicChannel === 'all' ? 'active' : ''}`}
                      onClick={() => setForensicChannel('all')}
                    >RGB</button>
                    <button
                      className={`btn-channel red ${forensicChannel === 'r' ? 'active' : ''}`}
                      onClick={() => setForensicChannel('r')}
                    >RED</button>
                    <button
                      className={`btn-channel green ${forensicChannel === 'g' ? 'active' : ''}`}
                      onClick={() => setForensicChannel('g')}
                    >GRN</button>
                    <button
                      className={`btn-channel blue ${forensicChannel === 'b' ? 'active' : ''}`}
                      onClick={() => setForensicChannel('b')}
                    >BLU</button>
                  </div>
                  <p style={{ fontSize: 9, color: '#666', marginTop: 10 }}>
                    Análise espectral isolada. Útil para encontrar escritas ocultas em cores específicas.
                  </p>
                </div>
              )}

              {forensicMode === 'decoder' && (
                <div className="tools-hud-panel">
                  <div className="hud-title">ESTAÇÃO DE DECIFRAGEM</div>
                  <div style={{ width: '100%' }}>
                    <UniversalDecoder />
                  </div>
                </div>
              )}

              {forensicMode === 'lens' && (
                <div className="tools-hud-panel">
                  <div className="hud-title">🧿 TRADUZIR</div>
                  <div style={{ width: '100%' }}>
                    <DecipherLens realText={currentCard.metadata?.real_text} cipherText={currentCard.metadata?.cipher_text} />
                  </div>
                </div>
              )}

              

              {/* audio is displayed via the 'audio' visual mode/tab now */}
            </div>

            {visualMode !== 'phone' && !audioExpanded && (
              <div className="inspect-details">
           
           {/* Coluna com SCROLL automático */}
           <div className="text-col">
              <h2>{card.title}</h2>
              
              <span className="desc-title">DESCRIÇÃO:</span>
              <p className="public-desc">
                 {card.description_public || "Nenhuma descrição fornecida."}
              </p>

              {isGameMaster && card.description_hidden && (
                 <div className="gm-note">
                    <strong style={{color:'#c6a45f'}}>🔒 NOTAS DO MESTRE:</strong><br/>
                    {card.description_hidden}
                 </div>
              )}

              {/* METADADOS LIMPOS E ORGANIZADOS */}
                {card.metadata && Object.keys(card.metadata).length > 0 && (
                  <div className="metadata-box">
                    <h4>METADADOS TÉCNICOS</h4>
                     {Object.entries(card.metadata || {}).map(([key, val]: any) => {
                      // Filtros:
                      if(['excalidraw_data', 'chat_data', 'type', 'status', 'image_filter_reveal', 'image_filter_layer', 'image_filter'].includes(key)) return null;
                      if (!val && val !== 0) return null;

                      // 1. Tratamento bonito para JSONs complexos (como person)
                      let displayVal: any = val;
                      if (typeof val === 'object') {
                        if (key === 'person' || key === 'person_meta') {
                         displayVal = (
                          <div style={{fontSize: 12, marginLeft: 5}}>
                            <div style={{color:'#ddd'}}><b>Nome:</b> {val.name || '—'}</div>
                            <div style={{color:'#ddd'}}><b>Profissão:</b> {val.occupation || '—'}</div>
                            <div style={{color: val.status && String(val.status).toLowerCase().includes('dead') ? '#b33' : '#2ecc71'}}><b>Estado:</b> {val.status || '—'}</div>
                          </div>
                         );
                        } else {
                         // stringify with indentation but render in a pre-wrap box so it doesn't overflow
                         displayVal = JSON.stringify(val, null, 2);
                        }
                      }

                      return (
                        <div key={key} style={{display:'flex', flexDirection:'column', borderBottom:'1px solid #222', padding:'6px 0'}}>
                          <span style={{color:'#666', fontSize:11, textTransform:'uppercase'}}>{key}:</span>
                          <div style={{color:'#aaa', fontSize:12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak:'break-word', marginTop:4}}>
                            {displayVal}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
           </div>

           {/* Coluna de Botões Fixos */}
           <div className="controls-col" style={{display:'flex', flexDirection:'column', gap:10, width: 200, flexShrink:0}}>
              {isGameMaster && (
                 <button className="btn-edit-ref" onClick={() => { onClose(); onEdit?.(); }}>
                    ✎ EDITAR DADOS
                 </button>
              )}
              
              {/* Exemplo de botão extra se for pessoa */}
              {card.metadata?.type === 'person' && (
                 <div style={{padding:10, background:'#222', border:'1px solid #444', textAlign:'center', fontSize:10}}>
                    STATUS: <br/>
                    <strong style={{
                      color: card.metadata.person?.status === 'DEAD' ? '#e74c3c' : card.metadata.person?.status === 'MIA' ? '#f39c12' : '#2ecc71',
                      fontSize:14
                    }}>
                      {card.metadata.person?.status === 'ALIVE' ? 'VIVO' : card.metadata.person?.status === 'DEAD' ? 'MORTO' : card.metadata.person?.status === 'MIA' ? 'DESAPARECIDO' : 'DESCONHECIDO'}
                    </strong>
                 </div>
              )}
           </div>

        </div>
            )}

            {visualMode === 'phone' && showPhoneDetails && (
              <div style={{ width: '100%', borderTop: '1px solid #222', background: '#0b0b0b', padding: 16 }}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1, overflowY: 'auto', maxHeight: 320 }}>
                    <div style={{ paddingRight: 10 }}>
                      <h2 style={{ color: '#f2f2f2', marginTop: 0 }}>{card.title}</h2>
                      <span className="desc-title">DESCRIÇÃO:</span>
                      <p className="public-desc">{card.description_public || 'Nenhuma descrição fornecida.'}</p>

                      {isGameMaster && card.description_hidden && (
                        <div className="gm-note">
                          <strong style={{color:'#c6a45f'}}>🔒 NOTAS DO MESTRE:</strong><br/>
                          {card.description_hidden}
                        </div>
                      )}

                      {card.metadata && Object.keys(card.metadata).length > 0 && (
                        <div className="metadata-box" style={{ marginTop: 12 }}>
                          <h4>METADADOS TÉCNICOS</h4>
                          {Object.entries(card.metadata || {}).map(([key, val]: any) => {
                            if(['excalidraw_data', 'chat_data', 'type', 'status', 'image_filter_reveal', 'image_filter_layer', 'image_filter'].includes(key)) return null;
                            if (!val && val !== 0) return null;
                            let displayVal: any = val;
                            if (typeof val === 'object') {
                              if (key === 'person' || key === 'person_meta') {
                                displayVal = (
                                  <div style={{fontSize: 12, marginLeft: 5}}>
                                    <div style={{color:'#ddd'}}><b>Nome:</b> {val.name || '—'}</div>
                                    <div style={{color:'#ddd'}}><b>Profissão:</b> {val.occupation || '—'}</div>
                                    <div style={{color: val.status && String(val.status).toLowerCase().includes('dead') ? '#b33' : '#2ecc71'}}><b>Estado:</b> {val.status || '—'}</div>
                                  </div>
                                );
                              } else {
                                displayVal = JSON.stringify(val, null, 2);
                              }
                            }
                            return (
                              <div key={key} style={{display:'flex', flexDirection:'column', borderBottom:'1px solid #222', padding:'6px 0'}}>
                                <span style={{color:'#666', fontSize:11, textTransform:'uppercase'}}>{key}:</span>
                                <div style={{color:'#aaa', fontSize:12, fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak:'break-word', marginTop:4}}>
                                  {displayVal}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ width: 200, flexShrink: 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {isGameMaster && (
                        <button className="btn-edit-ref" onClick={() => { onClose(); onEdit?.(); }}>
                          ✎ EDITAR DADOS
                        </button>
                      )}
                      {card.metadata?.type === 'person' && (
                        <div style={{padding:10, background:'#222', border:'1px solid #444', textAlign:'center', fontSize:10}}>
                          STATUS: <br/>
                          <strong style={{
                            color: card.metadata.person?.status === 'DEAD' ? '#e74c3c' : card.metadata.person?.status === 'MIA' ? '#f39c12' : '#2ecc71',
                            fontSize:14
                          }}>
                            {card.metadata.person?.status === 'ALIVE' ? 'VIVO' : card.metadata.person?.status === 'DEAD' ? 'MORTO' : card.metadata.person?.status === 'MIA' ? 'DESAPARECIDO' : 'DESCONHECIDO'}
                          </strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
