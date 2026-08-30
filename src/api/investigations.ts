import { supabase } from '../supabaseClient';
import { nanoid } from 'nanoid';
import { isValidId } from '../utils/supabaseHelpers';

// --- Allowlists para Mass Assignment ---
const INVESTIGATION_UPDATABLE_FIELDS = [
  'title', 'description', 'cover_url', 'whiteboard_data', 'conspiracy_board_data',
] as const;
type InvestigationUpdatableKey = typeof INVESTIGATION_UPDATABLE_FIELDS[number];

const CARD_UPDATABLE_FIELDS = [
  'title', 'description_public', 'description_hidden', 'image_url', 'image_uv_url',
  'video_url', 'audio_url', 'audio_hidden_url', 'audio_target_freq', 'image_filter_layer',
  'is_locked', 'lock_password', 'is_hidden', 'discovery_code', 'x', 'y', 'z_index',
  'visibility', 'tags', 'insights', 'metadata', 'chat_data', 'chat_contact_name', 'type',
] as const;
type CardUpdatableKey = typeof CARD_UPDATABLE_FIELDS[number];

function pickAllowed<T extends string>(obj: Record<string, unknown>, allowed: readonly T[]): Partial<Record<T, unknown>> {
  return Object.fromEntries(
    Object.entries(obj).filter(([k]) => (allowed as readonly string[]).includes(k))
  ) as Partial<Record<T, unknown>>;
}


// --- Types ---
export interface InvestigationCardInsight {
  id: string;
  skill: string;
  cost: number;
  text: string;
  visibility?: 'hidden' | 'group' | 'player';
  reveal_to?: string[];
}

export interface InvestigationCard {
  id?: string;
  investigation_id: string;
  title: string;
  image_uv_url?: string | null;
  video_url?: string | null;
  image_url?: string | null;
  description_public?: string | null;
  description_hidden?: string | null;
  x?: number;
  y?: number;
  z_index?: number;
  visibility?: any;
  tags?: string[];
  insights?: InvestigationCardInsight[];
  metadata?: any;
  chat_data?: any;
  chat_contact_name?: string | null;
  audio_url?: string | null;
  audio_hidden_url?: string | null;
  audio_target_freq?: number | null;
  is_locked?: boolean;
  lock_password?: string | null;
  is_hidden?: boolean;
  discovery_code?: string | null;
}

// --- QUADRO (BOARD) ---
export async function fetchInvestigationById(id: string) {
  const { data, error } = await supabase
    .from('investigations')
    .select('id, title, description, cover_url, created_at, owner_id, whiteboard_data, conspiracy_board_data, campaign_id')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('fetchInvestigationById error', error);
    throw error;
  }

  if (!data) {
    console.warn('fetchInvestigationById: no investigation found for id', id);
    return null;
  }
  return data;
}

export async function updateInvestigation(id: string, updates: Partial<Record<InvestigationUpdatableKey, unknown>>) {
  const safe = pickAllowed(updates as Record<string, unknown>, INVESTIGATION_UPDATABLE_FIELDS);
  const { data, error } = await supabase
    .from('investigations')
    .update(safe as any)
    .eq('id', id)
    .select('id, title, description, cover_url, created_at, owner_id, whiteboard_data, conspiracy_board_data')
    .single();
  if (error) {
    console.error('updateInvestigation error', error);
    throw error;
  }
  return data;
}

// Backwards-compatible alias
export const getInvestigationById = fetchInvestigationById;

// --- CARTAS (CARDS/CLUES) ---
export async function fetchCards(investigationId: string) {
  return fetchCardsForInvestigation(investigationId);
}

export async function fetchCardsForInvestigation(investigationId: string) {
  const { data, error } = await supabase
    .from('investigation_cards')
    .select('*')
    .eq('investigation_id', investigationId);
  if (error) {
    console.error('Erro ao buscar cards:', error);
    return [];
  }
  return data || [];
}

export async function createCard(payload: any) {
  const { data, error } = await supabase
    .from('investigation_cards')
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function createInvestigationCard(card: InvestigationCard) {
  const payload: any = {
    investigation_id: card.investigation_id,
    title: card.title,
    type: (card as any).type || null, // ← ADICIONAR ESTE CAMPO!
    image_uv_url: (card as any).image_uv_url || null,
    video_url: (card as any).video_url || null,
    image_filter_layer: (card as any).image_filter_layer || null,
    image_url: card.image_url || null,
    audio_url: (card as any).audio_url || null,
    audio_hidden_url: (card as any).audio_hidden_url || null,
    audio_target_freq: (card as any).audio_target_freq || null,
    is_locked: (card as any).is_locked || false,
    lock_password: (card as any).lock_password || null,
    is_hidden: (card as any).is_hidden || false,
    discovery_code: card.discovery_code || null,
    description_public: card.description_public || null,
    description_hidden: card.description_hidden || null,
    x: card.x ?? 0,
    y: card.y ?? 0,
    z_index: card.z_index ?? 0,
    visibility: card.visibility || null,
    tags: card.tags || [],
    insights: card.insights || [],
    metadata: (card as any).metadata || {},
    chat_data: (card as any).chat_data || null,
    chat_contact_name: (card as any).chat_contact_name || null,
  };
  try {
    const { data, error } = await supabase
      .from('investigation_cards')
      .insert(payload)
      .select()
      .single();
    if (error) {
      console.error('Erro ao criar card');
      throw error;
    }
    return data;
  } catch (err) {
    console.error('createInvestigationCard unexpected error');
    throw err;
  }
}

export async function updateCard(id: string, updates: Partial<Record<CardUpdatableKey, unknown>>) {
  const safe = pickAllowed(updates as Record<string, unknown>, CARD_UPDATABLE_FIELDS);
  const { data, error } = await supabase
    .from('investigation_cards')
    .update(safe as any)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvestigationCard(id: string, patch: Partial<InvestigationCard>) {
  const { data, error } = await (supabase as any)
    .from('investigation_cards')
    .update(patch as any)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    console.error('Erro ao atualizar card:', error);
    throw error;
  }
  return data;
}

export async function deleteCard(id: string) {
  const { error } = await supabase.from('investigation_cards').delete().eq('id', id);
  if (error) throw error;
  return true;
}

export async function deleteInvestigationCard(id: string) {
  const { error } = await supabase
    .from('investigation_cards')
    .delete()
    .eq('id', id);
  if (error) {
    console.error('Erro ao deletar card:', error);
    throw error;
  }
  return true;
}

export async function fetchOrCreateInvestigationForCampaign(campaignId: string) {
  try {
    if (!isValidId(campaignId)) {
      console.warn('fetchOrCreateInvestigationForCampaign called with invalid campaignId:', campaignId);
      return null;
    }
    const { data: existing, error: selErr } = await supabase
      .from('investigations')
      .select('id, title, owner_id, created_at, campaign_id')
      .eq('campaign_id', campaignId)
      .limit(1)
      .maybeSingle();

    if (selErr) {
      console.error('Erro ao buscar investigation para campanha:', selErr);
      throw selErr;
    }

    if (existing) return existing;

    const userRes = await supabase.auth.getUser();
    const currentUserId = userRes.data?.user?.id || null;
    const { data: created, error: insErr } = await (supabase as any)
      .from('investigations')
      .insert({ campaign_id: campaignId, name: 'Quadro de Investigação', owner_id: currentUserId, created_by: currentUserId } as any)
      .select()
      .single();

    if (insErr) {
      console.error('Erro ao criar investigation para campanha:', insErr);
      throw insErr;
    }
    return created;
  } catch (e) {
    console.error('fetchOrCreateInvestigationForCampaign erro inesperado', e);
    throw e;
  }
}

// Fetch basic details including owner_id for permission checks
export async function fetchInvestigationDetails(id: string) {
  const { data, error } = await supabase
    .from('investigations')
    .select('id, title, owner_id')
    .eq('id', id)
    .single();
  if (error) {
    console.error('fetchInvestigationDetails error', error);
    throw error;
  }
  return data;
}

// ...existing code...
// ...existing code...

// Create a new investigation and set current user as owner
export async function createInvestigation(title: string, description?: string, coverUrl?: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await (supabase as any)
    .from('investigations')
    .insert([{ title, owner_id: user.id, description: description || null, cover_url: coverUrl || null } as any])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInvestigation(id: string) {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) throw new Error('Usuário não autenticado');

  const { error } = await supabase.from('investigations').delete().eq('id', id);
  if (error) throw error;
  return true;
}

// --- INVITES ---
export async function createInviteLink(investigationId: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;
  if (!user) return null;

  const invite_code = nanoid(10);

  const { data, error } = await (supabase as any)
    .from('investigation_invites')
    .insert({ investigation_id: investigationId, invite_code, created_by: user.id } as any)
    .select()
    .single();

  if (error) {
    console.error('createInviteLink error', error);
    throw error;
  }
  return data;
}
