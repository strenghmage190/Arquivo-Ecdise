import { supabase } from '../supabaseClient';
import { nanoid } from 'nanoid';
import { isValidId } from '../utils/supabaseHelpers';

// Debug helper: perform low-level REST fetch to capture raw PostgREST error body
async function debugFetchInvestigationsRest() {
  try {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
    const anon = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';
    if (!supabaseUrl) return null;
    const url = `${supabaseUrl.replace(/\/+$/, '')}/rest/v1/investigations?select=*&order=created_at.desc`;
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        Accept: '*/*',
      },
    });
    const text = await res.text();
    console.error('debugFetchInvestigationsRest', { status: res.status, statusText: res.statusText, body: text });
    return { status: res.status, body: text };
  } catch (e) {
    console.error('debugFetchInvestigationsRest failed', e);
    return null;
  }
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
  image_url?: string | null;
  description_public?: string | null;
  description_hidden?: string | null;
  x?: number;
  y?: number;
  z_index?: number;
  visibility?: any;
  tags?: string[];
  insights?: InvestigationCardInsight[];
}

// --- QUADRO (BOARD) ---
export async function fetchInvestigationById(id: string) {
  const { data, error } = await supabase
    .from('investigations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('fetchInvestigationById error', error);
    await debugFetchInvestigationsRest();
    throw error;
  }

  if (!data) {
    console.warn('fetchInvestigationById: no investigation found for id', id);
    return null;
  }
  return data;
}

export async function updateInvestigation(id: string, updates: any) {
  const { data, error } = await supabase
    .from('investigations')
    .update(updates)
    .eq('id', id)
    .select()
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
    image_uv_url: (card as any).image_uv_url || null,
    image_filter_layer: (card as any).image_filter_layer || null,
    image_url: card.image_url || null,
    audio_url: (card as any).audio_url || null,
    audio_hidden_url: (card as any).audio_hidden_url || null,
    audio_target_freq: (card as any).audio_target_freq || null,
    is_locked: (card as any).is_locked || false,
    lock_password: (card as any).lock_password || null,
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
    // debug: log payload shape being sent to Supabase
    // eslint-disable-next-line no-console
    console.debug('createInvestigationCard: payload', payload);
    const { data, error } = await supabase
      .from('investigation_cards')
      .insert(payload)
      .select()
      .single();
    if (error) {
      // eslint-disable-next-line no-console
      console.error('Erro ao criar card:', error);
      throw error;
    }
    // eslint-disable-next-line no-console
    console.debug('createInvestigationCard: response', data);
    return data;
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('createInvestigationCard unexpected error', err);
    throw err;
  }
}

export async function updateCard(id: string, updates: any) {
  const { data, error } = await supabase
    .from('investigation_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateInvestigationCard(id: string, patch: Partial<InvestigationCard>) {
  const { data, error } = await supabase
    .from('investigation_cards')
    .update(patch)
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
      .select('*')
      .eq('campaign_id', campaignId)
      .limit(1)
      .maybeSingle();

    if (selErr) {
      console.error('Erro ao buscar investigation para campanha:', selErr);
      await debugFetchInvestigationsRest();
      throw selErr;
    }

    if (existing) return existing;

    const userRes = await supabase.auth.getUser();
    const currentUserId = userRes.data?.user?.id || null;
    const { data: created, error: insErr } = await supabase
      .from('investigations')
      .insert({ campaign_id: campaignId, name: 'Quadro de Investigação', owner_id: currentUserId, created_by: currentUserId })
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
    await debugFetchInvestigationsRest();
    throw error;
  }
  return data;
}

// --- NOTES (Sticky Post-its) ---
export async function fetchNotes(investigationId: string) {
  const { data, error } = await supabase
    .from('investigation_notes')
    .select('*')
    .eq('investigation_id', investigationId);
  if (error) {
    console.error('fetchNotes error', error);
    return [];
  }
  return data || [];
}

export async function createNote(investigationId: string, payload: any) {
  const body = {
    investigation_id: investigationId,
    content: payload.content || null,
    color: payload.color || '#f1c40f',
    x: payload.x ?? 100,
    y: payload.y ?? 100,
  };
  const { data, error } = await supabase.from('investigation_notes').insert(body).select().single();
  if (error) {
    console.error('createNote error', error);
    throw error;
  }
  return data;
}

export async function updateNote(id: string, updates: any) {
  const { data, error } = await supabase.from('investigation_notes').update(updates).eq('id', id).select().single();
  if (error) {
    console.error('updateNote error', error);
    throw error;
  }
  return data;
}

export async function deleteNote(id: string) {
  const { error } = await supabase.from('investigation_notes').delete().eq('id', id);
  if (error) {
    console.error('deleteNote error', error);
    throw error;
  }
  return true;
}

// Create a new investigation and set current user as owner
export async function createInvestigation(title: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;
  if (!user) throw new Error('Usuário não autenticado');

  const { data, error } = await supabase
    .from('investigations')
    .insert([{ title: title, owner_id: user.id }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// --- INVITES ---
export async function createInviteLink(investigationId: string) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user || null;
  if (!user) return null;

  const invite_code = nanoid(10);

  const { data, error } = await supabase
    .from('investigation_invites')
    .insert({ investigation_id: investigationId, invite_code, created_by: user.id })
    .select()
    .single();

  if (error) {
    console.error('createInviteLink error', error);
    throw error;
  }
  return data;
}
