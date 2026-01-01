/**
 * Card Test Helper
 * 
 * Safe testing utility that doesn't break React by manipulating the DOM directly.
 * Uses data attributes to query and test cards without interfering with React state.
 */

interface CardTestData {
  cardType: string;
  locked: boolean;
  playerView: boolean;
  id: string;
}

/**
 * Query card safely using data attributes
 * Safe because we're only reading, not modifying
 */
export function queryCard(cardId: string): CardTestData | null {
  const card = document.querySelector(`[data-testid="card-${cardId}"]`);
  if (!card) return null;

  const dataset = card.getAttribute('data-card-type');
  const locked = card.getAttribute('data-locked') === 'true';
  const playerView = card.getAttribute('data-player-view') === 'true';

  return {
    cardType: dataset || 'normal',
    locked,
    playerView,
    id: cardId,
  };
}

/**
 * Query all cards in the board
 */
export function queryAllCards(): CardTestData[] {
  const cards: CardTestData[] = [];
  const cardElements = document.querySelectorAll('[data-testid^="card-"]');

  cardElements.forEach((el) => {
    const testId = el.getAttribute('data-testid');
    if (testId) {
      const cardId = testId.replace('card-', '');
      const data = queryCard(cardId);
      if (data) cards.push(data);
    }
  });

  return cards;
}

/**
 * Log card information to console
 */
export function logCardInfo(cardId: string): void {
  const card = queryCard(cardId);
  if (card) {
    console.log(`✅ Card ${cardId}:`, card);
  } else {
    console.warn(`❌ Card ${cardId} not found`);
  }
}

/**
 * Log all cards information
 */
export function logAllCards(): void {
  const cards = queryAllCards();
  console.log(`📋 Found ${cards.length} cards:`, cards);
}

/**
 * Test mode: Add debug button to UI
 */
export function addDebugPanel(): void {
  // Only add if not already present
  if (document.getElementById('card-debug-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'card-debug-panel';
  panel.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: rgba(0, 20, 40, 0.95);
    border: 2px solid #00f3ff;
    border-radius: 8px;
    padding: 16px;
    z-index: var(--z-debug);
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: #00f3ff;
    max-width: 300px;
    max-height: 400px;
    overflow-y: auto;
    box-shadow: 0 0 20px rgba(0, 243, 255, 0.3);
  `;

  const content = document.createElement('div');
  content.innerHTML = `
    <div style="margin-bottom: 12px; font-weight: bold; border-bottom: 1px solid #00f3ff; padding-bottom: 8px;">
      🧪 Card Debug Panel
    </div>
    <div style="display: flex; flex-direction: column; gap: 8px;">
      <button id="debug-log-all" style="padding: 6px; background: #00f3ff; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        Log All Cards
      </button>
      <button id="debug-toggle-player" style="padding: 6px; background: #00f3ff; color: #000; border: none; border-radius: 4px; cursor: pointer; font-weight: bold;">
        Toggle Player View
      </button>
      <div id="debug-output" style="
        margin-top: 8px;
        padding: 8px;
        background: rgba(0, 0, 0, 0.5);
        border: 1px solid #00f3ff;
        border-radius: 4px;
        max-height: 200px;
        overflow-y: auto;
        font-size: 11px;
      "></div>
    </div>
  `;

  panel.appendChild(content);
  document.body.appendChild(panel);

  // Setup event listeners
  const logBtn = document.getElementById('debug-log-all');
  const toggleBtn = document.getElementById('debug-toggle-player');
  const output = document.getElementById('debug-output');

  if (logBtn) {
    logBtn.addEventListener('click', () => {
      const cards = queryAllCards();
      if (output) {
        output.innerHTML = `<pre>${JSON.stringify(cards, null, 2)}</pre>`;
      }
      logAllCards();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (output) {
        output.innerHTML = '⚠️ Player view toggle needs to be done via UI controls';
      }
    });
  }
}

/**
 * Test: Log specific card state
 */
export function testCard(cardId: string): void {
  console.log('=== Card Test ===');
  logCardInfo(cardId);
  const card = queryCard(cardId);
  if (card) {
    console.log('✅ Locked:', card.locked);
    console.log('✅ PlayerView:', card.playerView);
    console.log('✅ CardType:', card.cardType);
  }
}

// Export for console access during development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as any).CardTest = {
    queryCard,
    queryAllCards,
    logCardInfo,
    logAllCards,
    addDebugPanel,
    testCard,
  };
}
