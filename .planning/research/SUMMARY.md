# Project Research Summary

**Project:** UVEditor "Mini-Photoshop" UI/UX Refactor (v1.2 milestone of CreateClueModal UI/UX Refactor project)
**Domain:** Vanilla-CSS/JSX-skeleton refactor of a 3163-line canvas image editor — tool states, insertion-mode feedback, transparency checkerboard, Nexus-styled controls, layers styling integration
**Researched:** 2026-08-14
**Confidence:** HIGH (codebase line-verified by 4 independent research passes; web claims anchored to MDN/caniuse/CSSWG/official vendor docs)

## Executive Summary

The UVEditor is a functionally complete monolithic canvas editor (drawing, masks, layers, text/image placement, pan/zoom) whose UI "works but feels terrible" — the user calls it "horrível de mexer" and finds text/image placement confusing. Research confirms the editor already has **80% of the machinery needed**: the `tool` state, placement flow, `.tool-button.active` classes, layers drag-and-drop, and even a (too-subtle) checkerboard already exist. What's missing is **visual and structural polish, not logic** — a CSS/JSX-skeleton refactor only, with zero logic changes, zero new npm packages, and zero edits above the JSX presentation layer (line ~2868) except one permitted import.

The recommended approach is a **dependency-ordered build: UV-04 (semantic class taxonomy + inline-style removal) first** — every other requirement (UV-01/02/03/05/06/07) lands as a semantic class on top of it — followed by visual upgrades (UV-01 dock state, UV-03 checkerboard, UV-05 sliders, UV-06 pressed states), then the headline banner (UV-02) and preservation (UV-07). The entire milestone is ~6 Baseline CSS techniques (conic-gradient checkerboard, vendor-prefixed slider pseudos, box-shadow neon, `color-mix()`, `backdrop-filter`, opacity-only blink keyframes) plus a handful of new custom properties in `UVEditor.css :root`. Only **3 JSX edits** are permitted: the image tool button's missing `active` class, the insertion-banner conditional block, and a `data-tool` attribute for the canvas cursor.

The top risks are all visual-regression classes: (1) **renaming load-bearing classes** (`.uv-editor-panel`, `.uv-right-panel`) collapses a ~40-selector web — the fix is alias-composition (`uv-editor-panel uv-workspace`), never substitution; (2) **the checkerboard will stay invisible** unless the canvas's debug `background-color: rgb(10 10 10 / 60%)` (UVEditor.css:402) is made transparent in the same edit; (3) **the performance-mode system** (`body.performance-mode` + `data-perf-keep` `all: initial`) will silently strip every new glow/transition unless rules avoid `!important` and perf-mode restoration blocks are added; and (4) **react-beautiful-dnd** (archived, frozen) breaks silently if any transform/transition touches layer-row ancestors. One genuine research conflict must be resolved at planning: whether UV-07's purple glow arrives by importing the dead `UVEditor.animations.css` (ARCHITECTURE's recommendation) or by selectively recreating its rules (PITFALLS' warning, due to a `transition: all` landmine in that file).

## Key Findings

### Recommended Stack

**Zero new dependencies.** The milestone needs no libraries, no build-tool changes, no installs — six Baseline/near-Baseline CSS techniques mapped to UV requirements, all compatible with the existing `nexus.css` token architecture. The only "stack change" is ~8 new custom properties in `UVEditor.css :root` (do NOT touch `nexus.css` globals) and disciplined vendor-prefixing.

**Core techniques:**
- `repeating-conic-gradient()` checkerboard (UV-03): VS Code migrated FROM two overlapping `linear-gradient(45deg)` layers TO single-layer conic **specifically because the two-layer diagonal renders triangular subpixel artifacts at non-integer zoom** (vscode#304958) — this editor has arbitrary pan/zoom, same artifact class. Also ~70% less CSS.
- `::-webkit-slider-thumb` + `::-moz-range-thumb` (UV-05): the standardized `::slider-thumb` is **not shipped in any browser** (CSSWG #9830, resolved 2024) — vendor-prefixed pseudos are the only authoring path; project precedent exists (ForensicChannelEditor, GlitchMaker, SignalReconstructor). Must write **duplicated blocks per engine, never comma-joined** (Chrome drops a rule containing unknown `::-moz-` pseudos). Also fixes an existing bug: UVEditor.css:781 styles a 12px thumb on a 6px track with no negative `margin-top` → misaligned in Chrome/Edge/Safari.
- `box-shadow` two-layer neon glow (UV-01/05/06): tight + spread layers derived from `--nexus-blue` via `color-mix()` or the existing `rgb(var(--nexus-blue-rgb), X)` fallback.
- `color-mix()` (glow variants): Baseline 2023 (~89%). **Use `in srgb`** — mixing vivid neon in `oklch` can silently clip out of gamut (single-source MEDIUM-confidence gotcha; the `-rgb` alpha pattern is the safe drop-in).
- `backdrop-filter` glassmorphism (UV-02 banner, existing header/docks): already used but **missing `-webkit-` prefix** → Safari <18 silently drops it; mirror every declaration. Keep blur 3–8px; never on the viewport/canvas container (large-area backdrop filters are the expensive case).
- `@keyframes` opacity blink (UV-02): opacity-only (compositor, zero paint cost vs animating box-shadow), soft blink (floor ~0.3–0.4, ~1.1s cycle ≈ 0.9 flashes/sec, under WCAG 2.3.1's 3/sec), auto-neutralized by the existing `prefers-reduced-motion` block (UVEditor.css:97) — but keyframes MUST start AND end at `opacity: 1` so the static state is a fully legible banner.
- `:active` pressed transitions (UV-06): `translateY(1px) scale(0.96)` + inset shadow + compressed ~60ms duration, reusing existing `--transition-fast/medium` tokens.
- Small wins: `color-scheme: dark` (one line fixes native-control flash), `scrollbar-color`/`scrollbar-width` (Firefox parity), `touch-action: manipulation` on buttons, `accent-color` as styling floor.

**What NOT to use:** `::slider-thumb`/`::slider-track` (unshipped), any UI framework or CSS-in-JS (milestone constraint; would orphan 1213 lines of working CSS), npm slider/checkerboard packages (3–10 lines of CSS each), `@starting-style`/`allow-discrete` (Firefox display-transition gap + specificity gotcha), animating box-shadow in the blink loop (per-frame repaint), `transition: all` (layout+repaint), backdrop-filter on the viewport, new `will-change` hints, and the class names `.uv-canvas`, `.uv-layer`, `.uv-visual` — **reserved** (performance.css 210–217 has dead selectors that would activate restoration rules).

### Expected Features

**Must have (table stakes — all 7 UV requirements are committed P1 scope):**
- UV-01 Selected tool unmistakable: full-contrast fill + colored border + neon glow (current 18%-opacity border reads as "inactive" — the #1 "horrível de mexer" contributor). One-token JSX fix: the image dock button (~UVEditor.tsx:2884) never shows active today because it lacks `tool === 'placeImage' ? 'active' : ''`.
- UV-02 Persistent, dismissible insertion indicator: banner + red cancel, cancel reusing existing `setTool('draw')` handlers. **Deliberate differentiator** — PS/Figma/photopea use an options bar with Commit/Cancel + cursor change, no banner; we over-communicate on purpose for this user base. Must be slow-blink (1.1–1.6s), reduced-motion-safe, `role="status"` (announce once), non-blocking over canvas (`pointer-events: none` shell, `auto` only on Cancel).
- UV-03 Dark transparency checkerboard: pro dark editors use dark two-tone (PS "Dark" grid preset exists); **blocked today by the canvas's own near-opaque debug background** — same-edit fix.
- UV-04 Zero inline styles in UVEditor.tsx: 42 inline blocks → semantic classes (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`); 3 documented dynamic-geometry exceptions must stay inline (textarea geometry, mask-cursor geometry, swatch color value); canvas cursor via `data-tool` attribute.
- UV-05 Nexus sliders: dark translucent track + 14px neon thumb growing/glowing on hover/focus; two bare range inputs (UVEditor.tsx:3077, 3141) need the class added.
- UV-06 `:active` on Salvar/Fechar/Inverter Máscara: 100–150ms scale/inset-shadow press feedback; mask buttons (3130–3131) are unclassed raw `<button>`s needing `.uv-action-btn`.
- UV-07 Layers purple glow + DnD preserved: **preservation task** — `#b366ff` glow lives in `UVEditor.animations.css` (currently imported NOWHERE → dead CSS); brittle `[style*="borderWidth: 2px"]` hack flagged, do not recreate.

**Should have (differentiators):** per-tool neon color-coding (cyan=Pincel, red=Borracha, purple=Imagem matching layers), Nexus-tinted dark checkerboard, "power surge" glow spike on `:active`, layers purple as the UI's only purple (color-collision rule: banner=red/amber, tools=cyan, layers=purple).

**Defer (v2+ / out of scope):** Esc-key cancel + tool keyboard shortcuts (logic changes), auto-select after placement (line 1779 explicitly keeps multi-insert — behavior modification), SVG icon pass, zoom-synced checkerboard squares (render-loop coupling), LayersPanel.tsx/LayerItem.tsx inline styles (different component, out of UV-04 scope).

### Architecture Approach

Three-layer architecture; the refactor touches **only Layer 3 (presentation)**. Layers 1 (canvas math) and 2 (render + state) are frozen. Four load-bearing patterns: **Alias Class Composition** (`.uv-editor-panel uv-workspace` — adding classes, never renaming, because `.uv-editor-panel` anchors ~40 selectors, the `tool-draw`/`tool-erase` class-toggle effect, and `markPerfKeep` scoping); **Class Contract** (state → className expressions, e.g. `uv-channel-btn--red.active`); **Data-Driven Geometry Stays Inline** (3 documented exceptions); **Non-Intercepting Overlay** (`pointer-events` sandwich: banner shell `none`, Cancel `auto`, `z-index: 1200` above the canvas's forced `1100 !important`).

**Major components:**
1. UVEditor.tsx — monolithic; L1-2 logic untouched, JSX skeleton (L2868–3163) refactored: 42 inline-style → class mappings (fully line-anchored), 3 JSX edits total
2. UVEditor.css — 1213-line class contract; all new rules appended (specificity ≥ `.uv-editor-panel .uv-*` = (0,2,0) to beat the (0,1,1) base `button` rule)
3. UVEditor.animations.css — 122-line dead file holding the purple glow (#b366ff) + drag affordances; **integration approach is the one open conflict** (see Gaps)
4. LayersPanel.tsx / LayerItem.tsx — NOT refactored; `document.querySelector('.uv-sidebar-section.layers-section')` (L72) + all 23 props must survive byte-identical

**Explicit preserve list:** `rootRef`, `canvasRef`, `canvasContainerRef`, **both** `fileInputRef` inputs (L2890 + L3075 share one ref — mount order is load-bearing; deduplicating breaks image insertion), `inlineTextEdit` handlers/autoFocus, `maskCursor` conditional render, all canvas pointer/wheel handlers, hidden-file-input `display:none` semantics (via `.uv-hidden` class).

**Build order (from ARCHITECTURE, dependency-verified):** 1) CSS foundation → 2) TSX class swaps (UV-04) → 3) dock active (UV-01) → 4) banner (UV-02) → 5) layers import (UV-07) → 6) slider/button polish (UV-05/06) → 7) full regression.

### Critical Pitfalls

1. **Renaming/substituting load-bearing classes collapses the selector web** (grid-template-areas by name, `>`-combinator children, perf-mode guards rooted in `.uv-editor-panel`) — **avoid**: additive alias classes only; banner lives INSIDE `.uv-editor-viewport`, never as a new grid child. Verify `display: grid` survives in DevTools.
2. **Inline→class migration changes the cascade** (specificity downgrades: a (0,1,0) class loses to `.uv-editor-header .btn-save` (0,2,0) and `.uv-editor-panel button` (0,1,1)) — **avoid**: scope every new class under `.uv-editor-panel` (0,2,0)+, never `!important`; classify each block static-style vs dynamic-geometry; per-section computed-style diff after each migration.
3. **Breaking canvas interaction invariants** — `touch-action: none` (drawing on touch dies), `pointer-events: auto !important; z-index: 1100 !important` on canvas, `.tool-draw`/`.tool-erase` cursor rules — **avoid**: re-home touch-action to `.uv-canvas` class; every decorative layer `pointer-events: none` at z-index below 1100; never "clean up" the `!important` rules.
4. **Checkerboard invisible or dead canvas** — the debug rule `background-color: rgb(10 10 10 / 60%)` (UVEditor.css:402) paints 60% opaque over the pattern; a pattern above the canvas steals all clicks — **avoid**: make the canvas bg transparent in the same edit as the checkerboard; pattern `pointer-events: none`, z-index 0.
5. **Neon sliders that only work in Chromium** — existing `.uv-range` rules are webkit-only; Firefox shows default controls — **avoid**: duplicated `::-webkit-*` AND `::-moz-*` blocks (never comma-joined); `appearance: none` on input AND thumbs; design hover glow to look correct WITHOUT transition in Firefox; mandatory Firefox verification pass.
6. **Banner invisible/blocks/layout-shift** — TWO systems disable animation (reduced-motion duration-clamp AND performance-mode `animation: initial`); if keyframes end at opacity 0 the banner vanishes; in-flow banner breaks the grid and shifts layout — **avoid**: keyframes start AND end at opacity 1 (static state = fully legible), absolute overlay inside viewport (z-index 1200), `pointer-events: none` shell / `auto` cancel, explicit reduced-motion rule, Cancel is a real focusable `<button>` (the WCAG 2.2.2 pause/stop/hide mechanism).
7. **Performance-mode bypass / `all: initial` nuking** — `data-perf-keep` applies `all: initial !important` to the whole editor subtree; perf mode exists as a real toggle (`body.performance-mode`); only `src/styles/performance.css` (v2, imported main.tsx:8) is ACTIVE — `src/utils/performance.ts` (v3) is dead code — **avoid**: no `!important` anywhere in new rules; add explicit `body.performance-mode .uv-editor-panel { display: grid !important; ... }` restoration block in UVEditor.css (loads after performance.css → wins ties); mandatory perf-mode walkthrough in EVERY feature phase.
8. **react-beautiful-dnd drag regressions** — rbd is **archived (Aug 2025), frozen, no fixes**; any `transform`/`transition`/`will-change` on `.layer-item-wrapper` or ancestors corrupts drag math (rbd #128/#2230) — **avoid**: never style drag ancestors with transforms; treat any rbd breakage as P0 revert.
9. **`:active` transitions fighting base rules / vanishing in perf mode** — **avoid**: reuse `--transition-fast/medium` tokens, transform/box-shadow only, no `!important`; add new button classes to the focus-visible selector list (UVEditor.css:61–73); perf-mode opacity 0.7 feedback is the designed behavior.

## Implications for Roadmap

Based on combined research, suggested phase structure (5 phases, matching the orchestrator's Foundation → Visual upgrades → Headline + preservation):

### Phase 1: UV-04 Foundation — Semantic class taxonomy + inline-style removal
**Rationale:** Every other requirement is "land this feature as a semantic class" — without the taxonomy (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`) UV-01/03/05/06 have nowhere to attach. CSS-first (tokens → all new class rules appended to UVEditor.css), then the mechanical 42-block TSX swap. Zero logic risk (no edits above L2868).
**Delivers:** Semantic class system, zero-inline-style TSX skeleton, `.uv-hidden` file inputs, `.uv-canvas` class with relocated `touch-action: none`, `data-tool` attribute + cursor rules (1 of the 3 permitted JSX edits), 5 slider class swaps.
**Addresses:** FEATURES.md table-stakes UV-04; ARCHITECTURE 42-mapping table is the execution blueprint.
**Avoids:** Pitfalls 1, 2, 3, 7 (additive aliasing, `.uv-editor-panel`-scoped specificity, canvas invariants, no-`!important` + perf restoration block).

### Phase 2: Canvas-area upgrades — UV-01 tools dock active + UV-03 dark checkerboard
**Rationale:** Both land on the same viewport/canvas surface and share the pointer-events/z-index invariants — one phase, one regression surface. Small, high-user-value ("which tool am I?") with the checkerboard in the same edit as the canvas background fix.
**Delivers:** Strong neon `.tool-button.active` (2nd permitted JSX edit: image button active class), per-tool colored borders via `data-tool`, single-layer conic checkerboard, transparent canvas bg.
**Addresses:** FEATURES.md UV-01/UV-03; STACK.md conic-gradient recipe; differentiators per-tool color-coding.
**Avoids:** Pitfalls 3, 4 (pointer-events sandwich, canvas-bg-must-go-transparent-in-same-edit).

### Phase 3: Control polish — UV-05 Nexus sliders + UV-06 `:active` button transitions
**Rationale:** Both live in the properties panel and share the specificity audit (replace legacy `.uv-range`/`.properties-panel input[type="range"]` blocks with the dual-prefix `.uv-range-slider` block); refinement on top of the stabilized skeleton.
**Delivers:** Dual-engine neon sliders (with the thumb-centering bug fix), snappy pressed states on Salvar/Fechar/Inverter (+ `.uv-action-btn` on the two bare mask buttons), focus-visible coverage.
**Addresses:** FEATURES.md UV-05/UV-06; STACK.md slider recipe + `:active` recipe; `color-scheme: dark` one-liner.
**Avoids:** Pitfalls 5, 9 (Firefox parity, no `!important`, focus-visible list).

### Phase 4: UV-02 Headline — Giant blinking insertion banner + red cancel
**Rationale:** The headline answer to "placing texts/images is confusing." Requires the skeleton from Phase 1 to be stable and the canvas invariants from Phase 2 to be proven. This is the only phase needing the 3rd permitted JSX edit (conditional banner block).
**Delivers:** `[ MODO DE INSERÇÃO ATIVO - CLIQUE NO CANVAS PARA POSICIONAR ]` banner + big red cancel (reusing existing `setTool('draw')` handlers), slow opacity blink, glass treatment, z-index 1200 non-intercepting overlay, `role="status"`.
**Addresses:** FEATURES.md UV-02 table-stake + primary differentiator; STACK.md blink-keyframe + glass recipes.
**Avoids:** Pitfall 6 (visible static frame, reduced-motion pass, perf-mode pass, canvas click-through test, keyboard tab to Cancel) — these must be in this phase's acceptance criteria, not just final verification.

### Phase 5: UV-07 Preservation + full regression — Layers purple glow integration + smoke pass
**Rationale:** Highest-risk requirement (rbd frozen, dead-file trap) and the last visual layer — do it after the skeleton is proven stable so selector drift is caught early. Ends with the full regression pass.
**Delivers:** Layers purple glow (#b366ff) live again, drag affordances, `.uv-sidebar-section.layers-section` byte-identical, and the final smoke pass: canvas math/redrawAll/RAF, pan/zoom, touch drawing, both image-insertion paths (dock picker + properties picker), all 3 tabs, mask edit, save/close, performance-mode walkthrough.
**Addresses:** FEATURES.md UV-07 + differentiator "only purple in the UI."
**Avoids:** Pitfall 8 (rbd transform ban, P0-revert posture) + Pitfall 7 (perf-mode) — and resolves the import-vs-recreate conflict (see Research Flags).

### Phase Ordering Rationale
- **Dependency-first:** UV-04's taxonomy is the foundation every other feature attaches to (FEATURES dependency graph + ARCHITECTURE build order agree).
- **Risk-matched grouping:** canvas-area features together (shared invariants), properties-panel features together (shared specificity audit) — each phase has one regression surface.
- **Headline last-but-verifiable:** the banner is the biggest UX win but the riskiest new DOM; it goes after the skeleton is proven, so acceptance failures are attributable to the banner alone.
- **Preservation at the end:** UV-07 is a regression-risk containment task that can only be verified meaningfully against the completed refactor.

### Research Flags
Phases likely needing deeper research during planning:
- **Phase 5 (UV-07) — HIGH flag:** The two research files **disagree** on integration strategy. ARCHITECTURE says "import `./UVEditor.animations.css`" (one line, glow comes alive); PITFALLS says importing activates the `.layer-item, .layer-item * { transition: all 0.2s ease }` landmine (janky rbd drops) and the brittle `[style*="borderWidth: 2px"]` inline-style-matching selector — recommends recreating only the glow rules in UVEditor.css. **Recommended resolution for planning:** import the file but surgically scope the `transition: all` rule to `transition: transform, opacity, box-shadow` inside the file (or strip it), leave the brittle selector inert (it only matches if LayerItem emits that inline style, which it doesn't), and re-test drag reorder immediately. A `/gsd-plan-phase --research-phase` on UV-07 is warranted.
- **Phase 1 (UV-04) — MEDIUM flag:** "No inline styles" cannot be literal — the 3 dynamic-geometry exceptions (textarea geometry, mask-cursor geometry, swatch color value) MUST stay inline. Plan the review checklist around the 42→3 rule (grep `style={{` must return exactly the allowlist), and use the full 42-block line-anchored mapping table as planning input.
- **Phase 2 (UV-03) — LOW-MEDIUM flag:** checkerboard element choice (`.uv-editor-viewport::before` strengthen vs `.viewport-canvas` application) has two defensible variants; decide per the "pattern under canvas only" vs "whole viewport" preference.

Phases with standard patterns (can skip research-phase):
- **Phase 3 (UV-05/06):** dual-prefix slider + `:active` recipes are fully copy-paste from STACK.md with in-repo precedent; only the Firefox verification pass is mandatory.
- **Phase 4 (UV-02):** banner recipe fully specified (keyframes, z-index, pointer-events sandwich, WCAG constraints); no open questions beyond execution.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All techniques verified against MDN/caniuse/CSSWG; the conic-checkerboard rationale is a primary bug source (vscode#304958) matching this editor's zoom use case; slider-pseudo status verified (CSSWG #9830); in-repo project precedent read directly |
| Features | HIGH | Codebase verified by direct read (line-anchored: 2884 bug, 401-403 canvas bg, 3077/3141 bare ranges, no `:active` rules); pro-tool behavior from official Adobe/Figma docs (HIGH) + UX industry refs (MEDIUM) |
| Architecture | HIGH | Full line-anchored verification of UVEditor.tsx (3163 lines), UVEditor.css (1213 lines), animations.css import status (grep-confirmed dead), LayersPanel/LayerItem, performance.css v2 active vs performance.ts v3 dead |
| Pitfalls | HIGH | Codebase-verified claims (perf-mode system, rbd usage, dead file, reserved class names); web-verified patterns mixed HIGH (WCAG spec, rbd issues #128/#2230) / MEDIUM (slider cross-browser community reports) |

**Overall confidence:** HIGH — with one flagged conflict (UV-07 integration strategy) and a short list of MEDIUM-confidence web claims to validate during implementation.

### Gaps to Address
- **UV-07 import-vs-recreate conflict (actionable now):** resolved above as "import + scope the transition:all rule" — verify against live rbd drag in Phase 5's first task; if drag degrades, fall back to selective recreation in UVEditor.css. Do NOT ship the dead-file import unchecked.
- **rbd × `backdrop-filter` ancestor interaction:** LOW-confidence exact browser behavior (backdrop-filter makes ancestors containing blocks for fixed-position drag items). The existing combination works today — do not add MORE filters/transforms to `.uv-right-panel`/ancestors, and re-test drag immediately if the existing backdrop-filter is touched.
- **`color-mix(in srgb)` oklch clipping claim:** single-source (MEDIUM). The `rgb(var(--nexus-blue-rgb), X)` fallback pattern is already in the codebase — use it as the floor so this risk is moot.
- **LayersPanel.tsx/LayerItem.tsx inline styles (~15 blocks):** out of scope for UV-04 (scope is UVEditor.tsx only) — flag as a future-milestone backlog item; do not let the phase creep.
- **`.dragging`/`.drag-over` dead classes in UVEditor.css:** kept (scope is skeleton+CSS cleanup, not CSS debt) — note as follow-up.

## Sources

### Primary (HIGH confidence)
- `src/components/tools/UVEditor.tsx` (full read) — JSX skeleton L2868–3163, 42 inline styles, refs/effects, image-load → `setTool('placeImage')` (L1146), multi-insert (L1779), tool class-toggle effect (L2849–2856), image dock button active-class bug
- `src/components/tools/UVEditor.css` (full read, 1213 lines) — class contract anchors, canvas debug background (L402), `.uv-range` webkit-only sliders, no `:active` rules, perf-mode guards, layers overrides L938–1213
- `src/components/tools/UVEditor.animations.css` (full read, 122 lines) — purple glow `#b366ff` (L69–72), `transition: all` landmine, brittle `[style*="borderWidth: 2px"]` (L94); import status verified by full-src grep = 0 hits (dead CSS)
- `src/components/LayersPanel.tsx` / `LayerItem.tsx` (full reads) — rbd usage, `.uv-sidebar-section.layers-section` querySelector (L72), 23-prop surface
- `src/styles/performance.css` (active, imported main.tsx:8) + `src/utils/performance.ts` (v3, never injected) — perf-mode system, `data-perf-keep` `all: initial`, reserved class names
- `github.com/microsoft/vscode#304958` — checkerboard conic migration / subpixel artifacts at non-integer zoom
- `w3c/csswg-drafts#9830` — `::slider-thumb` unshipped status
- Adobe Help (place files, transparency preferences) · Figma (button states, toolbar) · NN/g (button states 100–150ms) · WCAG 2.2.2/2.3.1 · react-beautiful-dnd (archived; issues #128/#2230) · Lea Verou checkerboard technique

### Secondary (MEDIUM confidence)
- solid-web.com color-mix tutorial (2026-05) — oklch gamut-clipping; use `in srgb`
- OpenReplay (2026-08) + Josh Comeau (2025-09) — `@starting-style` Firefox gap + specificity gotcha
- UXPin (2026) / LogRocket / UX StackExchange 153788 — button states, insert-mode exit patterns
- css-tricks.com range-input cross-browser guide; StackOverflow 75759434 (Chrome drops comma-joined `-moz-` selectors)
- web-platform-dx web-features-explorer — backdrop-filter Safari 18 unprefixed cutoff

### Tertiary (LOW confidence — validate in implementation)
- FixTools CSS pattern generator — checkerboard dark recolor via custom properties
- rbd × backdrop-filter ancestor containing-block behavior — verify with live drag test in Phase 5

---
*Research completed: 2026-08-14*
*Ready for roadmap: yes*
