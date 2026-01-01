import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is not set');
}

/**
 * ✅ SINGLETON PATTERN
 * 
 * Ensures only ONE instance of Supabase client exists across the app.
 * This prevents state desynchronization and multiple connections.
 */
let supabaseInstance: ReturnType<typeof createClient> | null = null;

function getSupabaseClient() {
  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
    console.log('[Supabase] Client instantiated (singleton)');
  } else {
    console.debug('[Supabase] Returning existing instance');
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
