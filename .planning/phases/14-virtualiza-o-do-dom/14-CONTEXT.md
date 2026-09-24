# Phase 14: Virtualização do DOM — Context & Decisions

## Domain
Implementar scroll virtual em listas gigantes para eliminar travamentos (DOM-01, DOM-02). Foco na otimização de renderização.

## Canonical Refs
- ROADMAP.md
- REQUIREMENTS.md

## Implementation Decisions

### Alvo da Virtualização (Scope)
- **Decisão:** Cobertura Total (Modais, Painéis, Quadro Principal).
- **Detalhes:** O usuário selecionou que a virtualização deve ser aplicada em todos os lugares, incluindo listas 1D otimizadas (CreatorHub, TerminalSearch) e o quadro principal (InvestigationBoard) com implementação customizada para 2D, se necessário.

### Comportamento Visual durante Scroll (Overscan)
- **Decisão:** Overscan Alto (ex: 500px).
- **Detalhes:** Renderizar bastante área extra fora do viewport para evitar que o usuário veja clarões ou espaço em branco durante navegação e scroll super rápido, mesmo custando um pouco mais de memória/GPU.

## Code Context & Assets
- `src/components/modals/CreatorHub.tsx` (listas a virtualizar)
- `src/components/board/TerminalSearch.tsx` (histórico/resultados)
- `src/components/board/InvestigationBoard.tsx` (canvas 2D infinito)
