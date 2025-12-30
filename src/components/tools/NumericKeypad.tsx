import React, { useState } from 'react';

export default function NumericKeypad({ code, onUnlock }: any) {
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'locked' | 'error' | 'success'>('locked');

  const handlePress = (num: string) => {
    if (input.length >= 6) return;
    const next = input + num;
    setInput(next);
  };

  const handleEnter = () => {
    if (input === code) {
      setStatus('success');
      setTimeout(() => { onUnlock && onUnlock(); }, 500);
    } else {
      setStatus('error');
      setTimeout(() => { setInput(''); setStatus('locked'); }, 800);
    }
  };

  const btnStyle: React.CSSProperties = { padding: 15, background: '#333', border: '1px solid #444', color: '#fff', fontSize: 18, borderRadius: 5, cursor: 'pointer' };

  return (
    <div style={{background: '#222', padding: 20, borderRadius: 10, width: 220, margin:'0 auto', boxShadow:'0 5px 15px #000'}}>
       <div style={{
          background: status==='error'?'#500' : (status==='success'?'#050':'#000'), 
          height: 48, marginBottom: 15, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'monospace', fontSize: 24, color: '#fff', letterSpacing: 5
       }}>
          {status === 'error' ? 'ERROR' : (status==='success' ? 'OPEN' : input.replace(/./g, '*'))}
       </div>

       <div style={{display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10}}>
          {[1,2,3,4,5,6,7,8,9].map(n => (
             <button key={n} onClick={() => handlePress(String(n))} style={btnStyle}>{n}</button>
          ))}
          <button style={{...btnStyle, color:'#d63031'}} onClick={() => setInput('')}>C</button>
          <button style={btnStyle} onClick={() => handlePress('0')}>0</button>
          <button style={{...btnStyle, color:'#00b894'}} onClick={handleEnter}>⏎</button>
       </div>
    </div>
  );
}
