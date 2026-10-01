import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

// Spinner mínimo para evitar tela preta durante verificação de sessão
const AuthLoadingScreen = () => (
  <div style={{
    background: '#050505',
    height: '100dvh',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '16px',
    fontFamily: '"Share Tech Mono", monospace',
    color: '#b33030',
    letterSpacing: '3px',
    fontSize: '11px',
    textTransform: 'uppercase',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '2px solid #1a0505',
      borderTop: '2px solid #b33030',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    Verificando credenciais...
  </div>
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Timeout de segurança: se o Supabase não responder em 5s, desbloqueia a UI
    timeoutRef.current = setTimeout(() => {
      setLoading(false);
      console.warn('AuthProvider: getSession timeout — desbloqueando UI');
    }, 5000);

    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setSession(session ?? null);
      setLoading(false);
    }).catch(err => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      console.error('getSession error', err);
      setLoading(false);
    });

    // Ouve mudanças (login, logout)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.debug('onAuthStateChange', _event, session);
      setSession(session ?? null);
      setLoading(false);
    });

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {loading ? <AuthLoadingScreen /> : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
