import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../components/auth/AuthProvider';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isPasswordRecovery } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [msg, setMsg] = useState('');

  const validatePassword = (value: string) => {
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasMinLength = value.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (isSignUp) {
      if (!validatePassword(newPassword)) {
        setMsg('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.');
      } else {
        setMsg('');
      }
    } else if (msg) {
      setMsg('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !validatePassword(password)) {
      setMsg('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.');
      return;
    }

    setLoading(true);
    setMsg('');

    try {
      if (isSignUp) {
        const res = await supabase.auth.signUp({ email, password });
        if (res.error) throw res.error;
        setMsg('Solicitação enviada! Verifique seu email para confirmar o recrutamento.');
      } else {
        const res = await supabase.auth.signInWithPassword({ email, password });
        if (res.error) {
          throw res.error;
        }
        if (res.data?.session) {
          setMsg('Sessão iniciada. Redirecionando...');
        } else {
          try {
            const sess = await supabase.auth.getSession();
            if (sess.data?.session) {
              setMsg('Sessão iniciada. Redirecionando...');
            } else {
              setMsg('Resposta inesperada do servidor. Tente novamente.');
            }
          } catch (err) {
            console.error('getSession error after signIn', err);
            setMsg('Erro ao obter sessão; tente novamente.');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error', error?.message || error);
      setMsg(error?.message || 'Erro ao acessar o sistema.');
    } finally {
      setLoading(false);
    }
  };

  // Pega a rota de retorno que o ProtectedRoute passou
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (isPasswordRecovery) {
      navigate('/reset-password', { replace: true });
      return;
    }
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, isPasswordRecovery, from, navigate]);

  return (
    <div className="login-terminal">
      <div className="terminal-box">
        <h1 className="ordo-logo">
          Ordo Realitas
          <span>Terminal de Acesso C.R.I.S. // Ver 4.0.2</span>
        </h1>
        
        <p style={{ textAlign: 'center', marginBottom: 20, color: '#E5E7EB' }}>
          {isSignUp ? 'RECRUTAMENTO DE NOVOS AGENTES' : 'ACESSO AO SISTEMA'}
        </p>

        <form onSubmit={handleAuth}>
          <div className="input-group">
            <label htmlFor="login-email">IDENTIFICAÇÃO (EMAIL)</label>
            <input
              id="login-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="agente@ordo.com"
            />
          </div>

          <div className="input-group">
            <label htmlFor="login-password">SENHA DE ACESSO</label>
            <input
              id="login-password"
              type="password"
              required
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-access" aria-label={isSignUp ? 'Enviar solicitação de recrutamento' : 'Iniciar sessão'}>
            {loading ? 'PROCESSANDO...' : (isSignUp ? 'ENVIAR SOLICITAÇÃO' : 'INICIAR SESSÃO')}
          </button>

          {msg && <div className="system-msg">{msg}</div>}
        </form>

        <div className="auth-switch">
          {isSignUp ? 'Já possui credencial?' : 'Ainda não é um agente?'}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }} aria-pressed={isSignUp} aria-label={isSignUp ? 'Ir para tela de login' : 'Ir para recrutamento'}>
            {isSignUp ? 'Acesse aqui' : 'Recrutar-se'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 4 }}>
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => navigate('/reset-password')}
            aria-label="Redefinir senha"
          >
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}
