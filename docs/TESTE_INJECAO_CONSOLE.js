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
  `;
  
  document.head.appendChild(style);
  console.log('✅ CSS de animações injetado');
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
║                                                                ║
║  Se os efeitos aparecerem, o CSS/JS estão OK                  ║
║  Se não aparecerem, há problema com seletores/estrutura      ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
`);
