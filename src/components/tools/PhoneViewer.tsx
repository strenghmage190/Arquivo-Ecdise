import {
  Lock,
  MessageSquare,
  Image as ImageIcon,
  FileText,
  Mic,
  Trash2,
  ArrowLeft,
  MapPin,
  Camera,
  Clock,
  BookOpen,
  RotateCcw,
  Radio,
  Flashlight,
  Pin,
  AlertTriangle,
  Flame,
  Signal,
  BatteryMedium,
} from 'lucide-react';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import NumericKeypad from './NumericKeypad';
import PatternLock from './PatternLock';
import {
  DeviceExtractionMetadata,
  DeviceGalleryItem,
  DeviceNoteItem,
} from '../../types/forensicPillars';
import { useForensicDispatch } from '../../contexts/ForensicDispatchContext';
import { useCollaboration } from '../../contexts/CollaborationContext';
import { CasePin, PhonePinAnchor } from '../../types/collaboration';
import PinListBar from '../collaboration/PinListBar';
import PinNoteComposer from '../collaboration/PinNoteComposer';
import TeamFindingsPopover from '../collaboration/TeamFindingsPopover';
import { decryptNoteBody } from '../../utils/webCryptoLock';
import './PhoneViewer.css';

interface PhoneMessage {
  sender?: string;
  text?: string;
  message?: string;
  body?: string;
  payload?: any;
  content?: any;
  image_url?: string;
  image?: string;
  media?: { url?: string; src?: string } | null;
  photo?: string;
  time?: string;
  caption?: string;
  [k: string]: any;
}

interface PhoneViewerProps {
  chatData?: PhoneMessage[] | null;
  contactName?: string | null;
  isLocked?: boolean;
  password?: string | number;
  fullscreen?: boolean;
  passwordType?: 'pin' | 'pattern';
  deviceData?: DeviceExtractionMetadata | null;
  cardId?: string;
  hideInlinePinList?: boolean;
  showPins?: boolean;
  onToggleShowPins?: () => void;
}

type AppScreen = 'home' | 'messages' | 'gallery' | 'notes' | 'voicemails' | 'trash';

export default function PhoneViewer({
  chatData,
  contactName,
  isLocked = false,
  password,
  fullscreen = false,
  passwordType = 'pin',
  deviceData,
  cardId,
  hideInlinePinList = false,
  showPins: showPinsProp,
  onToggleShowPins,
}: PhoneViewerProps): React.ReactElement {
  const { sendToForensics, openFieldManual } = useForensicDispatch();
  const {
    investigationId,
    pinsByCardId,
    createPin,
    addFinding,
    pendingAnchorJump,
    clearAnchorJump,
  } = useCollaboration();
  const [pendingPinTarget, setPendingPinTarget] = useState<PhonePinAnchor | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [lockLens, setLockLens] = useState<'none' | 'uv' | 'thermal'>('none');
  const [internalShowPins, setInternalShowPins] = useState(true);

  const effectiveShowPins = showPinsProp !== undefined ? showPinsProp : internalShowPins;
  const handleToggleShowPins = onToggleShowPins || (() => setInternalShowPins((s) => !s));

  const resolvedDevice: DeviceExtractionMetadata = useMemo(() => {
    if (deviceData) return deviceData;
    const legacyMessages = Array.isArray(chatData)
      ? chatData.map((m, idx) => ({
          id: `leg-${idx}`,
          sender: (m.sender === 'me' || m.sender === 'eu' ? 'me' : 'them') as 'me' | 'them',
          type: (m.image_url || m.photo ? 'image' : 'text') as 'image' | 'text',
          text: m.text || m.message || m.body || '',
          mediaUrl: m.image_url || m.photo,
          time: m.time || '12:00',
        }))
      : [];
    return {
      version: 2,
      ownerName: contactName || 'Dispositivo Apreendido',
      lockScreen: {
        enabled: Boolean(isLocked && password),
        type: passwordType,
        code: String(password || ''),
        smudgeHints: [],
      },
      enabledApps: {
        messages: true,
        gallery: false,
        notes: false,
        voicemails: false,
        trash: false,
      },
      threads: [
        {
          id: 'default',
          contactName: contactName || 'Desconhecido',
          contactStatus: 'online agora',
          messages: legacyMessages,
        },
      ],
      gallery: [],
      notes: [],
      voicemails: [],
      trash: [],
    };
  }, [deviceData, chatData, contactName, isLocked, password, passwordType]);

  const [unlocked, setUnlocked] = useState(!resolvedDevice.lockScreen.enabled);
  const [activeApp, setActiveApp] = useState<AppScreen>(deviceData ? 'home' : 'messages');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(
    deviceData ? null : resolvedDevice.threads[0]?.id || null
  );
  const [selectedPhoto, setSelectedPhoto] = useState<DeviceGalleryItem | null>(null);
  const [selectedNote, setSelectedNote] = useState<DeviceNoteItem | null>(null);
  const [notePasswordInput, setNotePasswordInput] = useState('');
  const [unlockedNoteIds, setUnlockedNoteIds] = useState<Set<string>>(new Set());
  const [decryptedNoteBodies, setDecryptedNoteBodies] = useState<Record<string, string>>({});
  const [restoredMessageIds, setRestoredMessageIds] = useState<Set<string>>(new Set());
  const [trashUnlocked, setTrashUnlocked] = useState(!resolvedDevice.trashUnlockCode);
  const [trashPin, setTrashPin] = useState('');
  const [restoredTrashIds, setRestoredTrashIds] = useState<Set<string>>(new Set());
  const [currentTime, setCurrentTime] = useState('12:00');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUnlocked(!resolvedDevice.lockScreen.enabled);
  }, [resolvedDevice.lockScreen.enabled]);

  const phonePins = useMemo(() => {
    if (!cardId) return [];
    return (pinsByCardId[cardId] || []).filter((p) => p.tool_type === 'phone');
  }, [pinsByCardId, cardId]);

  const jumpToPhoneAnchor = React.useCallback(
    (a: PhonePinAnchor) => {
      if (a.app) setActiveApp(a.app);
      if (a.threadId) setActiveThreadId(a.threadId);
      if (a.app === 'gallery' && a.itemId) {
        const photo = resolvedDevice.gallery.find((g) => g.id === a.itemId) || null;
        if (photo) setSelectedPhoto(photo);
      }
      if (a.app === 'notes' && a.itemId) {
        const note = resolvedDevice.notes.find((n) => n.id === a.itemId) || null;
        if (note) setSelectedNote(note);
      }
      if (a.itemId) {
        setHighlightedItemId(a.itemId);
        setTimeout(() => setHighlightedItemId(null), 2600);
      }
    },
    [resolvedDevice.gallery, resolvedDevice.notes]
  );

  useEffect(() => {
    if (!pendingAnchorJump || !cardId) return;
    if (pendingAnchorJump.cardId === cardId && pendingAnchorJump.toolType === 'phone') {
      jumpToPhoneAnchor(pendingAnchorJump.anchorData as PhonePinAnchor);
      clearAnchorJump();
    }
  }, [pendingAnchorJump, cardId, jumpToPhoneAnchor, clearAnchorJump]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatBodyRef.current && typeof chatBodyRef.current.scrollTo === 'function') {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [activeThreadId, activeApp, unlocked]);

  const activeThread = resolvedDevice.threads.find((t) => t.id === activeThreadId) || null;

  const handleBack = () => {
    if (activeApp === 'messages' && activeThreadId && resolvedDevice.threads.length > 1) {
      setActiveThreadId(null);
      return;
    }
    if (activeApp === 'gallery' && selectedPhoto) {
      setSelectedPhoto(null);
      return;
    }
    if (activeApp === 'notes' && selectedNote) {
      setSelectedNote(null);
      setNotePasswordInput('');
      return;
    }
    setActiveApp('home');
  };

  const renderHeaderTitle = () => {
    if (activeApp === 'messages') return activeThread?.contactName || 'Mensagens';
    if (activeApp === 'gallery') return 'Galeria';
    if (activeApp === 'notes') return 'Notas';
    if (activeApp === 'voicemails') return 'Gravador / Caixa Postal';
    return 'Lixeira / Backup';
  };

  const renderHeaderAvatar = () => {
    if (activeApp === 'messages' && activeThread) {
      const initials = (activeThread.contactName || '?')
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('');
      return <span>{initials || '?'}</span>;
    }
    if (activeApp === 'messages') return <MessageSquare size={15} />;
    if (activeApp === 'gallery') return <ImageIcon size={15} />;
    if (activeApp === 'notes') return <FileText size={15} />;
    if (activeApp === 'voicemails') return <Mic size={15} />;
    return <Trash2 size={15} />;
  };

  const renderPinAnchorSummary = (pin: CasePin) => {
    const a = pin.anchor_data as PhonePinAnchor;
    const appNames: Record<string, string> = {
      messages: 'Msg',
      gallery: 'Foto',
      notes: 'Nota',
      voicemails: 'Áudio',
      trash: 'Lixeira',
    };
    return a.label ? `[${appNames[a.app] || a.app}] ${a.label}` : `[${appNames[a.app] || a.app}]`;
  };

  const isOnlineStatus = Boolean(activeApp === 'messages' && activeThread);

  return (
    <div className="phone-mockup-wrapper pv-wrapper">
      <div
        className={`nexus-phone-mockup pv-chassis ${
          fullscreen ? 'fullscreen' : ''
        } ${!unlocked ? 'locked' : ''}`}
      >
        {/* Status Bar (Topo fixo, nunca cortado) */}
        <div className="phone-status-bar pv-status-bar">
          <span className="pv-status-time">{currentTime}</span>

          <div className="pv-notch" aria-hidden="true">
            <span className="pv-notch-speaker" />
            <span className="pv-notch-cam" />
          </div>

          <div className="pv-status-right">
            <button
              type="button"
              onClick={() => openFieldManual('device')}
              className="phone-compact-btn pv-manual-btn"
              title="Manual de Extração Móvel"
            >
              <BookOpen size={12} />
            </button>
            <span className="pv-status-os">ORDO-OS</span>
            <Signal size={11} style={{ color: '#d4d4d8' }} />
            <BatteryMedium size={13} style={{ color: 'rgba(52, 211, 153, 0.9)' }} />
            <span className="pv-status-bat">84%</span>
          </div>
        </div>

        {!unlocked && resolvedDevice.lockScreen.code ? (
          <div className="locked-body pv-lock-body phone-scroll">
            <div className="pv-lock-header">
              <div className="pv-lock-icon">
                <Lock size={18} />
              </div>
              <h3 className="pv-lock-title">Acesso Restrito</h3>
              <p className="pv-lock-desc">
                {lockLens === 'thermal'
                  ? 'Termografia Residual: Frio (1º toque) → Quente (último toque).'
                  : lockLens === 'uv'
                  ? 'Luz UV: Resíduos biológicos/oleosidade nas teclas tocadas.'
                  : resolvedDevice.lockScreen.smudgeHints && resolvedDevice.lockScreen.smudgeHints.length > 0
                  ? 'Marcas de gordura visíveis em algumas teclas.'
                  : 'Insira as credenciais ou use lentes forenses na tela.'}
              </p>
              <div className="pv-lens-row">
                <button
                  type="button"
                  onClick={() => setLockLens((l) => (l === 'uv' ? 'none' : 'uv'))}
                  className={`phone-compact-btn pv-lens-btn ${
                    lockLens === 'uv' ? 'pv-lens-btn--uv' : ''
                  }`}
                >
                  <Flashlight size={12} /> Lente UV
                </button>
                <button
                  type="button"
                  onClick={() => setLockLens((l) => (l === 'thermal' ? 'none' : 'thermal'))}
                  className={`phone-compact-btn pv-lens-btn ${
                    lockLens === 'thermal' ? 'pv-lens-btn--thermal' : ''
                  }`}
                >
                  <Flame size={12} /> Termal Residual
                </button>
              </div>
            </div>

            {(() => {
              const rawCode = String(resolvedDevice.lockScreen.code || '');
              if (resolvedDevice.lockScreen.type === 'pattern') {
                const nodes = rawCode
                  .split('-')
                  .map((s) => Number(s.trim()))
                  .filter((n) => n >= 1 && n <= 9);
                const thermalMap: Record<number, number> = {};
                nodes.forEach((node, idx) => {
                  const ratio = nodes.length > 1 ? 0.3 + (idx / (nodes.length - 1)) * 0.7 : 1;
                  thermalMap[node] = Math.max(thermalMap[node] || 0, ratio);
                });
                return (
                  <PatternLock
                    code={rawCode}
                    forensicLens={lockLens}
                    smudgeNodes={nodes}
                    thermalMap={thermalMap}
                    onUnlock={() => setUnlocked(true)}
                  />
                );
              }

              const digits = rawCode.replace(/\D/g, '').split('');
              const effectiveSmudges =
                resolvedDevice.lockScreen.smudgeHints && resolvedDevice.lockScreen.smudgeHints.length > 0
                  ? resolvedDevice.lockScreen.smudgeHints
                  : Array.from(new Set(digits));
              const thermalMap: Record<string, number> = {};
              digits.forEach((d, idx) => {
                const ratio = digits.length > 1 ? 0.3 + (idx / (digits.length - 1)) * 0.7 : 1;
                thermalMap[d] = Math.max(thermalMap[d] || 0, ratio);
              });
              return (
                <NumericKeypad
                  code={rawCode}
                  smudgeHints={effectiveSmudges}
                  forensicLens={lockLens}
                  thermalMap={thermalMap}
                  onUnlock={() => setUnlocked(true)}
                />
              );
            })()}
            {investigationId && (
              <div className="mt-2">
                <TeamFindingsPopover />
              </div>
            )}
          </div>
        ) : activeApp === 'home' ? (
          <div className="phone-home-screen pv-home-body phone-scroll phone-chat-bg">
            <div className="pv-home-banner">
              <strong>{resolvedDevice.ownerName || 'Dispositivo Extraído'}</strong>
              <span>C.R.I.S. Mobile Forensics</span>
            </div>

            <div className="pv-app-grid">
              {resolvedDevice.enabledApps.messages && (
                <button
                  type="button"
                  className="pv-app-tile"
                  onClick={() => {
                    setActiveApp('messages');
                    if (resolvedDevice.threads.length === 1) {
                      setActiveThreadId(resolvedDevice.threads[0].id);
                    }
                  }}
                >
                  <MessageSquare size={20} style={{ color: '#67e8f9' }} />
                  <span>Mensagens ({resolvedDevice.threads.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.gallery && (
                <button
                  type="button"
                  className="pv-app-tile"
                  onClick={() => setActiveApp('gallery')}
                >
                  <ImageIcon size={20} style={{ color: '#6ee7b7' }} />
                  <span>Galeria ({resolvedDevice.gallery.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.notes && (
                <button
                  type="button"
                  className="pv-app-tile"
                  onClick={() => setActiveApp('notes')}
                >
                  <FileText size={20} style={{ color: '#fcd34d' }} />
                  <span>Notas ({resolvedDevice.notes.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.voicemails && (
                <button
                  type="button"
                  className="pv-app-tile"
                  onClick={() => setActiveApp('voicemails')}
                >
                  <Mic size={20} style={{ color: '#c4b5fd' }} />
                  <span>Gravador ({resolvedDevice.voicemails.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.trash && (
                <button
                  type="button"
                  className="pv-app-tile pv-app-tile--danger"
                  onClick={() => setActiveApp('trash')}
                >
                  <Trash2 size={20} style={{ color: '#f87171' }} />
                  <span>Lixeira ({resolvedDevice.trash.length})</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Header do Chat / App */}
            <div className="phone-header pv-header">
              <button
                type="button"
                aria-label="Voltar"
                className="phone-nav-btn phone-compact-btn pv-back-btn"
                onClick={handleBack}
              >
                <ArrowLeft size={16} />
              </button>

              <div className="pv-avatar">
                {renderHeaderAvatar()}
              </div>

              <div className="pv-header-info">
                <div className="pv-header-title">
                  {renderHeaderTitle()}
                </div>
                <div className="pv-header-sub">
                  <span
                    className={`pv-status-dot ${
                      isOnlineStatus ? 'pv-status-dot--online' : 'pv-status-dot--forensic'
                    }`}
                  />
                  <span className="pv-header-sub-text">
                    {isOnlineStatus && activeThread
                      ? activeThread.contactStatus || 'offline'
                      : 'Extração Forense'}
                  </span>
                </div>
              </div>
            </div>

            {activeApp === 'messages' && !activeThread && (
              <div className="pv-list-body phone-scroll phone-chat-bg">
                {resolvedDevice.threads.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className="pv-list-card"
                    onClick={() => setActiveThreadId(th.id)}
                  >
                    <div className="pv-avatar">
                      {th.contactName[0]?.toUpperCase() || '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong className="pv-list-title">{th.contactName}</strong>
                      <span className="pv-list-sub">
                        {th.messages[th.messages.length - 1]?.text || 'Sem mensagens'}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'messages' && activeThread && (
              <div
                className="chat-body pv-chat-body phone-chat-bg phone-scroll"
                ref={chatBodyRef}
              >
                {activeThread.messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  const isRestored = restoredMessageIds.has(msg.id);
                  const msgPins = (cardId && pinsByCardId[cardId] ? pinsByCardId[cardId] : []).filter(
                    (p) => !p.is_resolved && p.tool_type === 'phone' && (p.anchor_data as PhonePinAnchor).itemId === msg.id
                  );
                  const isPinned = (effectiveShowPins && msgPins.length > 0) || highlightedItemId === msg.id;
                  return (
                    <div
                      key={msg.id}
                      className={`nexus-bubble pv-bubble ${
                        isMe ? 'sent pv-bubble--sent' : 'received pv-bubble--received'
                      } ${
                        highlightedItemId === msg.id
                          ? 'pv-bubble--highlighted'
                          : isPinned
                          ? 'pv-bubble--pinned'
                          : ''
                      }`}
                    >
                      {msg.mediaUrl && msg.type === 'image' && (
                        <div className="mb-1.5">
                          <img src={msg.mediaUrl} alt="anexo" className="chat-image" loading="lazy" />
                          <button
                            type="button"
                            className="phone-forensic-chip phone-compact-btn appearance-none"
                            onClick={() =>
                              sendToForensics('document_table', {
                                sourceCardId: cardId,
                                sourceLabel: `Foto de ${activeThread.contactName}`,
                                assetType: 'image',
                                url: msg.mediaUrl,
                              })
                            }
                          >
                            <Flashlight size={11} /> Abrir na Mesa de Luz
                          </button>
                        </div>
                      )}
                      {msg.mediaUrl && msg.type === 'audio' && (
                        <button
                          type="button"
                          className="phone-forensic-chip phone-compact-btn appearance-none mb-1.5"
                          onClick={() =>
                            sendToForensics('acoustic_workbench', {
                              sourceCardId: cardId,
                              sourceLabel: `Áudio de ${activeThread.contactName}`,
                              assetType: 'audio',
                              url: msg.mediaUrl,
                            })
                          }
                        >
                          <Radio size={11} /> Enviar para Bancada Acústica
                        </button>
                      )}
                      {msg.isDeleted && !isRestored ? (
                        <div className="phone-deleted-msg">
                          <span className="inline-flex items-center gap-1">
                            <AlertTriangle size={11} /> Mensagem apagada
                          </span>
                          {msg.restorableText && (
                            <button
                              type="button"
                              onClick={() => setRestoredMessageIds((s) => new Set(s).add(msg.id))}
                            >
                              <RotateCcw size={11} /> Restaurar
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="msg-text pv-msg-text">
                          {isRestored ? msg.restorableText : msg.text}
                        </span>
                      )}
                      <div className="pv-msg-meta">
                        {isPinned && msgPins.length > 0 && (
                          <span className="pv-pin-badge">
                            <Pin size={9} /> Marcada{msgPins.length > 1 ? ` (${msgPins.length})` : ''}
                          </span>
                        )}
                        <span className="msg-time pv-msg-time">
                          {msg.time || currentTime}
                        </span>
                        {cardId && investigationId && (
                          <button
                            type="button"
                            className={`phone-compact-btn pv-pin-btn ${
                              isPinned ? 'pv-pin-btn--active' : ''
                            }`}
                            title="Marcar evidência ou salvar na Gaveta"
                            aria-label="Marcar mensagem"
                            onClick={() =>
                              setPendingPinTarget({
                                app: 'messages',
                                threadId: activeThread.id,
                                itemId: msg.id,
                                label: msg.text?.slice(0, 40) || 'Mensagem',
                              })
                            }
                          >
                            <Pin size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeApp === 'gallery' && !selectedPhoto && (
              <div className="pv-gallery-grid phone-scroll phone-chat-bg">
                {resolvedDevice.gallery.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="pv-gallery-item"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img
                      src={photo.url}
                      alt={photo.caption || 'Foto'}
                    />
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'gallery' && selectedPhoto && (
              <div className="phone-photo-detail pv-detail-body phone-scroll phone-chat-bg">
                <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Foto'} />
                {selectedPhoto.caption && (
                  <p style={{ margin: 0, fontSize: '13px', color: '#e4e4e7', lineHeight: 1.5 }}>
                    {selectedPhoto.caption}
                  </p>
                )}
                {selectedPhoto.exif && (
                  <div className="phone-exif-box">
                    <div>
                      <Clock size={12} /> {selectedPhoto.exif.date || '--'} {selectedPhoto.exif.time || ''}
                    </div>
                    <div>
                      <Camera size={12} /> {selectedPhoto.exif.camera || 'Sensor desconhecido'}
                    </div>
                    <div>
                      <MapPin size={12} /> {selectedPhoto.exif.gps || 'Sem GPS'}
                    </div>
                    {selectedPhoto.exif.locationNote && <small>{selectedPhoto.exif.locationNote}</small>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className="phone-forensic-action phone-compact-btn"
                    onClick={() =>
                      sendToForensics('document_table', {
                        sourceCardId: cardId,
                        sourceLabel: selectedPhoto.caption || 'Foto da Galeria',
                        assetType: 'image',
                        url: selectedPhoto.url,
                      })
                    }
                  >
                    <Flashlight size={13} /> Abrir na Mesa de Luz / UV
                  </button>
                  {cardId && investigationId && (
                    <button
                      type="button"
                      className="phone-forensic-action phone-compact-btn"
                      onClick={() =>
                        setPendingPinTarget({
                          app: 'gallery',
                          itemId: selectedPhoto.id,
                          label: selectedPhoto.caption || 'Foto da Galeria',
                        })
                      }
                    >
                      <Pin size={13} /> Marcar Foto
                    </button>
                  )}
                </div>
              </div>
            )}

            {activeApp === 'notes' && !selectedNote && (
              <div className="pv-list-body phone-scroll phone-chat-bg">
                {resolvedDevice.notes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="pv-list-card"
                    onClick={() => setSelectedNote(n)}
                  >
                    <div className="pv-avatar" style={{ width: 32, height: 32, color: '#fcd34d' }}>
                      {n.isLocked && !unlockedNoteIds.has(n.id) ? <Lock size={14} /> : <FileText size={14} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong className="pv-list-title">{n.title}</strong>
                      <span className="pv-list-sub">
                        {n.isLocked && !unlockedNoteIds.has(n.id) ? 'Nota protegida por senha' : n.body.slice(0, 32)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'notes' && selectedNote && (
              <div className="phone-note-detail pv-detail-body phone-scroll phone-chat-bg">
                <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f4f4f5' }}>
                  {selectedNote.title}
                </h4>
                {selectedNote.isLocked && !unlockedNoteIds.has(selectedNote.id) ? (
                  <div className="phone-note-lock">
                    <p>{selectedNote.hint || 'Digite a senha desta nota'}</p>
                    <input
                      type="text"
                      value={notePasswordInput}
                      onChange={(e) => setNotePasswordInput(e.target.value)}
                      placeholder="Senha..."
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const pwd = notePasswordInput.trim();
                        if (selectedNote.encryptedPayload) {
                          const plain = await decryptNoteBody(selectedNote.encryptedPayload, pwd);
                          if (plain !== null) {
                            setDecryptedNoteBodies((prev) => ({ ...prev, [selectedNote.id]: plain }));
                            setUnlockedNoteIds((s) => new Set(s).add(selectedNote.id));
                          }
                        } else if (pwd === (selectedNote.password || '').trim()) {
                          setUnlockedNoteIds((s) => new Set(s).add(selectedNote.id));
                        }
                      }}
                    >
                      Desbloquear Nota
                    </button>
                    {investigationId && (
                      <div style={{ marginTop: 4 }}>
                        <TeamFindingsPopover onSelectValue={(val) => setNotePasswordInput(val)} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="phone-note-body">
                      {decryptedNoteBodies[selectedNote.id] ?? selectedNote.body}
                    </p>
                    {cardId && investigationId && (
                      <button
                        type="button"
                        className="phone-forensic-chip phone-compact-btn"
                        onClick={() =>
                          setPendingPinTarget({
                            app: 'notes',
                            itemId: selectedNote.id,
                            label: selectedNote.title,
                          })
                        }
                      >
                        <Pin size={11} /> Marcar Nota
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {activeApp === 'voicemails' && (
              <div className="pv-list-body phone-scroll phone-chat-bg">
                {resolvedDevice.voicemails.map((vm) => (
                  <div
                    key={vm.id}
                    className="pv-list-card pv-list-card--static"
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <strong className="pv-list-title">{vm.caller}</strong>
                      <span className="pv-list-sub">
                        {vm.date} • {vm.duration}
                      </span>
                    </div>
                    <button
                      type="button"
                      className="phone-forensic-chip phone-compact-btn"
                      style={{ flexShrink: 0, marginTop: 0 }}
                      onClick={() =>
                        sendToForensics('acoustic_workbench', {
                          sourceCardId: cardId,
                          sourceLabel: `Gravação: ${vm.caller}`,
                          assetType: 'audio',
                          url: vm.audioUrl,
                        })
                      }
                    >
                      <Radio size={12} /> Enviar para Bancada Acústica
                    </button>
                  </div>
                ))}
              </div>
            )}

            {activeApp === 'trash' && (
              <div className="pv-list-body phone-scroll phone-chat-bg">
                {!trashUnlocked ? (
                  <div className="phone-note-lock">
                    <p>Backup Corrompido protegido. Insira o código:</p>
                    <input
                      type="text"
                      value={trashPin}
                      onChange={(e) => setTrashPin(e.target.value)}
                      placeholder="Código..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (trashPin.trim() === (resolvedDevice.trashUnlockCode || '').trim()) {
                          setTrashUnlocked(true);
                        }
                      }}
                    >
                      Acessar Lixeira
                    </button>
                    {investigationId && (
                      <div style={{ marginTop: 4 }}>
                        <TeamFindingsPopover onSelectValue={(val) => setTrashPin(val)} />
                      </div>
                    )}
                  </div>
                ) : (
                  resolvedDevice.trash.map((item) => (
                    <div
                      key={item.id}
                      className="pv-list-card pv-list-card--static"
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <strong className="pv-list-title">{item.label}</strong>
                        <span className="pv-list-sub" style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                          {restoredTrashIds.has(item.id) ? item.preview : '[Arquivo apagado — clique para restaurar]'}
                        </span>
                      </div>
                      {!restoredTrashIds.has(item.id) && (
                        <button
                          type="button"
                          className="phone-forensic-chip phone-compact-btn"
                          style={{ flexShrink: 0, marginTop: 0 }}
                          onClick={() => setRestoredTrashIds((s) => new Set(s).add(item.id))}
                        >
                          <RotateCcw size={12} /> Restaurar
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        {/* Barra Inferior do Celular (Modo Somente Leitura + Home Bar) */}
        <div className="phone-footer pv-footer">
          <div className="pv-footer-pill">
            <Lock size={11} style={{ flexShrink: 0, color: '#71717a' }} />
            <span>Modo Somente Leitura • Extração C.R.I.S.</span>
          </div>
          <div className="pv-home-bar" aria-hidden="true" />
        </div>

        {/* Compositor de marcador em overlay interno para não deslocar o aparelho */}
        {pendingPinTarget && cardId && (
          <div
            className="pv-pin-overlay"
            onClick={() => setPendingPinTarget(null)}
          >
            <div style={{ width: '100%' }} onClick={(e) => e.stopPropagation()}>
              <PinNoteComposer
                title="Marcar Evidência no Celular"
                subtitle={pendingPinTarget.label}
                onSubmitPin={async (tag, note) => {
                  await createPin({
                    cardId,
                    toolType: 'phone',
                    anchorData: pendingPinTarget,
                    tag,
                    note,
                  });
                }}
                onSubmitFinding={async (category, label, details) => {
                  await addFinding({
                    category,
                    label,
                    details,
                    sourceCardId: cardId,
                    sourceTool: 'phone',
                    sourceAnchor: pendingPinTarget,
                  });
                }}
                onCancel={() => setPendingPinTarget(null)}
              />
            </div>
          </div>
        )}
      </div>

      {!hideInlinePinList && cardId && investigationId && (
        <div className="pv-pin-list-wrap">
          <PinListBar
            pins={phonePins}
            showPins={effectiveShowPins}
            onToggleShowPins={handleToggleShowPins}
            onSelectPin={(pin: CasePin) => jumpToPhoneAnchor(pin.anchor_data as PhonePinAnchor)}
            renderAnchorSummary={renderPinAnchorSummary}
          />
        </div>
      )}
    </div>
  );
}
