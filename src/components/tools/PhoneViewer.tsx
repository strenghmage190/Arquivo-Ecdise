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
import { PhonePinAnchor } from '../../types/collaboration';
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

  useEffect(() => {
    if (!pendingAnchorJump || !cardId) return;
    if (pendingAnchorJump.cardId === cardId && pendingAnchorJump.toolType === 'phone') {
      const a = pendingAnchorJump.anchorData as PhonePinAnchor;
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
      clearAnchorJump();
    }
  }, [pendingAnchorJump, cardId, resolvedDevice.gallery, resolvedDevice.notes, clearAnchorJump]);

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

  return (
    <div className="phone-mockup-wrapper">
      <div className={`nexus-phone-mockup ${fullscreen ? 'fullscreen' : ''} ${!unlocked ? 'locked' : ''}`}>
        <div className="phone-notch" />
        <div className="status-bar">
          <span>{currentTime}</span>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => openFieldManual('device')}
              style={{ background: 'none', border: 'none', color: '#00f3ff', cursor: 'pointer', padding: 0 }}
              title="Manual de Extração Móvel"
            >
              <BookOpen size={12} />
            </button>
            <span>ORDO-OS</span>
            <span>84%</span>
          </div>
        </div>

        {!unlocked && resolvedDevice.lockScreen.code ? (
          <div className="chat-body locked-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ marginBottom: 20, textAlign: 'center' }}>
              <Lock className="lucide-icon inline-icon" size={28} />
              <h3 style={{ margin: '8px 0 4px', color: '#fff', fontSize: 15 }}>Acesso Restrito</h3>
              <p style={{ color: '#888', fontSize: 11, margin: 0 }}>
                {resolvedDevice.lockScreen.smudgeHints && resolvedDevice.lockScreen.smudgeHints.length > 0
                  ? 'Marcas de gordura visíveis em algumas teclas.'
                  : 'Insira as credenciais do aparelho.'}
              </p>
            </div>

            {resolvedDevice.lockScreen.type === 'pattern' ? (
              <PatternLock
                code={resolvedDevice.lockScreen.code}
                onUnlock={() => setUnlocked(true)}
              />
            ) : (
              <NumericKeypad
                code={resolvedDevice.lockScreen.code}
                smudgeHints={resolvedDevice.lockScreen.smudgeHints}
                onUnlock={() => setUnlocked(true)}
              />
            )}
            {investigationId && (
              <div style={{ marginTop: 12 }}>
                <TeamFindingsPopover />
              </div>
            )}
          </div>
        ) : activeApp === 'home' ? (
          <div className="phone-home-screen">
            <div className="phone-home-banner">
              <strong>{resolvedDevice.ownerName || 'Dispositivo Extraído'}</strong>
              <span>C.R.I.S. Mobile Forensics</span>
            </div>

            <div className="phone-app-grid">
              {resolvedDevice.enabledApps.messages && (
                <button
                  type="button"
                  className="phone-app-icon"
                  onClick={() => {
                    setActiveApp('messages');
                    if (resolvedDevice.threads.length === 1) {
                      setActiveThreadId(resolvedDevice.threads[0].id);
                    }
                  }}
                >
                  <MessageSquare size={22} />
                  <span>Mensagens ({resolvedDevice.threads.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.gallery && (
                <button type="button" className="phone-app-icon" onClick={() => setActiveApp('gallery')}>
                  <ImageIcon size={22} />
                  <span>Galeria ({resolvedDevice.gallery.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.notes && (
                <button type="button" className="phone-app-icon" onClick={() => setActiveApp('notes')}>
                  <FileText size={22} />
                  <span>Notas ({resolvedDevice.notes.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.voicemails && (
                <button type="button" className="phone-app-icon" onClick={() => setActiveApp('voicemails')}>
                  <Mic size={22} />
                  <span>Gravador ({resolvedDevice.voicemails.length})</span>
                </button>
              )}

              {resolvedDevice.enabledApps.trash && (
                <button type="button" className="phone-app-icon trash" onClick={() => setActiveApp('trash')}>
                  <Trash2 size={22} />
                  <span>Lixeira ({resolvedDevice.trash.length})</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="phone-header">
              <button type="button" aria-label="Voltar" className="phone-nav-btn" onClick={handleBack}>
                <ArrowLeft size={16} />
              </button>
              <div className="contact-info" style={{ marginLeft: 8 }}>
                <div className="contact-name">
                  {activeApp === 'messages'
                    ? activeThread?.contactName || 'Mensagens'
                    : activeApp === 'gallery'
                    ? 'Galeria'
                    : activeApp === 'notes'
                    ? 'Notas'
                    : activeApp === 'voicemails'
                    ? 'Gravador / Caixa Postal'
                    : 'Lixeira / Backup'}
                </div>
                <div className="contact-status">
                  {activeApp === 'messages' && activeThread
                    ? activeThread.contactStatus || 'offline'
                    : 'Extração Forense'}
                </div>
              </div>
            </div>

            {activeApp === 'messages' && !activeThread && (
              <div className="phone-list-body">
                {resolvedDevice.threads.map((th) => (
                  <button
                    key={th.id}
                    type="button"
                    className="phone-thread-row"
                    onClick={() => setActiveThreadId(th.id)}
                  >
                    <div className="contact-avatar">{th.contactName[0]?.toUpperCase() || '?'}</div>
                    <div className="phone-thread-meta">
                      <strong>{th.contactName}</strong>
                      <span>{th.messages[th.messages.length - 1]?.text || 'Sem mensagens'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'messages' && activeThread && (
              <div className="chat-body" ref={chatBodyRef}>
                {activeThread.messages.map((msg) => {
                  const isMe = msg.sender === 'me';
                  const isRestored = restoredMessageIds.has(msg.id);
                  const msgPins = (cardId && pinsByCardId[cardId] ? pinsByCardId[cardId] : []).filter(
                    (p) => !p.is_resolved && p.tool_type === 'phone' && (p.anchor_data as PhonePinAnchor).itemId === msg.id
                  );
                  const isPinned = msgPins.length > 0 || highlightedItemId === msg.id;
                  return (
                    <div
                      key={msg.id}
                      className={`nexus-bubble ${isMe ? 'sent' : 'received'}`}
                      style={
                        isPinned
                          ? { outline: '2px solid #f59e0b', background: 'rgba(245, 158, 11, 0.14)' }
                          : undefined
                      }
                    >
                      {msg.mediaUrl && msg.type === 'image' && (
                        <div className="phone-media-wrap">
                          <img src={msg.mediaUrl} alt="anexo" className="chat-image" loading="lazy" />
                          <button
                            type="button"
                            className="phone-forensic-chip"
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
                          className="phone-forensic-chip"
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
                          <span>⚠ Mensagem apagada</span>
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
                        <span className="msg-text">{isRestored ? msg.restorableText : msg.text}</span>
                      )}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span className="msg-time">{msg.time || currentTime}</span>
                        {cardId && investigationId && (
                          <button
                            type="button"
                            className="phone-forensic-chip"
                            style={{ padding: '1px 5px', fontSize: '0.65rem' }}
                            title="Marcar evidência ou salvar na Gaveta"
                            onClick={() =>
                              setPendingPinTarget({
                                app: 'messages',
                                threadId: activeThread.id,
                                itemId: msg.id,
                                label: msg.text?.slice(0, 40) || 'Mensagem',
                              })
                            }
                          >
                            <Pin size={10} /> {msgPins.length > 0 ? msgPins.length : 'Marcar'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeApp === 'gallery' && !selectedPhoto && (
              <div className="phone-gallery-grid">
                {resolvedDevice.gallery.map((photo) => (
                  <button
                    key={photo.id}
                    type="button"
                    className="phone-gallery-thumb"
                    onClick={() => setSelectedPhoto(photo)}
                  >
                    <img src={photo.url} alt={photo.caption || 'Foto'} />
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'gallery' && selectedPhoto && (
              <div className="phone-photo-detail">
                <img src={selectedPhoto.url} alt={selectedPhoto.caption || 'Foto'} />
                {selectedPhoto.caption && <p className="phone-photo-cap">{selectedPhoto.caption}</p>}
                {selectedPhoto.exif && (
                  <div className="phone-exif-box">
                    <div><Clock size={12} /> {selectedPhoto.exif.date || '--'} {selectedPhoto.exif.time || ''}</div>
                    <div><Camera size={12} /> {selectedPhoto.exif.camera || 'Sensor desconhecido'}</div>
                    <div><MapPin size={12} /> {selectedPhoto.exif.gps || 'Sem GPS'}</div>
                    {selectedPhoto.exif.locationNote && <small>{selectedPhoto.exif.locationNote}</small>}
                  </div>
                )}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                  <button
                    type="button"
                    className="phone-forensic-action"
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
                      className="phone-forensic-action"
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
              <div className="phone-list-body">
                {resolvedDevice.notes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="phone-thread-row"
                    onClick={() => setSelectedNote(n)}
                  >
                    <div className="contact-avatar">
                      {n.isLocked && !unlockedNoteIds.has(n.id) ? <Lock size={14} /> : <FileText size={14} />}
                    </div>
                    <div className="phone-thread-meta">
                      <strong>{n.title}</strong>
                      <span>{n.isLocked && !unlockedNoteIds.has(n.id) ? 'Nota protegida por senha' : n.body.slice(0, 32)}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'notes' && selectedNote && (
              <div className="phone-note-detail">
                <h4>{selectedNote.title}</h4>
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
                      <div style={{ marginTop: 8 }}>
                        <TeamFindingsPopover onSelectValue={(val) => setNotePasswordInput(val)} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="phone-note-body">{decryptedNoteBodies[selectedNote.id] ?? selectedNote.body}</p>
                    {cardId && investigationId && (
                      <button
                        type="button"
                        className="phone-forensic-chip"
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
              <div className="phone-list-body">
                {resolvedDevice.voicemails.map((vm) => (
                  <div key={vm.id} className="phone-vm-card">
                    <div>
                      <strong>{vm.caller}</strong>
                      <span>{vm.date} • {vm.duration}</span>
                    </div>
                    <button
                      type="button"
                      className="phone-forensic-chip"
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
              <div className="phone-list-body">
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
                      <div style={{ marginTop: 8 }}>
                        <TeamFindingsPopover onSelectValue={(val) => setTrashPin(val)} />
                      </div>
                    )}
                  </div>
                ) : (
                  resolvedDevice.trash.map((item) => (
                    <div key={item.id} className="phone-vm-card">
                      <div>
                        <strong>{item.label}</strong>
                        <span>
                          {restoredTrashIds.has(item.id) ? item.preview : '[Arquivo apagado — clique para restaurar]'}
                        </span>
                      </div>
                      {!restoredTrashIds.has(item.id) && (
                        <button
                          type="button"
                          className="phone-forensic-chip"
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
      </div>

      {pendingPinTarget && cardId && (
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
      )}
    </div>
  );
}
