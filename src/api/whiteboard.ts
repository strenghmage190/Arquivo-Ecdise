import { supabase } from '../supabaseClient';

export async function saveConspiracyBoard(investigationId: string, elements: any, appState: any, files: any) {
  try {
    // try to capture the current user id for metadata
    let userId: string | null = null;
    try { const u = await supabase.auth.getUser(); userId = u.data.user?.id || null; } catch (e) { /* ignore */ }
    const payload = { elements, appState, files, _meta: { modified_by: userId, modified_at: new Date().toISOString() } };

    const { error } = await supabase
      .from('investigations')
      .update({ conspiracy_board_data: payload })
      .eq('id', investigationId);
    if (error) console.error('Erro ao salvar quadro:', error);
    return { ok: !error, error };
  } catch (e) {
    console.error('saveConspiracyBoard unexpected error', e);
    return { ok: false, error: e };
  }
}

export async function fetchConspiracyBoard(investigationId: string) {
  try {
    const { data, error } = await supabase
      .from('investigations')
      .select('conspiracy_board_data')
      .eq('id', investigationId)
      .single();
    if (error) {
      console.error('fetchConspiracyBoard error', error);
      return null;
    }
    return data?.conspiracy_board_data || null;
  } catch (e) {
    console.error('fetchConspiracyBoard unexpected error', e);
    return null;
  }
}

export default { saveConspiracyBoard, fetchConspiracyBoard };
