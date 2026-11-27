import { supabase } from '../supabaseClient';
import { inferLockTypeFromSecret, PaceMode, LockType } from '../utils/cluePayloadBuilder';

export type { PaceMode, LockType };
export { inferLockTypeFromSecret };
export type SolveMethod = 'player_solution' | 'gm_override' | 'gm_assist';

export interface ClueSecretRecord {
  card_id: string;
  investigation_id: string;
  secret_value: string;
  assist_hint: string | null;
  updated_at?: string;
}

export interface VerifyClueResult {
  unlocked: boolean;
  unlocked_reward_ids?: string[];
  error?: string;
}

export interface GmOverrideResult {
  ok: boolean;
  mode?: 'assist_hint' | 'override_unlock';
  hint?: string;
  unlocked_reward_ids?: string[];
  error?: string;
}

export interface ClueSolveLogEntry {
  id: string;
  investigation_id: string;
  card_id: string;
  solved_by?: string | null;
  solver_name: string;
  method: SolveMethod;
  unlocked_reward_ids: string[];
  note?: string | null;
  created_at: string;
}

/**
 * GM-only: saves or updates the server-side secret in `clue_secrets` (protected by GM-only RLS).
 */
export async function upsertClueSecret(
  cardId: string,
  investigationId: string,
  secretValue: string,
  assistHint?: string | null
): Promise<boolean> {
  const clean = secretValue.trim();
  if (!cardId || !investigationId || !clean) return false;

  const { error } = await (supabase as any)
    .from('clue_secrets')
    .upsert(
      {
        card_id: cardId,
        investigation_id: investigationId,
        secret_value: clean,
        assist_hint: assistHint?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'card_id' }
    );

  if (error) {
    console.warn('[clueSecurity] upsertClueSecret failed (migration may not be applied yet):', error);
    return false;
  }
  return true;
}

/**
 * GM-only: fetches the stored secret when opening a card for editing.
 * Players will receive null/empty due to strict RLS.
 */
export async function fetchClueSecretForGM(cardId: string): Promise<ClueSecretRecord | null> {
  if (!cardId) return null;
  const { data, error } = await (supabase as any)
    .from('clue_secrets')
    .select('card_id, investigation_id, secret_value, assist_hint, updated_at')
    .eq('card_id', cardId)
    .maybeSingle();

  if (error) {
    return null;
  }
  return (data as ClueSecretRecord) || null;
}

/**
 * GM-only: fetches all stored secrets for an investigation (for GM Codes Panel).
 * Players will receive an empty array due to strict RLS.
 */
export async function fetchClueSecretsForInvestigation(
  investigationId: string
): Promise<Record<string, ClueSecretRecord>> {
  if (!investigationId) return {};
  const { data, error } = await (supabase as any)
    .from('clue_secrets')
    .select('card_id, investigation_id, secret_value, assist_hint, updated_at')
    .eq('investigation_id', investigationId);

  if (error || !Array.isArray(data)) {
    return {};
  }

  const byCardId: Record<string, ClueSecretRecord> = {};
  for (const row of data as ClueSecretRecord[]) {
    if (row?.card_id) byCardId[row.card_id] = row;
  }
  return byCardId;
}

/**
 * Server-side verification RPC (Anti-F12).
 * Falls back gracefully to legacy client check ONLY if the RPC is not yet deployed and a legacy password exists.
 */
export async function verifyClueSolution(
  cardId: string,
  attempt: string,
  solverName = 'Agente',
  legacyFallbackPassword?: string | null
): Promise<VerifyClueResult> {
  const cleanAttempt = String(attempt || '').trim();
  if (!cardId || !cleanAttempt) {
    return { unlocked: false, error: 'EMPTY_ATTEMPT' };
  }

  try {
    const { data, error } = await (supabase as any).rpc('verify_clue_solution', {
      p_card_id: cardId,
      p_attempt: cleanAttempt,
      p_solver_name: solverName,
    });

    if (!error && data && typeof data === 'object') {
      return {
        unlocked: Boolean(data.unlocked),
        unlocked_reward_ids: Array.isArray(data.unlocked_reward_ids) ? data.unlocked_reward_ids : [],
        error: data.error,
      };
    }

    // Fallback if RPC isn't deployed yet in the user's Supabase project
    if (error && legacyFallbackPassword) {
      const matched = cleanAttempt.toLowerCase() === String(legacyFallbackPassword).trim().toLowerCase();
      return {
        unlocked: matched,
        unlocked_reward_ids: [],
        error: matched ? undefined : 'INVALID_CREDENTIAL',
      };
    }

    return { unlocked: false, error: error?.message || 'RPC_ERROR' };
  } catch (err: any) {
    if (legacyFallbackPassword) {
      const matched = cleanAttempt.toLowerCase() === String(legacyFallbackPassword).trim().toLowerCase();
      return {
        unlocked: matched,
        unlocked_reward_ids: [],
        error: matched ? undefined : 'INVALID_CREDENTIAL',
      };
    }
    return { unlocked: false, error: err?.message || 'NETWORK_ERROR' };
  }
}

/**
 * GM-only live-session escape valve: triggers C.R.I.S. Assisted Calibration or Full Override Unlock.
 */
export async function triggerGmOverride(
  cardId: string,
  mode: 'assist_hint' | 'override_unlock',
  note?: string
): Promise<GmOverrideResult> {
  if (!cardId) return { ok: false, error: 'MISSING_CARD_ID' };

  try {
    const { data, error } = await (supabase as any).rpc('gm_override_clue', {
      p_card_id: cardId,
      p_mode: mode,
      p_note: note?.trim() || null,
    });

    if (error) {
      console.warn('[clueSecurity] gm_override_clue RPC error:', error);
      return { ok: false, error: error.message };
    }

    return {
      ok: Boolean(data?.ok),
      mode: data?.mode,
      hint: data?.hint,
      unlocked_reward_ids: Array.isArray(data?.unlocked_reward_ids) ? data.unlocked_reward_ids : [],
      error: data?.error,
    };
  } catch (err: any) {
    return { ok: false, error: err?.message || 'NETWORK_ERROR' };
  }
}

/**
 * Fetches recent puzzle solves / overrides for the GM Overwatch feed.
 */
export async function fetchSolveLog(investigationId: string, limit = 30): Promise<ClueSolveLogEntry[]> {
  if (!investigationId) return [];
  const { data, error } = await (supabase as any)
    .from('clue_solve_log')
    .select('id, investigation_id, card_id, solved_by, solver_name, method, unlocked_reward_ids, note, created_at')
    .eq('investigation_id', investigationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }
  return (data as ClueSolveLogEntry[]) || [];
}
