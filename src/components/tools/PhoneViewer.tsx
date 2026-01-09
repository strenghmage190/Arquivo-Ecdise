import React, { useState, useEffect } from 'react';
import NumericKeypad from './NumericKeypad';
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
   onContactNameChange?: (name: string) => void;
}

export default function PhoneViewer({ chatData, contactName, isLocked = false, password, fullscreen = false, onContactNameChange }: PhoneViewerProps): React.ReactElement {
   const [unlocked, setUnlocked] = useState(!isLocked);
   const [editingName, setEditingName] = useState(false);
   const [localName, setLocalName] = useState(contactName || '');
   const [isBooting, setIsBooting] = useState(false);
   
   // Sincroniza o estado se a prop `isLocked` mudar de fora
   useEffect(() => {
      setUnlocked(!isLocked);
   }, [isLocked]);

   // keep localName in sync if prop changes from outside
   useEffect(() => {
      setLocalName(contactName || '');
   }, [contactName]);
   
   const handleUnlock = () => {
     setIsBooting(true);
     setTimeout(() => {
       setUnlocked(true);
       setIsBooting(false);
     }, 1200);
   };
   
   const displayChat = Array.isArray(chatData) ? chatData : [];
   const resolveText = (msg: PhoneMessage) => msg.text || msg.message || msg.body || '';

   // --- TELA DE BLOQUEIO ---
   if (!unlocked && password) {
      return (
         <div className="phone-mockup-wrapper">
            <div className={`nexus-phone-mockup locked ${fullscreen ? 'fullscreen' : ''}`}>
               <div className="phone-header locked-header">
                  <div className="contact-avatar locked-avatar">🔒</div>
                  <div className="contact-info">
                     <div className="contact-name">Dispositivo Bloqueado</div>
                     <div className="contact-status">Autenticação Requerida</div>
                  </div>
               </div>

               <div className="chat-body locked-body">
                  <div className="locked-copy">
                     <div className="locked-title">Interface Criptografada</div>
                     <div className="locked-sub">Acesse com o PIN definido</div>
                  </div>
                  
                  {isBooting ? (
                    <div className="booting-screen">
                      <div className="spinner"></div>
                      <p>Descriptografando...</p>
                    </div>
                  ) : (
                    <NumericKeypad 
                       code={password} 
                       onUnlock={handleUnlock} 
                    />
                  )}
               </div>
            </div>
         </div>
      );
   }

  // --- TELA DESBLOQUEADA ---
   return (
    <div className="phone-mockup-wrapper">
       <div className={`nexus-phone-mockup ${fullscreen ? 'fullscreen' : ''}`}>
          <div className="phone-header">
             <div className="contact-avatar">{(localName || contactName) ? (localName || contactName)![0].toUpperCase() : '?'}</div>
             <div className="contact-info">
                <div className={`contact-name ${editingName ? 'editing' : 'clickable'}`} onClick={() => setEditingName(true)}>
                      {editingName ? (
                         <input
                            className="contact-name-input"
                            value={localName}
                            onChange={e => setLocalName(e.target.value)}
                            onBlur={e => {
                               const newVal = (e.target as HTMLInputElement).value || '';
                               setEditingName(false);
                               setLocalName(newVal);
                               if (onContactNameChange) onContactNameChange(newVal);
                            }}
                            onKeyDown={e => {
                               if (e.key === 'Enter') {
                                  const input = e.target as HTMLInputElement;
                                  const newVal = input.value || '';
                                  input.blur();
                                  setLocalName(newVal);
                                  if (onContactNameChange) onContactNameChange(newVal);
                               }
                            }}
                            autoFocus
                         />
                      ) : (
                         (localName && localName.length > 0) ? localName : (contactName || 'Desconhecido')
                      )}
                </div>
                <div className="contact-status">Online</div>
             </div>
          </div>

          <div className="chat-body">
             {displayChat.length > 0 ? displayChat.map((msg, i) => {
                const text = resolveText(msg);
                const imageUrl = msg.image_url || msg.photo;
                return (
                  <div key={i} className={`nexus-bubble ${msg.sender === 'me' ? 'sent' : 'received'}`}>
                     {text && <div>{text}</div>}
                     {imageUrl && <img src={imageUrl} alt="chat media" className="chat-image" />}
                     <span className="msg-time">{msg.time || '00:00'}</span>
                  </div>
                );
             }) : (
                <div style={{textAlign:'center', color:'#555', fontSize:12, marginTop:20}}>
                   Nenhuma mensagem recuperada.
                </div>
             )}
          </div>

          <div className="phone-input">[Canal Seguro /// Apenas Leitura]</div>
       </div>
    </div>
  );
}
