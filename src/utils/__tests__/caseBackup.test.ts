/// <reference types="jest" />
import {
  assertInvestigationOwner,
  batchSetCardsVisibility,
  CaseBackupPayload,
  exportCaseBackup,
  importCaseBackup,
  resetLocalPuzzleProgress,
  UNAUTHORIZED_OWNER_ERROR,
} from '../caseBackup';
import { supabase } from '../../supabaseClient';
import {
  createInvestigation,
  createInvestigationCard,
  fetchCardsForInvestigation,
  fetchInvestigationById,
  fetchInvestigationDetails,
  updateCard,
  updateInvestigation,
} from '../../api/investigations';
import {
  createInvestigationConnection,
  fetchConnectionsForInvestigation,
} from '../../api/connections';

jest.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}));

jest.mock('../../api/investigations', () => ({
  fetchInvestigationDetails: jest.fn(),
  fetchInvestigationById: jest.fn(),
  fetchCardsForInvestigation: jest.fn(),
  createInvestigation: jest.fn(),
  createInvestigationCard: jest.fn(),
  updateCard: jest.fn(),
  updateInvestigation: jest.fn(),
}));

jest.mock('../../api/connections', () => ({
  fetchConnectionsForInvestigation: jest.fn(),
  createInvestigationConnection: jest.fn(),
}));

const mockedSupabase = supabase as unknown as {
  auth: { getUser: jest.Mock };
  from: jest.Mock;
};

const mockedFetchDetails = fetchInvestigationDetails as jest.Mock;
const mockedFetchInvById = fetchInvestigationById as jest.Mock;
const mockedFetchCards = fetchCardsForInvestigation as jest.Mock;
const mockedCreateInv = createInvestigation as jest.Mock;
const mockedCreateCard = createInvestigationCard as jest.Mock;
const mockedUpdateCard = updateCard as jest.Mock;
const mockedUpdateInv = updateInvestigation as jest.Mock;
const mockedFetchConnections = fetchConnectionsForInvestigation as jest.Mock;
const mockedCreateConnection = createInvestigationConnection as jest.Mock;

describe('caseBackup & GM Toolkit utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  describe('autorização estrita (owner_id)', () => {
    it('bloqueia exportCaseBackup quando user.id !== investigation.owner_id', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'intruder-user' } },
        error: null,
      });
      mockedFetchDetails.mockResolvedValue({
        id: 'inv-1',
        title: 'Caso Secreto',
        owner_id: 'owner-user',
      });

      await expect(exportCaseBackup('inv-1')).rejects.toThrow(
        UNAUTHORIZED_OWNER_ERROR
      );
      expect(mockedFetchInvById).not.toHaveBeenCalled();
      expect(mockedFetchCards).not.toHaveBeenCalled();
    });

    it('bloqueia importCaseBackup em caso existente quando user.id !== owner_id', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'intruder-user' } },
        error: null,
      });
      mockedFetchDetails.mockResolvedValue({
        id: 'inv-1',
        title: 'Caso Secreto',
        owner_id: 'owner-user',
      });

      const backup: CaseBackupPayload = {
        version: 1,
        exported_at: '2026-11-24T00:00:00.000Z',
        investigation: { title: 'Backup' },
        cards: [{ id: 'old-1', title: 'Pista' }],
        connections: [],
      };

      await expect(
        importCaseBackup({ targetInvestigationId: 'inv-1', backup })
      ).rejects.toThrow(UNAUTHORIZED_OWNER_ERROR);
      expect(mockedCreateCard).not.toHaveBeenCalled();
    });

    it('bloqueia batchSetCardsVisibility quando usuário não está autenticado ou não é dono', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: null,
      });

      await expect(
        batchSetCardsVisibility('inv-1', ['card-1'], true)
      ).rejects.toThrow(UNAUTHORIZED_OWNER_ERROR);
      expect(mockedSupabase.from).not.toHaveBeenCalled();
    });

    it('permite assertInvestigationOwner quando user.id === owner_id', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-user' } },
        error: null,
      });
      mockedFetchDetails.mockResolvedValue({
        id: 'inv-1',
        title: 'Caso Secreto',
        owner_id: 'owner-user',
      });

      const res = await assertInvestigationOwner('inv-1');
      expect(res.userId).toBe('owner-user');
      expect(res.investigation.id).toBe('inv-1');
    });
  });

  describe('exportCaseBackup', () => {
    it('sanitiza File e URLs blob: preservando cards e connections', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-1' } },
        error: null,
      });
      mockedFetchDetails.mockResolvedValue({
        id: 'inv-1',
        title: 'Caso Ecdise',
        owner_id: 'owner-1',
      });
      mockedFetchInvById.mockResolvedValue({
        id: 'inv-1',
        title: 'Caso Ecdise',
        description: 'Descrição do caso',
        cover_url: 'blob:http://localhost:5173/temp-cover',
        whiteboard_data: { notes: ['Nota 1'] },
      });

      const fakeFile = new File(['abc'], 'evidencia.png', { type: 'image/png' });
      mockedFetchCards.mockResolvedValue([
        {
          id: 'card-a',
          title: 'Pista A',
          image_url: 'https://cdn.test/a.png',
          previewUrl: 'blob:http://localhost:5173/temp-preview',
          imgFile: fakeFile,
          metadata: {
            tempBlob: 'blob:https://ecdise.app/123',
            kept: 'valor-seguro',
          },
        },
      ]);
      mockedFetchConnections.mockResolvedValue([
        {
          id: 'conn-1',
          from_card_id: 'card-a',
          to_card_id: 'card-b',
          metadata: { color: '#ff0000' },
        },
      ]);

      const backup = await exportCaseBackup('inv-1');

      expect(backup.version).toBe(1);
      expect(backup.investigation.title).toBe('Caso Ecdise');
      expect(backup.investigation.cover_url).toBeUndefined();
      expect(backup.investigation.whiteboard_data).toEqual({ notes: ['Nota 1'] });
      expect(backup.cards).toHaveLength(1);
      expect(backup.cards[0].image_url).toBe('https://cdn.test/a.png');
      expect(backup.cards[0].previewUrl).toBeUndefined();
      expect(backup.cards[0].imgFile).toBeUndefined();
      expect(backup.cards[0].metadata.tempBlob).toBeUndefined();
      expect(backup.cards[0].metadata.kept).toBe('valor-seguro');
      expect(backup.connections).toHaveLength(1);
      expect(backup.connections[0].from_card_id).toBe('card-a');
    });
  });

  describe('importCaseBackup', () => {
    it('rejeita JSON inválido sem array cards', async () => {
      await expect(
        importCaseBackup({
          targetInvestigationId: 'inv-1',
          backup: { version: 1 } as any,
        })
      ).rejects.toThrow(/inválido/i);
    });

    it('remapeia oldCardId -> newCardId em connections e mega_clue.required_puzzle_ids', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-1' } },
        error: null,
      });
      mockedFetchDetails.mockResolvedValue({
        id: 'inv-dest',
        title: 'Destino',
        owner_id: 'owner-1',
      });

      let seq = 0;
      mockedCreateCard.mockImplementation(async (payload: any) => {
        seq += 1;
        return {
          ...payload,
          id: `new-card-${seq}`,
        };
      });
      mockedUpdateCard.mockResolvedValue({});
      mockedCreateConnection.mockResolvedValue({ id: 'new-conn-1' });

      const backup: CaseBackupPayload = {
        version: 1,
        exported_at: '2026-11-24T00:00:00.000Z',
        investigation: { title: 'Caso Origem' },
        cards: [
          // Mega-clue aparece antes dos puzzles para testar remapeamento em duas passadas
          {
            id: 'old-mega',
            title: 'Verdade Final',
            type: 'mega_clue',
            metadata: {
              mega_clue: {
                required_puzzle_ids: ['old-p1', 'old-p2', 'old-inexistente'],
                final_truth_text: 'Segredo',
              },
            },
          },
          {
            id: 'old-p1',
            title: 'Puzzle 1',
            type: 'glitch_puzzle',
          },
          {
            id: 'old-p2',
            title: 'Puzzle 2',
            type: 'glitch_puzzle',
          },
        ],
        connections: [
          {
            from_card_id: 'old-p1',
            to_card_id: 'old-mega',
            metadata: { color: '#eab308' },
          },
          {
            // Conexão órfã deve ser ignorada
            from_card_id: 'old-p1',
            to_card_id: 'old-missing',
          },
        ],
      };

      const result = await importCaseBackup({
        targetInvestigationId: 'inv-dest',
        backup,
      });

      expect(result).toEqual({
        investigationId: 'inv-dest',
        importedCards: 3,
        importedConnections: 1,
      });

      // Mega clue é o 1º card inserido -> new-card-1; old-p1 -> new-card-2; old-p2 -> new-card-3
      expect(mockedUpdateCard).toHaveBeenCalledWith('new-card-1', {
        metadata: {
          mega_clue: {
            required_puzzle_ids: ['new-card-2', 'new-card-3'],
            final_truth_text: 'Segredo',
          },
        },
      });

      expect(mockedCreateConnection).toHaveBeenCalledTimes(1);
      expect(mockedCreateConnection).toHaveBeenCalledWith({
        investigation_id: 'inv-dest',
        from_card_id: 'new-card-2',
        to_card_id: 'new-card-1',
        metadata: { color: '#eab308' },
      });
    });

    it('cria nova investigação quando newInvestigationTitle é informado', async () => {
      mockedCreateInv.mockResolvedValue({
        id: 'new-inv-99',
        title: 'Novo Caso Clonado',
        owner_id: 'owner-1',
      });
      mockedUpdateInv.mockResolvedValue({});
      mockedCreateCard.mockResolvedValue({ id: 'new-c1', metadata: {} });

      const result = await importCaseBackup({
        newInvestigationTitle: 'Novo Caso Clonado',
        backup: {
          version: 1,
          exported_at: '2026-11-24T00:00:00.000Z',
          investigation: {
            title: 'Original',
            description: 'Desc',
            whiteboard_data: { zoom: 1 },
          },
          cards: [{ id: 'old-c1', title: 'Pista 1' }],
          connections: [],
        },
      });

      expect(mockedCreateInv).toHaveBeenCalledWith(
        'Novo Caso Clonado',
        'Desc',
        undefined
      );
      expect(mockedUpdateInv).toHaveBeenCalledWith('new-inv-99', {
        whiteboard_data: { zoom: 1 },
      });
      expect(result.investigationId).toBe('new-inv-99');
      expect(result.importedCards).toBe(1);
    });
  });

  describe('batchSetCardsVisibility', () => {
    it('atualiza is_hidden em lote quando owner é válido', async () => {
      mockedSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: 'owner-1' } },
        error: null,
      });
      mockedFetchDetails.mockResolvedValue({
        id: 'inv-1',
        owner_id: 'owner-1',
      });

      const inMock = jest.fn().mockResolvedValue({ error: null });
      const eqMock = jest.fn().mockReturnValue({ in: inMock });
      const updateMock = jest.fn().mockReturnValue({ eq: eqMock });
      mockedSupabase.from.mockReturnValue({ update: updateMock });

      const count = await batchSetCardsVisibility(
        'inv-1',
        ['c1', 'c2'],
        false
      );

      expect(count).toBe(2);
      expect(mockedSupabase.from).toHaveBeenCalledWith('investigation_cards');
      expect(updateMock).toHaveBeenCalledWith({ is_hidden: false });
      expect(eqMock).toHaveBeenCalledWith('investigation_id', 'inv-1');
      expect(inMock).toHaveBeenCalledWith('id', ['c1', 'c2']);
    });
  });

  describe('resetLocalPuzzleProgress', () => {
    it('remove chaves do investigationId alvo sem apagar chaves de outras investigações', () => {
      localStorage.setItem('shredder_solved_inv-target_card-1', 'true');
      localStorage.setItem('glitch_solved_inv-target_card-2', '1');
      localStorage.setItem('puzzle_solved_inv-target_card-3', 'ok');
      localStorage.setItem('mega_clue_inv-target_card-4', 'unlocked');
      localStorage.setItem('shredder_solved_inv-other_card-1', 'true');
      localStorage.setItem('unrelated_theme_setting', 'dark');

      const removed = resetLocalPuzzleProgress('inv-target');

      expect(removed).toBe(4);
      expect(localStorage.getItem('shredder_solved_inv-target_card-1')).toBeNull();
      expect(localStorage.getItem('glitch_solved_inv-target_card-2')).toBeNull();
      expect(localStorage.getItem('puzzle_solved_inv-target_card-3')).toBeNull();
      expect(localStorage.getItem('mega_clue_inv-target_card-4')).toBeNull();
      expect(localStorage.getItem('shredder_solved_inv-other_card-1')).toBe('true');
      expect(localStorage.getItem('unrelated_theme_setting')).toBe('dark');
    });

    it('filtra por cardIds quando informados', () => {
      localStorage.setItem('shredder_solved_inv-target_card-1', 'true');
      localStorage.setItem('shredder_solved_inv-target_card-2', 'true');

      const removed = resetLocalPuzzleProgress('inv-target', ['card-1']);

      expect(removed).toBe(1);
      expect(localStorage.getItem('shredder_solved_inv-target_card-1')).toBeNull();
      expect(localStorage.getItem('shredder_solved_inv-target_card-2')).toBe('true');
    });
  });
});
