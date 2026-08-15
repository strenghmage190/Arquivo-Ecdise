# Roadmap

## Current Milestone: v1.2 UVEditor "Mini-Photoshop" UX/UI Refactor

Skeleton + CSS-only refactor of the UVEditor (3163-line canvas editor): obvious tool states, guided insertion flow, zero inline styles, Nexus-styled controls, layers styling preservation. **NO logic changes** (canvas math `getCanvasCoordinates`, render loops `redrawAll`/rAF, hooks `useState`/`useRef` frozen). Exactly 3 JSX edits permitted across the milestone: (a) image dock button active class, (b) insertion banner conditional block, (c) `data-tool` attribute on canvas/root.

Phase numbering continues from v1.0 (Phase 1) and v1.1 (Phase 2, scoped but skipped) — **this milestone starts at Phase 3**.

### Phases

- [ ] **Phase 3: Semantic Class Foundation (UV-04)** - Move all 42 inline styles to a semantic class taxonomy, zero logic changes
- [ ] **Phase 4: Canvas-area Upgrades (UV-01, UV-03)** - Obvious active tool state + dark transparency checkerboard
- [ ] **Phase 5: Control Polish (UV-05, UV-06)** - Nexus sliders in all engines + snappy `:active` button presses
- [ ] **Phase 6: Insertion Banner (UV-02)** - Giant blinking banner + big red cancel for placement mode
- [ ] **Phase 7: Layers Preservation + Full Regression (UV-07)** - Purple glow/DnD integrated + complete smoke pass

## Phase Details

### Phase 3: Semantic Class Foundation (UV-04)
**Goal**: UVEditor.tsx becomes a zero-inline-style skeleton — all static presentation moves to a semantic class taxonomy (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`) with zero logic changes
**Depends on**: Nothing (first phase of v1.2)
**Mode**: research
**UI hint**: yes
**Requirements**: UV-04
**Success Criteria** (what must be TRUE):
  1. `grep 'style=\{\{'` on UVEditor.tsx returns exactly the 3 documented dynamic-geometry exceptions (textarea geometry, mask-cursor geometry, swatch backgroundColor) — the 42→3 rule holds.
  2. The editor renders pixel-identical before/after the migration: 3-column grid (`display: grid` on `.uv-editor-panel`), panel backgrounds, header title text, and Save/Close pseudo-icon buttons all survive; semantic classes are ADDITIVE aliases (`.uv-workspace`, `.uv-sidebar`), never substitutions for load-bearing names (`.uv-editor-panel`, `.uv-right-panel`).
  3. Canvas interaction invariants survive: drawing works with mouse AND touch (`touch-action: none` re-homed to `.uv-canvas`), brush cursor hides over the canvas (`tool-draw`/`tool-erase` class-toggle intact), pan/zoom unaffected, and both hidden file inputs still open their pickers and insert images (`fileInputRef` mount order preserved — no deduplication).
  4. Performance-mode walkthrough: editor layout and colors survive `body.performance-mode` (explicit restoration block present — no black-on-transparent editor); no `!important` in any new rule; new button classes added to the focus-visible selector list.
**Plans**: TBD

### Phase 4: Canvas-area Upgrades (UV-01, UV-03)
**Goal**: Users can identify the active tool at a glance and distinguish image content from empty space via a dark two-tone transparency checkerboard
**Depends on**: Phase 3
**Mode**: standard
**UI hint**: yes
**Requirements**: UV-01, UV-03
**Success Criteria** (what must be TRUE):
  1. The selected tool in the dock shows a strong neon glow + colored border; per-tool color identity (Pincel=cyan, Borracha=red, Imagem=purple matching layers) lets users tell tools apart without reading labels; the image tool gains its active state after an image loads into placement mode (2nd of the 3 permitted JSX edits).
  2. Empty/transparent canvas areas show a dark two-tone checkerboard (visible through transparent pixels, not just viewport margins); the near-opaque debug canvas background (`rgb(10 10 10 / 60%)`) is made transparent in the same edit — single-layer conic gradient, `pointer-events: none`, z-index 0.
  3. Drawing still works with mouse AND touch after the checkerboard change — the pattern never intercepts events, and the canvas keeps its `pointer-events: auto !important` / `z-index: 1100 !important` rules untouched (canvas not dead).
  4. Performance-mode walkthrough: tool glow disappears (no `!important` sneaked in), checkerboard still renders, editor layout/colors intact.
**Plans**: TBD

### Phase 5: Control Polish (UV-05, UV-06)
**Goal**: Range controls and action buttons feel like Nexus/C.R.I.S hardware — dark translucent tracks with neon glowing thumbs in all engines, snappy press feedback on Salvar/Fechar/Inverter Máscara
**Depends on**: Phase 3 (sequenced after Phase 4 to keep one regression surface per phase)
**Mode**: standard
**UI hint**: yes
**Requirements**: UV-05, UV-06
**Success Criteria** (what must be TRUE):
  1. All 5 range sliders (brush size, mask softness, mask opacity, image scale, mask size) render the dark translucent track + 14px neon thumb that glows and scales on `:hover`/`:focus-visible` — verified in Chrome/Edge/Safari AND Firefox (duplicated `::-webkit-*` and `::-moz-*` blocks, never comma-joined; no OS-default controls in any engine).
  2. Slider thumbs are vertically centered on their tracks in Chromium (existing 12px-thumb-on-6px-track misalignment fixed via negative `margin-top`).
  3. Salvar, Fechar, and Inverter Máscara respond with satisfying `:active` feedback (100–150ms `translateY(1px) scale(0.96)` + inset shadow + glow spike, reusing `--transition-fast/medium` tokens); keyboard focus-visible outlines remain on all action buttons (incl. new `.uv-action-btn` on Inverter/Limpar).
  4. Performance-mode walkthrough: slider glow neutralized, `:active` falls back to the designed opacity feedback, no `!important` added.
**Plans**: TBD

### Phase 6: Insertion Banner (UV-02)
**Goal**: Users in insertion mode (Text/Image) see an unmissable blinking banner with a big red cancel button — and can still click the canvas to place content
**Depends on**: Phase 4 (banner overlays the viewport/canvas; canvas invariants must be proven first)
**Mode**: standard
**UI hint**: yes
**Requirements**: UV-02
**Success Criteria** (what must be TRUE):
  1. Entering Text or Image insertion mode shows "[ MODO DE INSERÇÃO ATIVO - CLIQUE NO CANVAS PARA POSICIONAR ]" as a large blinking banner (slow ~1.1s opacity-only blink, glass treatment, z-index 1200) at the top of the viewport; it appears and disappears with insertion mode without layout shift (absolute overlay inside `.uv-editor-viewport`, never a grid child).
  2. The big red cancel button is always visible and keyboard-focusable, and returns the editor to draw mode from both text and image insertion states (reusing existing `setTool('draw')` handlers — no new logic, no cleanup side-effects).
  3. Canvas clicks pass through the banner shell (`pointer-events` sandwich: shell `none`, cancel `auto`) — clicking the canvas still places text/image even near the top edge where the banner sits; placement flow works end-to-end (3rd of the 3 permitted JSX edits).
  4. Banner is fully legible and static under `prefers-reduced-motion` AND performance-mode (blink keyframes start AND end at opacity 1; the static frame is a readable banner); blink rate ≤1/sec with a soft opacity floor (~0.35, no strobe); `role="status"` announces once; text contrast ≥ 4.5:1.
**Plans**: TBD

### Phase 7: Layers Preservation + Full Regression (UV-07)
**Goal**: The layers panel's signature purple glow (`#b366ff`) and drag-and-drop animations are integrated and preserved, and the fully refactored editor passes a complete regression smoke pass with zero logic changes
**Depends on**: All prior phases (3, 4, 5, 6) — regression must run against the completed refactor
**Mode**: research
**UI hint**: yes
**Requirements**: UV-07
**Success Criteria** (what must be TRUE):
  1. Layers panel shows its purple glow (`#b366ff`) on selection, layer input focus, and drop-zone highlight, plus grab/grabbing drag cursors. **DECISION POINT (HIGH risk, from research):** integrate by importing the dead `UVEditor.animations.css` with its `transition: all` scoped to `transform, opacity, box-shadow` (brittle `[style*="borderWidth: 2px"]` selector left inert), OR selectively recreate only the glow rules in `UVEditor.css` — the phase plan must surface and resolve this explicitly, then re-test drag immediately; if drag degrades, fall back to selective recreation (rbd is archived — treat any breakage as P0 revert).
  2. Layer drag-and-drop still works after integration: drag-reorder lands on the correct index, drop animation is smooth (no doubled/laggy `transition: all`), right-click context menu still opens (`.uv-sidebar-section.layers-section` unchanged — byte-identical).
  3. Full regression pass: canvas math (`getCanvasCoordinates`) intact, render loops (`redrawAll`/rAF) unaffected, pan/zoom works, touch drawing works, both image-insertion paths (dock picker + properties picker) still insert, all 3 tabs functional, mask edit (Inverter/Limpar) works, save/close work.
  4. Performance-mode walkthrough of the complete editor: layout and colors survive, all new glows/transitions neutralized, banner static-but-visible.
  5. Milestone constraint audit passes: `grep 'style=\{\{'` returns only the 3 documented exceptions; no edits above line 2868 except the permitted import; exactly 3 JSX edits across the whole milestone; zero logic diffs.
**Plans**: TBD

## Completed Milestones

- [v1.0 Refactor UI/UX](milestones/v1.0-ROADMAP.md) — Phase 1, shipped 2026-08-14
- v1.1 UX & Copy Overhaul — scoped but skipped by user decision (Phase 2 reserved, never executed); may return in a future milestone

## Progress

**Execution Order:**
Phases execute in numeric order: 3 → 4 → 5 → 6 → 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 3. Semantic Class Foundation | TBD | Not started | - |
| 4. Canvas-area Upgrades | TBD | Not started | - |
| 5. Control Polish | TBD | Not started | - |
| 6. Insertion Banner | TBD | Not started | - |
| 7. Layers Preservation + Full Regression | TBD | Not started | - |
