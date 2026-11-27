import type { PaceMode } from './cluePayloadBuilder';

export type LinterSeverity = 'warning' | 'info';

export interface SolvabilityIssue {
  id: string;
  severity: LinterSeverity;
  title: string;
  detail: string;
  quickFix?: 'switch_between_sessions' | 'focus_assist_hint';
}

export interface BoardCardSummary {
  id: string;
  title?: string | null;
  description_public?: string | null;
  description_hidden?: string | null;
  discovery_code?: string | null;
  is_hidden?: boolean;
  chat_data?: any;
  metadata?: any;
}

export interface SolvabilityInput {
  currentCardId?: string | null;
  title: string;
  evidenceType: 'document' | 'glitch_puzzle' | 'mega_clue' | string;
  isLocked: boolean;
  lockPass: string;
  paceMode: PaceMode;
  assistHint: string;
  rewardCardIds: string[];
  hasUvOrThermal: boolean;
  hasHiddenAudio: boolean;
  hasCipherOrHex: boolean;
  isShredded: boolean;
  shredPiecesCount: number;
  boardCards: BoardCardSummary[];
}

export interface SolvabilityReport {
  estimatedMinutesLabel: string;
  complexity: 'rápida' | 'média' | 'densa';
  issues: SolvabilityIssue[];
}

function cardContainsNeedle(card: BoardCardSummary, needleLower: string): boolean {
  const fields: string[] = [
    card.title || '',
    card.description_public || '',
    card.description_hidden || '',
    card.discovery_code || '',
  ];
  for (const f of fields) {
    if (f && f.toLowerCase().includes(needleLower)) return true;
  }
  if (card.chat_data) {
    try {
      if (JSON.stringify(card.chat_data).toLowerCase().includes(needleLower)) return true;
    } catch {
      // ignore circular
    }
  }
  if (card.metadata) {
    try {
      if (JSON.stringify(card.metadata).toLowerCase().includes(needleLower)) return true;
    } catch {
      // ignore circular
    }
  }
  return false;
}

/**
 * Pure Anti-Soft-Lock Solvability Linter.
 * Analyzes the clue currently being authored against the other cards on the board.
 */
export function analyzeClueSolvability(input: SolvabilityInput): SolvabilityReport {
  const issues: SolvabilityIssue[] = [];
  const otherCards = (input.boardCards || []).filter(
    (c) => c && c.id && c.id !== input.currentCardId
  );

  // 1. Estimate complexity & session duration
  let score = 1;
  if (input.hasUvOrThermal) score += 1;
  if (input.isLocked) score += 2;
  if (input.hasHiddenAudio) score += 3;
  if (input.hasCipherOrHex) score += 3;
  if (input.evidenceType === 'glitch_puzzle') score += 3;
  if (input.evidenceType === 'mega_clue') score += 4;
  if (input.isShredded) score += input.shredPiecesCount > 8 ? 3 : 1;

  const complexity: SolvabilityReport['complexity'] =
    score <= 3 ? 'rápida' : score <= 6 ? 'média' : 'densa';

  const estimatedMinutesLabel =
    complexity === 'rápida'
      ? '30s – 3 min'
      : complexity === 'média'
      ? '5 – 12 min'
      : '15 – 40+ min';

  // 2. Orphan password check (soft-lock detection)
  const cleanPass = (input.lockPass || '').trim();
  if (input.isLocked && input.evidenceType !== 'mega_clue' && cleanPass.length >= 2) {
    const needle = cleanPass.toLowerCase();
    const mentionedElsewhere = otherCards.some((c) => cardContainsNeedle(c, needle));

    if (!mentionedElsewhere && otherCards.length > 0) {
      issues.push({
        id: 'orphan-password',
        severity: 'warning',
        title: `Senha "${cleanPass}" não aparece em outras pistas`,
        detail:
          'Nenhuma outra pista do caso menciona essa credencial. Confirme se ela será dada verbalmente na mesa ou se está escondida em imagem/áudio — caso contrário, risco de soft-lock.',
      });
    }
  }

  // 3. Pace mismatch (dense puzzle tagged as live in-session)
  if (input.paceMode === 'in_session' && complexity === 'densa') {
    issues.push({
      id: 'pace-mismatch',
      severity: 'warning',
      title: 'Enigma denso marcado como "Em Cena"',
      detail: `Tempo estimado (${estimatedMinutesLabel}) pode travar o ritmo da call ao vivo. Considere mover para "Entre Sessões (Quarentena)" ou cadastrar uma Dica de Calibração Assistida.`,
      quickFix: 'switch_between_sessions',
    });
  }

  // 4. Missing live escape-valve hint
  if (input.isLocked && input.paceMode === 'in_session' && !input.assistHint.trim()) {
    issues.push({
      id: 'missing-assist-hint',
      severity: 'info',
      title: 'Sem dica de Calibração Assistida (C.R.I.S.)',
      detail:
        'Para travas ao vivo, cadastrar uma dica curta permite liberar ajuda orgânica via Teste de Perícia caso a mesa empacar.',
      quickFix: 'focus_assist_hint',
    });
  }

  // 5. Reward card already visible
  if (input.rewardCardIds.length > 0) {
    for (const rid of input.rewardCardIds) {
      const target = otherCards.find((c) => c.id === rid);
      if (target && target.is_hidden === false) {
        issues.push({
          id: `reward-already-visible-${rid}`,
          severity: 'info',
          title: `Recompensa "${target.title || 'Sem título'}" já está visível`,
          detail:
            'Recompensas Dead-Drop funcionam melhor quando o card de destino começa OCULTO no mural e aparece automaticamente ao destravar esta pista.',
        });
      }
    }
  }

  return {
    estimatedMinutesLabel,
    complexity,
    issues,
  };
}
