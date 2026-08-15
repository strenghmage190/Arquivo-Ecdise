# Phase 3: Semantic Class Foundation (UV-04) — Research

**Researched:** 2026-08-15
**Domain:** Vanilla CSS semantic-class refactor of React JSX (UVEditor.tsx) — zero-logic, pixel-identical migration
**Confidence:** HIGH (every claim verified against live source files and the approved UI-SPEC)

## Summary

UVEditor.tsx contains exactly **42** `style={{...}}` occurrences in the refactor region (`:2871–:3154`), independently confirmed by two greps (42 matches, no other `style=` patterns such as `style={var}` exist anywhere in the file). **39** are static presentation styles that map 1:1 to the UI-SPEC's 39-row taxonomy; **3** are genuinely dynamic and must remain inline (`:2935–2948` textarea geometry, `:2954` mask-cursor geometry, `:2972` swatch `backgroundColor`) — the 42→3 rule holds as documented. No `[ASSUMED]` claims were needed: every finding below is verified by direct source inspection (`UVEditor.tsx:2868–3163`, `UVEditor.css` full 1213-line read) cross-referenced against the approved UI-SPEC.

The refactor is mechanically clean: the new semantic classes have **zero name collisions** with the existing file (only `.uv-sidebar-section` — a distinct, pre-existing LayersPanel class — shares the `uv-sidebar` prefix), the existing `:focus-visible` `:is(...)` list at `UVEditor.css:61–73` already covers every new interactive class (all are `<button>` elements), and the `body.performance-mode .uv-editor-panel *` block at `:469–474` automatically neutralizes all new transitions since every new class is a descendant of `.uv-editor-panel`. One **critical discrepancy** was found: the UI-SPEC row `.uv-property-group label + label → :3054` is a **dead rule** — the `:3054` label's preceding sibling is the `:3053` range input, not a label. It must be re-mapped to `.uv-property-group input + label` or the "Máscara: Opacidade do Pincel" label loses its 8px top margin (SC#2 violation). This must be resolved by the planner (recommendation in Open Questions).

**Primary recommendation:** Execute the refactor in the 11-step region order in §Implementation Order, verifying `grep -c 'style=\{\{' UVEditor.tsx` decreases monotonically (42 → 3) at every checkpoint, with each checkpoint following the UI-SPEC's 39-row taxonomy verbatim — except the single re-mapped `:3054` label rule documented below.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** Containers semânticos absorvem o espaçamento single-use (`marginTop`, `padding`) internamente — cada container define sua própria margem/padding no CSS, sem mini-utilitárias de espaçamento no JSX.
- **D-02:** Uma única utilitária compartilhada `.uv-flex-row` (com `display:flex; gap:8`) cobre os ~6 flex-row spreads repetidos: header actions (`:2874`), botões RGB (`:2985`), botões Pronto/Cancelar (`:3065`, `:3086`), mask controls (`:3127`, `:3134`).
- **D-03:** O padrão `marginLeft:'auto'` (3 ocorrências: `:2874`, `:3129`, `:3154`) vira uma variante da utilitária flex — `.uv-flex-row--push` (empurra o último item para a direita).
- **D-04:** Textos auxiliares compartilham uma classe `.uv-helper-text` (para `fontSize`, `opacity`, `italic`): hint do canal RGB (`:3038`), descrição do canal (`:2982`), "Pré-visualização" (`:3080`), "Use pincel/borracha" (`:3154`).
- **D-05:** Fase 3 padroniza TODOS os sliders em `.uv-range-slider`: os 2 que já têm `.uv-range` (`:3047`, `:3053-3055`) e os 2 sem classe (escala de imagem `:3077`, tamanho de máscara `:3141`). `.uv-range` permanece como alias para não quebrar. A Fase 5 faz apenas o polish visual Nexus sobre a mesma classe.
- **D-06:** A base de `.uv-range-slider` aplica `width:100%` + margin (funcional, não estético) já na Fase 3 — incluindo os 2 sliders que hoje herdam o default do browser.
- **D-07:** O slider de tamanho de máscara (`:3141`), que é inline num flex row dos mask controls, ganha `.uv-range-slider--inline` (zera width e usa um width fixo ~120px) para não quebrar o layout em linha.
- **D-08:** Os 3 botões de canal RGB (`:2989-3036`) vão para classes de estado no CSS: `.uv-channel-btn` + variante de cor (`.uv-channel-btn--red/green/blue`) + `.is-active` toggle. Cores 100% no CSS, sem inline. A troca de `className` é edição de estilo, não de lógica — permitida.
- **D-09:** O `<strong>` "Canal selecionado" (`:3039`) usa `.uv-channel-name` + variantes `.uv-channel-name--red/green/blue` conforme `targetChannel`. Consistente com os botões.
- **D-10:** O cursor dinâmico do canvas (`:2913`) é re-homado via classes root já existentes: `.uv-editor-panel.tool-draw .uv-editor-viewport canvas { cursor: crosshair }`, `.tool-erase` → `cell`. Zero JSX novo — o toggle já existe em `UVEditor.tsx:2853-2854`. `touch-action: none` e `display: block` vão para regras de canvas (`.uv-canvas`).
- **D-11:** O swatch de cor (`:2972`) permanece inline — única exceção documentada de cor dinâmica. A regra 42→3 do roadmap fica intacta (exatamente 3 exceções).
- **D-12:** Nomes flat kebab-case com prefixo `.uv-` — segue o padrão existente no arquivo (`.uv-editor-header`, `.uv-tools-dock`, `.uv-right-panel`) e os 4 nomes-piloto do roadmap (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`). Ex.: `.uv-panel-title`, `.uv-info-box`, `.uv-action-btn`.
- **D-13:** Modificador de variante como sufixo `--` (ex.: `.uv-channel-btn--red`, `.uv-range-slider--inline`, `.uv-flex-row--push`); estado booleano via `.is-active` (ex.: `.uv-channel-btn.is-active`). Não reutilizar `.active` (já usado por `.tab.active`/`.tool-button.active`).
- **D-14:** As novas regras vivem em um bloco novo seccionado ("Semantic classes") no final do `UVEditor.css`, com comentários de seção por região (header, viewport, sidebar, property-group, mask-controls, utilities). Aditivo, sem risco de regressão.

### the agent's Discretion
- Composição exata dos containers semânticos (quais estilos inline mapeiam para qual container) — o pesquisador/planner distribui os ~39 estilos nas classes decididas acima.
- Nomes concretos finais das classes individuais (além dos pilares D-12), desde que flat `.uv-` kebab-case.

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UV-04 | UVEditor.tsx contains no inline presentation styles — all static styles moved to semantic CSS classes (.uv-workspace, .uv-sidebar, .uv-property-group, .uv-range-slider); only the 3 documented dynamic-geometry exceptions (textarea geometry, mask-cursor geometry, swatch color) remain inline | Full 42-occurrence inventory below (§Style Inventory); 3 exceptions verified at `:2935–2948`, `:2954`, `:2972`; UI-SPEC 39-row taxonomy is the executor source of truth |
| (ROADMAP SC#1) 42→3 grep rule | `grep 'style=\{\{'` returns exactly the 3 exceptions | Verified: 42 total today; each remaining style block contains a live-state token (`inlineTextEdit.cssX`, `maskCursor.x`, `color`) — nothing else is genuinely dynamic |
| (ROADMAP SC#2) Pixel-identical + additive aliases | Rendering identical; `.uv-workspace`/`.uv-sidebar` additive only | All new rules replicate inline values exactly; one UI-SPEC discrepancy (dead `label + label` rule) must be corrected to preserve pixel-identity — see §Common Pitfalls P1 and §Open Questions |
| (ROADMAP SC#3) Canvas invariants | touch-action re-homed, tool-draw/erase toggle intact, both file pickers work | `.uv-canvas` class added to `:2903` canvas; `touch-action: none` moved there; `display: block` already covered by existing `:419–427`; class toggles at `:2853–2854` untouched; `ref={fileInputRef}` on BOTH `:2890`/`:3075` inputs preserved — no deduplication |
| (ROADMAP SC#4) Performance-mode + a11y | Perf walkthrough survives; no new `!important`; focus-visible coverage | `body.performance-mode .uv-editor-panel *` (`:469–474`) neutralizes all new classes automatically (all are descendants of `.uv-editor-panel`); existing `!important` inventory mapped (§Common Pitfalls P3); every new interactive class is a `<button>` already matched by `:is(button, ...)` at `:61–73` — verification only, no edit needed |
</phase_requirements>

## Architectural Responsibility Map

This phase is a **pure presentation-layer refactor** — every capability lives in the Browser tier. There is no API, SSR, CDN, or database involvement; the "service boundary" is the React component → CSS module edge.

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Static presentation styling (all 39 migrated styles) | Browser / Client | — | Inline `style` props and CSS classes both live in the DOM/style layer; migration is intra-tier |
| Dynamic geometry exceptions (textarea, mask cursor, swatch) | Browser / Client | — | Driven by React state (`inlineTextEdit`, `maskCursor`, `brushSize`, `color`) at runtime — must stay inline per D-11/locked exceptions |
| Canvas cursor behavior (draw/erase/select modes) | Browser / Client | — | CSS state rules keyed on existing root class toggles `tool-draw`/`tool-erase` (`:2853–2854`) — no logic changes |
| Performance-mode neutralization | Browser / Client | — | Existing `body.performance-mode` rules at `:469–474` cascade over all new descendant classes |

## Standard Stack

**No new packages. This phase is 100% vanilla CSS + JSX className edits.** The "stack" is the existing, verified-in-place tooling:

| Component | Version (verified) | Purpose |
|-----------|--------------------|---------|
| React + TypeScript (tsx) | repo's existing (tsconfig.json present) | JSX className editing |
| Vanilla CSS module `UVEditor.css` | 1213 lines (read fully) | All new rules appended per D-14 |
| Vite dev server (`npm run dev`) | vite.config.ts present | Visual pixel-diff verification |
| Jest (ts-jest + jsdom + identity-obj-proxy) | jest.config.js present | Static guard tests (see Validation Architecture) |
| Cypress | cypress.config.ts present | Optional e2e smoke (existing suites only) |

**Installation:** none — `npm install` intentionally NOT needed.

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vanilla CSS classes (locked D-01..D-14) | CSS modules / styled-components / Tailwind | Locked by CONTEXT + PROJECT.md "vanilla CSS" constraint; any library would violate the additive-alias, byte-identical selector requirement (`.uv-editor-panel`, `.uv-range` must never be renamed) |
| Codemod/automated style extraction | Manual JSX→class mapping | The 39 sites are heterogeneous (conditional ternaries, contextual sibling selectors, IIFE nesting); a codemod would produce non-semantic class names violating D-12; UI-SPEC already provides the exact target per site |

## Package Legitimacy Audit

**No external packages are installed by this phase** — the Package Legitimacy Gate is not applicable (no slopcheck run; nothing to verify on any registry). All work is confined to `UVEditor.tsx` className edits and `UVEditor.css` additions.

| Package | Registry | Disposition |
|---------|----------|-------------|
| (none) | — | n/a — zero new dependencies |

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ UVEditor.tsx (JSX skeleton — refactor region :2868–3163 only)   │
│                                                                 │
│  <div class="uv-editor-panel uv-workspace">  ← additive alias   │
│   ├── .uv-editor-header                                          │
│   │    ├── div.uv-panel-title          (:2871)                  │
│   │    └── div.uv-flex-row.uv-flex-row--push (:2874)            │
│   │         └── btn-save / btn-close                            │
│   ├── .uv-tools-dock                (untouched — no inline)     │
│   ├── input.uv-hidden               (:2893 hidden picker)       │
│   ├── .uv-editor-viewport                                        │
│   │    └── .viewport-canvas                                      │
│   │         ├── canvas.uv-canvas    (:2903 — touch-action home) │
│   │         │    cursor: state rules via root class toggles     │
│   │         │    (.tool-draw/.tool-erase → D-10)                │
│   │         ├── textarea [EXCEPTION #1 :2935–2948]              │
│   │         └── div.mask-cursor [EXCEPTION #2 :2954]            │
│   └── .uv-right-panel.uv-sidebar   ← additive alias (:2960)     │
│        ├── .uv-right-tabs (untouched)                            │
│        ├── .properties-panel                                     │
│        │    ├── div.uv-property-group.uv-property-group--palette │
│        │    │    └── div.uv-flex-row.uv-color-row  (:2971)       │
│        │    │         └── div [EXCEPTION #3 :2972 swatch]        │
│        │    ├── div.uv-info-box → .uv-info-box-title,            │
│        │    │    .uv-helper-text, .uv-flex-row,                  │
│        │    │    .uv-channel-btn--red/green/blue(.is-active),    │
│        │    │    .uv-helper-text--hint, .uv-channel-name--*      │
│        │    └── div.uv-property-group ×4 → sliders, inputs,     │
│        │         preview, action rows                            │
│        ├── LayersPanel (untouched — out of scope)                │
│        └── div.uv-mask-controls (IIFE block :3122–3158)          │
│             └── uv-flex-row, uv-mask-*, uv-range-slider--inline  │
└─────────────────────────────────────────────────────────────────┘
        ▲                                    ▲
        │ all new CSS rules (appended block  │ existing load-bearing
        │ "Semantic classes" at END of       │ selectors stay byte-
        │ UVEditor.css) are descendants of   │ identical — additive
        │ .uv-editor-panel → perf-mode +     │ aliases only (SC#2)
        │ reduced-motion cascade covers them │
```

Data flow for the primary use case (user opens RGB editor and adjusts a channel): header title/actions render via `.uv-panel-title` + `.uv-flex-row` → RGB section renders via `.uv-info-box` + `.uv-channel-btn` state classes → user clicks a channel button → `className` swap (`is-active`) toggles CSS colors (no JSX style) → property groups below render sliders via `.uv-range-slider` — all presentation flows through the CSS block; only the 3 dynamic-geometry blocks touch inline state.

### Recommended Project Structure

```
src/components/tools/
├── UVEditor.tsx          # className edits ONLY in :2868–3163; everything above is no-touch
└── UVEditor.css          # existing 1213 lines UNTOUCHED; new "Semantic classes" block appended at END
```

No new files are required. Optional (recommended for SC verification): one jest guard test file, see §Validation Architecture Wave 0 Gaps.

### Pattern 1: Semantic class + variant + state (BEM-lite per D-12/D-13)

**What:** Base class carries shared declarations; `--` suffix carries variant deltas; `.is-active` carries boolean state. Colors/geometry live 100% in CSS.

**When to use:** Every repeated visual pattern — this is the phase's entire architecture.

**Example (channel buttons — D-08):**

```css
/* UVEditor.css — appended "Semantic classes" block, section: channel-buttons */
.uv-channel-btn {
  flex: 1;
  padding: 12px 10px;
  border-radius: 6px;
  font-weight: 400;
  cursor: pointer;
  transition: all 0.2s ease;      /* literal 0.2s — tokens are NOT value-identical */
  border: 1px solid transparent;
}
.uv-channel-btn--red  { background: rgb(255 68 68 / 10%); color: #ff8888; border: 1px solid rgb(255 68 68 / 20%); }
.uv-channel-btn--red.is-active { background: #ff4444; color: #fff; border: 2px solid #ff4444; }
.uv-channel-btn.is-active { font-weight: 600; }
```

```tsx
// UVEditor.tsx :2989 — inline style (39 lines) replaced by className swap:
<button
  type="button"
  onClick={() => handleTargetChannelChange('R')}
  className={`uv-channel-btn uv-channel-btn--red ${targetChannel === 'R' ? 'is-active' : ''}`}
>
  🔴 Red
</button>
```

**Guardrail (UI-SPEC):** preserve the 1px→2px border growth on activation exactly — do NOT "fix" it with padding compensation or `box-sizing`.

### Pattern 2: Container-absorbed spacing (D-01) + contextual sibling rules

**What:** Single-use margins move INTO the container's class; gaps between label/input pairs are reproduced with contextual descendant/sibling rules instead of per-element classes.

**When to use:** All property-group spacing — this reproduces today's pixel spacing exactly.

```css
.uv-property-group { margin-top: 12px; }
.uv-property-group--palette { margin-top: 0; margin-bottom: 12px; }  /* first child stays flush */
.uv-property-group input + label { margin-top: 8px; }   /* :3054, :3063, :3076 */
.uv-property-group .uv-flex-row { margin-top: 8px; }    /* :3065, :3086 — and :2971 color row */
.uv-property-group .uv-image-preview { margin-top: 8px; } /* :3079 */
```

**Guardrail (UI-SPEC):** do NOT switch `.uv-property-group` to `display:flex; gap:...` — the existing `.properties-panel label { margin-bottom: 6px }` (`:791–796`) would add to flex gaps and shift every label→control distance.

### Pattern 3: Additive alias (SC#2)

**What:** New semantic names are ADDED alongside load-bearing names; the load-bearing selectors keep their rules byte-identical.

```tsx
<div className="uv-editor-panel uv-workspace" ref={rootRef}>   {/* :2869 */}
<div className="uv-right-panel uv-sidebar">                    {/* :2960 */}
```

```css
.uv-workspace {}  /* empty declaration + comment: taxonomy hook for Phases 4–7 */
.uv-sidebar {}    /* .uv-right-panel rules untouched */
```

### Anti-Patterns to Avoid

- **Substituting aliases for load-bearing names:** `className="uv-workspace"` REPLACING `uv-editor-panel` breaks the grid — additive only (SC#2, Verification Hook 5).
- **"Fixing" values during migration:** the 6px micro-gaps, 10px channel-btn padding, `transition: all 0.2s ease`, `line-height: 1.4` (only in `.uv-info-box .uv-helper-text`) are pixel-identical preservation, not design choices.
- **Adding `!important` to the new block:** zero permitted (SC#4).
- **Touching `.uv-editor-viewport canvas { cursor: none !important }` at `:393–398`:** the new crosshair/cell rules are deliberately outranked by these — hidden-cursor behavior must survive.
- **Adding classes to buttons already covered by focus-visible:** `.uv-channel-btn`/`.uv-mask-eraser-toggle` are `<button>`s matched by `:is(button, ...)` at `:61–73` — no selector-list edit needed (UI-SPEC: sole permitted additive edit only if a new interactive class lands on a NON-button).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Style extraction codemod | A scripted AST transform to remove inline styles | Manual, UI-SPEC-guided className edits per site | Sites are heterogeneous (ternaries, contextual sibling selectors, IIFE nesting); the UI-SPEC already specifies the exact target per line; a codemod cannot produce D-12 semantic names |
| A new spacing utility per value | `.uv-mt-8`, `.uv-p-12` mini-classes | Container absorption (D-01) + contextual rules | Mini-utilities contradict D-01/D-02 and bloat the JSX; only `.uv-flex-row` earned shared-utility status (6 real repetitions) |
| "Improving" the refactor region | Fixing the redundant `{fontWeight:600}`-style duplicates, the `tool === 'select' ? 'default' : 'default'` tautology by changing behavior | Faithful value replication | SC#2 pixel-identity is the controlling constraint; simplification is allowed only where behavior provably unchanged (e.g., the tautological cursor ternary collapses to a CSS `default` rule) |
| Deduplicating the two file inputs | Merging `:2890` and `:3075` inputs | Leave both; add `.uv-hidden` to the dock one | SC#3 explicitly forbids deduplication — both inputs share `ref={fileInputRef}` and mount-order behavior |

**Key insight:** The UI-SPEC 39-row table already IS the don't-hand-roll answer — the executor's job is transcription, not design. Any deviation (a "cleaner" selector, a token substitution that isn't value-identical, a merged element) risks SC#2 and must be treated as a change request, not an improvement.

## Runtime State Inventory

> Included because this is a refactor phase. The canonical question — *"After every file in the repo is updated, what runtime systems still have the old string cached, stored, or registered?"* — answered per category. The "old string" here is inline presentation styles; these are compile-time artifacts, not runtime state.

| Category | Items Found | Action Required |
|----------|-------------|------------------|
| Stored data | None — no databases, key-value stores, or persisted records reference inline styles or CSS classes in UVEditor.tsx | none |
| Live service config | None — no external service (n8n, analytics, feature flags, tunnels) holds UVEditor CSS/class config; styling is 100% in-repo | none |
| OS-registered state | None — no scheduled tasks, services, or launch registrations reference UVEditor.tsx | none |
| Secrets/env vars | None — this phase touches no secrets; the only "env-like" dependency is `body.performance-mode` (a CSS class on `<body>`, toggled by existing app logic — untouched) | none |
| Build artifacts | None — no prebuilt/installed artifact embeds the inline styles; Vite rebuilds from source (`npm run build`); jest CSS is mocked via identity-obj-proxy | Rebuild/dev-server restart after edits is the only step |

**Nothing found in any category — verified by:** full read of the refactor region, grep of the repo for `style=` outside UVEditor.tsx (only other components' own inline styles, out of scope per REQUIREMENTS.md Out of Scope), and config.json (no service integrations for this phase).

## Style Inventory — All 42 `style={{...}}` Occurrences (UVEditor.tsx)

Verification: `grep 'style=\{\{'` → 42 matches; `grep 'style='` (broader) → same 42 — **no** `style={var}` or other style-prop forms exist. Line numbers verified against the current file (2026-08-15).

### The 3 Exceptions (LOCKED — remain inline)

| # | Lines | Element | Inline content | Why dynamic (verified live-state tokens) |
|---|-------|---------|----------------|------------------------------------------|
| E1 | 2935–2948 | `<textarea>` (inline text edit) | `position:absolute; left: inlineTextEdit.cssX; top: inlineTextEdit.cssY; fontSize: inlineTextEdit.fontSize; background; color; border; padding:4; minWidth:80; maxWidth:600; resize; outline` | Geometry/fontSize from live `inlineTextEdit` state; static parts stay inline WITH the block (UI-SPEC #1 — do not split) |
| E2 | 2954 | `<div class="mask-cursor">` | `left: maskCursor.x; top: maskCursor.y; width: brushSize; height: brushSize` | Pointer/state-driven geometry; static look already in `.viewport-canvas .mask-cursor` (`:406–416`, untouched) |
| E3 | 2972 | `<div>` color swatch | `width:28; height:28; borderRadius:6; background: color; border:1px solid rgba(0,0,0,0.2)` | `background` from live `color` state (D-11 — only documented dynamic color) |

### The 39 Static Styles → Class Mapping (executor source of truth: UI-SPEC §Semantic Class Taxonomy)

**Header region (→ 2 classes)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 2871 | `{fontWeight:600}` | `.uv-panel-title` | font-size NOT set — inherits header 13px |
| 2874 | `{marginLeft:'auto', display:'flex', gap:8}` | `.uv-flex-row` + `.uv-flex-row--push` | push = `margin-left:auto` ONLY, no display |

**Hidden input (→ 1 class)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 2893 | `{display:'none'}` | `.uv-hidden` | dock file picker; keep `ref={fileInputRef}` |

**Canvas (→ 1 class + 3 cursor rules, D-10)**

| Line | Current inline | Target | Notes |
|------|----------------|--------|-------|
| 2913 | `{touchAction:'none', cursor: <ternary>, display:'block'}` | `.uv-canvas` (touch-action only) + `.uv-editor-viewport canvas {cursor:default}` + `.uv-editor-panel.tool-draw … canvas {cursor:crosshair}` + `.tool-erase … {cursor:cell}` | `display:block` already in `:419–427`; the tautological ternary (`select ? 'default' : 'default'`) disappears entirely — zero logic change; `cursor:none !important` at `:393–398` still wins in draw/erase |

**Sidebar aliases (→ 2 classes, additive only)**

| Line | Element | Target class(es) | Notes |
|------|---------|-------------------|-------|
| 2869 | root div | ADD `.uv-workspace` (keep `uv-editor-panel`) | empty declaration + comment |
| 2960 | right panel | ADD `.uv-sidebar` (keep `uv-right-panel`) | empty declaration + comment |

**Palette (→ 2 classes)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 2969 | `{marginBottom:12}` | `.uv-property-group` + `.uv-property-group--palette` | base + variant BOTH required (base makes `.uv-property-group .uv-flex-row` fire below; variant zeroes base margin-top) |
| 2971 | `{display:'flex',alignItems:'center',gap:8,marginTop:8}` | `.uv-flex-row` + `.uv-color-row` | marginTop:8 via `.uv-property-group .uv-flex-row` contextual rule |

**Info box (→ 3 classes + 1 contextual)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 2980 | `{marginTop:12, padding:12, background:'rgba(0,215,255,0.03)', border:'1px solid rgba(0,215,255,0.12)', borderRadius:8}` | `.uv-info-box` | background/border = `rgb(var(--nexus-blue-rgb) / 3%)` / `/ 12%` |
| 2981 | `{fontSize:14, fontWeight:600, color:'#00d7ff', display:'block', marginBottom:8}` | `.uv-info-box-title` | color = `var(--nexus-blue)` |
| 2982 | `{fontSize:12, opacity:0.85, marginBottom:12, lineHeight:1.4}` | `.uv-helper-text` (+ `.uv-info-box .uv-helper-text` contextual: `margin-bottom:12px; line-height:1.4`) | the ONLY line-height:1.4 in the refactor |

**Channel buttons + name (→ 8 classes, D-08/D-09)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 2985 | `{display:'flex',gap:8}` | `.uv-flex-row` | no top margin today — none added |
| 2989 | R button 39-line dynamic style | `.uv-channel-btn` + `.uv-channel-btn--red` + `is-active` | className swap per D-08 |
| 3006 | G button | `.uv-channel-btn` + `.uv-channel-btn--green` + `is-active` | active text `#002200` (NOT #fff) |
| 3023 | B button | `.uv-channel-btn` + `.uv-channel-btn--blue` + `is-active` | |
| 3038 | `{fontSize:11, opacity:0.7, marginTop:8, fontStyle:'italic'}` | `.uv-helper-text--hint` — **standalone, NO base class** | inside `.uv-info-box`; composing base would match `.uv-info-box .uv-helper-text` → wrong line-height/margin |
| 3039 | `<strong>` `{color: <ternary>}` | `.uv-channel-name--red` / `--green` / `--blue` | className swapped by `targetChannel` (R→red, G→green, B→blue) |

**Property groups — generic (→ 2 classes + 3 contextual rules)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 3045 | `{marginTop:12}` | `.uv-property-group` | brush size group |
| 3051 | `{marginTop:12}` | `.uv-property-group` | softness/opacity group |
| 3054 | `{marginTop:8}` | ⚠️ see P1 — should be `.uv-property-group input + label` | **UI-SPEC row `.uv-property-group label + label` is DEAD — preceding sibling is input `:3053`, not a label** |
| 3060 | `{marginTop:12}` | `.uv-property-group` | text insert group |
| 3073 | `{marginTop:12}` | `.uv-property-group` | image group |

**Inputs & preview (→ 4 classes + 1 element rule)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 3062 | `{width:'100%',boxSizing:'border-box',marginTop:6}` | `.uv-text-input` | |
| 3063 | `{marginTop:8}` | `.uv-property-group input + label` | follows input `:3062` |
| 3064 | `{width:'100%'}` | `.uv-number-input` | |
| 3065 | `{display:'flex',gap:8,marginTop:8}` | `.uv-flex-row` | marginTop:8 via `.uv-property-group .uv-flex-row` |
| 3075 | `{display:'block',marginTop:6}` | `.uv-file-input` | keep `ref={fileInputRef}`; do NOT merge with :2893 |
| 3076 | `{marginTop:8}` | `.uv-property-group input + label` | follows input `:3075` |
| 3077 | *(no class)* | `.uv-range-slider` (+ `:not(.uv-range)` → margin-top:0) | gets `.properties-panel input[type=range]` look from `:771–789` — unchanged |
| 3079 | `{marginTop:8}` | `.uv-image-preview` | marginTop:8 via `.uv-property-group .uv-image-preview` |
| 3080 | `{fontSize:12,opacity:0.8}` | `.uv-helper-text` + `.uv-helper-text--faint` | outside info-box — no line-height applies |
| 3081 | `{maxWidth:'100%', marginTop:6}` | *(no className)* — `.uv-image-preview img {max-width:100%}` descendant rule; marginTop:6 absorbed by `.uv-image-preview` gap:6px | img keeps `src/alt/loading` attrs |
| 3084 | `{marginTop:8, fontSize:13, opacity:0.9}` | `.uv-helper-text` + `.uv-helper-text--note` | falsy branch — NOT inside `.uv-image-preview` |
| 3086 | `{display:'flex',gap:8,marginTop:8}` | `.uv-flex-row` | marginTop:8 via `.uv-property-group .uv-flex-row` |

**Sliders (→ 2 classes + 1 contextual guardrail, D-05/D-06/D-07)**

| Line | Current className | Target class(es) | Notes |
|------|-------------------|-------------------|-------|
| 3047 | `uv-range` | `uv-range uv-range-slider` | `.uv-range` stays as alias (D-05) |
| 3053 | `uv-range` | `uv-range uv-range-slider` | |
| 3055 | `uv-range` | `uv-range uv-range-slider` | |
| 3077 | *(none)* | `uv-range-slider` | margin-top zeroed by `.uv-range-slider:not(.uv-range)` guardrail (pixel-identical, resolves D-06 vs SC#2) |
| 3141 | *(none)* | `uv-range-slider` + `uv-range-slider--inline` | width:120px, margin-top:0 — flex row layout |

**Mask controls (→ 4 classes + 2 contextual rules, IIFE region)**

| Line | Current inline | Target class(es) | Notes |
|------|----------------|-------------------|-------|
| 3126 | `{padding:12, borderTop:'1px dashed rgba(255,255,255,0.04)', marginTop:8}` | `.uv-mask-controls` | |
| 3127 | `{display:'flex',gap:8,alignItems:'center',marginBottom:8}` | `.uv-flex-row` + `.uv-mask-controls-header` | |
| 3129 | `{marginLeft:'auto',display:'flex',gap:8}` | `.uv-flex-row` + `.uv-flex-row--push` | Inverter/Limpar buttons `:3130–3131` have NO inline style → no class (Phase 5's `.uv-action-btn`) |
| 3134 | `{display:'flex',gap:8,alignItems:'center'}` | `.uv-flex-row` + `.uv-mask-paint-row` | |
| 3135 | `{fontSize:13}` | `.uv-mask-paint-row label` | NOT affected by `.properties-panel label` (outside `.properties-panel`) |
| 3140 | `{fontSize:13, marginLeft:12}` | `.uv-mask-paint-row label` + `.uv-mask-paint-row select + label` | |
| 3153 | `{marginLeft:8}` | `.uv-mask-eraser-toggle` | `<button>` — focus-visible already covered |
| 3154 | `{marginLeft:'auto', fontSize:12, opacity:0.85}` | `.uv-helper-text` + `.uv-flex-row--push` | push standalone (NO display:flex); element is a flex child of `:3134` |

**Count check:** 3 exceptions + 39 static = 42 ✓. Class-name total ≈ 27–32 declarations depending on how variants/contextual rules are counted — the UI-SPEC 39-row table is authoritative; D-12 requires all flat `.uv-` kebab-case.

## CSS Organization & Implementation Order

### File organization (D-14 — verified conventions)

Existing `UVEditor.css` conventions confirmed by full read:
- **Section comment headers** at `:1`, `:34`, `:105`, `:131`, `:147`, `:201`, `:314`, `:519`, `:938` — styles vary between `/* ===== ... ===== */` and `/* =====...===== */`; new block should use the `/* ===== Semantic classes — <region> ===== */` form.
- **Token palette** `:root` at `:5–32` (`--nexus-*`, `--space-*`, `--transition-*`, `--border-color`, `--bg-elevated`, `--bg-2`).
- **`body.performance-mode` block** at `:468–488`.
- **`.uv-range`** at `:491–502` (base slider to alias).
- **`.properties-panel input[type="range"]`** at `:771–789`, **`.properties-panel label`** at `:791–796`.
- **`:focus-visible` list** at `:61–73`.

**New block layout (appended at END of file, after `:1213`):**

```css
/* ===== Semantic classes (Phase 3 — UV-04) ===== */
/* 01 header */
.uv-panel-title { font-weight: 600; }                       /* :2871 */
/* 02 viewport-canvas */
.uv-canvas { touch-action: none; }                           /* :2903 — display:block already at :419 */
.uv-editor-viewport canvas { cursor: default; }              /* NEW additive — later in file than :387, same specificity → wins for select/placeText/placeImage */
.uv-editor-panel.tool-draw .uv-editor-viewport canvas { cursor: crosshair; }  /* outranked by :393 !important — preserves hidden cursor */
.uv-editor-panel.tool-erase .uv-editor-viewport canvas { cursor: cell; }
/* 03 sidebar (additive aliases) */
.uv-workspace {}  /* taxonomy hook — .uv-editor-panel untouched */
.uv-sidebar {}    /* taxonomy hook — .uv-right-panel untouched */
/* 04 utilities */
.uv-flex-row { display: flex; gap: 8px; }
.uv-flex-row--push { margin-left: auto; }                   /* NO display:flex — standalone */
.uv-hidden { display: none; }
.uv-helper-text { font-size: 12px; opacity: 0.85; }         /* NO line-height */
.uv-helper-text--hint { font-size: 11px; opacity: 0.7; font-style: italic; margin-top: 8px; }
.uv-helper-text--faint { opacity: 0.8; }
.uv-helper-text--note { font-size: 13px; opacity: 0.9; margin-top: 8px; }
/* 05 property-group */
.uv-property-group { margin-top: 12px; }
.uv-property-group--palette { margin-top: 0; margin-bottom: 12px; }
.uv-property-group input + label { margin-top: 8px; }       /* :3054, :3063, :3076 */
.uv-property-group .uv-flex-row { margin-top: 8px; }        /* :2971, :3065, :3086 */
.uv-property-group .uv-image-preview { margin-top: 8px; }   /* :3079 */
.uv-color-row { align-items: center; }
.uv-text-input { width: 100%; box-sizing: border-box; margin-top: 6px; }
.uv-number-input { width: 100%; }
.uv-file-input { display: block; margin-top: 6px; }
.uv-image-preview { display: flex; flex-direction: column; gap: 6px; }
.uv-image-preview img { max-width: 100%; }
/* 06 info-box */
.uv-info-box { margin-top: 12px; padding: 12px; background: rgb(var(--nexus-blue-rgb) / 3%); border: 1px solid rgb(var(--nexus-blue-rgb) / 12%); border-radius: 8px; }
.uv-info-box-title { font-size: 14px; font-weight: 600; color: var(--nexus-blue); display: block; margin-bottom: 8px; }
.uv-info-box .uv-helper-text { margin-bottom: 12px; line-height: 1.4; }
/* 07 channel-buttons */
.uv-channel-btn { flex: 1; padding: 12px 10px; border-radius: 6px; font-weight: 400; cursor: pointer; transition: all 0.2s ease; border: 1px solid transparent; }
.uv-channel-btn--red  { background: rgb(255 68 68 / 10%); color: #ff8888; border: 1px solid rgb(255 68 68 / 20%); }
.uv-channel-btn--red.is-active  { background: #ff4444; color: #fff; border: 2px solid #ff4444; }
.uv-channel-btn--green { background: rgb(68 255 68 / 10%); color: #88ff88; border: 1px solid rgb(68 255 68 / 20%); }
.uv-channel-btn--green.is-active { background: #44ff44; color: #002200; border: 2px solid #44ff44; }
.uv-channel-btn--blue { background: rgb(68 68 255 / 10%); color: #8888ff; border: 1px solid rgb(68 68 255 / 20%); }
.uv-channel-btn--blue.is-active { background: #4444ff; color: #fff; border: 2px solid #4444ff; }
.uv-channel-btn.is-active { font-weight: 600; }
.uv-channel-name--red { color: #ff4444; }
.uv-channel-name--green { color: #44ff44; }
.uv-channel-name--blue { color: #4444ff; }
/* 08 mask-controls */
.uv-mask-controls { padding: 12px; border-top: 1px dashed rgb(255 255 255 / 4%); margin-top: 8px; }
.uv-mask-controls-header { align-items: center; margin-bottom: 8px; }
.uv-mask-paint-row { align-items: center; }
.uv-mask-paint-row label { font-size: 13px; }
.uv-mask-paint-row select + label { margin-left: 12px; }
.uv-mask-eraser-toggle { margin-left: 8px; }
/* 09 range-sliders */
.uv-range-slider { width: 100%; margin-top: 6px; }
.uv-range-slider--inline { width: 120px; margin-top: 0; }
.uv-range-slider:not(.uv-range) { margin-top: 0; }   /* pixel-identical guardrail — :3077, :3141 */
```

### Implementation order (incremental 42→3 verification)

Each step = one commit-ready checkpoint; verify `(rg -c 'style=\{\{' UVEditor.tsx)` — or `Select-String` count on Windows — decreases monotonically. CSS additions for a region go in FIRST, then the JSX className edits for that region (so any single commit is rendering-safe either way).

| Step | Region | JSX lines touched | `style={{` count after |
|------|--------|-------------------|------------------------|
| 0 | Baseline | — | 42 |
| 1 | Header | 2871, 2874 | 40 |
| 2 | Hidden input | 2893 | 39 |
| 3 | Canvas (D-10) | 2913 (style removed; `.uv-canvas` added at 2903) | 38 |
| 4 | Sidebar aliases (additive) | 2869, 2960 | 38 (no style removal — pure taxonomy) |
| 5 | Palette | 2969, 2971 | 36 |
| 6 | Info box | 2980, 2981, 2982 | 33 |
| 7 | Channel buttons + name | 2985, 2989, 3006, 3023, 3038, 3039 | 27 |
| 8 | Property groups I (generic + text) | 3045, 3051, 3054, 3060, 3062, 3063, 3064, 3065 | 19 |
| 9 | Property groups II (image + preview) | 3073, 3075, 3076, 3077, 3079, 3080, 3081, 3084, 3086 | 11 |
| 10 | Mask controls (IIFE) | 3126, 3127, 3129, 3134, 3135, 3140, 3141, 3153, 3154 | 3 |
| 11 | FINAL GATE | — | 3 — must be exactly lines 2935, 2954, 2972 |

Rationale for this order: CSS + JSX per region keeps each diff self-contained; step 7 (channel buttons) is the highest-risk visual region (state colors) so it lands before the property groups where mistakes are easier to eyeball; mask controls last because they're inside the IIFE and require the properties panel context to visually verify.

## Common Pitfalls

### Pitfall 1: The dead `label + label` rule in UI-SPEC (CRITICAL — must be resolved by planner)
**What goes wrong:** UI-SPEC maps `:3054` ("Máscara: Opacidade do Pincel") to `.uv-property-group label + label`. The DOM at `:3051–3055` is `label(3052) → input(3053) → label(3054) → input(3055)` — the `:3054` label's preceding sibling is the **input**, so `label + label` never matches. Following the UI-SPEC verbatim drops the label's 8px margin → SC#2 violation. Verified by direct inspection — no `label+label` adjacency exists anywhere in the refactor region.
**Why it happens:** Likely a transcription slip in the UI-SPEC row (the row's intent — "second label in a group" — is satisfied by `input + label`).
**How to avoid:** Re-map `:3054` to `.uv-property-group input + label` (one rule now covers `:3054`, `:3063`, `:3076`) and DELETE the dead `label + label` rule from the block. Both rows currently declare the same `margin-top: 8px`, so this is value-identical. Planner: add a checkpoint noting the deviation from UI-SPEC (checker was not aware).
**Warning signs:** 8px spacing loss between "Máscara: Suavidade do Pincel" slider and "Máscara: Opacidade do Pincel" label in pixel-diff.

### Pitfall 2: `.uv-helper-text` composition traps (SC#2 box-growth)
**What goes wrong:** `:3038` (RGB hint, `font-size:11`) sits INSIDE `.uv-info-box`. If it receives the base `.uv-helper-text` class, the contextual `.uv-info-box .uv-helper-text` rule applies `line-height: 1.4` + `margin-bottom: 12px` it doesn't have today → box grows ~1–2px. Conversely, giving the base a `line-height: 1.4` grows `:3038`/`:3080`/`:3084`/`:3154`.
**Why it happens:** Contextual rules (0,2,0) outrank base (0,1,0) — silent cascade.
**How to avoid:** Follow the UI-SPEC class strings EXACTLY: `:3038` → `uv-helper-text--hint` ONLY (no base); `:3080` → `uv-helper-text uv-helper-text--faint`; `:3084` → `uv-helper-text uv-helper-text--note`; base has NO `line-height`.
**Warning signs:** Info-box height diff; hint text italic lost; spacing between hint and buttons changed.

### Pitfall 3: `!important` and load-bearing selector integrity (SC#4 + Verification Hooks 5)
**What goes wrong:** New rules that accidentally include `!important`, or edits to `:383–385` (pointer-events/z-index), `:393–398` (cursor none), `:469–474` (perf block), `:274–283`/`:1022–1044`/`:1154–1212` (existing !important), or renames of `.uv-editor-panel`/`.uv-right-panel`/`.uv-range`/`.tool-draw`/`.tool-erase`.
**Why it happens:** Convenience during debugging.
**How to avoid:** Zero `!important` in the new block (grep gate); never touch the listed existing rules; aliases are additive only.
**Warning signs:** `rg '!important'` matches inside the semantic block; canvas becomes click-dead or cursor visible in draw mode.

### Pitfall 4: `.uv-flex-row--push` given `display:flex`
**What goes wrong:** `:3154` (mask hint) uses push STANDALONE — it is a flex *child* of `:3134`, not a flex container. If push inherits `display:flex` (e.g., by writing the two utilities as one rule), the hint div becomes a flex container wrapping its text — layout/vertical-align change.
**Why it happens:** Reading "variant of uv-flex-row" as "extends the rule" instead of "separate modifier".
**How to avoid:** `.uv-flex-row--push { margin-left: auto; }` — exactly one declaration. Compose (`uv-flex-row uv-flex-row--push`) only at `:2874` and `:3129`.
**Warning signs:** Mask hint text reflows; header actions misalign.

### Pitfall 5: The 6px slider-margin trap (D-06 vs SC#2)
**What goes wrong:** `:3077` (image scale) currently has **0** top margin — the base `.uv-range-slider { margin-top: 6px }` would shift it 6px.
**Why it happens:** D-06 mandates a functional base margin; the classless slider inherits nothing today.
**How to avoid:** Keep the `.uv-range-slider:not(.uv-range) { margin-top: 0 }` guardrail rule (applies to `:3077`, `:3141` — the latter already zeroed by `--inline`). `:3047/:3053/:3055` keep `uv-range` so they KEEP the 6px from `.uv-range` itself.
**Warning signs:** Image-scale slider visibly shifted in pixel-diff.

### Pitfall 6: Channel-button border-grow "fix" and green-active text
**What goes wrong:** "Improving" activation (compensating the 1px→2px border growth with padding or box-sizing) changes the active-button size vs today; or the green active text `#002200` (not `#fff`) is "corrected" to white — both are SC#2 violations.
**Why it happens:** The inline code is the contract; it's easy to second-guess.
**How to avoid:** Transcribe the UI-SPEC channel rows verbatim; keep `transition: all 0.2s ease` literal (tokens are 120/180ms — NOT value-identical).
**Warning signs:** Button size jump on activation differs from pre-refactor; Green active text looks white.

## Code Examples

Verified patterns — all target strings exactly as the executor should write them (values replicate current inline rendering):

### Channel button className swap (D-08) — `:2989/:3006/:3023`
```tsx
<button
  type="button"
  onClick={() => handleTargetChannelChange('R')}
  className={`uv-channel-btn uv-channel-btn--red ${targetChannel === 'R' ? 'is-active' : ''}`}
>
  🔴 Red
</button>
```
Template-literal + ternary className precedent already exists in-file (`:2881–2885`, `:2962–2964`).

### Channel name swap (D-09) — `:3039`
```tsx
Canal selecionado: <strong className={`uv-channel-name--${targetChannel === 'R' ? 'red' : targetChannel === 'G' ? 'green' : 'blue'}`}>{targetChannel}</strong>
```

### Slider class unification (D-05/D-07)
```tsx
{/* :3047, :3053, :3055 — keep alias */}
<input className="uv-range uv-range-slider" type="range" ... />
{/* :3077 — previously classless */}
<input className="uv-range-slider" type="range" min={0.1} max={3} step={0.05} ... />
{/* :3141 — inline in mask flex row */}
<input className="uv-range-slider uv-range-slider--inline" type="range" min={1} max={200} ... />
```

### Additive aliases (SC#2)
```tsx
<div className="uv-editor-panel uv-workspace" ref={rootRef}>      {/* :2869 */}
<div className="uv-right-panel uv-sidebar">                        {/* :2960 */}
```

### Canvas (D-10) — `:2903–2914`
```tsx
<canvas
  ref={canvasRef}
  width={800}
  height={600}
  className="uv-canvas"
  /* ... all event handlers unchanged ... */
  /* style={{...}} REMOVED entirely — cursor now CSS, touch-action in .uv-canvas */
/>
```

### Palette group (base + variant BOTH) — `:2969–2971`
```tsx
<div className="uv-property-group uv-property-group--palette">
  <label>Paleta</label>
  <div className="uv-flex-row uv-color-row">
    <div style={{width:28,height:28,borderRadius:6,background:color,border:'1px solid rgba(0,0,0,0.2)'}} title={`Cor atual: ${color}`} />  {/* EXCEPTION #3 — stays */}
    <input type="color" value={color} onChange={e => handleColorChange(e.target.value)} aria-label="Selecionar cor" />
  </div>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 42 inline `style={{}}` props in refactor region | Semantic class taxonomy + 3 documented dynamic exceptions | This phase (v1.2 Phase 3) | UV-04: zero-inline-skeleton; classes reusable by Phases 4–7 |
| Per-element spacing in JSX | Container-absorbed spacing + contextual sibling rules (D-01) | This phase | Only shared utility (`.uv-flex-row`) survives as a class; no mini-spacing utilities |
| Inline conditional cursor on canvas | CSS state rules on existing `tool-draw`/`tool-erase` root toggles (D-10) | This phase | Cursor is now pure CSS; toggle was already wired at `:2853–2854` |

**Deprecated/outdated:**
- `transition: all 0.2s ease` on channel buttons — kept LITERAL this phase (value-identical); Phase 5 replaces with token-based polish (do not pre-migrate — would break SC#2).
- `.uv-range` — retained as alias under `.uv-range-slider` (D-05); Phase 5 restyles via `.uv-range-slider`.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| — | No `[ASSUMED]` claims | all | All findings were verified against live source files (UVEditor.tsx read at :2840–3163, UVEditor.css full 1213-line read, two independent greps) and the approved UI-SPEC — no training-data claims were used. The single deviation from the UI-SPEC (Pitfall 1) is itself a *verified fact* (dead selector), listed in Open Questions for planner resolution, not an assumption |

## Open Questions

1. **How should the `.uv-property-group label + label` UI-SPEC row be resolved?**
   - What we know: the selector cannot match any element in the refactor region (verified DOM: `:3054` follows input `:3053`); `input + label` matches `:3054`, `:3063`, `:3076` and is value-identical (`margin-top: 8px`).
   - What's unclear: whether the UI-SPEC row was meant as documentation-for-future or is a transcription error.
   - Recommendation: **re-map `:3054` to `.uv-property-group input + label` and omit the dead `label + label` rule**; note the deviation in the plan (checker approved via the "checker non-blocking FLAGs resolved" precedent — this is a new flag). If the team prefers zero UI-SPEC deviation, keep `label + label` as an inert documented rule AND add `:3054` to `input + label` — the pixel outcome is identical either way; only the CSS block content differs.

2. **Does the final-gate grep need to assert exact line numbers, or only count=3?**
   - What we know: verification hook 1 says "exactly lines 2935, 2954, 2972"; the UI-SPEC explicitly documents line numbers.
   - What's unclear: line numbers may shift by ±1 if prettier/formatting touches the JSX during edits (guard: no formatting pass on the file this phase).
   - Recommendation: primary gate = count == 3 + each remaining block contains a live-state token (`inlineTextEdit.`/`maskCursor.`/`brushSize`/`: color`); line-number assertion as a soft check.

3. **Visual pixel-diff tooling for SC#2?**
   - What we know: repo has Cypress (existing suites: mobile-responsiveness, investigation-board) but no screenshot-diff harness; jest mocks CSS via identity-obj-proxy (cannot assert styling).
   - What's unclear: whether to add a screenshot baseline this phase or rely on manual before/after walkthrough.
   - Recommendation: manual browser walkthrough (dev server + Chrome DevTools screenshot before/after per region) — no new tooling this phase (keeps the zero-dependency constraint); consider a Cypress visual regression only if a Phase 4+ need emerges.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | dev server, jest, typecheck | ✓ | v24.16.0 | — |
| npm | script runner (`npm run dev` / `npm test`) | ✓ | 11.13.0 | — |
| Vite dev server | visual pixel-diff verification | ✓ (config present) | vite.config.ts | `npm run build` + `npm run preview` |
| Jest (ts-jest) | static guard tests | ✓ | jest.config.js | manual grep gates |
| Cypress | optional e2e smoke | ✓ | cypress.config.ts | manual walkthrough |
| Browser (Chromium) | visual walkthrough (SC#2/SC#3/SC#4) | assumed — dev workstation | — | manual DOM inspection via dev server |

**Missing dependencies with no fallback:** none — the phase needs only what's already installed.
**Missing dependencies with fallback:** browser verification cannot be automated this phase (no screenshot-diff harness exists; jest mocks CSS) — fallback is the manual per-region walkthrough in §Implementation Order.

## Validation Architecture

> `workflow.nyquist_validation: true` in `.planning/config.json` → included. This is a CSS refactor: automated validation is **grep/static-assert based**, not unit-test based (jest mocks CSS imports via identity-obj-proxy, so CSS behavior is untestable in jsdom; the UI-SPEC's own Verification Hooks are the authoritative gate).

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Jest (ts-jest, jsdom, identity-obj-proxy CSS mock) — existing |
| Config file | jest.config.js (exists) |
| Quick run command | `npm test -- --watch=false` (or the targeted file below) |
| Full suite command | `npm test` + `npm run typecheck` + manual browser walkthrough |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UV-04 (SC#1) | `style={{` count in UVEditor.tsx == 3; remaining blocks are the documented exceptions | static fs-grep unit | `npm test -- uv04-semantic-classes` | ❌ Wave 0 |
| UV-04 (SC#4) | New "Semantic classes" block exists at END of UVEditor.css with zero `!important` | static fs-grep unit | same test file | ❌ Wave 0 |
| UV-04 (SC#2) | Load-bearing selectors byte-identical (`.uv-editor-panel`, `.uv-right-panel`, `.uv-range`, `.tool-draw`, `.tool-erase` still declared) | static fs-grep unit | same test file | ❌ Wave 0 |
| UV-04 (SC#3/SC#4) | Canvas interactivity, touch drawing, file pickers, perf-mode visuals | manual (no screenshot harness) | manual walkthrough per §Implementation Order | n/a — manual-only, justified: jest mocks CSS; no Cypress screenshot-diff baseline exists |

### Sampling Rate
- **Per task commit:** `rg -c 'style=\{\{' src/components/tools/UVEditor.tsx` (Windows: `Select-String` count) — must equal the §Implementation Order checkpoint value; plus `npm run typecheck`.
- **Per wave merge:** `npm test` + `npm run typecheck` + the focused jest guard test.
- **Phase gate:** full suite green + UI-SPEC Verification Hooks 1–7 walked (grep 42→3, zero `!important` in block, perf-mode walkthrough, pixel-diff of grid/header/Save/Close, selector byte-identity, canvas draw mouse+touch + both file pickers, block position at end of file).

### Wave 0 Gaps
- [ ] `tests/uv04-semantic-classes.test.ts` (or `src/.../__tests__/` per repo convention `src/utils/__tests__/`) — reads `src/components/tools/UVEditor.tsx` via fs, regex-counts `style=\{\{`, asserts == 3 and that each match line's context contains a live-state token (`inlineTextEdit` / `maskCursor` / `brushSize` / `background: color`); reads `UVEditor.css`, asserts the final block starts with a `Semantic classes` comment AFTER the last existing rule and contains zero `!important`.
- [ ] No framework install needed — Jest exists; the test file is the only Wave 0 gap.

## Security Domain

> `security_enforcement` key absent in config.json → treated as enabled. Honest assessment: this phase is a **zero-logic, zero-new-input CSS refactor** — the security surface is unchanged from the pre-refactor state.

### Applicable ASVS Categories
| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | no | — no auth touched; component already inside authenticated app shell |
| V3 Session Management | no | — no session state in scope |
| V4 Access Control | no | — no authorization logic in refactor region |
| V5 Input Validation | no (no new input paths) | Existing inputs (`:3062` text, `:3064` number, `:3075` file, `:2973` color) are unchanged in handling; React escapes all rendered values; className strings are static literals or `targetChannel`-derived (`'red'|'green'|'blue'`) — no user input reaches a className |
| V6 Cryptography | no | — no crypto in scope (existing file-export path untouched) |

### Known Threat Patterns for {stack}
| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| CSS injection via dynamic className | Tampering | None possible — the only dynamic className interpolations are `targetChannel === 'R' ? 'red' : 'G' ? 'green' : 'blue'` and `is-active` ternaries over `targetChannel` (a fixed `'R'|'G'|'B'` union) — no user-controlled strings |
| Inline-style injection via state | Tampering | Unchanged from today — the 3 exceptions use state-derived numeric/color values (`cssX/cssY/fontSize/brushSize/maskCursor.x/color`) already rendered inline pre-refactor; no new injection surface introduced |
| DOM clobbering / layout bypass | — | New classes are flat `.uv-` names, no `!important` (SC#4), all scoped under `.uv-editor-panel` — cannot override canvas invariants (`pointer-events`/`z-index` `!important` at `:383–385` untouched) |

**Security verification hooks for this phase:** (a) `rg '!important' UVEditor.css` — new block adds zero; (b) confirm no `dangerouslySetInnerHTML` / `innerHTML` introduced (none are — refactor removes style props only); (c) confirm `style={{` count == 3 and each remaining block's values derive from existing state variables only.

## Sources

### Primary (HIGH confidence)
- `src/components/tools/UVEditor.tsx` — full read of refactor region `:2840–3163` (all 42 style sites + className structure + IIFE nesting + root class toggles + `fileInputRef` mounts) and imports `:1–60`
- `src/components/tools/UVEditor.css` — full 1213-line read (token palette, `:focus-visible` list `:61–73`, perf-mode block `:468–488`, `.uv-range` `:491–502`, `.properties-panel` rules `:771–796`, canvas rules `:379–427`, all existing `.uv-*` classes, media queries `:871–936`)
- `.planning/phases/03-semantic-class-foundation-uv-04/03-UI-SPEC.md` — approved 39-row taxonomy, verification hooks, guardrails (read in full)
- `.planning/phases/03-semantic-class-foundation-uv-04/03-CONTEXT.md` — locked decisions D-01..D-14 (read in full)
- Repo verification: two independent `style={{` greps (42 matches, no other `style=` forms), `className` grep (`:2869–:3153`), `!important` inventory, no CSS-name collisions (`rg '\.uv-(canvas|hidden|flex-row|workspace|sidebar|property-group|range-slider|helper-text|info-box|channel|mask|panel-title|text-input|number-input|file-input|image-preview|color-row|action-btn|palette)'` → only pre-existing `.uv-sidebar-section`), jest/vite/cypress config reads, node/npm version probes

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` §Phase 3 success criteria SC#1–SC#4 and milestone constraints
- `.planning/REQUIREMENTS.md` §UV-04 + §Out of Scope no-touch zones
- `.planning/config.json` — workflow flags (nyquist_validation: true; security_enforcement absent)

### Tertiary (LOW confidence)
- Browser availability for visual walkthrough — assumed on this dev workstation (not probed); flagged in Environment Availability

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — zero new packages; existing tooling probed and version-confirmed
- Architecture: HIGH — every mapping derived from direct source inspection cross-checked against the approved UI-SPEC table
- Pitfalls: HIGH — all six pitfalls verified against actual file contents (DOM sibling order, specificity math, existing `!important`/perf/focus rules); the `label + label` dead-rule finding is source-verified, with resolution delegated to the planner

**Research date:** 2026-08-15
**Valid until:** 2026-09-14 (30 days — refactor region line numbers are stable; any upstream edit to UVEditor.tsx between 2868–3163 invalidates the line references)
