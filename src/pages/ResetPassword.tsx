import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../supabaseClient';
import { useAuth } from '../components/auth/AuthProvider';
import './Login.css';

function validateStrongPassword(value: string) {
  return (
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /[0-9]/.test(value) &&
    value.length >= 8
  );
}

export default function ResetPassword() {
  const navigate = useNavigate();
  const { session, isPasswordRecovery, clearPasswordRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const isRecoverySession = Boolean(
    isPasswordRecovery && session
  );

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
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

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    if (!validateStrongPassword(newPassword)) {
      setMsg('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMsg('As senhas digitadas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      clearPasswordRecovery();
      toast.success('Senha atualizada com sucesso!');
      navigate('/', { replace: true });
    } catch (err: any) {
      setMsg(err?.message || 'Erro ao atualizar a senha. Solicite um novo link de recuperação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-terminal">
      <div className="terminal-box">
        <h1 className="ordo-logo">
          {isRecoverySession ? 'DEFINIR NOVA SENHA' : 'RECUPERAR ACESSO'}
          <span>Terminal C.R.I.S. // Protocolo de Redefinição</span>
        </h1>

        {isRecoverySession ? (
          <>
            <p style={{ textAlign: 'center', marginBottom: 20, color: 'var(--text-secondary, #94a3b8)', fontSize: 13, lineHeight: 1.5 }}>
              Credencial validada. Informe sua nova senha de acesso ao terminal.
            </p>
            <form onSubmit={handleUpdatePassword}>
              <div className="input-group">
                <label htmlFor="new-password">NOVA SENHA</label>
                <input
                  id="new-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres (A-Z, a-z, 0-9)"
                />
              </div>

              <div className="input-group">
                <label htmlFor="confirm-password">CONFIRMAR SENHA</label>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                />
              </div>

              <button type="submit" disabled={loading} className="btn-access">
                {loading ? 'ATUALIZANDO...' : 'SALVAR NOVA SENHA'}
              </button>

              {msg && <div className="system-msg" role="status">{msg}</div>}
            </form>
          </>
        ) : (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}
