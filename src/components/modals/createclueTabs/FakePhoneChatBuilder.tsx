import React, { useRef, useState } from 'react';
import { useClueModal, ChatEntry } from '../../../contexts/ClueModalContext';
import PhoneViewer from '../../tools/PhoneViewer';
import { uploadInvestigationImage } from '../../../utils/storage';
import { toast } from 'sonner';

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
  { label: '📞 Ligação perdida', text: '📞 Ligação perdida' },
  { label: '🎵 Áudio (0:14)', text: '🎵 Áudio (0:14)' },
  { label: '🖼️ Mídia expirada', text: '🖼️ Mídia expirada' },
  { label: '⚠️ Mensagem apagada', text: '⚠️ Mensagem apagada' },
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
    <div style={{ marginTop: '10px' }}>
      <button
        type="button"
        className={showChatEditor ? 'cc-btn cc-btn-save' : 'cc-btn cc-btn-cancel'}
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => setShowChatEditor(!showChatEditor)}
      >
        💬 {showChatEditor ? 'Fechar Editor de Chat' : 'Configurar Chat Fake'}
      </button>

      {showChatEditor && (
        <div
          style={{
            display: 'flex',
            gap: '20px',
            marginTop: '15px',
            background: 'rgba(0,0,0,0.4)',
            padding: '15px',
            borderRadius: '8px',
            border: '1px solid rgba(100,150,255,0.2)',
            flexWrap: 'wrap',
          }}
        >
          {/* LADO ESQUERDO: INPUTS */}
          <div style={{ flex: 1, minWidth: 280, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="cc-field">
              <label className="cc-label">Nome do Contato</label>
              <input
                className="cc-input"
                value={phoneState.contactName}
                onChange={(e) => setPhoneState((s) => ({ ...s, contactName: e.target.value }))}
                placeholder="Ex: Suspeito Principal"
              />
            </div>

            {/* CONTROLES DE HORÁRIO AUTOMÁTICO */}
            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                padding: '10px',
                borderRadius: '6px',
                border: '1px solid rgba(100,150,255,0.18)',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                alignItems: 'flex-end',
              }}
            >
              <div style={{ flex: 1, minWidth: 100 }}>
                <label className="cc-label" style={{ fontSize: 11 }}>
                  Horário Inicial
                </label>
                <input
                  type="time"
                  className="cc-input"
                  style={{ padding: '4px 6px' }}
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
              </div>
              <div style={{ flex: 1, minWidth: 110 }}>
                <label className="cc-label" style={{ fontSize: 11 }}>
                  Auto-incremento
                </label>
                <select
                  className="cc-input"
                  style={{ padding: '4px 6px' }}
                  value={timeIncrement}
                  onChange={(e) => setTimeIncrement(parseInt(e.target.value, 10))}
                >
                  <option value={1}>+1 min</option>
                  <option value={2}>+2 min</option>
                  <option value={5}>+5 min</option>
                  <option value={0}>Manual</option>
                </select>
              </div>
              <button
                type="button"
                className="cc-btn cc-btn-cancel"
                style={{ padding: '6px 10px', fontSize: 11 }}
                onClick={handleRecalculateTimes}
              >
                ⏱️ Recalcular horários
              </button>
            </div>

            {/* TIPOS RÁPIDOS DE MENSAGEM DE SISTEMA */}
            <div>
              <label className="cc-label" style={{ fontSize: 11, marginBottom: 6, display: 'block' }}>
                Inserir Mensagem de Sistema (1 Clique)
              </label>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {SYSTEM_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="cc-btn cc-btn-cancel"
                    style={{ padding: '4px 8px', fontSize: '11px' }}
                    onClick={() => handleInsertSystemPreset(preset.text)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="cc-label">Mensagens ({phoneState.chatList.length})</label>
              {phoneState.chatList.length === 0 ? (
                <div
                  style={{
                    padding: 12,
                    background: 'rgba(0,0,0,0.3)',
                    borderRadius: 6,
                    border: '1px dashed rgba(100,150,255,0.3)',
                    color: '#888',
                    fontSize: 11,
                    textAlign: 'center',
                    marginBottom: 10,
                  }}
                >
                  Nenhuma mensagem. Clique em "➕ Adicionar Mensagem".
                </div>
              ) : (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    maxHeight: '400px',
                    overflowY: 'auto',
                    paddingRight: '5px',
                  }}
                >
                  {phoneState.chatList.map((m, idx) => (
                    <div
                      key={m.id || idx}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        padding: '10px',
                        borderRadius: '6px',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                        <select
                          className="cc-input"
                          style={{ flex: 1, padding: '4px' }}
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
                          className="cc-input"
                          style={{ width: 110, padding: '4px 6px' }}
                          value={m.time || ''}
                          onChange={(e) => {
                            const copy = [...phoneState.chatList];
                            copy[idx] = { ...copy[idx], time: e.target.value };
                            setPhoneState((s) => ({ ...s, chatList: copy }));
                          }}
                        />
                        <button
                          type="button"
                          className="cc-btn cc-btn-cancel"
                          style={{ padding: '4px 7px', fontSize: '11px' }}
                          disabled={idx === 0}
                          title="Subir mensagem"
                          onClick={() => handleMoveMessage(idx, -1)}
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          className="cc-btn cc-btn-cancel"
                          style={{ padding: '4px 7px', fontSize: '11px' }}
                          disabled={idx === phoneState.chatList.length - 1}
                          title="Descer mensagem"
                          onClick={() => handleMoveMessage(idx, 1)}
                        >
                          ↓
                        </button>
                      </div>

                      <textarea
                        className="cc-input"
                        rows={2}
                        style={{ width: '100%', marginBottom: '8px', padding: '6px' }}
                        value={m.text}
                        onChange={(e) => {
                          const copy = [...phoneState.chatList];
                          copy[idx] = { ...copy[idx], text: e.target.value };
                          setPhoneState((s) => ({ ...s, chatList: copy }));
                        }}
                      />

                      <div style={{ marginBottom: '8px' }}>
                        {m.image_url && (
                          <img
                            src={m.image_url}
                            alt="preview"
                            style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }}
                          />
                        )}
                        {chatUploadProgress[idx] !== undefined && (
                          <div style={{ fontSize: 11, color: '#9cc' }}>
                            Enviando: {chatUploadProgress[idx]}%
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="cc-btn cc-btn-cancel"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => {
                            const copy = [...phoneState.chatList];
                            copy.splice(idx, 1);
                            setPhoneState((s) => ({ ...s, chatList: copy }));
                          }}
                        >
                          ✖ Remover
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
                          className="cc-btn cc-btn-cancel"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          onClick={() => fileInputsRef.current[idx]?.click()}
                        >
                          📎 Anexar Imagem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                className="cc-btn cc-btn-cancel"
                style={{ marginTop: 10, width: '100%', justifyContent: 'center' }}
                onClick={handleAddBlankMessage}
              >
                ➕ Adicionar Mensagem
              </button>
            </div>

            <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
              <label className="cc-label">Importar JSON</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  className="cc-input"
                  style={{ flex: 1 }}
                  placeholder="Colar JSON aqui"
                  value={chatJson}
                  onChange={(e) => setChatJson(e.target.value)}
                />
                <button
                  type="button"
                  className="cc-btn cc-btn-save"
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
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 8, width: '100%', justifyContent: 'center' }}>
              <button
                type="button"
                className={previewLocked ? 'cc-btn cc-btn-save' : 'cc-btn cc-btn-cancel'}
                style={{ flex: 1, justifyContent: 'center', fontSize: 12, padding: '6px 10px' }}
                onClick={() => setPreviewLocked((prev) => !prev)}
              >
                {previewLocked ? '🔓 Ver Conversa' : '🔒 Simular Bloqueio'}
              </button>
            </div>

            <div style={{ width: '100%', height: '500px', position: 'relative', border: '1px solid #333', borderRadius: '24px', overflow: 'hidden' }}>
              <PhoneViewer
                chatData={phoneState.chatList}
                contactName={phoneState.contactName}
                isLocked={previewLocked}
                password={previewLocked ? phoneState.password || '0000' : undefined}
                passwordType={phoneState.lockType}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Preview do Dispositivo ({previewLocked ? 'Bloqueado' : 'Conversa'})
            </div>

            <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(100,150,255,0.2)' }}>
              <div style={{ fontSize: 11, color: '#9ac4ff', marginBottom: '8px' }}>ADIÇÃO RÁPIDA (PREVIEW)</div>
              <div style={{ display: 'flex', gap: 6, marginBottom: '5px' }}>
                <select
                  className="cc-input"
                  style={{ flex: 1, padding: '4px' }}
                  value={quickChatSender}
                  onChange={(e) => setQuickChatSender(e.target.value as any)}
                >
                  <option value="them">Contato</option>
                  <option value="me">Eu</option>
                  <option value="system">Sistema</option>
                </select>
                <input
                  type="time"
                  className="cc-input"
                  style={{ width: 100, padding: '4px 6px' }}
                  value={quickChatTime}
                  onChange={(e) => setQuickChatTime(e.target.value)}
                />
              </div>
              <textarea
                className="cc-input"
                rows={2}
                style={{ width: '100%', padding: '6px', marginBottom: '5px' }}
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
              <button type="button" className="cc-btn cc-btn-save" style={{ width: '100%', justifyContent: 'center' }} onClick={handleQuickAddMessage}>
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
