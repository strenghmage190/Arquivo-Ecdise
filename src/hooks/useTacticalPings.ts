import { useCallback, useEffect, useRef, useState } from 'react';
import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient';
import { TacticalPingEvent } from '../types/collaboration';

function playRadarPingBeep() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(980, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1420, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
    osc.onended = () => {
      try { ctx.close(); } catch {}
    };
  } catch {
    // No-op if AudioContext is unavailable or blocked by browser autoplay policy
  }
}

export function useTacticalPings(
  investigationId: string,
  userId?: string,
  authorName: string = 'Agente'
) {
  const [tacticalPings, setTacticalPings] = useState<TacticalPingEvent[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  const pushPing = useCallback((ping: TacticalPingEvent) => {
    playRadarPingBeep();
    setTacticalPings((prev) => [...prev, ping]);
    window.setTimeout(() => {
      setTacticalPings((prev) => prev.filter((p) => p.id !== ping.id));
    }, 2300);
  }, []);

  useEffect(() => {
    if (!investigationId) return;
    const channel = supabase.channel(`tactical_pings:${investigationId}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on('broadcast', { event: 'tactical-ping' }, ({ payload }) => {
        if (!payload) return;
        pushPing({
          id: payload.id || `${Date.now()}-${Math.random()}`,
          x: Number(payload.x) || 0,
          y: Number(payload.y) || 0,
          authorName: payload.authorName || 'Agente',
          userId: payload.userId,
          createdAt: Date.now(),
        });
      })
      .subscribe();

    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [investigationId, pushPing]);

  const sendTacticalPing = useCallback(
    (x: number, y: number) => {
      const ping: TacticalPingEvent = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        x,
        y,
        authorName,
        userId,
        createdAt: Date.now(),
      };
      pushPing(ping);
      if (channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'tactical-ping',
          payload: ping,
        });
      }
    },
    [authorName, userId, pushPing]
  );

  return { tacticalPings, sendTacticalPing };
}
