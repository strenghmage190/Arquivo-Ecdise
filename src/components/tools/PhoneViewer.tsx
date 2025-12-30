import React from 'react';
import './PhoneViewer.css';

export default function PhoneViewer({ chatData, contactName }: any) {
  const displayChat = Array.isArray(chatData) ? chatData : [];

  const resolveText = (msg: any) => {
    if (!msg) return '';
    if (typeof msg === 'string') return msg;
    if (typeof msg.text === 'string') return msg.text;
    if (typeof msg.message === 'string') return msg.message;
    if (typeof msg.body === 'string') return msg.body;
    if (typeof msg.payload === 'string') return msg.payload;
    if (msg.payload && typeof msg.payload === 'object') return msg.payload.text ?? msg.payload.message ?? '';
    if (typeof msg.content === 'string') return msg.content;
    if (msg.content && typeof msg.content === 'object') {
      if (Array.isArray(msg.content)) {
        const pieces = msg.content.map((c: any) => (typeof c === 'string' ? c : (c?.text ?? c?.message ?? ''))).filter(Boolean);
        return pieces.join('\n');
      }
      return msg.content.text ?? msg.content.message ?? '';
    }
    return '';
  };

  return (
    <div className="phone-mockup-wrapper">
       <div className="phone-mockup">
          <div className="phone-header">
             {contactName && String(contactName).trim() ? (
               <div className="contact-avatar">{String(contactName)[0].toUpperCase()}</div>
             ) : <div className="contact-avatar" style={{opacity:0.25}}>{'?'}</div>}
             <div className="contact-info">
                <div className="contact-name">{contactName || 'Desconhecido'}</div>
                <div className="contact-status">visto por último hoje às 03:00</div>
             </div>
          </div>

          <div className="chat-body">
             {displayChat.length > 0 ? displayChat.map((msg: any, i: number) => {
                const text = resolveText(msg);
                const imageUrl = msg.image_url || msg.image || msg.media?.url || msg.media?.src || msg.photo;
                return (
                  <div key={i} className={`chat-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                     {text ? (
                       <div style={{whiteSpace:'pre-wrap', wordBreak:'break-word'}}>{text}</div>
                     ) : null}
                     {imageUrl ? (
                        <div style={{marginTop: text ? 8 : 0}}>
                          <img src={String(imageUrl)} alt={msg.caption || 'image'} className="chat-image" />
                        </div>
                     ) : null}
                     <span className="msg-time">{msg.time || '00:00'}</span>
                  </div>
                );
             }) : (
                <div style={{textAlign:'center', color:'#555', fontSize:12, marginTop:20}}>
                   Sem mensagens recuperadas.
                </div>
             )}
          </div>

          <div className="phone-input">Apenas Leitura...</div>
       </div>
    </div>
  );
}
