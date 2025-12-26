// Define o tamanho padrão para calcular espaçamento
const CARD_WIDTH = 240;
const CARD_HEIGHT = 180; // Altura visual média incluindo textos
const GAP_X = 50; // Espaço horizontal entre colunas
const GAP_Y = 30; // Espaço vertical entre cartas
const START_X = 50;
const START_Y = 100;

export interface CardPosition {
  id: string;
  x: number;
  y: number;
}

/**
 * Organiza por linha do tempo baseada em Tags (dia:1, dia:2) ou Criação.
 */
export function organizeByTimeline(cards: any[]): CardPosition[] {
  // 1. Agrupar cartas por "Tempo"
  const groups: Record<string, any[]> = {};
  const unsorted: any[] = [];

  cards.forEach(card => {
    // Tenta achar tags como 'dia:1', 'dia:2', 'tempo:noite'
    // Formatos aceitos na tag: "dia:X", "time:X", "data:XX/XX"
    const timeTag = (card.tags || []).find((t: string) => 
      t.toLowerCase().startsWith('dia:') || 
      t.toLowerCase().startsWith('time:') ||
      t.toLowerCase().startsWith('data:')
    );

    if (timeTag) {
      // Normaliza a chave (ex: "dia:1" vira "dia:1")
      const key = timeTag.toLowerCase();
      if (!groups[key]) groups[key] = [];
      groups[key].push(card);
    } else {
      unsorted.push(card);
    }
  });

  // 2. Ordenar as Chaves dos grupos (ex: dia:1 antes de dia:2)
  const sortedKeys = Object.keys(groups).sort((a, b) => {
    // Tenta extrair números para comparar
    const numA = parseInt(a.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.replace(/\D/g, '')) || 0;
    return numA - numB;
  });

  const finalPositions: CardPosition[] = [];
  let currentX = START_X;

  // 3. Posicionar os grupos cronológicos
  sortedKeys.forEach(key => {
    const groupCards = groups[key];
    
    // Opcional: ordenar dentro do grupo por ID ou Titulo
    // groupCards.sort(...) 

    let currentY = START_Y;
    
    // Cabeçalho da Coluna (mentalmente): Vamos empilhar verticalmente
    groupCards.forEach(card => {
      finalPositions.push({
        id: card.id,
        x: currentX,
        y: currentY
      });
      currentY += CARD_HEIGHT + GAP_Y;
    });

    // Avança para a próxima coluna
    currentX += CARD_WIDTH + GAP_X;
  });

  // 4. Lidar com cartas "Sem Tempo" (Grid no final ou abaixo)
  // Vamos colocá-las em uma nova seção à direita
  if (unsorted.length > 0) {
    currentX += GAP_X; // Separador extra
    let currentY = START_Y;
    
    unsorted.forEach((card, index) => {
      finalPositions.push({
        id: card.id,
        x: currentX,
        y: currentY
      });
      
      currentY += CARD_HEIGHT + GAP_Y;
      
      // Quebra coluna se ficar muito alta (max 5 cartas)
      if ((index + 1) % 5 === 0) {
        currentY = START_Y;
        currentX += CARD_WIDTH + GAP_X;
      }
    });
  }

  return finalPositions;
}

/**
 * Organiza em Grid Compacto (sem considerar tempo)
 */
export function organizeByGrid(cards: any[]): CardPosition[] {
  const COLUMNS = 5; // Quantos cards por linha
  return cards.map((card, index) => {
    const col = index % COLUMNS;
    const row = Math.floor(index / COLUMNS);
    return {
      id: card.id,
      x: START_X + col * (CARD_WIDTH + GAP_X),
      y: START_Y + row * (CARD_HEIGHT + GAP_Y)
    };
  });
}
