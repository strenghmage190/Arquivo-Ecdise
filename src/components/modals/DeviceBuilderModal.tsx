import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  Save,
  Smartphone,
  Image as ImageIcon,
  FileText,
  Mic,
  Trash2,
  Lock,
  Plus,
  Upload,
  MessageSquare,
  RotateCcw,
} from 'lucide-react';
import { nanoid } from 'nanoid';
import {
  DeviceExtractionMetadata,
  DeviceGalleryItem,
  DeviceMessage,
  DeviceNoteItem,
  DeviceThread,
  DeviceVoicemailItem,
  DeviceTrashItem,
} from '../../types/forensicPillars';
import { encryptNoteBody } from '../../utils/webCryptoLock';
import { uploadInvestigationImage, uploadInvestigationFile } from '../../utils/storage';
import { toast } from 'sonner';
import './DeviceBuilderModal.css';

export interface BasePhoneStateInput {
  hasKeypad: boolean;
  lockType: 'pin' | 'pattern';
  password: string;
  contactName: string;
  chatList: any[];
}

export interface DeviceBuilderPanelProps {
  investigationId?: string;
  initialDevice?: DeviceExtractionMetadata | null;
  basePhoneState: BasePhoneStateInput;
  inline?: boolean;
  onChange?: (device: DeviceExtractionMetadata) => void;
  onSave?: (device: DeviceExtractionMetadata) => void;
  onClose?: () => void;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  investigationId?: string;
  initialDevice?: DeviceExtractionMetadata | null;
  basePhoneState: BasePhoneStateInput;
  onSave: (device: DeviceExtractionMetadata) => void;
}

type BuilderTab = 'lock' | 'threads' | 'gallery' | 'notes' | 'voicemails' | 'trash';

function isBlobUrl(url: string | undefined | null): boolean {
  return typeof url === 'string' && url.trim().toLowerCase().startsWith('blob:');
}

function buildInitialThreads(
  initialDevice: DeviceExtractionMetadata | null | undefined,
  basePhoneState: BasePhoneStateInput
): DeviceThread[] {
  if (initialDevice?.threads && initialDevice.threads.length > 0) {
    return initialDevice.threads;
  }
  const legacyMessages: DeviceMessage[] = (basePhoneState.chatList || []).map((m, idx) => ({
    id: m.id || `msg-${idx}`,
    sender: (m.sender === 'me' || m.sender === 'eu' ? 'me' : m.sender === 'system' ? 'system' : 'them') as
      | 'me'
      | 'them'
      | 'system',
    type: (m.image_url ? 'image' : 'text') as 'image' | 'text',
    text: m.text || '',
    mediaUrl: isBlobUrl(m.image_url) ? undefined : m.image_url,
    time: m.time || '12:00',
  }));
  return [
    {
      id: 'main',
      contactName: basePhoneState.contactName || 'Contato Principal',
      contactStatus: 'online',
      messages: legacyMessages,
    },
  ];
}

export function DeviceBuilderPanel({
  investigationId,
  initialDevice,
  basePhoneState,
  inline = false,
  onChange,
  onSave,
  onClose,
}: DeviceBuilderPanelProps) {
  const [tab, setTab] = useState<BuilderTab>('lock');

  const [ownerName, setOwnerName] = useState(
    () => initialDevice?.ownerName || basePhoneState.contactName || 'Dispositivo Apreendido'
  );
  const [lockEnabled, setLockEnabled] = useState<boolean>(
    () => initialDevice?.lockScreen?.enabled ?? Boolean(basePhoneState.hasKeypad)
  );
  const [lockType, setLockType] = useState<'pin' | 'pattern'>(
    () => initialDevice?.lockScreen?.type || basePhoneState.lockType || 'pin'
  );
  const [lockCode, setLockCode] = useState<string>(
    () => initialDevice?.lockScreen?.code ?? basePhoneState.password ?? ''
  );
  const [smudgeHints, setSmudgeHints] = useState<string[]>(
    () => initialDevice?.lockScreen?.smudgeHints || []
  );
  const [gallery, setGallery] = useState<DeviceGalleryItem[]>(() => initialDevice?.gallery || []);
  const [notes, setNotes] = useState<DeviceNoteItem[]>(() => initialDevice?.notes || []);
  const [voicemails, setVoicemails] = useState<DeviceVoicemailItem[]>(
    () => initialDevice?.voicemails || []
  );
  const [trash, setTrash] = useState<DeviceTrashItem[]>(() => initialDevice?.trash || []);
  const [trashUnlockCode, setTrashUnlockCode] = useState(
    () => initialDevice?.trashUnlockCode || ''
  );
  const [threads, setThreads] = useState<DeviceThread[]>(() =>
    buildInitialThreads(initialDevice, basePhoneState)
  );
  const [activeThreadId, setActiveThreadId] = useState<string>(
    () => buildInitialThreads(initialDevice, basePhoneState)[0]?.id || 'main'
  );

  // Draft inputs
  const [newContactName, setNewContactName] = useState('');
  const [msgSender, setMsgSender] = useState<'me' | 'them' | 'system'>('them');
  const [msgType, setMsgType] = useState<'text' | 'image' | 'audio'>('text');
  const [msgText, setMsgText] = useState('');
  const [msgMediaUrl, setMsgMediaUrl] = useState('');
  const [msgTime, setMsgTime] = useState('22:30');
  const [msgDeleted, setMsgDeleted] = useState(false);
  const [msgRestorable, setMsgRestorable] = useState('');

  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteLocked, setNoteLocked] = useState(false);
  const [notePwd, setNotePwd] = useState('');
  const [noteHint, setNoteHint] = useState('');

  const [galUrl, setGalUrl] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galDate, setGalDate] = useState('');
  const [galGps, setGalGps] = useState('');
  const [galCam, setGalCam] = useState('');

  const [vmCaller, setVmCaller] = useState('');
  const [vmUrl, setVmUrl] = useState('');
  const [vmDuration, setVmDuration] = useState('0:15');

  const [trashLabel, setTrashLabel] = useState('');
  const [trashPreview, setTrashPreview] = useState('');

  // Track last emitted device reference so external hydration (loadExistingCard / resetForm)
  // re-hydrates cleanly without causing an infinite loop on our own onChange updates.
  const lastEmittedRef = useRef<DeviceExtractionMetadata | null | undefined>(initialDevice);

  useEffect(() => {
    if (initialDevice === lastEmittedRef.current) return;
    lastEmittedRef.current = initialDevice;

    setOwnerName(initialDevice?.ownerName || basePhoneState.contactName || 'Dispositivo Apreendido');
    setLockEnabled(initialDevice?.lockScreen?.enabled ?? Boolean(basePhoneState.hasKeypad));
    setLockType(initialDevice?.lockScreen?.type || basePhoneState.lockType || 'pin');
    setLockCode(initialDevice?.lockScreen?.code ?? basePhoneState.password ?? '');
    setSmudgeHints(initialDevice?.lockScreen?.smudgeHints || []);
    setGallery(initialDevice?.gallery || []);
    setNotes(initialDevice?.notes || []);
    setVoicemails(initialDevice?.voicemails || []);
    setTrash(initialDevice?.trash || []);
    setTrashUnlockCode(initialDevice?.trashUnlockCode || '');
    const hydratedThreads = buildInitialThreads(initialDevice, basePhoneState);
    setThreads(hydratedThreads);
    setActiveThreadId(hydratedThreads[0]?.id || 'main');
  }, [initialDevice, basePhoneState]);

  const buildSnapshot = useCallback(
    (overrides?: Partial<{
      ownerName: string;
      lockEnabled: boolean;
      lockType: 'pin' | 'pattern';
      lockCode: string;
      smudgeHints: string[];
      threads: DeviceThread[];
      gallery: DeviceGalleryItem[];
      notes: DeviceNoteItem[];
      voicemails: DeviceVoicemailItem[];
      trash: DeviceTrashItem[];
      trashUnlockCode: string;
    }>): DeviceExtractionMetadata => {
      const nextOwner = overrides?.ownerName ?? ownerName;
      const nextLockEnabled = overrides?.lockEnabled ?? lockEnabled;
      const nextLockType = overrides?.lockType ?? lockType;
      const nextLockCode = overrides?.lockCode ?? lockCode;
      const nextSmudges = overrides?.smudgeHints ?? smudgeHints;
      const nextThreads = overrides?.threads ?? threads;
      const nextGallery = overrides?.gallery ?? gallery;
      const nextNotes = overrides?.notes ?? notes;
      const nextVoicemails = overrides?.voicemails ?? voicemails;
      const nextTrash = overrides?.trash ?? trash;
      const nextTrashCode = overrides?.trashUnlockCode ?? trashUnlockCode;

      return {
        version: 2,
        ownerName: nextOwner,
        lockScreen: {
          enabled: Boolean(nextLockEnabled && nextLockCode.trim()),
          type: nextLockType,
          code: nextLockCode,
          smudgeHints: nextSmudges,
        },
        enabledApps: {
          messages: true,
          gallery: nextGallery.length > 0,
          notes: nextNotes.length > 0,
          voicemails: nextVoicemails.length > 0,
          trash: nextTrash.length > 0,
        },
        trashUnlockCode: nextTrashCode.trim() || undefined,
        threads: nextThreads,
        gallery: nextGallery,
        notes: nextNotes,
        voicemails: nextVoicemails,
        trash: nextTrash,
      };
    },
    [
      ownerName,
      lockEnabled,
      lockType,
      lockCode,
      smudgeHints,
      threads,
      gallery,
      notes,
      voicemails,
      trash,
      trashUnlockCode,
    ]
  );

  const emitChange = useCallback(
    (overrides?: Parameters<typeof buildSnapshot>[0]) => {
      if (!onChange) return;
      const snap = buildSnapshot(overrides);
      lastEmittedRef.current = snap;
      onChange(snap);
    },
    [buildSnapshot, onChange]
  );

  const rejectIfBlob = (url: string): boolean => {
    if (isBlobUrl(url)) {
      toast.error('URL temporária blob: não pode ser salva. Envie o arquivo para o Storage ou use URL https://.');
      return true;
    }
    return false;
  };

  const toggleSmudge = (digit: string) => {
    const next = smudgeHints.includes(digit)
      ? smudgeHints.filter((d) => d !== digit)
      : [...smudgeHints, digit];
    setSmudgeHints(next);
    emitChange({ smudgeHints: next });
  };

  const handleAddNote = async () => {
    if (!noteTitle.trim()) return;
    let encryptedPayload = undefined;
    let storedBody = noteBody;
    let storedPassword = notePwd;

    if (noteLocked && notePwd.trim()) {
      const enc = await encryptNoteBody(noteBody, notePwd.trim());
      if (enc) {
        encryptedPayload = enc;
        storedBody = '';
        storedPassword = '';
      }
    }

    const nextNotes: DeviceNoteItem[] = [
      ...notes,
      {
        id: nanoid(8),
        title: noteTitle.trim(),
        body: storedBody,
        isLocked: noteLocked,
        password: storedPassword || undefined,
        hint: noteHint.trim() || undefined,
        encryptedPayload,
      },
    ];
    setNotes(nextNotes);
    emitChange({ notes: nextNotes });
    setNoteTitle('');
    setNoteBody('');
    setNotePwd('');
    setNoteHint('');
    setNoteLocked(false);
    toast.success(encryptedPayload ? 'Nota criptografada com AES-GCM!' : 'Nota adicionada!');
  };

  const handleUploadGalleryFile = async (file: File | null) => {
    if (!file) return;
    try {
      const folderId = investigationId || 'device_gallery';
      const url = await uploadInvestigationImage(file, folderId);
      if (!url || isBlobUrl(url)) throw new Error('URL inválida');
      setGalUrl(url);
      toast.success('Foto enviada para o Storage.');
    } catch {
      toast.error('Falha ao enviar foto para o Storage. Tente novamente.');
    }
  };

  const handleUploadVmFile = async (file: File | null) => {
    if (!file) return;
    try {
      const folderId = investigationId || 'device_voicemails';
      const url = await uploadInvestigationFile(file, folderId, 'voicemails');
      if (!url || isBlobUrl(url)) throw new Error('URL inválida');
      setVmUrl(url);
      toast.success('Áudio enviado para o Storage.');
    } catch {
      toast.error('Falha ao enviar áudio para o Storage. Tente novamente.');
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId) || threads[0] || null;

  return (
    <div className={inline ? 'dbm-inline' : 'dbm-dialog'} onClick={(e) => e.stopPropagation()}>
      {!inline && (
        <header className="dbm-header">
          <div className="dbm-title">
            <Smartphone size={17} />
            <div>
              <h2>EXTRATOR FORENSE DE CELULAR</h2>
              <span>Bloqueio, Conversas, Galeria EXIF, Notas AES-GCM, Gravador &amp; Lixeira</span>
            </div>
          </div>
          {onClose && (
            <button type="button" className="dbm-close" onClick={onClose} aria-label="Fechar">
              <X size={18} />
            </button>
          )}
        </header>
      )}

      <nav className="dbm-tabs">
        <button type="button" className={tab === 'lock' ? 'active' : ''} onClick={() => setTab('lock')}>
          <Lock size={13} /> Bloqueio &amp; Dedos
        </button>
        <button type="button" className={tab === 'threads' ? 'active' : ''} onClick={() => setTab('threads')}>
          <MessageSquare size={13} /> Conversas ({threads.length})
        </button>
        <button type="button" className={tab === 'gallery' ? 'active' : ''} onClick={() => setTab('gallery')}>
          <ImageIcon size={13} /> Galeria ({gallery.length})
        </button>
        <button type="button" className={tab === 'notes' ? 'active' : ''} onClick={() => setTab('notes')}>
          <FileText size={13} /> Notas ({notes.length})
        </button>
        <button type="button" className={tab === 'voicemails' ? 'active' : ''} onClick={() => setTab('voicemails')}>
          <Mic size={13} /> Gravador ({voicemails.length})
        </button>
        <button type="button" className={tab === 'trash' ? 'active' : ''} onClick={() => setTab('trash')}>
          <Trash2 size={13} /> Lixeira ({trash.length})
        </button>
      </nav>

      <div className="dbm-body">
        {tab === 'lock' && (
          <div className="dbm-stack">
            <label className="dbm-field">
              <span>Nome do Dono do Aparelho</span>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => {
                  const val = e.target.value;
                  setOwnerName(val);
                  emitChange({ ownerName: val });
                }}
              />
            </label>

            <label className="dbm-check">
              <input
                type="checkbox"
                checked={lockEnabled}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setLockEnabled(checked);
                  emitChange({ lockEnabled: checked });
                }}
              />
              Exigir senha / padrão na tela de bloqueio
            </label>

            {lockEnabled && (
              <div className="dbm-grid">
                <label className="dbm-field">
                  <span>Tipo de Bloqueio</span>
                  <select
                    value={lockType}
                    onChange={(e) => {
                      const val = e.target.value as 'pin' | 'pattern';
                      setLockType(val);
                      emitChange({ lockType: val });
                    }}
                  >
                    <option value="pin">PIN Numérico</option>
                    <option value="pattern">Padrão (3x3)</option>
                  </select>
                </label>
                <label className="dbm-field">
                  <span>{lockType === 'pin' ? 'PIN (ex: 1994)' : 'Sequência (ex: 1-2-3-6-9)'}</span>
                  <input
                    type="text"
                    value={lockCode}
                    maxLength={lockType === 'pin' ? 8 : undefined}
                    onChange={(e) => {
                      const val = e.target.value;
                      setLockCode(val);
                      emitChange({ lockCode: val });
                    }}
                    placeholder={lockType === 'pin' ? '1234' : '1-2-3-6-9'}
                  />
                </label>
              </div>
            )}

            <div className="dbm-field">
              <span>Marcas de Gordura / Dedo nas Teclas (Dica Visual)</span>
              <div className="dbm-digit-grid">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0'].map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={smudgeHints.includes(d) ? 'active' : ''}
                    onClick={() => toggleSmudge(d)}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'threads' && (
          <div className="dbm-stack">
            <div className="dbm-grid">
              <input
                type="text"
                placeholder="Novo contato ou grupo (ex: Joui)"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
              <button
                type="button"
                className="dbm-add-btn"
                onClick={() => {
                  if (!newContactName.trim()) return;
                  const id = nanoid(6);
                  const nextThreads: DeviceThread[] = [
                    ...threads,
                    { id, contactName: newContactName.trim(), contactStatus: 'online', messages: [] },
                  ];
                  setThreads(nextThreads);
                  setActiveThreadId(id);
                  setNewContactName('');
                  emitChange({ threads: nextThreads });
                }}
              >
                <Plus size={14} /> Criar Conversa
              </button>
            </div>

            <div className="dbm-tabs" style={{ padding: 0, background: 'transparent', border: 'none' }}>
              {threads.map((th) => (
                <button
                  key={th.id}
                  type="button"
                  className={activeThread?.id === th.id ? 'active' : ''}
                  onClick={() => setActiveThreadId(th.id)}
                >
                  {th.contactName} ({th.messages.length})
                </button>
              ))}
            </div>

            {activeThread && (
              <div className="dbm-grid">
                <input
                  type="text"
                  value={activeThread.contactName}
                  onChange={(e) => {
                    const name = e.target.value;
                    const nextThreads = threads.map((th) =>
                      th.id === activeThread.id ? { ...th, contactName: name } : th
                    );
                    setThreads(nextThreads);
                    emitChange({ threads: nextThreads });
                  }}
                  placeholder="Nome do contato da conversa ativa"
                />
                {threads.length > 1 && (
                  <button
                    type="button"
                    className="dbm-cancel"
                    onClick={() => {
                      const nextThreads = threads.filter((th) => th.id !== activeThread.id);
                      setThreads(nextThreads);
                      setActiveThreadId(nextThreads[0]?.id || '');
                      emitChange({ threads: nextThreads });
                    }}
                  >
                    Remover Conversa
                  </button>
                )}
              </div>
            )}

            <div className="dbm-grid">
              <select
                value={msgSender}
                onChange={(e) => setMsgSender(e.target.value as 'me' | 'them' | 'system')}
              >
                <option value="them">Contato</option>
                <option value="me">Dono do Celular</option>
                <option value="system">Sistema</option>
              </select>
              <select
                value={msgType}
                onChange={(e) => setMsgType(e.target.value as 'text' | 'image' | 'audio')}
              >
                <option value="text">Texto</option>
                <option value="image">Imagem</option>
                <option value="audio">Áudio</option>
              </select>
              <input
                type="time"
                value={msgTime}
                onChange={(e) => setMsgTime(e.target.value)}
              />
            </div>

            <input
              type="text"
              placeholder="Texto da mensagem..."
              value={msgText}
              onChange={(e) => setMsgText(e.target.value)}
            />

            {msgType !== 'text' && (
              <div className="dbm-grid">
                <label className="dbm-upload">
                  <Upload size={14} /> Subir {msgType === 'image' ? 'Foto' : 'Áudio'}
                  <input
                    type="file"
                    accept={msgType === 'image' ? 'image/*' : 'audio/*'}
                    hidden
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      try {
                        const folderId = investigationId || 'device_chat';
                        const url =
                          msgType === 'image'
                            ? await uploadInvestigationImage(f, folderId)
                            : await uploadInvestigationFile(f, folderId, 'chat_audio');
                        if (!url || isBlobUrl(url)) throw new Error('URL inválida');
                        setMsgMediaUrl(url);
                        toast.success('Anexo enviado para o Storage.');
                      } catch {
                        toast.error('Falha ao enviar anexo para o Storage. Tente novamente.');
                      } finally {
                        e.target.value = '';
                      }
                    }}
                  />
                </label>
                <input
                  type="text"
                  placeholder="ou URL https:// do anexo"
                  value={msgMediaUrl}
                  onChange={(e) => setMsgMediaUrl(e.target.value)}
                />
              </div>
            )}

            <label className="dbm-check">
              <input
                type="checkbox"
                checked={msgDeleted}
                onChange={(e) => setMsgDeleted(e.target.checked)}
              />
              Marcar como Mensagem Apagada (recuperável pelo jogador)
            </label>
            {msgDeleted && (
              <input
                type="text"
                placeholder="Texto revelado ao clicar em Restaurar..."
                value={msgRestorable}
                onChange={(e) => setMsgRestorable(e.target.value)}
              />
            )}

            <button
              type="button"
              className="dbm-add-btn"
              onClick={() => {
                if (!activeThread) return;
                if (msgType !== 'text' && msgMediaUrl.trim() && rejectIfBlob(msgMediaUrl)) {
                  return;
                }
                const newMsg: DeviceMessage = {
                  id: nanoid(8),
                  sender: msgSender,
                  type: msgType,
                  text: msgText,
                  mediaUrl: msgType !== 'text' ? msgMediaUrl.trim() || undefined : undefined,
                  time: msgTime || '22:30',
                  isDeleted: msgDeleted,
                  restorableText: msgDeleted ? msgRestorable || msgText : undefined,
                };
                const nextThreads = threads.map((th) =>
                  th.id === activeThread.id ? { ...th, messages: [...th.messages, newMsg] } : th
                );
                setThreads(nextThreads);
                emitChange({ threads: nextThreads });
                setMsgText('');
                setMsgMediaUrl('');
                setMsgRestorable('');
                setMsgDeleted(false);
              }}
            >
              <Plus size={14} /> Adicionar Mensagem na Conversa
            </button>

            {activeThread && activeThread.messages.length > 0 && (
              <div className="dbm-list">
                {activeThread.messages.map((m) => (
                  <div key={m.id} className="dbm-item">
                    <div className="dbm-item-meta">
                      <span>
                        <strong>{m.sender === 'me' ? 'Dono' : m.sender === 'system' ? 'Sistema' : activeThread.contactName}</strong>
                        {m.time ? ` (${m.time})` : ''}: {m.isDeleted ? `[Apagada: ${m.restorableText || m.text}]` : m.text || (m.mediaUrl ? '[Mídia]' : '')}
                      </span>
                      {m.mediaUrl && <small>{m.mediaUrl.slice(0, 48)}</small>}
                    </div>
                    <button
                      type="button"
                      title="Toggle apagada"
                      style={{ color: 'var(--ccm-text-muted)' }}
                      onClick={() => {
                        const nextThreads = threads.map((th) =>
                          th.id === activeThread.id
                            ? {
                                ...th,
                                messages: th.messages.map((item) =>
                                  item.id === m.id
                                    ? {
                                        ...item,
                                        isDeleted: !item.isDeleted,
                                        restorableText: !item.isDeleted
                                          ? item.restorableText || item.text
                                          : item.restorableText,
                                      }
                                    : item
                                ),
                              }
                            : th
                        );
                        setThreads(nextThreads);
                        emitChange({ threads: nextThreads });
                      }}
                    >
                      <RotateCcw size={13} />
                    </button>
                    <button
                      type="button"
                      title="Excluir mensagem"
                      onClick={() => {
                        const nextThreads = threads.map((th) =>
                          th.id === activeThread.id
                            ? { ...th, messages: th.messages.filter((item) => item.id !== m.id) }
                            : th
                        );
                        setThreads(nextThreads);
                        emitChange({ threads: nextThreads });
                      }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'gallery' && (
          <div className="dbm-stack">
            <div className="dbm-grid">
              <label className="dbm-upload">
                <Upload size={14} /> Enviar Foto
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={(e) => handleUploadGalleryFile(e.target.files?.[0] || null)}
                />
              </label>
              <input
                type="text"
                placeholder="ou URL https:// da foto"
                value={galUrl}
                onChange={(e) => setGalUrl(e.target.value)}
              />
              <input
                type="text"
                placeholder="Legenda"
                value={galCaption}
                onChange={(e) => setGalCaption(e.target.value)}
              />
              <input
                type="text"
                placeholder="Data EXIF (ex: 12/10/2026 23:40)"
                value={galDate}
                onChange={(e) => setGalDate(e.target.value)}
              />
              <input
                type="text"
                placeholder="GPS EXIF (ex: -23.55, -46.63)"
                value={galGps}
                onChange={(e) => setGalGps(e.target.value)}
              />
              <input
                type="text"
                placeholder="Câmera (ex: iPhone 14)"
                value={galCam}
                onChange={(e) => setGalCam(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="dbm-add-btn"
              onClick={() => {
                if (!galUrl.trim() || rejectIfBlob(galUrl)) return;
                const nextGallery: DeviceGalleryItem[] = [
                  ...gallery,
                  {
                    id: nanoid(8),
                    url: galUrl.trim(),
                    caption: galCaption.trim() || undefined,
                    exif: {
                      date: galDate || undefined,
                      gps: galGps || undefined,
                      camera: galCam || undefined,
                    },
                  },
                ];
                setGallery(nextGallery);
                emitChange({ gallery: nextGallery });
                setGalUrl('');
                setGalCaption('');
              }}
            >
              <Plus size={14} /> Adicionar Foto na Galeria
            </button>
            <div className="dbm-list">
              {gallery.map((g) => (
                <div key={g.id} className="dbm-item">
                  <span>
                    {g.caption || g.url.slice(0, 40)} ({g.exif?.gps || 'sem GPS'})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextGallery = gallery.filter((x) => x.id !== g.id);
                      setGallery(nextGallery);
                      emitChange({ gallery: nextGallery });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'notes' && (
          <div className="dbm-stack">
            <input
              type="text"
              placeholder="Título da Nota"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
            />
            <textarea
              rows={3}
              placeholder="Conteúdo da nota..."
              value={noteBody}
              onChange={(e) => setNoteBody(e.target.value)}
            />
            <label className="dbm-check">
              <input
                type="checkbox"
                checked={noteLocked}
                onChange={(e) => setNoteLocked(e.target.checked)}
              />
              Trancar nota com senha (Criptografia AES-GCM no cliente)
            </label>
            {noteLocked && (
              <div className="dbm-grid">
                <input
                  type="text"
                  placeholder="Senha da nota (ex: 1994)"
                  value={notePwd}
                  onChange={(e) => setNotePwd(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Dica (ex: Ano de nascimento)"
                  value={noteHint}
                  onChange={(e) => setNoteHint(e.target.value)}
                />
              </div>
            )}
            <button type="button" className="dbm-add-btn" onClick={handleAddNote}>
              <Plus size={14} /> Adicionar Nota
            </button>
            <div className="dbm-list">
              {notes.map((n) => (
                <div key={n.id} className="dbm-item">
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {n.isLocked && <Lock size={12} />}
                    {n.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextNotes = notes.filter((x) => x.id !== n.id);
                      setNotes(nextNotes);
                      emitChange({ notes: nextNotes });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'voicemails' && (
          <div className="dbm-stack">
            <div className="dbm-grid">
              <input
                type="text"
                placeholder="Origem / Contato"
                value={vmCaller}
                onChange={(e) => setVmCaller(e.target.value)}
              />
              <input
                type="text"
                placeholder="Duração (ex: 0:18)"
                value={vmDuration}
                onChange={(e) => setVmDuration(e.target.value)}
              />
              <label className="dbm-upload">
                <Upload size={14} /> Enviar Áudio
                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={(e) => handleUploadVmFile(e.target.files?.[0] || null)}
                />
              </label>
              <input
                type="text"
                placeholder="ou URL https:// do áudio"
                value={vmUrl}
                onChange={(e) => setVmUrl(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="dbm-add-btn"
              onClick={() => {
                if (!vmUrl.trim() || rejectIfBlob(vmUrl)) return;
                const nextVoicemails: DeviceVoicemailItem[] = [
                  ...voicemails,
                  {
                    id: nanoid(8),
                    caller: vmCaller || 'Desconhecido',
                    duration: vmDuration || '0:15',
                    date: 'Recente',
                    audioUrl: vmUrl.trim(),
                  },
                ];
                setVoicemails(nextVoicemails);
                emitChange({ voicemails: nextVoicemails });
                setVmCaller('');
                setVmUrl('');
              }}
            >
              <Plus size={14} /> Adicionar Gravação
            </button>
            <div className="dbm-list">
              {voicemails.map((v) => (
                <div key={v.id} className="dbm-item">
                  <span>
                    {v.caller} ({v.duration})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextVoicemails = voicemails.filter((x) => x.id !== v.id);
                      setVoicemails(nextVoicemails);
                      emitChange({ voicemails: nextVoicemails });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'trash' && (
          <div className="dbm-stack">
            <label className="dbm-field">
              <span>Código para acessar a Lixeira (opcional — deixe vazio para acesso livre)</span>
              <input
                type="text"
                value={trashUnlockCode}
                onChange={(e) => {
                  const val = e.target.value;
                  setTrashUnlockCode(val);
                  emitChange({ trashUnlockCode: val });
                }}
                placeholder="Ex: ADMIN-99"
              />
            </label>
            <div className="dbm-grid">
              <input
                type="text"
                placeholder="Nome do arquivo apagado"
                value={trashLabel}
                onChange={(e) => setTrashLabel(e.target.value)}
              />
              <input
                type="text"
                placeholder="Texto recuperado ao restaurar"
                value={trashPreview}
                onChange={(e) => setTrashPreview(e.target.value)}
              />
            </div>
            <button
              type="button"
              className="dbm-add-btn"
              onClick={() => {
                if (!trashLabel.trim()) return;
                const nextTrash: DeviceTrashItem[] = [
                  ...trash,
                  {
                    id: nanoid(8),
                    kind: 'note',
                    label: trashLabel.trim(),
                    preview: trashPreview.trim() || 'Conteúdo recuperado',
                  },
                ];
                setTrash(nextTrash);
                emitChange({ trash: nextTrash });
                setTrashLabel('');
                setTrashPreview('');
              }}
            >
              <Plus size={14} /> Adicionar Item na Lixeira
            </button>
            <div className="dbm-list">
              {trash.map((t) => (
                <div key={t.id} className="dbm-item">
                  <span>{t.label}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const nextTrash = trash.filter((x) => x.id !== t.id);
                      setTrash(nextTrash);
                      emitChange({ trash: nextTrash });
                    }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {!inline && onSave && (
        <footer className="dbm-footer">
          {onClose && (
            <button type="button" className="dbm-cancel" onClick={onClose}>
              Cancelar
            </button>
          )}
          <button
            type="button"
            className="dbm-save"
            onClick={() => {
              onSave(buildSnapshot());
              onClose?.();
            }}
          >
            <Save size={14} /> Salvar Aparelho na Pista
          </button>
        </footer>
      )}
    </div>
  );
}

export default function DeviceBuilderModal({
  isOpen,
  onClose,
  investigationId,
  initialDevice,
  basePhoneState,
  onSave,
}: ModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="dbm-backdrop" onClick={onClose}>
      <DeviceBuilderPanel
        investigationId={investigationId}
        initialDevice={initialDevice}
        basePhoneState={basePhoneState}
        onSave={onSave}
        onClose={onClose}
      />
    </div>,
    document.body
  );
}
