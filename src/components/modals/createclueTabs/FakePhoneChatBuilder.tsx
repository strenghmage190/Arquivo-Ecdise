import React, { useRef, useState } from 'react';
import { useClueModal } from '../../../contexts/ClueModalContext';
import PhoneViewer from '../../tools/PhoneViewer';
import { supabase } from '../../../supabaseClient';
import { ChatEntry } from '../../../contexts/ClueModalContext';

export default function FakePhoneChatBuilder() {
  const { phoneState, setPhoneState } = useClueModal();
  const [showChatEditor, setShowChatEditor] = useState(false);
  const [chatJson, setChatJson] = useState('');
  const fileInputsRef = useRef<Record<number, HTMLInputElement | null>>({});
  const [chatUploadProgress, setChatUploadProgress] = useState<Record<number, number>>({});

  // Quick Add State
  const [quickChatSender, setQuickChatSender] = useState<'me' | 'them' | 'system'>('them');
  const [quickChatText, setQuickChatText] = useState('');

  const handleQuickAddMessage = () => {
    if (!quickChatText.trim()) return;
    setPhoneState(s => ({
      ...s,
      chatList: [...s.chatList, { sender: quickChatSender, type: 'text', text: quickChatText.trim() }]
    }));
    setQuickChatText('');
  };

  const handleChatImageSelected = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setChatUploadProgress(p => ({ ...p, [idx]: 1 }));
      
      const originalName = file.name || 'image';
      const ext = originalName.split('.').pop() || '';
      const safeName = `chat_${Date.now()}.${ext}`;
      const path = `chat_images/${safeName}`;

      const { data, error } = await supabase.storage.from('investigation-assets').upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });
      
      if (error) throw error;
      const { data: publicData } = await supabase.storage.from('investigation-assets').getPublicUrl(path);
      
      const copy = [...phoneState.chatList];
      copy[idx] = { ...copy[idx], type: 'image', image_url: publicData.publicUrl };
      setPhoneState(s => ({ ...s, chatList: copy }));
    } catch (error) {
      console.error('Erro ao enviar imagem do chat', error);
      alert('Erro ao enviar imagem. Verifique o console.');
    } finally {
      setChatUploadProgress(p => { const copy = {...p}; delete copy[idx]; return copy; });
    }
  };

  return (
    <div style={{ marginTop: '10px' }}>
      <button 
        className={showChatEditor ? "cc-btn cc-btn-save" : "cc-btn cc-btn-cancel"} 
        style={{ width: '100%', justifyContent: 'center' }}
        onClick={() => setShowChatEditor(!showChatEditor)}
      >
        💬 {showChatEditor ? 'Fechar Editor de Chat' : 'Configurar Chat Fake'}
      </button>

      {showChatEditor && (
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px', background: 'rgba(0,0,0,0.4)', padding: '15px', borderRadius: '8px', border: '1px solid rgba(100,150,255,0.2)' }}>
          
          {/* LADO ESQUERDO: INPUTS */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div className="cc-field">
              <label className="cc-label">Nome do Contato</label>
              <input 
                className="cc-input"
                value={phoneState.contactName} 
                onChange={e => setPhoneState(s => ({ ...s, contactName: e.target.value }))} 
                placeholder="Ex: Suspeito Principal" 
              />
            </div>

            <div>
              <label className="cc-label">Mensagens</label>
              {phoneState.chatList.length === 0 ? (
                <div style={{ padding: 12, background: 'rgba(0,0,0,0.3)', borderRadius: 6, border: '1px dashed rgba(100,150,255,0.3)', color: '#888', fontSize: 11, textAlign: 'center', marginBottom: 10 }}>
                  Nenhuma mensagem. Clique em "➕ Adicionar Mensagem".
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '400px', overflowY: 'auto', paddingRight: '5px' }}>
                  {phoneState.chatList.map((m, idx) => (
                    <div key={idx} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.1)' }}>
                      <select 
                        className="cc-input" 
                        style={{ marginBottom: '8px', width: '100%', padding: '4px' }}
                        value={m.sender} 
                        onChange={e => { 
                          const copy = [...phoneState.chatList]; 
                          copy[idx] = { ...copy[idx], sender: e.target.value as any }; 
                          setPhoneState(s => ({ ...s, chatList: copy })); 
                        }}
                      >
                        <option value="me">Eu</option>
                        <option value="them">Contato</option>
                        <option value="system">Sistema</option>
                      </select>
                      
                      <textarea 
                        className="cc-input"
                        rows={2} 
                        style={{ width: '100%', marginBottom: '8px', padding: '6px' }}
                        value={m.text} 
                        onChange={e => { 
                          const copy = [...phoneState.chatList]; 
                          copy[idx] = { ...copy[idx], text: e.target.value }; 
                          setPhoneState(s => ({ ...s, chatList: copy })); 
                        }} 
                      />
                      
                      <div style={{ marginBottom: '8px' }}>
                        {m.image_url && <img src={m.image_url} alt="preview" style={{ maxWidth: '100px', maxHeight: '100px', borderRadius: '4px' }} />}
                        {chatUploadProgress[idx] && <div style={{ fontSize: 11, color: '#9cc' }}>Enviando: {chatUploadProgress[idx]}%</div>}
                      </div>
                      
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="cc-btn cc-btn-cancel" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => { 
                          const copy = [...phoneState.chatList]; 
                          copy.splice(idx, 1); 
                          setPhoneState(s => ({ ...s, chatList: copy })); 
                        }}>✖ Remover</button>
                        
                        <input ref={el => fileInputsRef.current[idx] = el} type="file" accept="image/*" hidden onChange={(e) => handleChatImageSelected(idx, e)} />
                        
                        <button className="cc-btn cc-btn-cancel" style={{ padding: '4px 8px', fontSize: '11px' }} onClick={() => fileInputsRef.current[idx]?.click()}>
                          📎 Anexar Imagem
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button 
                className="cc-btn cc-btn-cancel" 
                style={{ marginTop: 10, width: '100%', justifyContent: 'center' }} 
                onClick={() => setPhoneState(s => ({ ...s, chatList: [...s.chatList, { sender: 'me', type: 'text', text: '' }] }))}
              >
                ➕ Adicionar Mensagem
              </button>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '15px' }}>
              <label className="cc-label">Importar JSON</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input 
                  className="cc-input"
                  style={{ flex: 1 }}
                  placeholder='Colar JSON aqui' 
                  value={chatJson} 
                  onChange={e => setChatJson(e.target.value)} 
                />
                <button className="cc-btn cc-btn-save" onClick={() => {
                  try {
                    const parsed = JSON.parse(chatJson || '[]');
                    if (Array.isArray(parsed)) {
                      setPhoneState(s => ({ ...s, chatList: parsed.map((m: any) => ({ sender: m.sender || 'me', type: m.type || 'text', text: m.text || '', image_url: m.image_url })) }));
                      setChatJson('');
                    } else alert('JSON inválido. Deve ser um array.');
                  } catch (e) { alert('JSON inválido'); }
                }}>Importar</button>
              </div>
            </div>
          </div>

          {/* LADO DIREITO: PREVIEW */}
          <div style={{ width: '320px', display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
            <div style={{ width: '100%', height: '500px', position: 'relative', border: '1px solid #333', borderRadius: '24px', overflow: 'hidden' }}>
              <PhoneViewer 
                chatData={phoneState.chatList} 
                contactName={phoneState.contactName} 
                isLocked={phoneState.hasKeypad}
                password={phoneState.hasKeypad ? phoneState.password : undefined}
                passwordType={phoneState.lockType}
              />
            </div>
            <div style={{ fontSize: '11px', color: '#888', textTransform: 'uppercase', letterSpacing: '1px' }}>Preview do Dispositivo</div>

            <div style={{ width: '100%', background: 'rgba(0,0,0,0.5)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(100,150,255,0.2)' }}>
              <div style={{ fontSize: 11, color: '#9ac4ff', marginBottom: '8px' }}>ADIÇÃO RÁPIDA (PREVIEW)</div>
              <select 
                className="cc-input" 
                style={{ width: '100%', marginBottom: '5px', padding: '4px' }}
                value={quickChatSender} 
                onChange={e => setQuickChatSender(e.target.value as any)}
              >
                <option value="them">Contato</option>
                <option value="me">Eu</option>
                <option value="system">Sistema</option>
              </select>
              <textarea 
                className="cc-input"
                rows={2} 
                style={{ width: '100%', padding: '6px', marginBottom: '5px' }}
                value={quickChatText} 
                onChange={e => setQuickChatText(e.target.value)}
                onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') { e.preventDefault(); handleQuickAddMessage(); } }}
                placeholder="Digite a mensagem e CTRL+ENTER"
              />
              <button className="cc-btn cc-btn-save" style={{ width: '100%', justifyContent: 'center' }} onClick={handleQuickAddMessage}>
                Adicionar
              </button>
            </div>
          </div>
          
        </div>
      )}
    </div>
  );
}
