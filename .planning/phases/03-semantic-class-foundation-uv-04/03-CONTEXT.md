# Phase 3: Semantic Class Foundation (UV-04) - Context

**Gathered:** 2026-08-14
**Status:** Ready for planning

<domain>
## Phase Boundary

Transform the ~39 static inline presentation styles in `UVEditor.tsx` JSX into a semantic class taxonomy in `UVEditor.css` — leaving exactly the 3 documented dynamic-geometry exceptions inline (textarea geometry `UVEditor.tsx:2935-2948`, mask-cursor geometry `:2954`, swatch `backgroundColor` `:2972`). Zero logic changes: canvas math, render loops, hooks frozen. Rendering must be pixel-identical; semantic classes are ADDITIVE aliases (`.uv-workspace`, `.uv-sidebar`), never substitutions for load-bearing names (`.uv-editor-panel`, `.uv-right-panel`).

</domain>

<decisions>
## Implementation Decisions

### Utilitários vs classes semânticas
- **D-01:** Containers semânticos absorvem o espaçamento single-use (`marginTop`, `padding`) internamente — cada container define sua própria margem/padding no CSS, sem mini-utilitárias de espaçamento no JSX.
- **D-02:** Uma única utilitária compartilhada `.uv-flex-row` (com `display:flex; gap:8`) cobre os ~6 flex-row spreads repetidos: header actions (`:2874`), botões RGB (`:2985`), botões Pronto/Cancelar (`:3065`, `:3086`), mask controls (`:3127`, `:3134`).
- **D-03:** O padrão `marginLeft:'auto'` (3 ocorrências: `:2874`, `:3129`, `:3154`) vira uma variante da utilitária flex — `.uv-flex-row--push` (empurra o último item para a direita).
- **D-04:** Textos auxiliares compartilham uma classe `.uv-helper-text` (para `fontSize`, `opacity`, `italic`): hint do canal RGB (`:3038`), descrição do canal (`:2982`), "Pré-visualização" (`:3080`), "Use pincel/borracha" (`:3154`).

### Fronteira dos sliders vs Fase 5
- **D-05:** Fase 3 padroniza TODOS os sliders em `.uv-range-slider`: os 2 que já têm `.uv-range` (`:3047`, `:3053-3055`) e os 2 sem classe (escala de imagem `:3077`, tamanho de máscara `:3141`). `.uv-range` permanece como alias para não quebrar. A Fase 5 faz apenas o polish visual Nexus sobre a mesma classe.
- **D-06:** A base de `.uv-range-slider` aplica `width:100%` + margin (funcional, não estético) já na Fase 3 — incluindo os 2 sliders que hoje herdam o default do browser.
- **D-07:** O slider de tamanho de máscara (`:3141`), que é inline num flex row dos mask controls, ganha `.uv-range-slider--inline` (zera width e usa um width fixo ~120px) para não quebrar o layout em linha.

### Estilos dinâmicos (botões RGB + cursor)
- **D-08:** Os 3 botões de canal RGB (`:2989-3036`) vão para classes de estado no CSS: `.uv-channel-btn` + variante de cor (`.uv-channel-btn--red/green/blue`) + `.is-active` toggle. Cores 100% no CSS, sem inline. A troca de `className` é edição de estilo, não de lógica — permitida.
- **D-09:** O `<strong>` "Canal selecionado" (`:3039`) usa `.uv-channel-name` + variantes `.uv-channel-name--red/green/blue` conforme `targetChannel`. Consistente com os botões.
- **D-10:** O cursor dinâmico do canvas (`:2913`) é re-homado via classes root já existentes: `.uv-editor-panel.tool-draw .uv-editor-viewport canvas { cursor: crosshair }`, `.tool-erase` → `cell`. Zero JSX novo — o toggle já existe em `UVEditor.tsx:2853-2854`. `touch-action: none` e `display: block` vão para regras de canvas (`.uv-canvas`).
- **D-11:** O swatch de cor (`:2972`) permanece inline — única exceção documentada de cor dinâmica. A regra 42→3 do roadmap fica intacta (exatamente 3 exceções).

### Convenção de nomenclatura
- **D-12:** Nomes flat kebab-case com prefixo `.uv-` — segue o padrão existente no arquivo (`.uv-editor-header`, `.uv-tools-dock`, `.uv-right-panel`) e os 4 nomes-piloto do roadmap (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`). Ex.: `.uv-panel-title`, `.uv-info-box`, `.uv-action-btn`.
- **D-13:** Modificador de variante como sufixo `--` (ex.: `.uv-channel-btn--red`, `.uv-range-slider--inline`, `.uv-flex-row--push`); estado booleano via `.is-active` (ex.: `.uv-channel-btn.is-active`). Não reutilizar `.active` (já usado por `.tab.active`/`.tool-button.active`).
- **D-14:** As novas regras vivem em um bloco novo seccionado ("Semantic classes") no final do `UVEditor.css`, com comentários de seção por região (header, viewport, sidebar, property-group, mask-controls, utilities). Aditivo, sem risco de regressão.

### the agent's Discretion
- Composição exata dos containers semânticos (quais estilos inline mapeiam para qual container) — o pesquisador/planner distribui os ~39 estilos nas classes decididas acima.
- Nomes concretos finais das classes individuais (além dos pilares D-12), desde que flat `.uv-` kebab-case.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements
- `.planning/ROADMAP.md` §Phase 3 — Goal, success criteria (42→3 rule, pixel-identical, additive aliases, canvas invariants, performance-mode), milestone-wide "exactly 3 JSX edits" constraint.
- `.planning/REQUIREMENTS.md` §UV-04 — Requirement definition (only the 3 documented dynamic-geometry exceptions remain inline) + §Out of Scope (no-touch zones: canvas math, render loops, hooks, LayersPanel/LayerItem inline styles).
- `.planning/PROJECT.md` — Core value, Key Decisions (skeleton + CSS only; additive aliases), Constraints (vanilla CSS, no inline styles, preserve Cyberpunk identity).
- `.planning/STATE.md` §Blockers/Concerns — Phase 7 HIGH-risk `UVEditor.animations.css` integration note (read-only awareness; not this phase).

### Source Code
- `src/components/tools/UVEditor.tsx:2868-3163` — The entire JSX to refactor (the only region that may change; everything above is no-touch).
- `src/components/tools/UVEditor.css` — Existing classes (flat `.uv-*`), token palette (`:root` vars `--nexus-*`, `--space-*`, `--transition-*`), performance-mode block at lines ~468-488.
- `src/components/tools/UVEditor.animations.css` — Do NOT import or modify (Phase 7 concern; must stay dead this phase).
- `src/utils/perf_helpers.ts` / `src/utils/performance.ts` — `markPerfKeep` (already wired at `UVEditor.tsx:2862`); performance-mode behavior must survive.

### Pattern Reference (v1.0 precedent)
- `src/components/modals/CreateClueModal_Refactored.css` — Semantic flat kebab-case precedent from Phase 1 (`nexus-row`, `panel-header`, `primary-btn`, `ghost-btn`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.uv-range` (`UVEditor.css:491`) — existing slider base to alias into `.uv-range-slider`.
- `.uv-flex-row`/`.uv-flex-row--push` — new; will serve header actions, RGB buttons, Pronto/Cancelar, mask controls.
- `:root` token palette (`--nexus-blue`, `--space-*`, `--transition-*`) — use for all new rules; no hardcoded colors.
- `markPerfKeep` (`src/utils/perf_helpers.ts`) — already applied to the editor root (`UVEditor.tsx:2862`); new classes must respect the `body.performance-mode` block.

### Established Patterns
- Flat `.uv-*` kebab-case classes with section comment headers — the UVEditor.css convention (lines 1, 34, 105, etc.).
- `--` suffix for variants, `.is-active` for boolean state (D-13) — newly locked for this phase.
- Root-level tool classes (`tool-draw`/`tool-erase`) toggled via `root.classList` (`UVEditor.tsx:2853-2854`) — reused for canvas cursor (D-10).

### Integration Points
- `.uv-editor-panel` root (`UVEditor.tsx:2869`) — load-bearing grid container; do not rename or change display.
- `.uv-editor-viewport` / `.viewport-canvas` / `canvas` — touch-action re-homed here (D-10); canvas must keep `pointer-events: auto !important` / `z-index: 1100 !important` untouched.
- `.uv-right-panel` — load-bearing right sidebar; semantic `.uv-sidebar` is an additive alias only.
- `.uv-editor-header`, `.uv-tools-dock`, `.uv-right-tabs`, `.properties-panel` — existing load-bearing layout names that keep their roles.

</code_context>

<specifics>
## Specific Ideas

- User explicitly chose recommended options throughout — prefers the disciplined approach: containers absorb spacing, shared utilities only where repetition is real (flex-row), state via CSS classes (no inline dynamic colors beyond the documented swatch), flat `.uv-` naming consistent with the existing file.
- Slider boundary is deliberately crisp: Phase 3 owns class + functional base, Phase 5 owns the visual Nexus polish. No overlap.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 3-Semantic Class Foundation (UV-04)*
*Context gathered: 2026-08-14*
