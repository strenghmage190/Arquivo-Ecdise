import React, { useState, useEffect, useRef } from 'react';
import NumericKeypad from './NumericKeypad';
import PatternLock from './PatternLock';
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
}

export default function PhoneViewer({ chatData, contactName, isLocked = false, password, fullscreen = false, passwordType = 'pin' }: PhoneViewerProps): React.ReactElement {
   const [unlocked, setUnlocked] = useState(!isLocked);
   const [currentTime, setCurrentTime] = useState('12:00');
   const chatBodyRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      setUnlocked(!isLocked);
   }, [isLocked]);

   // Relógio em tempo real para a barra de status
   useEffect(() => {
     const updateTime = () => {
       const now = new Date();
       setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
     };
     updateTime();
     const interval = setInterval(updateTime, 60000);
     return () => clearInterval(interval);
   }, []);

   // Auto-scroll para a última mensagem
   useEffect(() => {
     if (chatBodyRef.current) {
       chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
     }
   }, [chatData, unlocked]);
   
   const handleUnlock = () => {
       setUnlocked(true);
   };
   
   const displayChat = Array.isArray(chatData) ? chatData : [];
   const resolveText = (msg: PhoneMessage) => msg.text || msg.message || msg.body || '';

   // --- RENDERIZAÇÃO ---
   return (
    <div className="phone-mockup-wrapper">
       <div className={`nexus-phone-mockup ${fullscreen ? 'fullscreen' : ''} ${!unlocked ? 'locked' : ''}`}>
          
          {/* HARDWARE E UI DO SISTEMA */}
          <div className="phone-notch" />
          <div className="status-bar">
             <span>{currentTime}</span>
             <div style={{display:'flex', gap:6}}>
                <span>5G</span>
                <span>100%</span>
             </div>
          </div>

          {/* TELA DE BLOQUEIO */}
          {!unlocked && password ? (
             <div className="chat-body locked-body" style={{ alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ marginBottom: 40, textAlign: 'center' }}>
                   <div style={{ fontSize: 60 }}>🔒</div>
                   <h3 style={{ margin: '10px 0', color: '#fff' }}>Acesso Restrito</h3>
                   <p style={{ color: '#888', fontSize: 12 }}>Biometria falhou. Insira credenciais.</p>
                </div>
                
                {String(passwordType) === 'pattern' ? (
                   <PatternLock code={String(password)} onUnlock={handleUnlock} />
                ) : (
                   <NumericKeypad code={password} onUnlock={handleUnlock} />
                )}
             </div>
          ) : (
             /* TELA DE CHAT (DESBLOQUEADA) */
             <>
                <div className="phone-header">
                   <button style={{background:'none', border:'none', color:'#00f3ff', fontSize:20, cursor:'pointer', padding:0}}>←</button>
                   <div className="contact-avatar">
                      {contactName ? contactName[0].toUpperCase() : '?'}
                   </div>
                   <div className="contact-info">
                      <div className="contact-name">{contactName || 'Desconhecido'}</div>
                      <div className="contact-status">online agora</div>
                   </div>
                   <div style={{marginLeft:'auto', fontSize:20}}>⋮</div>
                </div>

                <div className="chat-body" ref={chatBodyRef}>
                   {displayChat.length > 0 ? displayChat.map((msg, i) => {
                      const text = resolveText(msg);
                      const imageUrl = msg.image_url || msg.photo;
                      const isMe = msg.sender === 'me' || msg.sender === 'eu';
                      
                                 return (
                                    <div key={i} className={`nexus-bubble ${isMe ? 'sent' : 'received'}`}>
                                        {imageUrl && <img src={imageUrl} alt="anexo" className="chat-image" loading="lazy" />}
                           {text && <span className="msg-text">{text}</span>}
                           <span className="msg-time">{msg.time || currentTime}</span>
                        </div>
                      );
                   }) : (
                      <div style={{ margin:'auto', color:'#555', fontSize:12, padding:20, textAlign:'center', background:'rgba(0,0,0,0.2)', borderRadius:10 }}>
                         🔒 As mensagens deste chat são protegidas com criptografia de ponta-a-ponta.
                      </div>
                   )}
                </div>

                <div className="phone-input-area">
                   <span className="input-icon">+</span>
                   <div className="fake-input">Mensagem...</div>
                   <span className="input-icon">🎤</span>
                </div>
             </>
          )}

          {/* BARRA HOME (iPhone Style) */}
          <div className="home-indicator" />
       </div>
    </div>
   );
}
