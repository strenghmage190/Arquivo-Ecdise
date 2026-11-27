import {
  fetchClueSecretsForInvestigation,
  inferLockTypeFromSecret,
  verifyClueSolution,
} from '../clueSecurity';
import { buildClueDbPayload } from '../../utils/cluePayloadBuilder';
import { supabase } from '../../supabaseClient';

jest.mock('../../supabaseClient', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('clueSecurity & Phase 5 payload builder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('inferLockTypeFromSecret detects keypad, pattern, and terminal', () => {
    expect(inferLockTypeFromSecret('4812')).toBe('keypad');
    expect(inferLockTypeFromSecret('1-2-5-8-9')).toBe('pattern');
    expect(inferLockTypeFromSecret('ECDISE-04')).toBe('terminal');
    expect(inferLockTypeFromSecret('')).toBe('terminal');
  });

  test('buildClueDbPayload omits plaintext lock_password when useServerSecret is true', () => {
    const payload = buildClueDbPayload({
      investigationId: 'inv-1',
      coreState: {
        title: 'Cofre da Ordo',
        evidenceType: 'document',
      },
      securityState: {
        isLocked: true,
        lockPass: '4812',
        useServerSecret: true,
        paceMode: 'between_sessions',
        rewardCardIds: ['reward-uuid-1', 'reward-uuid-2'],
      },
    });

    expect(payload.is_locked).toBe(true);
    expect(payload.lock_password).toBeNull();
    expect(payload.lock_type).toBe('keypad');
    expect(payload.pace_mode).toBe('between_sessions');
    expect(payload.reward_card_ids).toEqual(['reward-uuid-1', 'reward-uuid-2']);
  });

  test('verifyClueSolution returns unlocked=true and reward IDs from RPC', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: { unlocked: true, unlocked_reward_ids: ['r-1'] },
      error: null,
    });

    const res = await verifyClueSolution('card-1', '4812', 'Agente K');
    expect(supabase.rpc).toHaveBeenCalledWith('verify_clue_solution', {
      p_card_id: 'card-1',
      p_attempt: '4812',
      p_solver_name: 'Agente K',
    });
    expect(res).toEqual({
      unlocked: true,
      unlocked_reward_ids: ['r-1'],
      error: undefined,
    });
  });

  test('verifyClueSolution falls back to legacy password only when RPC errors', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'function not found' },
    });

    const ok = await verifyClueSolution('card-1', 'ecdisc', 'Agente', 'ECDISC');
    expect(ok.unlocked).toBe(true);

    const fail = await verifyClueSolution('card-1', 'wrong', 'Agente', 'ECDISC');
    expect(fail.unlocked).toBe(false);
  });

  test('verifyClueSolution never unlocks when RPC errors and legacy password is null', async () => {
    (supabase.rpc as jest.Mock).mockResolvedValue({
      data: null,
      error: { message: 'rpc unavailable' },
    });

    const res = await verifyClueSolution('card-1', 'anything', 'Agente', null);
    expect(res.unlocked).toBe(false);
  });

  test('fetchClueSecretsForInvestigation maps returned rows by card_id', async () => {
    const eqMock = jest.fn().mockResolvedValue({
      data: [
        { card_id: 'c1', investigation_id: 'inv-1', secret_value: '4812', assist_hint: null },
        { card_id: 'c2', investigation_id: 'inv-1', secret_value: 'ECDISE', assist_hint: 'Dica' },
      ],
      error: null,
    });
    const selectMock = jest.fn(() => ({ eq: eqMock }));
    (supabase.from as jest.Mock).mockReturnValue({ select: selectMock });

    const map = await fetchClueSecretsForInvestigation('inv-1');
    expect(supabase.from).toHaveBeenCalledWith('clue_secrets');
    expect(Object.keys(map)).toEqual(['c1', 'c2']);
    expect(map.c1.secret_value).toBe('4812');
    expect(map.c2.secret_value).toBe('ECDISE');
  });
});
