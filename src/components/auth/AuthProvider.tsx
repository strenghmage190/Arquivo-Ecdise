import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import type { Session } from '@supabase/supabase-js';

const AuthContext = createContext<{ session: Session | null; loading: boolean }>({ session: null, loading: true });

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pega sessão inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setLoading(false);
    }).catch(err => {
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
      try { subscription.unsubscribe(); } catch (e) { /* ignore */ }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ session, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};
