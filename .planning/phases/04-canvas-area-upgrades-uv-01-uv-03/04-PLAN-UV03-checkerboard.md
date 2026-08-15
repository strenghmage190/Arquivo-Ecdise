---
wave: 1
depends_on: []
files_modified:
  - src/components/tools/UVEditor.css
requirements:
  - UV-03
autonomous: true
---

# Plan: UV-03 Transparency Checkerboard

## Goal

The canvas viewport shows a dark two-tone transparency checkerboard behind image content, making transparent areas clearly distinguishable from opaque content.

## Tasks

### Task T-04: Append checkerboard rules to UVEditor.css

<read_first>
- src/components/tools/UVEditor.css (lines 355-405 — viewport-canvas section; confirm `position: relative` at line 362; confirm debug bg at line 401-403; confirm `pointer-events: auto !important` / `z-index: 1100 !important` at lines 383-384)
- src/components/tools/UVEditor.css (lines 468-488 — performance-mode block for pattern reference)
- src/components/tools/UVEditor.css (line 1214 — current end of file OR end of UV-01 Phase 4 block if T-02 already ran)
</read_first>

<action>
At the END of `src/components/tools/UVEditor.css` (after all existing content including any UV-01 block added by Plan UV-01), append the following block verbatim:

```css
/* ===== Phase 4: Canvas-area Upgrades (UV-03) — transparency checkerboard ===== */

/* Remove debug canvas background — replaced by checkerboard ::before */
.uv-editor-viewport canvas {
  background-color: transparent;
}

/* Dark two-tone transparency checkerboard pattern.
   Parent .viewport-canvas already has position:relative (line 362).
   z-index:0 sits below canvas (z-index:1100!important via line 384).
   pointer-events:none — never intercepts draw/erase/pan events. */
.uv-editor-viewport .viewport-canvas::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: conic-gradient(
    #141a20 25%,
    #1c242e 25% 50%,
    #141a20 50% 75%,
    #1c242e 75%
  );
  background-size: 10px 10px;
}

/* Phase 4: performance-mode suppression — hide checkerboard (heavy gradient) */
body.performance-mode .uv-editor-viewport .viewport-canvas::before {
  display: none;
}
```

**Note:** `.uv-editor-viewport .viewport-canvas` already has `position: relative` at line 362. Do NOT add `position: relative` again.

**Do NOT modify** lines 380-385 (canvas `pointer-events: auto !important` / `z-index: 1100 !important`).
</action>

<acceptance_criteria>
- `grep "conic-gradient" src/components/tools/UVEditor.css` → 1 match (the checkerboard rule)
- `grep "background-color: transparent" src/components/tools/UVEditor.css` → ≥1 match (debug bg override)
- `grep "pointer-events: none" src/components/tools/UVEditor.css | grep "viewport-canvas::before"` → 1 match
- `grep "pointer-events: auto !important" src/components/tools/UVEditor.css` → still present (invariant not broken)
- `grep "z-index: 1100 !important" src/components/tools/UVEditor.css` → still present (invariant not broken)
- `grep "performance-mode.*viewport-canvas" src/components/tools/UVEditor.css` → 1 match (suppression rule)
- No `!important` in the `::before` source rule itself (only in perf-mode suppression is permitted)
- `npm run build` exits 0
</acceptance_criteria>

---

## Verification

### must_haves
- Transparent image pixels show the dark navy checkerboard (#141a20 / #1c242e alternating 10px tiles)
- Canvas drawing/erasing/panning works normally (pointer-events on canvas unchanged)
- Debug black background is gone
- Performance mode hides the checkerboard entirely

### Visual checklist (manual)
- Open editor → select an image with transparency → transparent areas show checkerboard pattern
- Draw on canvas → brush works correctly (no pointer-event interference)
- Erase on canvas → eraser works correctly
- Toggle `body.performance-mode` class in DevTools → checkerboard hides instantly

### Regression invariants
- `grep "pointer-events: auto !important" src/components/tools/UVEditor.css` → ≥1 match
- `grep "z-index: 1100 !important" src/components/tools/UVEditor.css` → ≥1 match
- `grep -c "conic-gradient" src/components/tools/UVEditor.css` → exactly 1 (no duplicate checkerboard rules)
