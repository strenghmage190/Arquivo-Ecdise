import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import MysteryImage from '../board/MysteryImage';
import HackingTerminal from '../tools/HackingTerminal';
import AudioDecrypter from '../tools/AudioDecrypter';
import AudioLab from '../tools/AudioLab';
import ChannelIsolator from '../tools/ChannelIsolator';
import HexViewer from '../tools/HexViewer';
import PhoneViewer from '../tools/PhoneViewer';
import DecipherLens from '../tools/DecipherLens';
import ShredderPuzzle from '../tools/ShredderPuzzle';
import UniversalDecoder from '../tools/UniversalDecoder';
import './InspectionModal.css';
import { supabase } from '../../supabaseClient';

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
  const [showAudio, setShowAudio] = useState(false);
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
  const [showPhoneDetails, setShowPhoneDetails] = useState(false);
  const [serverCard, setServerCard] = useState<any | null>(null);
  const [showMoreTools, setShowMoreTools] = useState(false);

  // Controle de qual ferramenta visual está ativa
  // 'image' | 'phone' | 'forense' | ...
  const getInitialMode = () => {
     if (card?.metadata?.type === 'phone' || card?.metadata?.chat_data) return 'phone';
     return 'image';
  };
  const [visualMode, setVisualMode] = useState(getInitialMode());

  // Atualiza o modo visual quando o cartão muda (garante que PhoneViewer apareça se houver chat)
  React.useEffect(() => {
    setVisualMode(getInitialMode());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card]);

  // initialize localThermal from card metadata when card changes
  React.useEffect(() => {
    try {
      const meta = card?.metadata;
      const hasThermal = Boolean(meta && (meta.thermal === true || meta.thermal_enabled === true || meta.thermal_overlay === true));
      setLocalThermal(hasThermal);
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

      // visualMode === 'image'
      if (currentCard.image_url) {
        return (
          <MysteryImage
            baseSrc={currentCard.image_url}
            hiddenSrc={currentCard.image_uv_url}
            filterLayerSrc={currentCard.image_filter_layer}
            filters={{ brightness, contrast, saturate: saturation }}
            isUVMode={localUV}
            fit="contain"
            className="large-evidence-img"
            style={{ height: '100%', width: '100%' }}
            forensicChannel={forensicChannel}
          />
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
        className="inspect-file"
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
                {currentCard.metadata?.type && <span className="type-tag">{currentCard.metadata.type}</span>}
                {contactNameInferred && (
                  <span className="chat-contact">{contactNameInferred}</span>
                )}

                {/* Toggle buttons when both an image and chat data are present */}
                {card.image_url && _headerChatList && _headerChatList.length > 0 && (
                  <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                      <button className={`btn-tool-tab ${visualMode === 'image' ? 'active-green' : ''}`} onClick={() => setVisualMode('image')}>FOTO</button>
                      <button className={`btn-tool-tab ${visualMode === 'phone' ? 'active-green' : ''}`} onClick={() => setVisualMode('phone')}>CHATS</button>
                    </div>
                )}
              </div>
              <div className="actions">
                {card.audio_url && <span style={{fontSize:12, color:'#b33', marginRight:8}}>🔊 ÁUDIO ANEXADO</span>}

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
                          <button type="button" className={`btn-tool-tab ${showAudio ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setShowAudio(!showAudio); setShowMoreTools(false); }}>📻 INVESTIGAR ÁUDIO</button>
                        )}
                        <button type="button" className={`btn-tool-tab ${localThermal ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { setLocalThermal(!localThermal); setShowMoreTools(false); }}>🌡️ TERMAL</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'channel' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('forense'); setShowMoreTools(false); }}>🔬 FORENSE</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'hex' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('hex'); setShowMoreTools(false); }}>⌨ INSPECIONAR CÓDIGO</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'decoder' ? 'active-blue' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('decoder'); setShowMoreTools(false); }}>🔐 DECODIFICADOR</button>
                        <button type="button" className={`btn-tool-tab ${forensicMode === 'lens' ? 'active-purple' : ''}`} style={{ display: 'block', width: '100%', textAlign: 'left' }} onClick={() => { disableAllBut('lens'); setShowMoreTools(false); }}>🧿 TRADUZIR</button>
                    </div>
                  )}
                </div>

                {/* Phone open/close button removed per request */}

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
        {!isUnlocked ? (
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
              {!showAudio && renderVisualContent()}
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

              {localThermal && (
                <div className="thermal-overlay" aria-hidden />
              )}

              {card.audio_url && (
                showAudio ? (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 50, boxShadow: '0 -6px 28px rgba(0,0,0,0.9)' }}>
                    <AudioLab
                      baseSrc={card.audio_url}
                      hiddenSrc={card.audio_hidden_url}
                      targetFreq={card.audio_target_freq || 50}
                      externalBaseId={externalBaseId}
                      externalHiddenId={externalHiddenId}
                    />
                  </div>
                ) : (
                  <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-30%)', zIndex: 60 }}>
                    <AudioDecrypter baseAudio={card.audio_url} hiddenAudio={card.audio_hidden_url} targetFreq={card.audio_target_freq || 50} />
                  </div>
                )
              )}
            </div>

            {visualMode !== 'phone' && (
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
                    <strong style={{color:'#2ecc71', fontSize:14}}>VIVO</strong>
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
                          <strong style={{color:'#2ecc71', fontSize:14}}>VIVO</strong>
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
