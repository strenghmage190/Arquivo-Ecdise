import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './Login.css';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/login',
      });
      if (error) throw error;
      setMsg('Verifique seu email. Instruções para redefinir sua senha foram enviadas.');
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        'Erro ao solicitar redefinição. Por favor, tente novamente mais tarde ou entre em contato com o suporte.';
      setMsg(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-terminal">
      <div className="terminal-box">
        <h1 className="ordo-logo">
          RECUPERAR ACESSO
          <span>Terminal C.R.I.S. // Protocolo de Redefinição</span>
        </h1>

        <p style={{ textAlign: 'center', marginBottom: 20, color: 'var(--text-secondary, #94a3b8)', fontSize: 13, lineHeight: 1.5 }}>
          Informe o email cadastrado para receber o link de redefinição.
        </p>

        <form onSubmit={handleReset}>
          <div className="input-group">
            <label htmlFor="reset-email">EMAIL</label>
            <input
              id="reset-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agente@ordo.com"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-access">
            {loading ? 'ENVIANDO...' : 'ENVIAR INSTRUÇÕES'}
          </button>

          {msg && <div className="system-msg" role="status">{msg}</div>}
        </form>

        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => navigate('/login')}
          >
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
