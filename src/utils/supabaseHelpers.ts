import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, notifyRealtimeStatus, RealtimeConnectionStatus } from '../supabaseClient';

export function isValidId(id: string | null | undefined): boolean {
  if (!id || typeof id !== 'string') return false;
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

/**
 * Cria canal Realtime com listener de status integrado e reconexão automática resiliente
 */
export function createResilientChannel(
  channelName: string,
  onStatusChange?: (status: RealtimeConnectionStatus) => void
): RealtimeChannel {
  const channel = supabase.channel(channelName);

  channel.subscribe((status, err) => {
    const s = status as RealtimeConnectionStatus;
    notifyRealtimeStatus(s, channelName);
    onStatusChange?.(s);

    if (err) {
      console.warn(`[Realtime: ${channelName}] Status: ${status}, erro:`, err);
    }
  });

  return channel;
}

export default { isValidId, createResilientChannel };
