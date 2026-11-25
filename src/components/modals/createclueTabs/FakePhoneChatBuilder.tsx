import React, { useRef, useState } from 'react';
import {
  Clock,
  Lock,
  Unlock,
  PhoneMissed,
  Music,
  Image as ImageIcon,
  AlertTriangle,
  MessageSquare,
  X,
  Paperclip,
  Plus,
} from 'lucide-react';
import { useClueModal, ChatEntry } from '../../../contexts/ClueModalContext';
import PhoneViewer from '../../tools/PhoneViewer';
import { uploadInvestigationImage } from '../../../utils/storage';
import { toast } from 'sonner';
import DeviceBuilderModal from '../DeviceBuilderModal';
import { DeviceExtractionMetadata } from '../../../types/forensicPillars';

function parseTimeToMinutes(timeStr: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec((timeStr || '').trim());
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes: number): string {
  const normalized = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function computeNextTime(
  chatList: ChatEntry[],
  startTime: string,
  incrementMinutes: number
): string {
  if (incrementMinutes <= 0) return '';
  if (chatList.length === 0) {
    return parseTimeToMinutes(startTime) !== null ? startTime : '22:15';
  }
  for (let i = chatList.length - 1; i >= 0; i--) {
    const mins = parseTimeToMinutes(chatList[i].time || '');
    if (mins !== null) {
      return formatMinutesToTime(mins + incrementMinutes);
    }
  }
  const baseMins = parseTimeToMinutes(startTime);
  return baseMins !== null ? formatMinutesToTime(baseMins + incrementMinutes) : '22:15';
}

const SYSTEM_PRESETS = [
  { label: 'Ligação perdida', text: 'Ligação perdida', icon: PhoneMissed },
  { label: 'Áudio (0:14)', text: 'Áudio (0:14)', icon: Music },
  { label: 'Mídia expirada', text: 'Mídia expirada', icon: ImageIcon },
  { label: 'Mensagem apagada', text: 'Mensagem apagada', icon: AlertTriangle },
];

export default function FakePhoneChatBuilder() {
  const { phoneState, setPhoneState, investigationId } = useClueModal();
  const [showChatEditor, setShowChatEditor] = useState(false);
  const [chatJson, setChatJson] = useState('');
  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});
  const [chatUploadProgress, setChatUploadProgress] = useState<Record<number, number>>({});

  // Time auto-increment & preview lock state
  const [startTime, setStartTime] = useState('22:15');
  const [timeIncrement, setTimeIncrement] = useState<number>(1);
  const [previewLocked, setPreviewLocked] = useState<boolean>(false);

  // Quick Add State
  const [quickChatSender, setQuickChatSender] = useState<'me' | 'them' | 'system'>('them');
  const [quickChatText, setQuickChatText] = useState('');
  const [showDeviceBuilder, setShowDeviceBuilder] = useState(false);
  const [deviceDraft, setDeviceDraft] = useState<DeviceExtractionMetadata | null>(() => {
    try {
      return (window as any).__ecdiseDeviceDraft || null;
    } catch {
      return null;
    }
  });
  const [quickChatTime, setQuickChatTime] = useState('');

  const handleMoveMessage = (idx: number, direction: -1 | 1) => {
    const target = idx + direction;
    if (target < 0 || target >= phoneState.chatList.length) return;
    setPhoneState((s) => {
      const copy = [...s.chatList];
      const temp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = temp;
      return { ...s, chatList: copy };
    });
  };

  const handleRecalculateTimes = () => {
    const baseMins = parseTimeToMinutes(startTime);
    if (baseMins === null) {
      toast.error('Horário inicial inválido.');
      return;
    }
    const step = timeIncrement > 0 ? timeIncrement : 1;
    setPhoneState((s) => ({
      ...s,
      chatList: s.chatList.map((m, idx) => ({
        ...m,
        time: formatMinutesToTime(baseMins + idx * step),
      })),
    }));
    toast.success('Horários recalculados!');
  };

  const handleInsertSystemPreset = (text: string) => {
    setPhoneState((s) => {
      const nextTime = computeNextTime(s.chatList, startTime, timeIncrement);
      const entry: ChatEntry = {
        sender: 'system',
        type: 'text',
        text,
        ...(nextTime ? { time: nextTime } : {}),
      };
      return { ...s, chatList: [...s.chatList, entry] };
    });
  };

  const handleAddBlankMessage = () => {
    setPhoneState((s) => {
      const nextTime = computeNextTime(s.chatList, startTime, timeIncrement);
      const entry: ChatEntry = {
        sender: 'me',
        type: 'text',
        text: '',
        ...(nextTime ? { time: nextTime } : {}),
      };
      return { ...s, chatList: [...s.chatList, entry] };
    });
  };

  const handleQuickAddMessage = () => {
    if (!quickChatText.trim()) return;
    setPhoneState((s) => {
      const resolvedTime =
        quickChatTime.trim() || computeNextTime(s.chatList, startTime, timeIncrement);
      const entry: ChatEntry = {
        sender: quickChatSender,
        type: 'text',
        text: quickChatText.trim(),
        ...(resolvedTime ? { time: resolvedTime } : {}),
      };
      return {
        ...s,
        chatList: [...s.chatList, entry],
      };
    });
    setQuickChatText('');
    setQuickChatTime('');
  };

  const handleChatImageSelected = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setChatUploadProgress((p) => ({ ...p, [idx]: 5 }));
      const folderId = investigationId || 'chat_images';
      const uploadedUrl = await uploadInvestigationImage(file, folderId, (pct) => {
        setChatUploadProgress((p) => ({ ...p, [idx]: pct }));
      });
      if (!uploadedUrl) throw new Error('Falha ao obter URL da imagem');

      setPhoneState((s) => {
        const copy = [...s.chatList];
        copy[idx] = { ...copy[idx], type: 'image', image_url: uploadedUrl };
        return { ...s, chatList: copy };
      });
    } catch (error) {
      console.error('Erro ao enviar imagem do chat', error);
      toast.error('Erro ao enviar imagem do chat.');
    } finally {
      setChatUploadProgress((p) => {
        const copy = { ...p };
        delete copy[idx];
        return copy;
      });
      e.target.value = '';
    }
  };

  return (
    <div className="ccm-list-stack">
      <button
        type="button"
        className={`ccm-btn ccm-btn-block ${showChatEditor ? 'ccm-btn-primary' : ''}`}
        onClick={() => setShowChatEditor(!showChatEditor)}
      >
        <MessageSquare size={15} /> {showChatEditor ? 'Fechar Editor de Chat' : 'Configurar Chat Fake'}
      </button>

      {showChatEditor && (
        <div className="ccm-section ccm-chat-builder">
          {/* LADO ESQUERDO: INPUTS */}
          <div className="ccm-chat-col">
            <div className="ccm-field">
              <label className="ccm-label">Nome do Contato</label>
              <input
                className="ccm-input"
                value={phoneState.contactName}
                onChange={(e) => setPhoneState((s) => ({ ...s, contactName: e.target.value }))}
                placeholder="Ex: Suspeito Principal"
              />
            </div>

            <div className="ccm-list-card">
              <div className="ccm-grid-3">
                <div className="ccm-field">
                  <label className="ccm-label">Horário Inicial</label>
                  <input
                    type="time"
                    className="ccm-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                  />
                </div>
                <div className="ccm-field">
                  <label className="ccm-label">Auto-incremento</label>
                  <select
                    className="ccm-input"
                    value={timeIncrement}
                    onChange={(e) => setTimeIncrement(parseInt(e.target.value, 10))}
                  >
                    <option value={1}>+1 min</option>
                    <option value={2}>+2 min</option>
                    <option value={5}>+5 min</option>
                    <option value={0}>Manual</option>
                  </select>
                </div>
                <div className="ccm-field" style={{ justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="ccm-btn"
                    onClick={handleRecalculateTimes}
                  >
                    <Clock size={14} /> Recalcular
                  </button>
                </div>
              </div>
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Inserir Mensagem de Sistema (1 Clique)</label>
              <div className="ccm-btn-row">
                {SYSTEM_PRESETS.map((preset) => {
                  const PresetIcon = preset.icon;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      className="ccm-btn ccm-btn-sm"
                      onClick={() => handleInsertSystemPreset(preset.text)}
                    >
                      <PresetIcon size={13} /> {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Mensagens ({phoneState.chatList.length})</label>
              {phoneState.chatList.length === 0 ? (
                <div className="ccm-callout ccm-note">
                  Nenhuma mensagem. Clique em "Adicionar Mensagem".
                </div>
              ) : (
                <div className="ccm-chat-list">
                  {phoneState.chatList.map((m, idx) => (
                    <div key={m.id || idx} className="ccm-list-card">
                      <div className="ccm-chat-msg-head">
                        <select
                          className="ccm-input"
                          value={m.sender}
                          onChange={(e) => {
                            const copy = [...phoneState.chatList];
                            copy[idx] = { ...copy[idx], sender: e.target.value as any };
                            setPhoneState((s) => ({ ...s, chatList: copy }));
                          }}
                        >
                          <option value="me">Eu</option>
                          <option value="them">Contato</option>
                          <option value="system">Sistema</option>
                        </select>
                        <input
                          type="time"
                          className="ccm-input"
                          value={m.time || ''}
                          onChange={(e) => {
                            const copy = [...phoneState.chatList];
                            copy[idx] = { ...copy[idx], time: e.target.value };
                            setPhoneState((s) => ({ ...s, chatList: copy }));
                          }}
                        />
                        <button
                          type="button"
                          className="ccm-btn ccm-btn-sm"
                          disabled={idx === 0}
                          title="Subir mensagem"
                          onClick={() => handleMoveMessage(idx, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="ccm-btn ccm-btn-sm"
                          disabled={idx === phoneState.chatList.length - 1}
                          title="Descer mensagem"
                          onClick={() => handleMoveMessage(idx, 1)}
                        >
                          ↓
                        </button>
                      </div>

                      <textarea
                        className="ccm-input"
                        rows={2}
                        value={m.text}
                        onChange={(e) => {
                          const copy = [...phoneState.chatList];
                          copy[idx] = { ...copy[idx], text: e.target.value };
                          setPhoneState((s) => ({ ...s, chatList: copy }));
                        }}
                      />

                      {m.image_url && (
                        <img src={m.image_url} alt="preview" className="ccm-chat-thumb" />
                      )}
                      {chatUploadProgress[idx] !== undefined && (
                        <div className="ccm-note" style={{ color: 'var(--ccm-accent)' }}>
                          Enviando: {chatUploadProgress[idx]}%
                        </div>
                      )}

                      <div className="ccm-btn-row">
                        <button
                          type="button"
                          className="ccm-btn ccm-btn-sm ccm-btn-danger"
                          onClick={() => {
                            const copy = [...phoneState.chatList];
                            copy.splice(idx, 1);
                            setPhoneState((s) => ({ ...s, chatList: copy }));
                          }}
                        >
                          <X size={13} /> Remover
                        </button>

                        <input
                          ref={(el) => (fileInputsRef.current[idx] = el)}
                          type="file"
                          accept="image/*"
                          hidden
                          onChange={(e) => handleChatImageSelected(idx, e)}
                        />

                        <button
                          type="button"
                          className="ccm-btn ccm-btn-sm"
                          onClick={() => fileInputsRef.current[idx]?.click()}
                        >
                          <Paperclip size={13} /> Anexar Imagem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="ccm-btn ccm-btn-block"
                onClick={handleAddBlankMessage}
              >
                <Plus size={14} /> Adicionar Mensagem
              </button>
            </div>

            <div className="ccm-field">
              <label className="ccm-label">Importar JSON</label>
              <div className="ccm-btn-row">
                <input
                  className="ccm-input"
                  style={{ flex: 1 }}
                  placeholder="Colar JSON aqui"
                  value={chatJson}
                  onChange={(e) => setChatJson(e.target.value)}
                />
                <button
                  type="button"
                  className="ccm-btn ccm-btn-primary"
                  onClick={() => {
                    try {
                      const parsed = JSON.parse(chatJson || '[]');
                      if (Array.isArray(parsed)) {
                        setPhoneState((s) => ({
                          ...s,
                          chatList: parsed.map((m: any) => ({
                            sender: m.sender || 'me',
                            type: m.type || 'text',
                            text: m.text || '',
                            ...(m.image_url ? { image_url: m.image_url } : {}),
                            ...(m.time ? { time: m.time } : {}),
                          })),
                        }));
                        setChatJson('');
                      } else {
                        toast.error('JSON inválido. Deve ser um array.');
                      }
                    } catch {
                      toast.error('JSON inválido.');
                    }
                  }}
                >
                  Importar
                </button>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: PREVIEW */}
          <div className="ccm-phone-col">
            <button
              type="button"
              className={`ccm-btn ccm-btn-sm ccm-btn-block ${previewLocked ? 'ccm-btn-primary' : ''}`}
              onClick={() => setPreviewLocked((prev) => !prev)}
            >
              {previewLocked ? (
                <>
                  <Unlock size={14} /> Ver Conversa
                </>
              ) : (
                <>
                  <Lock size={14} /> Simular Bloqueio
                </>
              )}
            </button>

            <div className="ccm-phone-frame">
              <PhoneViewer
                chatData={phoneState.chatList}
                contactName={phoneState.contactName}
                isLocked={previewLocked}
                password={previewLocked ? phoneState.password || '0000' : undefined}
                passwordType={phoneState.lockType}
                deviceData={deviceDraft}
              />
            </div>

            <button
              type="button"
              className="ccm-btn ccm-btn-primary ccm-btn-block"
              style={{ marginTop: 6 }}
              onClick={() => setShowDeviceBuilder(true)}
            >
              Configurar Aparelho Completo (Galeria EXIF, Notas AES-GCM, Caixa Postal &amp; Lixeira)
            </button>

            <DeviceBuilderModal
              isOpen={showDeviceBuilder}
              onClose={() => setShowDeviceBuilder(false)}
              initialDevice={deviceDraft}
              basePhoneState={{
                hasKeypad: phoneState.hasKeypad,
                lockType: phoneState.lockType,
                password: phoneState.password,
                contactName: phoneState.contactName,
                chatList: phoneState.chatList,
              }}
              onSave={(device) => {
                setDeviceDraft(device);
                (window as any).__ecdiseDeviceDraft = device;
                toast.success('Ecossistema completo do celular salvo na pista!');
              }}
            />
            <div className="ccm-note" style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Preview ({previewLocked ? 'Bloqueado' : 'Conversa'})
            </div>

            <div className="ccm-list-card" style={{ width: '100%' }}>
              <div className="ccm-label">ADIÇÃO RÁPIDA (PREVIEW)</div>
              <div className="ccm-grid-2">
                <select
                  className="ccm-input"
                  value={quickChatSender}
                  onChange={(e) => setQuickChatSender(e.target.value as any)}
                >
                  <option value="them">Contato</option>
                  <option value="me">Eu</option>
                  <option value="system">Sistema</option>
                </select>
                <input
                  type="time"
                  className="ccm-input"
                  value={quickChatTime}
                  onChange={(e) => setQuickChatTime(e.target.value)}
                />
              </div>
              <textarea
                className="ccm-input"
                rows={2}
                value={quickChatText}
                onChange={(e) => setQuickChatText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.ctrlKey && e.key === 'Enter') {
                    e.preventDefault();
                    handleQuickAddMessage();
                  }
                }}
                placeholder="Digite a mensagem e CTRL+ENTER"
              />
              <button
                type="button"
                className="ccm-btn ccm-btn-primary ccm-btn-block"
                onClick={handleQuickAddMessage}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
