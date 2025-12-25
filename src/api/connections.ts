import { supabase } from '../supabaseClient';

export async function fetchConnections(investigationId: string) {
  const { data, error } = await supabase
    .from('investigation_connections')
    .select('*')
    .eq('investigation_id', investigationId);
  if (error) return [];
  return data || [];
}

export async function createConnection(payload: any) {
  const cleanPayload = {
    ...payload,
    metadata: payload.metadata || {}
  };

  const { data, error } = await supabase
    .from('investigation_connections')
    .insert(cleanPayload)
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function deleteConnection(id: string) {
  const { error } = await supabase
    .from('investigation_connections')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}

export async function fetchConnectionsForInvestigation(investigationId: string) {
  const { data, error } = await supabase
    .from('investigation_connections')
    .select('*')
    .eq('investigation_id', investigationId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createInvestigationConnection(payload: { investigation_id: string; from_card_id: string; to_card_id: string; metadata?: any; color?: string }) {
  const meta = Object.assign({}, payload.metadata || {});
  if (payload.color) meta.color = payload.color;
  const insertPayload = {
    investigation_id: payload.investigation_id,
    from_card_id: payload.from_card_id,
    to_card_id: payload.to_card_id,
    metadata: meta,
    created_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('investigation_connections')
    .insert([insertPayload])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteInvestigationConnection(id: string) {
  const { data, error } = await supabase
    .from('investigation_connections')
    .delete()
    .eq('id', id);
  if (error) throw error;
  return true;
}
