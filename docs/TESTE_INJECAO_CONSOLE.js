/**
 * TESTE SIMPLES: Injetar Glitch Manualmente
 * 
 * Se quer ver os efeitos funcionando AGORA:
 * 1. Abra Console (F12)
 * 2. Cole este código lá
 */

// ============================================
// TESTE 1: Forçar Locked View em um Card
// ============================================

(function testLockedView() {
  const cards = document.querySelectorAll('.clue-card');
  if (cards.length === 0) {
    console.log('❌ Nenhum card encontrado');
    return;
  }
  
  const firstCard = cards[0];
  const container = firstCard && firstCard.querySelector('.card-content-container');
  
  if (!container) {
    console.log('❌ .card-content-container não encontrado');
    return;
  }
  
  // Remove classes antigas
  container.classList.remove('gm-view', 'glitch-view', 'normal-view');
  
  // Adiciona locked-view
  container.classList.add('locked-view');
  
  // Limpa conteúdo
  container.innerHTML = `
    <div style="position: absolute; inset: 0; background: repeating-linear-gradient(0deg, rgba(255,0,60,0.08) 0px, rgba(255,0,60,0.08) 2px, transparent 2px, transparent 4px), repeating-linear-gradient(90deg, rgba(255,0,60,0.08) 0px, rgba(255,0,60,0.08) 2px, transparent 2px, transparent 4px); animation: grid-pulse 3s infinite;"></div>
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 101;">
      <span style="font-size: 40px; color: #ff003c; margin-bottom: 10px;">🔐</span>
      <div style="font-family: 'Share Tech Mono', monospace; font-size: 14px; color: #ff003c; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; text-shadow: 0 0 15px rgba(255,0,60,0.8); animation: blink 1s infinite;">ACESSO NEGADO</div>
      <div style="font-family: 'Courier New', monospace; font-size: 10px; color: #ff6600; letter-spacing: 2px; margin-top: 8px; text-transform: uppercase; opacity: 0.8;">RND-TEST1234</div>
    </div>
  `;
  
  console.log('✅ Locked View injetado no primeiro card');
})();

// ============================================
// TESTE 2: Forçar Glitch View em um Card
// ============================================

(function testGlitchView() {
  const cards = document.querySelectorAll('.clue-card');
  if (cards.length < 2) {
    console.log('❌ Precisa de pelo menos 2 cards para teste de glitch');
    return;
  }
  
  const secondCard = cards[1];
  const container = secondCard && secondCard.querySelector('.card-content-container');
  
  if (!container) {
    console.log('❌ .card-content-container não encontrado no segundo card');
    return;
  }
  
  // Remove classes antigas
  container.classList.remove('gm-view', 'locked-view', 'normal-view');
  
  // Adiciona glitch-view
  container.classList.add('glitch-view');
  
  // Limpa conteúdo
  container.innerHTML = `
    <div style="position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(255,0,60,0.2) 0px, rgba(255,0,60,0.2) 3px, transparent 3px, transparent 6px); animation: glitch-shift 0.3s infinite;"></div>
    <div style="position: absolute; inset: 0; background: repeating-linear-gradient(90deg, rgba(0,255,255,0.2) 0px, rgba(0,255,255,0.2) 3px, transparent 3px, transparent 6px); animation: glitch-shift-reverse 0.25s infinite;"></div>
    <div style="position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; z-index: 70;">
      <div style="font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; text-shadow: 0 0 15px rgba(255,0,60,0.8); animation: glitch-char 0.4s infinite; color: #ff003c;">▓░▓ DATA</div>
      <div style="font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; text-shadow: 0 0 10px rgba(255,255,0,0.6); animation: glitch-char-reverse 0.35s infinite; color: #ffff00; margin: 5px 0;">CØRRÜPT</div>
      <div style="font-family: 'Share Tech Mono', monospace; font-size: 12px; letter-spacing: 3px; text-transform: uppercase; font-weight: bold; text-shadow: 0 0 15px rgba(0,255,255,0.8); animation: glitch-char 0.45s infinite; color: #00f3ff;">░▓░ LOCKED</div>
    </div>
    <div style="position: absolute; inset: 0; background: repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px); animation: scanline-drift 8s linear infinite;"></div>
  `;
  
  console.log('✅ Glitch View injetado no segundo card');
})();

// ============================================
// TESTE 3: Ver estado das props
// ============================================

(function checkProps() {
  console.log('\n=== VERIFICAÇÃO DE PROPS ===\n');
  
  const cards = document.querySelectorAll('.clue-card');
  cards.forEach((card, index) => {
    const container = card.querySelector('.card-content-container');
    const id = card.getAttribute('data-id') || 'desconhecido';
    
    console.log(`Card ${index}:`, {
      id,
      hasContainer: !!container,
      containerClasses: container?.className || 'N/A',
      containerHTML: container?.innerHTML?.substring(0, 100) || 'N/A'
    });
  });
})();

// ============================================
// INJETAR CSS SE NECESSÁRIO
// ============================================

(function injectCSS() {
  if (document.getElementById('glitch-test-css')) {
    return; // Já foi injetado
  }
  
  const style = document.createElement('style');
  style.id = 'glitch-test-css';
  style.innerHTML = `
    @keyframes glitch-shift {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-2px); }
      40% { transform: translateX(2px); }
      60% { transform: translateX(-1px); }
      80% { transform: translateX(1px); }
    }
    
    @keyframes glitch-shift-reverse {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(2px); }
      40% { transform: translateX(-2px); }
      60% { transform: translateX(1px); }
      80% { transform: translateX(-1px); }
    }
    
    @keyframes glitch-char {
      0%, 100% { transform: translateX(0) scaleX(1); opacity: 1; }
      20% { transform: translateX(-3px) scaleX(0.98); opacity: 0.8; }
      40% { transform: translateX(2px) scaleX(1.02); opacity: 0.9; }
      60% { transform: translateX(-1px) scaleX(0.99); opacity: 0.7; }
      80% { transform: translateX(1px) scaleX(1.01); opacity: 0.8; }
    }
    
    @keyframes glitch-char-reverse {
      0%, 100% { transform: translateX(0) skewX(0deg); opacity: 1; }
      20% { transform: translateX(3px) skewX(-2deg); opacity: 0.7; }
      40% { transform: translateX(-2px) skewX(2deg); opacity: 0.8; }
      60% { transform: translateX(1px) skewX(-1deg); opacity: 0.9; }
      80% { transform: translateX(-1px) skewX(1deg); opacity: 0.7; }
    }
    
    @keyframes scanline-drift {
      0% { transform: translateY(0); }
      100% { transform: translateY(10px); }
    }
    
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.6; }
    }
    
    @keyframes grid-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }

    .console-highlight {
      outline: 3px solid #ff00ff;
      box-shadow: 0 0 18px rgba(255, 0, 255, 0.45);
      animation: console-pulse 1.2s ease-in-out infinite;
    }

    .console-note {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 320;
      padding: 8px 10px;
      border-radius: 8px;
      background: rgba(0, 0, 0, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #f8f8f8;
      font-family: 'Share Tech Mono', monospace;
      font-size: 11px;
      letter-spacing: 0.5px;
      box-shadow: 0 0 10px rgba(255, 0, 255, 0.35);
      pointer-events: none;
    }

    .console-note strong {
      display: block;
      font-size: 10px;
      color: #ff00ff;
      letter-spacing: 1px;
    }

    .console-glitch-overlay {
      position: absolute;
      inset: 0;
      display: grid;
      place-items: center;
      background: radial-gradient(circle at 20% 20%, rgba(255,0,60,0.08), transparent 45%), radial-gradient(circle at 80% 70%, rgba(0,255,255,0.08), transparent 45%), rgba(0, 0, 0, 0.65);
      color: #ffdeff;
      text-align: center;
      z-index: 140;
      overflow: hidden;
    }

    .console-glitch-overlay .glitch-label {
      font-family: 'Share Tech Mono', monospace;
      font-size: 13px;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-bottom: 8px;
      text-shadow: 0 0 12px rgba(255, 0, 60, 0.7);
    }

    .console-glitch-overlay .glitch-sub {
      font-size: 11px;
      opacity: 0.8;
      letter-spacing: 1px;
    }

    .console-glitch-scan {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(0deg, rgba(0,255,255,0.08) 0px, rgba(0,255,255,0.08) 2px, transparent 2px, transparent 4px);
      mix-blend-mode: screen;
      animation: scanline-drift 3s linear infinite;
      pointer-events: none;
    }

    @keyframes console-pulse {
      0% { opacity: 0.7; }
      50% { opacity: 1; }
      100% { opacity: 0.7; }
    }
  `;
  
  document.head.appendChild(style);
  console.log('✅ CSS de animações injetado');
})();

// ============================================
// TOOLBOX: Funções para explorar o caso via Console
// ============================================

(function setupInvestigationConsole() {
  const prefix = '🧠 investigationConsole';

  const cardsFromDom = () => Array.from(document.querySelectorAll('.clue-card'));

  const resolveCard = (target) => {
    const cards = cardsFromDom();
    if (cards.length === 0) return null;
    if (target === undefined || target === null) return cards[0];
    if (typeof target === 'number') return cards[target] || null;
    const byId = cards.find((card) => card.id === `card-${target}` || card.id === String(target));
    if (byId) return byId;
    return cards.find((card) => card.getAttribute('data-id') === String(target)) || null;
  };

  const highlight = (card) => {
    if (!card) return;
    card.classList.add('console-highlight');
    setTimeout(() => card.classList.remove('console-highlight'), 1400);
  };

  const syncDecisionButtons = (card, status) => {
    const map = {
      verified: '.btn-decision.true',
      theory: '.btn-decision.theory',
      false: '.btn-decision.false'
    };
    card.querySelectorAll('.btn-decision.true, .btn-decision.theory, .btn-decision.false').forEach((btn) => btn.classList.remove('active'));
    if (status && map[status]) {
      const btn = card.querySelector(map[status]);
      if (btn) btn.classList.add('active');
    }
  };

  const setStatus = (target, status = null) => {
    const card = resolveCard(target);
    if (!card) {
      console.warn(`${prefix}: nenhum card encontrado para`, target);
      return null;
    }
    const statusClasses = ['status-true', 'status-theory', 'status-false'];
    card.classList.remove(...statusClasses);
    syncDecisionButtons(card, null);

    if (!status) {
      highlight(card);
      console.log(`${prefix}: status limpo em`, card.id || card); 
      return null;
    }

    const map = {
      verified: 'status-true',
      theory: 'status-theory',
      false: 'status-false'
    };
    const cls = map[status];
    if (!cls) {
      console.warn(`${prefix}: status inválido`, status, '(use verified | theory | false)');
      return null;
    }
    card.classList.add(cls);
    syncDecisionButtons(card, status);
    highlight(card);
    console.log(`${prefix}: status '${status}' aplicado em`, card.id || card);
    return cls;
  };

  const toggleLock = (target, force) => {
    const card = resolveCard(target);
    if (!card) {
      console.warn(`${prefix}: nenhum card para lock/unlock`, target);
      return null;
    }
    const shouldLock = typeof force === 'boolean' ? force : !card.classList.contains('is-locked');
    card.classList.toggle('is-locked', shouldLock);
    if (!shouldLock) {
      card.classList.remove('locked-view');
    }
    highlight(card);
    console.log(`${prefix}: card ${card.id || target} ${shouldLock ? '🔒 bloqueado' : '🔓 liberado'}`);
    return shouldLock;
  };

  const addNote = (target, note = 'Revisar pista') => {
    const card = resolveCard(target);
    if (!card) {
      console.warn(`${prefix}: não achei card para anotar`, target);
      return null;
    }
    const existing = card.querySelector('.console-note');
    if (existing) existing.remove();
    const el = document.createElement('div');
    el.className = 'console-note';
    el.innerHTML = `<strong>OBS</strong><div>${note}</div>`;
    card.appendChild(el);
    highlight(card);
    console.log(`${prefix}: anotação adicionada em ${card.id || target}`);
    return el;
  };

  const glitchCard = (target, label = 'CONSOLE GLITCH') => {
    const card = resolveCard(target);
    if (!card) {
      console.warn(`${prefix}: card não encontrado para glitch`, target);
      return null;
    }
    const container = card.querySelector('.card-content-container');
    if (!container) {
      console.warn(`${prefix}: .card-content-container ausente no card`, card);
      return null;
    }
    container.classList.remove('gm-view', 'locked-view', 'normal-view');
    container.classList.add('glitch-view');
    container.innerHTML = `
      <div class="console-glitch-overlay">
        <div>
          <div class="glitch-label">${label}</div>
          <div class="glitch-sub">Pista temporariamente corrompida</div>
        </div>
      </div>
      <div class="console-glitch-scan"></div>
    `;
    highlight(card);
    console.log(`${prefix}: glitch manual aplicado em ${card.id || target}`);
    return container;
  };

  const listClues = () => {
    const cards = cardsFromDom();
    const data = cards.map((card, index) => {
      const title = card.querySelector('.clue-info h3')?.textContent?.trim() || 'sem título';
      const container = card.querySelector('.card-content-container');
      const status = card.classList.contains('status-true') ? 'verified' : card.classList.contains('status-theory') ? 'theory' : card.classList.contains('status-false') ? 'false' : 'none';
      return {
        index,
        id: card.id || `card-${index}`,
        title,
        locked: card.classList.contains('is-locked'),
        status,
        view: container?.className || 'N/A'
      };
    });
    console.table(data);
    return data;
  };

  const summarize = () => {
    const cards = cardsFromDom();
    const counts = cards.reduce((acc, card) => {
      if (card.classList.contains('status-true')) acc.verified += 1;
      else if (card.classList.contains('status-theory')) acc.theory += 1;
      else if (card.classList.contains('status-false')) acc.false += 1;
      else acc.undefined += 1;
      if (card.classList.contains('is-locked')) acc.locked += 1;
      return acc;
    }, { verified: 0, theory: 0, false: 0, undefined: 0, locked: 0, total: cards.length });
    console.log(`${prefix}: resumo rápido`, counts);
    return counts;
  };

  const unlockAll = () => {
    cardsFromDom().forEach((card, index) => toggleLock(index, false));
    console.log(`${prefix}: todos os cards liberados para revisão`);
  };

  window.investigationConsole = {
    listClues,
    setStatus,
    toggleLock,
    glitchCard,
    addNote,
    highlightCard: (target) => { const card = resolveCard(target); highlight(card); return card; },
    summarize,
    unlockAll
  };

  console.log(`${prefix} disponível. Exemplos:`);
  console.log('- investigationConsole.listClues() // inventário rápido');
  console.log('- investigationConsole.setStatus(0, "verified") // marcar pista como confirmada');
  console.log('- investigationConsole.toggleLock(1) // alternar bloqueio no card 1');
  console.log('- investigationConsole.glitchCard("abcd") // corrompe card com id abcd');
  console.log('- investigationConsole.addNote(2, "checar logs do agente")');
})();

console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║  🧪 TESTES DE GLITCH EFFECTS INJETADOS                        ║
║                                                                ║
║  ✅ Teste 1: Locked View (card 0)                            ║
║  ✅ Teste 2: Glitch View (card 1)                            ║
║  ✅ Teste 3: Verificação de Props                             ║
║  ✅ CSS Injetado                                              ║
║  🧠 investigationConsole pronto                               ║
║                                                                ║
║  Se os efeitos aparecerem, o CSS/JS estão OK                  ║
║  Se não aparecerem, há problema com seletores/estrutura      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
