import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set');
}

/**
 * SINGLETON PATTERN com Resiliência de Conexão e Auto-Reconexão Realtime
 */
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export type RealtimeConnectionStatus = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'CONNECTING';

export type RealtimeStatusListener = (status: RealtimeConnectionStatus, channelName: string) => void;

const statusListeners = new Set<RealtimeStatusListener>();

export function registerRealtimeStatusListener(listener: RealtimeStatusListener): () => void {
  statusListeners.add(listener);
  return () => {
    statusListeners.delete(listener);
  };
}

export function notifyRealtimeStatus(status: RealtimeConnectionStatus, channelName: string) {
  statusListeners.forEach((listener) => {
    try {
      listener(status, channelName);
    } catch (e) {
      console.error('[Supabase Realtime] Listener error:', e);
    }
  });
}

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // Listener global para status de canais e auto-reconexão online
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[Supabase] Conexão com a rede reestabelecida. Reconectando canais Realtime...');
        try {
          const channels = (supabaseInstance as any)?.getChannels?.() as RealtimeChannel[] | undefined;
          if (Array.isArray(channels)) {
            channels.forEach((ch) => {
              ch.subscribe((status) => {
                notifyRealtimeStatus(status as RealtimeConnectionStatus, ch.topic);
              });
            });
          }
        } catch (e) {
          console.warn('[Supabase] Erro ao re-sincronizar canais realtime:', e);
        }
      });
    }
  }
  return supabaseInstance;
}

export const supabase = getSupabaseClient();

/**
 * For debugging: check if singleton is working correctly
 */
export function getSupabaseInstance() {
  return getSupabaseClient();
}

export default supabase;
