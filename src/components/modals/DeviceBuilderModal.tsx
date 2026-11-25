import React, { useState } from 'react';
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

interface Props {
  isOpen: boolean;
  onClose: () => void;
  investigationId?: string;
  initialDevice?: DeviceExtractionMetadata | null;
  basePhoneState: {
    hasKeypad: boolean;
    lockType: 'pin' | 'pattern';
    password: string;
    contactName: string;
    chatList: any[];
  };
  onSave: (device: DeviceExtractionMetadata) => void;
}

type BuilderTab = 'lock' | 'threads' | 'gallery' | 'notes' | 'voicemails' | 'trash';

export default function DeviceBuilderModal({
  isOpen,
  onClose,
  investigationId,
  initialDevice,
  basePhoneState,
  onSave,
}: Props) {
  const [tab, setTab] = useState<BuilderTab>('lock');
  const [ownerName, setOwnerName] = useState(
    () => initialDevice?.ownerName || basePhoneState.contactName || 'Dispositivo Apreendido'
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
  const [threads, setThreads] = useState<DeviceThread[]>(() => {
    if (initialDevice?.threads && initialDevice.threads.length > 0) {
      return initialDevice.threads;
    }
    const legacyMessages: DeviceMessage[] = (basePhoneState.chatList || []).map((m, idx) => ({
      id: m.id || `msg-${idx}`,
      sender: (m.sender === 'me' || m.sender === 'eu' ? 'me' : 'them') as 'me' | 'them',
      type: (m.image_url ? 'image' : 'text') as 'image' | 'text',
      text: m.text || '',
      mediaUrl: m.image_url,
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
  });
  const [activeThreadId, setActiveThreadId] = useState<string>(() => threads[0]?.id || 'main');
  const [newContactName, setNewContactName] = useState('');
  const [msgSender, setMsgSender] = useState<'me' | 'them'>('them');
  const [msgType, setMsgType] = useState<'text' | 'image' | 'audio'>('text');
  const [msgText, setMsgText] = useState('');
  const [msgMediaUrl, setMsgMediaUrl] = useState('');
  const [msgDeleted, setMsgDeleted] = useState(false);
  const [msgRestorable, setMsgRestorable] = useState('');

  // New note draft
  const [noteTitle, setNoteTitle] = useState('');
  const [noteBody, setNoteBody] = useState('');
  const [noteLocked, setNoteLocked] = useState(false);
  const [notePwd, setNotePwd] = useState('');
  const [noteHint, setNoteHint] = useState('');

  // New gallery draft
  const [galUrl, setGalUrl] = useState('');
  const [galCaption, setGalCaption] = useState('');
  const [galDate, setGalDate] = useState('');
  const [galGps, setGalGps] = useState('');
  const [galCam, setGalCam] = useState('');

  // New voicemail draft
  const [vmCaller, setVmCaller] = useState('');
  const [vmUrl, setVmUrl] = useState('');
  const [vmDuration, setVmDuration] = useState('0:15');

  // New trash draft
  const [trashLabel, setTrashLabel] = useState('');
  const [trashPreview, setTrashPreview] = useState('');

  if (!isOpen) return null;

  const toggleSmudge = (digit: string) => {
    setSmudgeHints((prev) =>
      prev.includes(digit) ? prev.filter((d) => d !== digit) : [...prev, digit]
    );
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
        storedBody = ''; // Never store plaintext when encrypted
        storedPassword = ''; // Never store plaintext password
      }
    }

    setNotes((prev) => [
      ...prev,
      {
        id: nanoid(8),
        title: noteTitle.trim(),
        body: storedBody,
        isLocked: noteLocked,
        password: storedPassword || undefined,
        hint: noteHint.trim() || undefined,
        encryptedPayload,
      },
    ]);
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
      if (!url) throw new Error('URL vazia');
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
      if (!url) throw new Error('URL vazia');
      setVmUrl(url);
      toast.success('Áudio enviado para o Storage.');
    } catch {
      toast.error('Falha ao enviar áudio para o Storage. Tente novamente.');
    }
  };

  const handleSaveAll = () => {
    onSave({
      version: 2,
      ownerName,
      lockScreen: {
        enabled: Boolean(basePhoneState.hasKeypad && basePhoneState.password),
        type: basePhoneState.lockType,
        code: basePhoneState.password || '',
        smudgeHints,
      },
      enabledApps: {
        messages: true,
        gallery: gallery.length > 0,
        notes: notes.length > 0,
        voicemails: voicemails.length > 0,
        trash: trash.length > 0,
      },
      trashUnlockCode: trashUnlockCode.trim() || undefined,
      threads,
      gallery,
      notes,
      voicemails,
      trash,
    });
    onClose();
  };

  return createPortal(
    <div className="dbm-backdrop" onClick={onClose}>
      <div className="dbm-dialog" onClick={(e) => e.stopPropagation()}>
        <header className="dbm-header">
          <div className="dbm-title">
            <Smartphone size={17} />
            <div>
              <h2>DEVICE BUILDER — EXTRAÇÃO FORENSE DE CELULAR</h2>
              <span>Configure Marcas de Dedo, Galeria EXIF, Notas AES-GCM, Caixa Postal &amp; Lixeira</span>
            </div>
          </div>
          <button type="button" className="dbm-close" onClick={onClose}>
            <X size={18} />
          </button>
        </header>

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
                <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
              </label>
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
                    setThreads((prev) => [
                      ...prev,
                      { id, contactName: newContactName.trim(), contactStatus: 'online', messages: [] },
                    ]);
                    setActiveThreadId(id);
                    setNewContactName('');
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
                    className={activeThreadId === th.id ? 'active' : ''}
                    onClick={() => setActiveThreadId(th.id)}
                  >
                    {th.contactName} ({th.messages.length})
                  </button>
                ))}
              </div>

              <div className="dbm-grid">
                <select
                  value={msgSender}
                  onChange={(e) => setMsgSender(e.target.value as 'me' | 'them')}
                  style={{ background: '#060a10', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6, padding: 8 }}
                >
                  <option value="them">Contato</option>
                  <option value="me">Dono do Celular</option>
                </select>
                <select
                  value={msgType}
                  onChange={(e) => setMsgType(e.target.value as 'text' | 'image' | 'audio')}
                  style={{ background: '#060a10', color: '#fff', border: '1px solid rgba(255,255,255,0.16)', borderRadius: 6, padding: 8 }}
                >
                  <option value="text">Texto</option>
                  <option value="image">Imagem</option>
                  <option value="audio">Áudio</option>
                </select>
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
                          if (!url) throw new Error('URL vazia');
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
                    placeholder="ou URL do anexo"
                    value={msgMediaUrl}
                    onChange={(e) => setMsgMediaUrl(e.target.value)}
                  />
                </div>
              )}

              <label className="dbm-check">
                <input type="checkbox" checked={msgDeleted} onChange={(e) => setMsgDeleted(e.target.checked)} />
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
                  const newMsg: DeviceMessage = {
                    id: nanoid(8),
                    sender: msgSender,
                    type: msgType,
                    text: msgText,
                    mediaUrl: msgType !== 'text' ? msgMediaUrl.trim() || undefined : undefined,
                    time: '22:30',
                    isDeleted: msgDeleted,
                    restorableText: msgDeleted ? msgRestorable || msgText : undefined,
                  };
                  setThreads((prev) =>
                    prev.map((th) =>
                      th.id === activeThreadId ? { ...th, messages: [...th.messages, newMsg] } : th
                    )
                  );
                  setMsgText('');
                  setMsgMediaUrl('');
                  setMsgRestorable('');
                  setMsgDeleted(false);
                }}
              >
                <Plus size={14} /> Adicionar Mensagem na Conversa
              </button>
            </div>
          )}

          {tab === 'gallery' && (
            <div className="dbm-stack">
              <div className="dbm-grid">
                <label className="dbm-upload">
                  <Upload size={14} /> Enviar Foto
                  <input type="file" accept="image/*" hidden onChange={(e) => handleUploadGalleryFile(e.target.files?.[0] || null)} />
                </label>
                <input type="text" placeholder="ou URL da foto" value={galUrl} onChange={(e) => setGalUrl(e.target.value)} />
                <input type="text" placeholder="Legenda" value={galCaption} onChange={(e) => setGalCaption(e.target.value)} />
                <input type="text" placeholder="Data EXIF (ex: 12/10/2026 23:40)" value={galDate} onChange={(e) => setGalDate(e.target.value)} />
                <input type="text" placeholder="GPS EXIF (ex: -23.55, -46.63)" value={galGps} onChange={(e) => setGalGps(e.target.value)} />
                <input type="text" placeholder="Câmera (ex: iPhone 14)" value={galCam} onChange={(e) => setGalCam(e.target.value)} />
              </div>
              <button
                type="button"
                className="dbm-add-btn"
                onClick={() => {
                  if (!galUrl.trim()) return;
                  setGallery((prev) => [
                    ...prev,
                    {
                      id: nanoid(8),
                      url: galUrl.trim(),
                      caption: galCaption.trim() || undefined,
                      exif: { date: galDate || undefined, gps: galGps || undefined, camera: galCam || undefined },
                    },
                  ]);
                  setGalUrl('');
                  setGalCaption('');
                }}
              >
                <Plus size={14} /> Adicionar Foto na Galeria
              </button>
              <div className="dbm-list">
                {gallery.map((g) => (
                  <div key={g.id} className="dbm-item">
                    <span>{g.caption || g.url.slice(0, 40)} ({g.exif?.gps || 'sem GPS'})</span>
                    <button type="button" onClick={() => setGallery((p) => p.filter((x) => x.id !== g.id))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'notes' && (
            <div className="dbm-stack">
              <input type="text" placeholder="Título da Nota" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} />
              <textarea rows={3} placeholder="Conteúdo da nota..." value={noteBody} onChange={(e) => setNoteBody(e.target.value)} />
              <label className="dbm-check">
                <input type="checkbox" checked={noteLocked} onChange={(e) => setNoteLocked(e.target.checked)} />
                Trancar nota com senha (Criptografia AES-GCM no cliente)
              </label>
              {noteLocked && (
                <div className="dbm-grid">
                  <input type="text" placeholder="Senha da nota (ex: 1994)" value={notePwd} onChange={(e) => setNotePwd(e.target.value)} />
                  <input type="text" placeholder="Dica (ex: Ano de nascimento)" value={noteHint} onChange={(e) => setNoteHint(e.target.value)} />
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
                    <button type="button" onClick={() => setNotes((p) => p.filter((x) => x.id !== n.id))}>
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
                <input type="text" placeholder="Origem / Contato" value={vmCaller} onChange={(e) => setVmCaller(e.target.value)} />
                <input type="text" placeholder="Duração (ex: 0:18)" value={vmDuration} onChange={(e) => setVmDuration(e.target.value)} />
                <label className="dbm-upload">
                  <Upload size={14} /> Enviar Áudio
                  <input type="file" accept="audio/*" hidden onChange={(e) => handleUploadVmFile(e.target.files?.[0] || null)} />
                </label>
                <input type="text" placeholder="ou URL do áudio" value={vmUrl} onChange={(e) => setVmUrl(e.target.value)} />
              </div>
              <button
                type="button"
                className="dbm-add-btn"
                onClick={() => {
                  if (!vmUrl.trim()) return;
                  setVoicemails((prev) => [
                    ...prev,
                    { id: nanoid(8), caller: vmCaller || 'Desconhecido', duration: vmDuration || '0:15', date: 'Recente', audioUrl: vmUrl.trim() },
                  ]);
                  setVmCaller('');
                  setVmUrl('');
                }}
              >
                <Plus size={14} /> Adicionar Gravação
              </button>
              <div className="dbm-list">
                {voicemails.map((v) => (
                  <div key={v.id} className="dbm-item">
                    <span>{v.caller} ({v.duration})</span>
                    <button type="button" onClick={() => setVoicemails((p) => p.filter((x) => x.id !== v.id))}>
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
                <input type="text" value={trashUnlockCode} onChange={(e) => setTrashUnlockCode(e.target.value)} placeholder="Ex: ADMIN-99" />
              </label>
              <div className="dbm-grid">
                <input type="text" placeholder="Nome do arquivo apagado" value={trashLabel} onChange={(e) => setTrashLabel(e.target.value)} />
                <input type="text" placeholder="Texto recuperado ao restaurar" value={trashPreview} onChange={(e) => setTrashPreview(e.target.value)} />
              </div>
              <button
                type="button"
                className="dbm-add-btn"
                onClick={() => {
                  if (!trashLabel.trim()) return;
                  setTrash((prev) => [
                    ...prev,
                    { id: nanoid(8), kind: 'note', label: trashLabel.trim(), preview: trashPreview.trim() || 'Conteúdo recuperado' },
                  ]);
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
                    <button type="button" onClick={() => setTrash((p) => p.filter((x) => x.id !== t.id))}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <footer className="dbm-footer">
          <button type="button" className="dbm-cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="dbm-save" onClick={handleSaveAll}>
            <Save size={14} /> Salvar Aparelho na Pista
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}
