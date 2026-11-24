const CARD_WIDTH = 244;
const CARD_HEIGHT = 286;
const GAP_X = 64;
const GAP_Y = 48;
const START_X = 100;
const START_Y = 100;

export interface CardPosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Função genérica que organiza em colunas baseada em um extrator de chave
 */
function organizeByGroup(cards: any[], getKey: (card: any) => string): CardPosition[] {
  const groups: Record<string, any[]> = {};

  cards.forEach((card) => {
    const key = getKey(card) || 'Outros';
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });

  const finalPositions: CardPosition[] = [];
  let currentX = START_X;
  const sortedKeys = Object.keys(groups).sort();

  sortedKeys.forEach((key) => {
    const groupCards = groups[key];
    let currentY = START_Y;

    groupCards.forEach((card) => {
      finalPositions.push({ id: card.id, x: currentX, y: currentY });
      currentY += CARD_HEIGHT + GAP_Y;
    });

    currentX += CARD_WIDTH + GAP_X;
  });

  return finalPositions;
}

// 1. Veracidade / Status
export function organizeByVeracity(cards: any[]): CardPosition[] {
  return organizeByGroup(cards, (card) => {
    const status = (card?.metadata?.status || '').toLowerCase();
    const tags = (card.tags || []).join(' ').toLowerCase();
    const imp = (card.metadata?.importance || '').toLowerCase();

    if (status === 'false' || tags.includes('falso') || tags.includes('mentira') || imp === 'falso') {
      return '1_Descartado';
    }
    if (status === 'verified' || tags.includes('certeza') || tags.includes('fato') || imp === 'central') {
      return '3_Confirmado';
    }
    if (status === 'theory' || imp === 'contexto') {
      return '2_Hipótese';
    }
    return '0_Em Análise';
  });
}

// 2. Elementos e Tipo de Evidência
export function organizeByElement(cards: any[]): CardPosition[] {
  return organizeByGroup(cards, (card) => {
    const tags = (card.tags || []).join(' ').toLowerCase();
    const title = (card.title || '').toLowerCase();
    const el = String(card?.metadata?.element || card?.metadata?.elemento || card?.element || '').toLowerCase();

    if (el === 'sangue' || tags.includes('sangue') || title.includes('sangue')) return '1_Sangue';
    if (el === 'morte' || tags.includes('morte') || title.includes('morte') || title.includes('cadáver')) return '2_Morte';
    if (el === 'conhecimento' || tags.includes('conhecimento') || title.includes('livro') || title.includes('texto')) return '3_Conhecimento';
    if (el === 'energia' || tags.includes('energia') || title.includes('energia')) return '4_Energia';
    if (el === 'medo' || tags.includes('medo') || title.includes('medo')) return '5_Medo';

    if (card.evidence_type === 'image') return '6_Imagens';
    if (card.evidence_type === 'audio') return '7_Áudio';
    if (card.evidence_type === 'text') return '8_Documentos';
    if (card.evidence_type === 'video') return '9_Vídeos';

    return 'Z_Outros';
  });
}

// 3. Linha do Tempo (por tags dia:/time: ou created_at)
export function organizeByTimeline(cards: any[]): CardPosition[] {
  const sorted = [...cards].sort((a, b) => {
    const aTag = (a.tags || []).find((t: string) => t.startsWith('dia:') || t.startsWith('time:'));
    const bTag = (b.tags || []).find((t: string) => t.startsWith('dia:') || t.startsWith('time:'));

    if (aTag && bTag) return aTag.localeCompare(bTag);
    if (aTag) return -1;
    if (bTag) return 1;

    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });

  const positions: CardPosition[] = [];
  const CARDS_PER_ROW = 4;

  sorted.forEach((card, index) => {
    const col = index % CARDS_PER_ROW;
    const row = Math.floor(index / CARDS_PER_ROW);
    positions.push({
      id: card.id,
      x: START_X + col * (CARD_WIDTH + GAP_X),
      y: START_Y + row * (CARD_HEIGHT + GAP_Y),
    });
  });

  return positions;
}

// 4. Grade Uniforme (compacta, ordenação alfabética)
export function organizeByGrid(cards: any[], columns = 5): CardPosition[] {
  const cols = Math.max(2, Math.min(columns, Math.ceil(Math.sqrt(cards.length || 1))));
  return cards.map((card, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
      id: card.id,
      x: START_X + col * (CARD_WIDTH + GAP_X),
      y: START_Y + row * (CARD_HEIGHT + GAP_Y),
    };
  });
}

// 5. Desempilhar: separa apenas cards que estejam sobrepostos sem embaralhar o restante
export function unstackCards(
  cards: any[],
  currentPositions: Record<string, { x: number; y: number }>
): CardPosition[] {
  const placed: Array<{ id: string; x: number; y: number }> = [];
  const minDistX = CARD_WIDTH + 24;
  const minDistY = CARD_HEIGHT + 24;

  cards.forEach((card) => {
    const base = currentPositions[card.id] || { x: card.x ?? START_X, y: card.y ?? START_Y };
    let x = Math.round(base.x);
    let y = Math.round(base.y);

    let guard = 0;
    while (
      guard < 40 &&
      placed.some((p) => Math.abs(p.x - x) < minDistX * 0.7 && Math.abs(p.y - y) < minDistY * 0.7)
    ) {
      x += Math.round(minDistX * 0.65);
      if (guard % 4 === 3) {
        x = Math.round(base.x);
        y += Math.round(minDistY * 0.65);
      }
      guard += 1;
    }

    placed.push({ id: card.id, x, y });
  });

  return placed;
}
