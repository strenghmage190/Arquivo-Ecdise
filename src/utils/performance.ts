const performanceCSS = `/* ============================================================================
   PERFORMANCE MODE v3.0 (Funcional + Otimizado)
   ========================================================================== */

/* 1. ANIMAÇÕES (Remove apenas animações pesadas) */
body.performance-mode *,
body.performance-mode *::before,
body.performance-mode *::after {
  animation-duration: 0.01s !important; /* Torna animações instantâneas */
  animation-delay: 0s !important;
  transition-duration: 0.01s !important; /* Torna transições instantâneas */
  transition-delay: 0s !important;
}

/* 2. EFEITOS PESADOS (Glow, Blur, Neon) */
body.performance-mode * {
  box-shadow: none !important;
  text-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* 3. PROTEÇÃO DE FILTROS ESSENCIAIS */
/* NÃO desabilite filter globalmente - ele é necessário para UV, Forense e Tratamento */
body.performance-mode .large-evidence-img,
body.performance-mode .mystery-image,
body.performance-mode canvas,
body.performance-mode video {
  /* Filtros são PERMITIDOS aqui - essenciais para funcionalidade */
}

/* Desabilitar apenas filtros decorativos */
body.performance-mode .decorative,
body.performance-mode .background-effect,
body.performance-mode .particle-effect,
body.performance-mode .scanline,
body.performance-mode .grid-overlay {
  filter: none !important;
  opacity: 0 !important; /* Esconde elementos puramente decorativos */
}

/* 4. SUBSTITUIÇÃO VISUAL (Fundos sólidos) */
body.performance-mode .investigation-toolbar,
body.performance-mode .modal-content,
body.performance-mode .glass-panel,
body.performance-mode .toolbar,
body.performance-mode .clue-card {
  background-color: #05080a !important;
  border: 1px solid #1e40af !important;
  backdrop-filter: none !important;
}

/* 5. PERFORMANCE GRÁFICA */
body.performance-mode * {
  background-image: none !important;
  border-radius: 0 !important;
}

/* EXCEÇÃO: Preservar backgrounds de imagens */
body.performance-mode .evidence-display-area,
body.performance-mode .inspect-visual-area,
body.performance-mode img,
body.performance-mode canvas,
body.performance-mode video {
  background-image: initial !important; /* Restaura backgrounds essenciais */
}

/* 6. INTERAÇÕES BÁSICAS */
body.performance-mode button:active,
body.performance-mode .clickable:active {
  opacity: 0.7 !important;
}

/* 7. SCROLL SUAVE OFF */
body.performance-mode {
  scroll-behavior: auto !important;
}

/* 8. SELEÇÃO DE TEXTO */
body.performance-mode * {
  user-select: text !important;
}

body.performance-mode button,
body.performance-mode .nav-item {
  user-select: none !important;
}

/* 9. ELEMENTOS DECORATIVOS */
body.performance-mode .decorative,
body.performance-mode .background-effect,
body.performance-mode .particle-effect {
  pointer-events: none !important;
  display: none !important; /* Remove completamente do DOM visível */
}

/* 10. RENDERIZAÇÃO DE TEXTO */
body.performance-mode * {
  font-variant-ligatures: none !important;
  font-feature-settings: normal !important;
  text-rendering: optimizeSpeed !important;
}

/* 11. GPU MEMORY */
body.performance-mode canvas {
  image-rendering: pixelated !important;
}

/* 12. CSS PROPERTIES PESADAS */
body.performance-mode * {
  mix-blend-mode: normal !important;
  isolation: auto !important;
  border-image: none !important;
  counter-reset: none !important;
  counter-increment: none !important;
  quotes: none !important;
}

/* 13. PRINT/PAGE */
body.performance-mode * {
  page-break-after: auto !important;
  page-break-before: auto !important;
  page-break-inside: auto !important;
}

/* 14. COLUMNS */
body.performance-mode * {
  column-count: auto !important;
  column-gap: normal !important;
  column-rule: none !important;
}

/* 15. 3D TRANSFORMS (Desabilitar apenas os pesados) */
body.performance-mode * {
  perspective: none !important;
  backface-visibility: visible !important;
  transform-style: flat !important;
}

/* ============================================================================
   EXCEÇÕES CRÍTICAS - PRESERVAR FUNCIONALIDADES
   ========================================================================== */

/* 
 * MODAL INSPECTOR - Precisa de filtros para funcionar
 */
body.performance-mode .inspect-backdrop,
body.performance-mode .inspect-file,
body.performance-mode .inspect-visual-area,
body.performance-mode .inspect-visual-area * {
  animation: initial !important;
  transition: initial !important;
}

/* CRÍTICO: Filtros de imagem (Brightness, Contrast, Saturation) */
body.performance-mode .large-evidence-img,
body.performance-mode .mystery-image img,
body.performance-mode .mystery-image canvas {
  filter: initial !important; /* ESSENCIAL para tratamento de imagem */
}

/* CRÍTICO: Canvas térmico */
body.performance-mode .thermal-canvas,
body.performance-mode .thermal-overlay {
  filter: initial !important; /* ESSENCIAL para modo térmico */
  mix-blend-mode: initial !important;
}

/* CRÍTICO: Forense RGB */
body.performance-mode .mystery-image[data-forensic-channel] img,
body.performance-mode .mystery-image[data-forensic-channel] canvas {
  filter: initial !important; /* ESSENCIAL para análise forense */
}

/* CRÍTICO: Painéis de ferramentas */
body.performance-mode .tools-hud-panel,
body.performance-mode .filters-overlay-panel {
  backdrop-filter: blur(4px) !important; /* Mantém legibilidade */
  background: rgba(5, 8, 10, 0.95) !important;
}

/* CRÍTICO: Botões ativos precisam de feedback visual */
body.performance-mode .btn-tool-tab.active-green,
body.performance-mode .btn-tool-tab.active-purple,
body.performance-mode .btn-tool-tab.active-blue {
  box-shadow: initial !important; /* Feedback visual importante */
  text-shadow: initial !important;
}

/* CRÍTICO: Modais precisam de overlay blur */
body.performance-mode .modal-backdrop,
body.performance-mode .glitch-solver-backdrop {
  backdrop-filter: blur(2px) !important; /* Reduzido mas presente */
}

/* CRÍTICO: Video/CCTV */
body.performance-mode .cctv-wrapper video,
body.performance-mode .cctv-wrapper.filter-night-vision video,
body.performance-mode .cctv-wrapper.filter-thermal video {
  filter: initial !important; /* ESSENCIAL para filtros de vídeo */
}

/* CRÍTICO: UV editor - preservar filtros/overlays quando necessário */
body.performance-mode .uv-editor-panel .uv-canvas,
body.performance-mode .uv-editor-panel .uv-layer,
body.performance-mode .uv-editor-panel .uv-visual,
body.performance-mode .inspection-modal .thermal-canvas,
body.performance-mode .inspection-modal .backdrop {
  filter: initial !important;
  backdrop-filter: initial !important;
  animation: initial !important;
  transition: initial !important;
}

/* GLOBAL EXCEPTION: elementos marcados explicitamente para manter efeitos
   Use data-perf-keep="1" no elemento para garantir que filtros/ animações
   e transições essenciais não sejam desligados pelo modo performance. */
body.performance-mode [data-perf-keep="1"],
body.performance-mode [data-perf-keep="1"] * {
  animation: initial !important;
  transition: initial !important;
  filter: initial !important;
  backdrop-filter: initial !important;
  box-shadow: initial !important;
  mix-blend-mode: initial !important;
}

/* ============================================================================
   OTIMIZAÇÕES VISUAIS LEVES
   ========================================================================== */

/* Simplificar grid overlay mas manter visível */
body.performance-mode .grid-overlay {
  opacity: 0.1 !important; /* Reduz mas não remove */
  display: block !important;
}

/* Simplificar scan lines */
body.performance-mode .inspect-visual-area::before {
  animation-duration: 20s !important; /* Mais lento = menos CPU */
  opacity: 0.1 !important;
}

/* Simplificar cantos decorativos */
body.performance-mode .ui-corners::before,
body.performance-mode .ui-corners::after {
  box-shadow: none !important;
  border-width: 1px !important; /* Mais fino */
}

/* ============================================================================
   REGRAS DE PRIORIDADE (Garantir que exceções funcionem)
   ========================================================================== */

/* Força a aplicação de filtros em elementos críticos */
body.performance-mode .large-evidence-img[style*="filter"],
body.performance-mode .mystery-image img[style*="filter"],
body.performance-mode .thermal-canvas[style*="filter"] {
  filter: initial !important;
}

/* ============================================================================
   INDICADOR VISUAL DO MODO PERFORMANCE
   ========================================================================== */

body.performance-mode::before {
  content: "⚡ MODO PERFORMANCE";
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 255, 0, 0.1);
  border: 1px solid rgba(0, 255, 0, 0.3);
  color: #0f0;
  padding: 4px 8px;
  font-size: 10px;
  z-index: 999999;
  border-radius: 4px;
  pointer-events: none;
}
`;

export function isPerformanceMode(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return document.body.classList.contains('performance-mode');
  } catch {
    return false;
  }
}

export function isExtendedPerformanceMode(): boolean {
  try {
    if (typeof window === 'undefined') return false;
    return document.body.classList.contains('performance-mode-extended') || localStorage.getItem('extendedPerformanceMode') === '1';
  } catch {
    return false;
  }
}

export function getOptimizedInterval(normalMs: number, factor = 5): number {
  return isExtendedPerformanceMode() ? Math.max(1, normalMs * factor) : normalMs;
}

export default performanceCSS;

export function markPerfKeep(el: HTMLElement | null): () => void {
  try {
    if (!el) return () => {};
    el.setAttribute('data-perf-keep', '1');
    return () => {
      try { el.removeAttribute('data-perf-keep'); } catch {}
    };
  } catch {
    return () => {};
  }
}