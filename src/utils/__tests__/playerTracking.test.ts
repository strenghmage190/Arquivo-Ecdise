/// <reference types="jest" />
import {
  clearPlayerTracking,
  getSeenCardIds,
  getUnlockedCodes,
  isCardSeen,
  markCardSeen,
  recordUnlockedCode,
  shouldShowNewBadge,
} from '../playerTracking';

describe('playerTracking', () => {
  const invA = 'inv-alpha';
  const invB = 'inv-beta';

  beforeEach(() => {
    localStorage.clear();
  });

  describe('isolamento Mestre vs Jogador', () => {
    it('não marca pista como vista quando isGameMaster=true e playerView=false', () => {
      const changed = markCardSeen(invA, 'card-1', { isGameMaster: true, playerView: false });
      expect(changed).toBe(false);
      expect(isCardSeen(invA, 'card-1')).toBe(false);
      expect(getSeenCardIds(invA)).toEqual([]);
    });

    it('marca pista como vista quando jogador abre ou quando GM está em playerView', () => {
      expect(markCardSeen(invA, 'card-1', { isGameMaster: false, playerView: true })).toBe(true);
      expect(isCardSeen(invA, 'card-1')).toBe(true);

      expect(markCardSeen(invA, 'card-2', { isGameMaster: true, playerView: true })).toBe(true);
      expect(isCardSeen(invA, 'card-2')).toBe(true);
    });

    it('não registra códigos desbloqueados no modo exclusivo do Mestre', () => {
      const result = recordUnlockedCode(
        invA,
        { cardId: 'card-secret', cardTitle: 'Cofre', code: '9999', lockType: 'keypad' },
        { isGameMaster: true, playerView: false }
      );
      expect(result).toEqual([]);
      expect(getUnlockedCodes(invA)).toEqual([]);
    });
  });

  describe('badge NOVA', () => {
    it('exibe NOVA apenas para pistas não vistas e não ocultas na visão do jogador', () => {
      const visibleCard = { id: 'card-10', is_hidden: false };
      const hiddenCard = { id: 'card-11', is_hidden: true };

      expect(shouldShowNewBadge(invA, visibleCard, { isGameMaster: false, playerView: true })).toBe(true);
      expect(shouldShowNewBadge(invA, hiddenCard, { isGameMaster: false, playerView: true })).toBe(false);

      // Na visão exclusiva do Mestre, não exibe badge NOVA do jogador
      expect(shouldShowNewBadge(invA, visibleCard, { isGameMaster: true, playerView: false })).toBe(false);

      // Após jogador abrir, badge NOVA desaparece
      markCardSeen(invA, 'card-10', { isGameMaster: false, playerView: true });
      expect(shouldShowNewBadge(invA, visibleCard, { isGameMaster: false, playerView: true })).toBe(false);
    });

    it('isola pistas vistas entre investigações diferentes', () => {
      markCardSeen(invA, 'card-1', { isGameMaster: false, playerView: true });
      expect(isCardSeen(invA, 'card-1')).toBe(true);
      expect(isCardSeen(invB, 'card-1')).toBe(false);
    });
  });

  describe('histórico de códigos desbloqueados', () => {
    it('registra, deduplica e mantém ordem do mais recente primeiro', () => {
      recordUnlockedCode(
        invA,
        { cardId: 'c1', cardTitle: 'Diário', code: '1234', lockType: 'keypad', unlockedAt: '2026-01-01T10:00:00Z' },
        { isGameMaster: false, playerView: true }
      );
      recordUnlockedCode(
        invA,
        { cardId: 'c2', cardTitle: 'Celular', code: '1-4-7-8', lockType: 'pattern', unlockedAt: '2026-01-01T10:05:00Z' },
        { isGameMaster: false, playerView: true }
      );
      // Re-desbloquear o mesmo código atualiza sem duplicar
      recordUnlockedCode(
        invA,
        { cardId: 'c1', cardTitle: 'Diário', code: '1234', lockType: 'keypad', unlockedAt: '2026-01-01T10:10:00Z' },
        { isGameMaster: false, playerView: true }
      );

      const list = getUnlockedCodes(invA);
      expect(list).toHaveLength(2);
      expect(list[0].cardId).toBe('c1');
      expect(list[0].code).toBe('1234');
      expect(list[1].cardId).toBe('c2');
      expect(list[1].lockType).toBe('pattern');
    });

    it('limpa rastreamento corretamente com clearPlayerTracking', () => {
      markCardSeen(invA, 'c1', { isGameMaster: false, playerView: true });
      recordUnlockedCode(invA, { cardId: 'c1', cardTitle: 'Cofre', code: '4321', lockType: 'keypad' });

      clearPlayerTracking(invA);
      expect(getSeenCardIds(invA)).toEqual([]);
      expect(getUnlockedCodes(invA)).toEqual([]);
    });
  });
});
