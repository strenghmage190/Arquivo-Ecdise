# Phase 12: Otimização Estrutural e de Mídia - Context

**Gathered:** 2026-09-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Configuração de Code Splitting (React.lazy) nas rotas principais e otimização de imagens (Vite + WebP + lazy loading).

</domain>

<decisions>
## Implementation Decisions

### Code Splitting
- **D-01:** Utilizar `React.lazy()` e `<Suspense>` no componente principal de rotas (ex: `App.tsx`) com um fallback simples textual (`<div className="text-white text-center">Carregando...</div>`).

### Imagens
- **D-02:** Utilizar `vite-plugin-image-optimizer` e `sharp` no `vite.config.ts` convertendo imagens para formato WebP com qualidade 80.
- **D-03:** Todas as tags `<img>` devem receber o atributo `loading="lazy"` para evitar sobrecarga de RAM no carregamento inicial.

### the agent's Discretion
Refatorações no arquivo principal de rotas estão autorizadas, garantindo a coesão com a base de código e estrutura da navegação existente.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos
- `.planning/ROADMAP.md` — Requisitos e objetivos da Phase 12 (IMG-01, IMG-02, RND-01)
- `.planning/REQUIREMENTS.md` — Visão geral e escopo de performance
- `.planning/PROJECT.md` — Contexto de constraints e performance

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- Componente de Rotas (ex: `App.tsx` ou similar): Deve ser reestruturado para suportar lazy imports.

### Established Patterns
- Uso de plugins Vite no `vite.config.ts`.

### Integration Points
- `vite.config.ts` (Build pipeline config)
- `App.tsx` / `main.tsx` (Componente Raiz da Aplicação)

</code_context>

<specifics>
## Specific Ideas

- Foco agressivo em redução de memória, otimização de banda de rede e performance global (mobile/PCs limitados).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-Otimização Estrutural e de Mídia*
*Context gathered: 2026-09-24*
