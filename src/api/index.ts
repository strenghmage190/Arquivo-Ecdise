import { supabase } from '../supabaseClient';

export async function getInvestigations() {
  const { data, error } = await supabase.from('investigations').select('*').order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getInvestigationById(id: string) {
  const { data, error } = await supabase.from('investigations').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
}
