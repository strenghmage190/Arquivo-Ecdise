/// <reference types="jest" />
import {
  createCaseFinding,
  createCasePin,
  updateCaseFinding,
  upsertCaseCardStatus,
} from '../collaboration';
import { supabase } from '../../supabaseClient';

jest.mock('../../supabaseClient', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockedSupabase = supabase as unknown as { from: jest.Mock };

describe('collaboration API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('createCasePin envia anchor_data e retorna o pin criado', async () => {
    const createdPin = {
      id: 'pin-1',
      investigation_id: 'inv-1',
      card_id: 'card-1',
      tool_type: 'acoustic',
      anchor_data: { timeSec: 18.2, channel: 'diff' },
      tag: 'look_here',
      note: 'Ouvir em L-R',
      is_resolved: false,
      author_name: 'Ana',
    };

    const single = jest.fn().mockResolvedValue({ data: createdPin, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockedSupabase.from.mockReturnValue({ insert });

    const result = await createCasePin({
      investigation_id: 'inv-1',
      card_id: 'card-1',
      tool_type: 'acoustic',
      anchor_data: { timeSec: 18.2, channel: 'diff' },
      tag: 'look_here',
      note: 'Ouvir em L-R',
      author_name: 'Ana',
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('case_pins');
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        investigation_id: 'inv-1',
        card_id: 'card-1',
        tool_type: 'acoustic',
        note: 'Ouvir em L-R',
      })
    );
    expect(result.id).toBe('pin-1');
  });

  it('createCaseFinding e updateCaseFinding funcionam com case_findings', async () => {
    const finding = {
      id: 'find-1',
      investigation_id: 'inv-1',
      category: 'code',
      label: '7492',
      author_name: 'Marcos',
    };

    const single = jest.fn().mockResolvedValue({ data: finding, error: null });
    const select = jest.fn(() => ({ single }));
    const insert = jest.fn(() => ({ select }));
    mockedSupabase.from.mockReturnValue({ insert });

    const created = await createCaseFinding({
      investigation_id: 'inv-1',
      category: 'code',
      label: ' 7492 ',
      author_name: 'Marcos',
    });
    expect(created.label).toBe('7492');

    const eq = jest.fn(() => ({ select }));
    const update = jest.fn(() => ({ eq }));
    mockedSupabase.from.mockReturnValue({ update });

    await updateCaseFinding('find-1', { label: '7493' });
    expect(mockedSupabase.from).toHaveBeenCalledWith('case_findings');
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ label: '7493' }));
  });

  it('upsertCaseCardStatus salva em case_card_status com onConflict', async () => {
    const row = {
      investigation_id: 'inv-1',
      card_id: 'card-9',
      team_status: 'stuck',
      updated_at: '2026-11-25T12:00:00Z',
    };
    const single = jest.fn().mockResolvedValue({ data: row, error: null });
    const select = jest.fn(() => ({ single }));
    const upsert = jest.fn(() => ({ select }));
    mockedSupabase.from.mockReturnValue({ upsert });

    const res = await upsertCaseCardStatus({
      investigation_id: 'inv-1',
      card_id: 'card-9',
      team_status: 'stuck',
    });

    expect(mockedSupabase.from).toHaveBeenCalledWith('case_card_status');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({ team_status: 'stuck' }),
      { onConflict: 'investigation_id,card_id' }
    );
    expect(res.team_status).toBe('stuck');
  });
});
