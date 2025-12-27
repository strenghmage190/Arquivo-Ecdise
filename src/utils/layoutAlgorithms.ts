const CARD_WIDTH = 240;
const CARD_HEIGHT = 160; // Altura aproximada
const GAP_X = 60; // Espaço lateral entre colunas
const GAP_Y = 30; // Espaço vertical
const START_X = 0;
const START_Y = 0;

export interface CardPosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Função Genérica que organiza em Colunas baseada em um extrator de chave
 */
function organizeByGroup(cards: any[], getKey: (card: any) => string): CardPosition[] {
  const groups: Record<string, any[]> = {};
  
  // 1. Agrupar
  cards.forEach(card => {
    const key = (getKey(card) || 'Outros');
    if (!groups[key]) groups[key] = [];
    groups[key].push(card);
  });

  const finalPositions: CardPosition[] = [];
  let currentX = START_X;
  
  // Ordenar chaves para consistência (Opcional)
  const sortedKeys = Object.keys(groups).sort();

  // 2. Calcular Posições
  sortedKeys.forEach(key => {
    const groupCards = groups[key];
    let currentY = START_Y;
    
    groupCards.forEach(card => {
      finalPositions.push({ id: card.id, x: currentX, y: currentY });
      currentY += CARD_HEIGHT + GAP_Y;
    });

    currentX += CARD_WIDTH + GAP_X; // Próxima coluna
  });

  return finalPositions;
}

// --- ESTRATÉGIAS ESPECÍFICAS ---

// 1. Veracidade: Separa o que é CONFIRMADO, o que é FALSO e o resto
export function organizeByVeracity(cards: any[]) {
  return organizeByGroup(cards, (card) => {
    const tags = (card.tags || []).join(' ').toLowerCase();
    const imp = (card.metadata?.importance || '').toLowerCase();

    if (tags.includes('falso') || tags.includes('mentira') || imp === 'falso') return '1_Falso / Pista Fria ❌';
    if (tags.includes('certeza') || tags.includes('fato') || imp === 'central') return '3_Fato Confirmado ✅';
    if (imp === 'contexto') return '2_Contexto 📄';
    return '0_Em Análise 🔍';
  });
}

// 2. Elementos: Separa por Sangue, Morte, Conhecimento...
export function organizeByElement(cards: any[]) {
  return organizeByGroup(cards, (card) => {
    const tags = (card.tags || []).join(' ').toLowerCase();
    
    if (tags.includes('sangue')) return 'Sangue 🩸';
    if (tags.includes('morte')) return 'Morte 💀';
    if (tags.includes('conhecimento')) return 'Conhecimento 👁️';
    if (tags.includes('energia')) return 'Energia ⚡';
    if (tags.includes('medo')) return 'Medo ∞';
    return 'Mundano / Sem Elemento';
  });
}

// 3. Timeline (Revisada): Tenta pegar datas
export function organizeByTimeline(cards: any[]) {
  return organizeByGroup(cards, (card) => {
    const tTags = (card.tags || []).filter((t: string) => t.startsWith('dia:') || t.startsWith('time:'));
    if (tTags && tTags.length > 0) return tTags[0].toUpperCase(); // Ex: "DIA:1"
    return 'SEM DATA';
  });
}
