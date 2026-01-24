import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../components/auth/AuthProvider';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [msg, setMsg] = useState('');

  const validatePassword = (password: string) => {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasMinLength = password.length >= 8;
    return hasUpperCase && hasLowerCase && hasNumber && hasMinLength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    if (!validatePassword(newPassword)) {
      setMsg('A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas e números.');
    } else {
      setMsg('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');

    try {
      if (isSignUp) {
        const res = await supabase.auth.signUp({ email, password });
        console.debug('signUp response', res);
        if (res.error) throw res.error;
        setMsg('Solicitação enviada! Verifique seu email para confirmar o recrutamento.');
      } else {
        const res = await supabase.auth.signInWithPassword({ email, password });
        console.debug('signIn response', res);
        if (res.error) {
          // Mostra erro do supabase (mensagem mais detalhada)
          throw res.error;
        }
        // Se tiver sessão no retorno, informa usuário e redireciona
        if (res.data?.session) {
          setMsg('Sessão iniciada. Redirecionando...');
        } else {
          // Tenta obter sessão manualmente (caso seja retornada em outra call)
          try {
            const sess = await supabase.auth.getSession();
            console.debug('getSession after signIn', sess);
            if (sess.data?.session) {
              setMsg('Sessão iniciada. Redirecionando...');
            } else {
              setMsg('Resposta inesperada do servidor. Verifique o console (F12).');
              console.warn('signIn no session', res);
            }
          } catch (e) {
            console.error('getSession error after signIn', e);
            setMsg('Erro ao obter sessão; verifique o console.');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error', error);
      setMsg(error.message || JSON.stringify(error) || 'Erro ao acessar o sistema.');
    } finally {
      setLoading(false);
    }
  };

  // Pega a rota de retorno que o ProtectedRoute passou
  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    if (session) {
      navigate(from, { replace: true });
    }
  }, [session, from, navigate]);

  return (
    <div className="login-terminal">
      <div className="terminal-box">
        <h1 className="ordo-logo">
          Ordo Realitas
          <span>Terminal de Acesso C.R.I.S. // Ver 4.0.2</span>
        </h1>
        
        <p style={{ textAlign: 'center', marginBottom: 20, color: '#888' }}>
          {isSignUp ? 'RECRUTAMENTO DE NOVOS AGENTES' : 'ACESSO AO SISTEMA'}
        </p>

        <form onSubmit={handleAuth}>
          <div className="input-group">
            <label>IDENTIFICAÇÃO (EMAIL)</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="agente@ordo.com"
            />
          </div>

          <div className="input-group">
            <label>SENHA DE ACESSO</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={handlePasswordChange}
              placeholder="••••••••"
            />
          </div>

          <button disabled={loading} className="btn-access">
            {loading ? 'PROCESSANDO...' : (isSignUp ? 'ENVIAR SOLICITAÇÃO' : 'INICIAR SESSÃO')}
          </button>

          {msg && <div className="system-msg">{msg}</div>}
        </form>

        <div className="auth-switch">
          {isSignUp ? 'Já possui credencial?' : 'Ainda não é um agente?'}
          <button type="button" onClick={() => { setIsSignUp(!isSignUp); setMsg(''); }}>
            {isSignUp ? 'Acesse aqui' : 'Recrutar-se'}
          </button>
        </div>

        <div style={{ textAlign: 'center', marginTop: 10 }}>
          <button type="button" onClick={() => navigate('/reset-password')} style={{ background: 'none', border: 'none', color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>
            Esqueci minha senha
          </button>
        </div>
      </div>
    </div>
  );
}
