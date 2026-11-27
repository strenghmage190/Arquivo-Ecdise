import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  loading: true,
  isPasswordRecovery: false,
  clearPasswordRecovery: () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.location.hash.includes('type=recovery');
  });

  const clearPasswordRecovery = useCallback(() => {
    setIsPasswordRecovery(false);
  }, []);

  useEffect(() => {
    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setLoading(false);
    }).catch(err => {
      console.error('getSession error', err);
      setLoading(false);
    });

    // Ouve mudanças (login, logout, password recovery)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      } else if (event === 'SIGNED_OUT') {
        setIsPasswordRecovery(false);
      }
      setSession(session ?? null);
      setLoading(false);
    });

    return () => {
      try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading, isPasswordRecovery, clearPasswordRecovery }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
