# Requirements: CreateClueModal UI/UX Refactor

**Defined:** 2026-08-14
**Core Value:** Clean, maintainable component code (no inline styles) without losing any of the complex visual identity (neon, glitch, scanlines).

## v1.2 Requirements

Requirements for milestone v1.2 (UVEditor "Mini-Photoshop" UX/UI Refactor). Each maps to roadmap phases.

### Tools Dock & Insertion Feedback

- [ ] **UV-01**: User can identify the active tool at a glance — the selected tool button in the dock shows a strong neon glow and a colored border
- [ ] **UV-02**: User in insertion mode (Text/Image) sees a large blinking banner "[ MODO DE INSERÇÃO ATIVO - CLIQUE NO CANVAS PARA POSICIONAR ]" with a big red cancel button

### Canvas & Workspace

- [ ] **UV-03**: User can distinguish image content from empty space via a dark two-tone checkerboard background behind the canvas
- [ ] **UV-04**: UVEditor.tsx contains no inline presentation styles — all static styles moved to semantic CSS classes (.uv-workspace, .uv-sidebar, .uv-property-group, .uv-range-slider); only the 3 documented dynamic-geometry exceptions (textarea geometry, mask-cursor geometry, swatch color) remain inline

### Controls & Interaction

- [ ] **UV-05**: User can adjust range controls (brush size, mask softness, mask opacity, image scale) via Nexus/C.R.I.S sliders — dark translucent track with a neon thumb that glows on :hover, working in Chrome/Edge/Safari AND Firefox
- [ ] **UV-06**: User gets satisfying press feedback (:active) on Salvar, Fechar, and Inverter Máscara buttons (100-150ms scale/inset-shadow)

### Layers Preservation

- [ ] **UV-07**: Existing layers panel purple glow (#b366ff) and drag-and-drop animations remain fully functional after the refactor

## Future Requirements

Deferred to a future release. Tracked but not in the v1.2 roadmap.

### Deferred

- **ESC-01**: User can cancel insertion mode with the Escape key — requires a key handler (logic change)
- **KBD-01**: Keyboard shortcuts for tools (V/B/E/T) — logic milestone
- **ICO-01**: SVG icon set replacing emoji tool icons — visual polish, not requested this milestone

## Out of Scope

| Feature | Reason |
|---------|--------|
| Canvas math, render loops, state hooks (getCanvasCoordinates, redrawAll, rAF, useState/useRef) | Strict no-touch zones — refactor is HTML skeleton + CSS only |
| CreateClueModal UX & Copy Overhaul (tooltips, immersive copy, empty states) | v1.1 scoped and skipped by user decision; may return in a future milestone |
| Esc-key cancel for insertion banner | Requires a new key handler (logic change) |
| Keyboard shortcuts for tools | Logic milestone, deferred |
| SVG icon replacement | Large visual diff; not requested |
| Auto-select after placement / single-insert toggle | Changes existing multi-insert behavior (UVEditor.tsx:1779) |
| LayersPanel.tsx / LayerItem.tsx inline styles | Different component, out of UV-04 scope — future backlog |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| UV-01 | — | Pending |
| UV-02 | — | Pending |
| UV-03 | — | Pending |
| UV-04 | — | Pending |
| UV-05 | — | Pending |
| UV-06 | — | Pending |
| UV-07 | — | Pending |

**Coverage:**
- v1.2 requirements: 7 total
- Mapped to phases: 0 (roadmap pending)
- Unmapped: 7 ⚠️

---
*Requirements defined: 2026-08-14*
*Last updated: 2026-08-14 after milestone v1.2 definition*
