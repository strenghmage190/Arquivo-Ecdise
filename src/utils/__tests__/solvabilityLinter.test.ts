import { analyzeClueSolvability } from '../solvabilityLinter';

describe('solvabilityLinter', () => {
  test('flags orphan password when no other board card mentions it', () => {
    const report = analyzeClueSolvability({
      currentCardId: 'card-1',
      title: 'Terminal da Recepção',
      evidenceType: 'document',
      isLocked: true,
      lockPass: 'ECDISE',
      paceMode: 'between_sessions',
      assistHint: 'Veja o crachá do doutor.',
      rewardCardIds: [],
      hasUvOrThermal: false,
      hasHiddenAudio: false,
      hasCipherOrHex: false,
      isShredded: false,
      shredPiecesCount: 0,
      boardCards: [
        { id: 'card-1', title: 'Terminal da Recepção', description_public: 'Trancado.' },
        { id: 'card-2', title: 'Bilhete', description_public: 'Nada relacionado aqui.' },
      ],
    });

    expect(report.issues.some((i) => i.id === 'orphan-password')).toBe(true);
  });

  test('does NOT flag orphan password when another card mentions it in metadata or description', () => {
    const report = analyzeClueSolvability({
      currentCardId: 'card-1',
      title: 'Terminal da Recepção',
      evidenceType: 'document',
      isLocked: true,
      lockPass: 'ECDISE',
      paceMode: 'between_sessions',
      assistHint: '',
      rewardCardIds: [],
      hasUvOrThermal: false,
      hasHiddenAudio: false,
      hasCipherOrHex: false,
      isShredded: false,
      shredPiecesCount: 0,
      boardCards: [
        { id: 'card-2', title: 'Crachá', description_hidden: 'A senha anotada atrás é ECDISE.' },
      ],
    });

    expect(report.issues.some((i) => i.id === 'orphan-password')).toBe(false);
  });

  test('warns when a dense puzzle is marked as in_session', () => {
    const report = analyzeClueSolvability({
      currentCardId: 'card-1',
      title: 'Transmissão Cifrada',
      evidenceType: 'glitch_puzzle',
      isLocked: true,
      lockPass: '4812',
      paceMode: 'in_session',
      assistHint: '',
      rewardCardIds: [],
      hasUvOrThermal: false,
      hasHiddenAudio: true,
      hasCipherOrHex: true,
      isShredded: false,
      shredPiecesCount: 0,
      boardCards: [],
    });

    expect(report.complexity).toBe('densa');
    expect(report.issues.some((i) => i.id === 'pace-mismatch')).toBe(true);
    expect(report.issues.some((i) => i.id === 'missing-assist-hint')).toBe(true);
  });

  test('warns when a Dead-Drop reward card is already visible on the board', () => {
    const report = analyzeClueSolvability({
      currentCardId: 'card-1',
      title: 'Cofre',
      evidenceType: 'document',
      isLocked: true,
      lockPass: '1234',
      paceMode: 'between_sessions',
      assistHint: 'Dica',
      rewardCardIds: ['card-reward'],
      hasUvOrThermal: false,
      hasHiddenAudio: false,
      hasCipherOrHex: false,
      isShredded: false,
      shredPiecesCount: 0,
      boardCards: [
        { id: 'card-reward', title: 'Dossiê Final', is_hidden: false, description_public: '1234' },
      ],
    });

    expect(report.issues.some((i) => i.id === 'reward-already-visible-card-reward')).toBe(true);
  });
});
