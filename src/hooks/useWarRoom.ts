import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import throttle from 'lodash.throttle';

// Tipos
export type AgentInfo = {
  codename: string;
  clearance_level: string;
  specialization: string;
  avatar_url?: string;
};

export type AgentPresence = {
  user_id: string;
  code_name: string;
  avatar_url?: string;
  online_at: string;
  color: string;
  clearance_level: string;
  specialization: string;
};

export type CursorPosition = {
  x: number;
  y: number;
  user_id: string;
  info?: AgentInfo;
};

// Mapeamento de cores baseado no clearance level
const CLEARANCE_COLORS: Record<string, string> = {
  'BRANCO': '#e0e0e0',
  'AMARELO': '#FFD700',
  'LARANJA': '#FF8C00',
  'VERMELHO': '#DC143C',
  'PRETO': '#333333',
  'ALFA': '#4169E1',
  'OMEGA': '#8B00FF'
};

// Helper para obter cor baseada no clearance level
const getClearanceColor = (clearance?: string): string => {
  if (!clearance) return CLEARANCE_COLORS['BRANCO'];
  return CLEARANCE_COLORS[clearance.toUpperCase()] || CLEARANCE_COLORS['BRANCO'];
};

export const useWarRoom = (investigationId: string, currentUser: any) => {
  const [agents, setAgents] = useState<AgentPresence[]>([]);
  const [cursors, setCursors] = useState<Record<string, CursorPosition>>({});
  const [userProfile, setUserProfile] = useState<AgentInfo | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Buscar perfil do usuário atual
  useEffect(() => {
    if (!currentUser?.id) return;

    const fetchUserProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('codename, clearance_level, specialization, avatar_url')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.warn('[War Room] Profile not found, using defaults:', error);
          setUserProfile({
            codename: currentUser.user_metadata?.code_name || 'Agente Desconhecido',
            clearance_level: 'BRANCO',
            specialization: 'Investigação de Campo',
            avatar_url: currentUser.user_metadata?.avatar_url
          });
        } else if (data) {
          setUserProfile({
            codename: (data as any).codename || 'Agente Desconhecido',
            clearance_level: (data as any).clearance_level || 'BRANCO',
            specialization: (data as any).specialization || 'Investigação de Campo',
            avatar_url: (data as any).avatar_url || currentUser.user_metadata?.avatar_url
          });
        }
      } catch (err) {
        console.error('[War Room] Error fetching profile:', err);
      }
    };

    fetchUserProfile();
  }, [currentUser]);

  useEffect(() => {
    if (!investigationId || !currentUser || !userProfile) return;

    // 1. Configurar o Canal
    const channel = supabase.channel(`war_room:${investigationId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    // 2. Ouvir Mudanças de Presença (Quem entra/sai)
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        const activeAgents: AgentPresence[] = [];
        
        for (const key in newState) {
          // Supabase presence retorna um array por chave
          const userState = newState[key][0] as any;
          if (userState) {
            const clearance = userState.clearance_level || 'BRANCO';
            activeAgents.push({
              user_id: key,
              code_name: userState.code_name || 'Agente Desconhecido',
              avatar_url: userState.avatar_url,
              online_at: new Date().toISOString(),
              color: getClearanceColor(clearance),
              clearance_level: clearance,
              specialization: userState.specialization || 'Investigação de Campo'
            });
          }
        }
        setAgents(activeAgents);
      })
      // 3. Ouvir Movimento de Mouse (Broadcast leve)
      .on('broadcast', { event: 'cursor-pos' }, (payload) => {
        const { x, y, user_id, info } = payload.payload;
        if (user_id === currentUser.id) return; // Ignora o próprio cursor

        setCursors((prev) => ({
          ...prev,
          [user_id]: { x, y, user_id, info },
        }));
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Envia dados iniciais do usuário atual com perfil completo
          await channel.track({
            code_name: userProfile.codename,
            avatar_url: userProfile.avatar_url || '',
            clearance_level: userProfile.clearance_level,
            specialization: userProfile.specialization,
            online_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [investigationId, currentUser, userProfile]);

  // Função throttled para enviar posição do mouse (Max 10x por segundo)
  const broadcastCursor = useCallback(
    throttle((x: number, y: number) => {
      if (channelRef.current && userProfile) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'cursor-pos',
          payload: { 
            x, 
            y, 
            user_id: currentUser.id,
            info: {
              codename: userProfile.codename,
              clearance_level: userProfile.clearance_level,
              specialization: userProfile.specialization,
              avatar_url: userProfile.avatar_url
            }
          },
        });
      }
    }, 100),
    [currentUser, userProfile]
  );

  return { agents, cursors, broadcastCursor };
};
