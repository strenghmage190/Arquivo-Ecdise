import React from 'react';

interface InvestigationChatTabProps {
  chatMessages: any[] | null;
  setChatMessages: (messages: any[] | null) => void;
  newMsgText: string;
  setNewMsgText: (text: string) => void;
  newMsgSender: 'me' | 'them';
  setNewMsgSender: (sender: 'me' | 'them') => void;
  isGameMaster: boolean;
}

export default function InvestigationChatTab({
  chatMessages,
  setChatMessages,
  newMsgText,
  setNewMsgText,
  newMsgSender,
  setNewMsgSender,
  isGameMaster,
}: InvestigationChatTabProps) {
  if (!isGameMaster) {
    return (
      <div style={{ color: '#999', textAlign: 'center', padding: 20 }}>
        💬 Recurso disponível apenas para Game Masters
      </div>
    );
  }

  return (
    <div style={{ flex: 1 }}>
      <div style={{ marginBottom: 12, borderBottom: '1px solid #333', paddingBottom: 12 }}>
        <strong>📱 Editor de Mensagens de Chat</strong>
      </div>

      {/* Messages Preview */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>
          📝 Mensagens Existentes ({chatMessages?.length || 0})
        </label>
        <div
          style={{
            maxHeight: 220,
            overflowY: 'auto',
            border: '1px solid #333',
            padding: 8,
            borderRadius: 6,
            background: '#0a0a0a',
          }}
        >
          {(!chatMessages || chatMessages.length === 0) && (
            <div style={{ color: '#666', fontSize: 13, textAlign: 'center', padding: 20 }}>
              Nenhuma mensagem adicionada
            </div>
          )}
          {chatMessages &&
            chatMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 8,
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: m.sender === 'me' ? '#053' : '#333',
                    color: '#fff',
                    padding: '8px 10px',
                    borderRadius: 6,
                  }}
                >
                  <div style={{ fontSize: 12, marginBottom: 4 }}>
                    <strong>{m.sender === 'me' ? '👤 Você' : '👥 Contato'}</strong>
                  </div>
                  <div style={{ fontSize: 13 }}>{m.text || m.message || m.body || ''}</div>
                  <div style={{ fontSize: 10, color: '#bbb', marginTop: 6 }}>
                    {m.time || ''}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!chatMessages) return;
                    const updated = chatMessages.filter((_, idx) => idx !== i);
                    setChatMessages(updated);
                  }}
                  style={{
                    padding: '6px 8px',
                    background: '#e74c3c',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 12,
                  }}
                >
                  🗑️
                </button>
              </div>
            ))}
        </div>
      </div>

      {/* New Message Input */}
      <div style={{ paddingTop: 12, borderTop: '1px solid #333' }}>
        <label style={{ display: 'block', fontSize: 13, color: '#aaa', marginBottom: 8 }}>
          ➕ Adicionar Nova Mensagem
        </label>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <select
            value={newMsgSender}
            onChange={(e) => setNewMsgSender(e.target.value as 'me' | 'them')}
            style={{
              width: 120,
              padding: '8px',
              border: '1px solid #444',
              background: '#111',
              color: '#fff',
              borderRadius: 4,
            }}
          >
            <option value="them">👥 Contato</option>
            <option value="me">👤 Você</option>
          </select>
        </div>

        <textarea
          placeholder="Escreva a mensagem aqui..."
          value={newMsgText}
          onChange={(e) => setNewMsgText(e.target.value)}
          style={{
            width: '100%',
            height: 60,
            padding: '8px',
            border: '1px solid #444',
            background: '#111',
            color: '#fff',
            borderRadius: 4,
            marginBottom: 8,
            resize: 'vertical',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
              const nm = newMsgText.trim();
              if (!nm) return;
              const toAdd = {
                sender: newMsgSender,
                text: nm,
                time: new Date().toLocaleTimeString().slice(0, 5),
                type: 'text',
              };
              setChatMessages([...(chatMessages || []), toAdd]);
              setNewMsgText('');
            }
          }}
        />

        <button
          type="button"
          onClick={() => {
            const nm = newMsgText.trim();
            if (!nm) return;
            const toAdd = {
              sender: newMsgSender,
              text: nm,
              time: new Date().toLocaleTimeString().slice(0, 5),
              type: 'text',
            };
            setChatMessages([...(chatMessages || []), toAdd]);
            setNewMsgText('');
          }}
          style={{
            width: '100%',
            padding: '10px',
            background: '#27ae60',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 'bold',
          }}
        >
          ✓ Adicionar Mensagem
        </button>
      </div>
    </div>
  );
}
