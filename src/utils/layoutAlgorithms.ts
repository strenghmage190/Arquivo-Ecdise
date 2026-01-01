const CARD_WIDTH = 240;
const CARD_HEIGHT = 180; // Aumentado para evitar sobreposição
const GAP_X = 80; // Mais espaço entre colunas
const GAP_Y = 40; // Mais espaço vertical
const START_X = 100;
const START_Y = 100;

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

// 2. Elementos: Separa por tipo de evidência e tags
export function organizeByElement(cards: any[]) {
  return organizeByGroup(cards, (card) => {
    const tags = (card.tags || []).join(' ').toLowerCase();
    const title = (card.title || '').toLowerCase();
    
    // Elementos místicos
    if (tags.includes('sangue') || title.includes('sangue')) return '1_Sangue 🩸';
    if (tags.includes('morte') || title.includes('morte') || title.includes('cadáver')) return '2_Morte 💀';
    if (tags.includes('conhecimento') || title.includes('livro') || title.includes('texto')) return '3_Conhecimento 👁️';
    if (tags.includes('energia') || title.includes('energia')) return '4_Energia ⚡';
    if (tags.includes('medo') || title.includes('medo')) return '5_Medo ∞';
    
    // Tipo de evidência
    if (card.evidence_type === 'image') return '6_Imagens 📷';
    if (card.evidence_type === 'audio') return '7_Áudio 🎵';
    if (card.evidence_type === 'text') return '8_Documentos 📄';
    if (card.evidence_type === 'video') return '9_Vídeos 🎬';
    
    return 'Z_Outros';
  });
}

// 3. Timeline (Revisada): Organiza por data de criação ou tags de data
export function organizeByTimeline(cards: any[]) {
  // Primeiro, tenta organizar por data
  const sorted = [...cards].sort((a, b) => {
    // Tenta pegar data de tags
    const aTags = (a.tags || []).find((t: string) => t.startsWith('dia:') || t.startsWith('time:'));
    const bTags = (b.tags || []).find((t: string) => t.startsWith('dia:') || t.startsWith('time:'));
    
    if (aTags && bTags) {
      return aTags.localeCompare(bTags);
    }
    if (aTags) return -1;
    if (bTags) return 1;
    
    // Se não tem tags, usa data de criação
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateA - dateB;
  });
  
  // Organiza em grid temporal
  const positions: CardPosition[] = [];
  const CARDS_PER_ROW = 4;
  
  sorted.forEach((card, index) => {
    const col = index % CARDS_PER_ROW;
    const row = Math.floor(index / CARDS_PER_ROW);
    positions.push({
      id: card.id,
      x: START_X + col * (CARD_WIDTH + GAP_X),
      y: START_Y + row * (CARD_HEIGHT + GAP_Y)
    });
  });
  
  return positions;
}
