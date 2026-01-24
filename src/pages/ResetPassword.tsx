import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login'
      });
      if (error) throw error;
      setMsg('Verifique seu email. Instruções para redefinir sua senha foram enviadas.');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erro ao solicitar redefinição. Por favor, tente novamente mais tarde ou entre em contato com o suporte.';
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-terminal">
      <div className="terminal-box">
        <h1 className="ordo-logo">RECUPERAR ACESSO</h1>

        <p style={{ textAlign: 'center', marginBottom: 20, color: '#888' }}>
          Informe o email cadastrado para receber o link de redefinição.
        </p>

        <form onSubmit={handleReset}>
          <div className="input-group">
            <label>EMAIL</label>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="agente@ordo.com" />
          </div>

          <button disabled={loading} className="btn-access">
            {loading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}
          </button>

          {msg && <div className="system-msg">{msg}</div>}
        </form>
      </div>
    </div>
  );
}
