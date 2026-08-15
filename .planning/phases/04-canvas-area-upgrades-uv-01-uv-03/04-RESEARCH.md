# Phase 4 Research: Canvas-area Upgrades (UV-01, UV-03)

**Date:** 2026-08-15
**Phase:** 4 — Canvas-area Upgrades
**Requirements:** UV-01 (per-tool active glow), UV-03 (checkerboard)

---

## CSS Specificity Strategy (UV-01)

### Existing generic active rule (lines 189-195)

```css
.uv-tools-dock .tool-button.active {   /* specificity: 0,3,0 */
  box-shadow: var(--primary-glow-medium), 0 0 0 1px rgb(var(--accent-cyan-rgb), 0.06) inset;
  border-color: rgb(var(--accent-cyan-rgb), 0.18);
  will-change: transform, box-shadow;
}
```

Specificity = **0,3,0** (three class selectors: `.uv-tools-dock` + `.tool-button` + `.active`).

### Per-tool override strategy

**Problem:** `placeImage` and `placeText` have NO corresponding root class toggled on `.uv-editor-panel` (only `tool-draw` and `tool-erase` are toggled at `UVEditor.tsx:2853-2854`). So the root-scope pattern (`.uv-editor-panel.tool-draw .tool-button.active`) works for draw and erase but NOT for placeImage or placeText.

**Conclusion:** Use a HYBRID approach:
- Draw + Erase: root-scope (`.uv-editor-panel.tool-draw .uv-tools-dock .tool-button.active`) — specificity **0,4,0** ✓ overrides generic
- placeImage + placeText + select: direct title-attribute selector (`.uv-tools-dock .tool-button[title="Texto"].active`) — specificity **0,3,1** ✓ overrides generic (attribute + class + class)

Actually, the cleanest approach is consistent title-attribute selectors for ALL tools. Title values (from `UVEditor.tsx:2881-2885`):
- Select → `title="Selecionar"`
- Draw → `title="Desenhar"`
- Erase → `title="Borracha"`
- Image → `title="Inserir Imagem (picker)"`
- Text → `title="Texto"`

**Recommended selector pattern** (specificity 0,3,1 — beats 0,3,0):

```css
.uv-tools-dock .tool-button[title="Desenhar"].active     { /* cyan */ }
.uv-tools-dock .tool-button[title="Borracha"].active     { /* red */ }
.uv-tools-dock .tool-button[title="Inserir Imagem (picker)"].active { /* purple */ }
.uv-tools-dock .tool-button[title="Texto"].active        { /* cyan */ }
.uv-tools-dock .tool-button[title="Selecionar"].active   { /* neutral */ }
```

This is: consistent, no new JSX attributes needed (titles already exist), beats generic rule specificity, works for ALL 5 tools including placeImage (which only gets .active via JSX edit #2).

**Alternative verified**: Root-scope for draw/erase only:
```css
.uv-editor-panel.tool-draw .uv-tools-dock .tool-button.active  { /* 0,4,0 */  cyan }
.uv-editor-panel.tool-erase .uv-tools-dock .tool-button.active { /* 0,4,0 */  red  }
```
This also works for draw/erase but would still need title-attr selectors for placeImage/placeText/select. Mixed approach adds cognitive load. Title-attr approach is cleaner and equally valid.

**No new JSX needed** for any mechanism — titles already exist; `.active` already toggled by existing className logic (except image tool which gets JSX edit #2).

### Token availability

| Color | Token / Value | Available |
|-------|--------------|-----------|
| Draw (cyan) | `var(--nexus-blue)` = `#00d7ff` | ✓ in `:root` |
| Erase (red) | `#ff3b3b` — no token exists | Must add `--tool-erase-color: #ff3b3b` to `:root` or use raw hex |
| Image (purple) | `#b366ff` — no token exists | Must add `--tool-image-color: #b366ff` to `:root` or use raw hex |
| Text (cyan) | same as draw | ✓ |
| Select (neutral) | `rgb(255 255 255 / 40%)` | Use inline |

**Recommendation:** Add two new CSS custom properties to the existing `:root` block in `UVEditor.css`:
```css
--tool-erase-color: #ff3b3b;
--tool-image-color: #b366ff;  /* matches layers panel purple */
```

---

## viewport-canvas Position Context (UV-03)

**Finding:** `.uv-editor-viewport .viewport-canvas` already has `position: relative` at **line 362**:
```css
.uv-editor-viewport .viewport-canvas {
  position: relative;   /* ← ALREADY SET */
  z-index: 1000;
  ...
}
```

**Result:** `::before` pseudo-element works immediately — NO change to `.viewport-canvas` itself needed. The `::before` will position absolutely within the already-relative container.

**Canvas stacking confirmed (lines 380-385):**
```css
.uv-editor-viewport .viewport-canvas,
.uv-editor-viewport canvas,
.viewport-canvas canvas {
  pointer-events: auto !important;
  z-index: 1100 !important;
}
```
Canvas z-index 1100 > checkerboard z-index 0 ✓. Canvas pointer-events untouched ✓.

**Debug background to remove (line 401-403):**
```css
.uv-editor-viewport canvas {
  background-color: rgb(10 10 10 / 60%);  /* ← must be zeroed */
}
```
Override with: `.uv-editor-viewport canvas { background-color: transparent; }` in the new Phase 4 block. This selector already exists — the new rule appends after it or in the Phase 4 section with same specificity (last-write wins).

**Checkerboard selector:**
```css
.uv-editor-viewport .viewport-canvas::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  background: conic-gradient(
    #141a20 25%, #1c242e 25% 50%,
    #141a20 50% 75%, #1c242e 75%
  );
  background-size: 10px 10px;
}
```

---

## Performance-mode Block (lines 468-488)

```css
/* Line 468-474 */
body.performance-mode .uv-editor-panel *,
body.performance-mode .uv-editor-panel *::before,
body.performance-mode .uv-editor-panel *::after {
  transition: none !important;
  animation: none !important;
}

/* Line 476-479 */
body.performance-mode .uv-editor-panel .primary-glow-medium {
  box-shadow: none !important;
}

/* Line 481-483 */
body.performance-mode .uv-editor-panel .uv-editor-header {
  backdrop-filter: none !important;
}

/* Line 485-488 */
body.performance-mode .uv-editor-panel .primary-glow-large {
  box-shadow: none !important;
}
```

**Pattern:** The global `*` / `*::before` / `*::after` rule already suppresses all transitions and animations with `!important`. But individual glow rules (`box-shadow`) need explicit suppression rules.

**New suppression rules needed for Phase 4:**

```css
/* Phase 4: suppress per-tool glow */
body.performance-mode .uv-tools-dock .tool-button.active {
  box-shadow: none;       /* source rules have no !important, so this wins */
  border-color: rgb(255 255 255 / 6%);
}

/* Phase 4: suppress checkerboard */
body.performance-mode .uv-editor-viewport .viewport-canvas::before {
  display: none;
}
```

Note: Source rules for per-tool glow should NOT use `!important` (per project constraint). The performance-mode suppression adds simple overrides without `!important` on the source rules.

The `*::before` rule at line 470 already adds `animation: none !important` and `transition: none !important` to `::before` — but NOT `display: none` for checkerboard. Must add explicit `display: none` rule.

---

## End of File / Phase 3 Section

**Finding:** Phase 3 has NOT yet executed (no semantic classes section exists at end of UVEditor.css). The file currently ends at line 1214 with layer-selection rules.

**Phase 3 PLAN.md** (when it executes) will add a "Semantic classes" section. Phase 4 PLAN.md must instruct executor to append the Phase 4 block AFTER Phase 3's section. If Phase 3 hasn't run yet, Phase 4 waits. The execution order is Phase 3 → Phase 4 (as per ROADMAP.md `Depends on: Phase 3`).

**Convention** for Phase 4 section header (following Phase 3's established pattern):
```css
/* ===== Phase 4: Canvas-area Upgrades (UV-01, UV-03) ===== */
```

---

## JSX Edit #2

**File:** `src/components/tools/UVEditor.tsx` line 2884
**Current:**
```tsx
<button className={`tool-button`} onClick={...} title="Inserir Imagem (picker)">
```
**After:**
```tsx
<button className={`tool-button ${tool === 'placeImage' ? 'active' : ''}`} onClick={...} title="Inserir Imagem (picker)">
```
This is a className-change only — not a logic change. It's the 2nd of 3 permitted milestone JSX edits.

Note: The image tool button currently calls `fileInputRef.current.click()` (a file picker) which then triggers `setImageFile(f)` → `useEffect` → sets `tool === 'placeImage'`. So `.active` renders when the user is in placement mode.

---

## Implementation Plan (ordered)

### Wave 1 — CSS additions only

**File:** `src/components/tools/UVEditor.css`

1. **Add color tokens** to `:root` block (lines 5-32):
   - `--tool-erase-color: #ff3b3b;`
   - `--tool-image-color: #b366ff;`

2. **Add Phase 4 section** at end of file (after existing content, line 1215+):

```css
/* ===== Phase 4: Canvas-area Upgrades (UV-01, UV-03) ===== */

/* --- UV-01: Per-tool active state color identity --- */

/* Remove generic active glow — per-tool variants below provide the actual color */
/* Note: the generic .uv-tools-dock .tool-button.active (line 189-195) stays as fallback */

/* Draw tool (cyan) */
.uv-tools-dock .tool-button[title="Desenhar"].active {
  box-shadow:
    0 0 14px rgb(0 215 255 / 60%),
    0 0 4px rgb(0 215 255 / 80%),
    0 0 0 1px rgb(0 215 255 / 10%) inset;
  border-color: rgb(0 215 255 / 40%);
}

/* Erase tool (red) */
.uv-tools-dock .tool-button[title="Borracha"].active {
  box-shadow:
    0 0 14px rgb(255 59 59 / 60%),
    0 0 4px rgb(255 59 59 / 80%),
    0 0 0 1px rgb(255 59 59 / 10%) inset;
  border-color: rgb(255 59 59 / 40%);
}

/* Image tool (purple — matches layers panel) */
.uv-tools-dock .tool-button[title="Inserir Imagem (picker)"].active {
  box-shadow:
    0 0 14px rgb(179 102 255 / 60%),
    0 0 4px rgb(179 102 255 / 80%),
    0 0 0 1px rgb(179 102 255 / 10%) inset;
  border-color: rgb(179 102 255 / 40%);
}

/* Text tool (cyan — same family as draw) */
.uv-tools-dock .tool-button[title="Texto"].active {
  box-shadow:
    0 0 14px rgb(0 215 255 / 60%),
    0 0 4px rgb(0 215 255 / 80%),
    0 0 0 1px rgb(0 215 255 / 10%) inset;
  border-color: rgb(0 215 255 / 40%);
}

/* Select tool (neutral white/grey) */
.uv-tools-dock .tool-button[title="Selecionar"].active {
  box-shadow:
    0 0 10px rgb(255 255 255 / 20%),
    0 0 0 1px rgb(255 255 255 / 12%) inset;
  border-color: rgb(255 255 255 / 25%);
}

/* --- UV-03: Dark two-tone transparency checkerboard --- */

/* Remove debug background from canvas */
.uv-editor-viewport canvas {
  background-color: transparent;
}

/* Checkerboard on viewport-canvas ::before (position:relative already set at line 362) */
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

/* --- Performance-mode suppression (Phase 4) --- */

/* Suppress per-tool glow in performance mode */
body.performance-mode .uv-tools-dock .tool-button.active {
  box-shadow: none;
  border-color: rgb(255 255 255 / 6%);
}

/* Suppress checkerboard in performance mode */
body.performance-mode .uv-editor-viewport .viewport-canvas::before {
  display: none;
}
```

### Wave 2 — JSX edit (depends on Wave 1)

**File:** `src/components/tools/UVEditor.tsx` line 2884

Change `className={`tool-button`}` to `className={`tool-button ${tool === 'placeImage' ? 'active' : ''}`}`

---

## Risks & Invariants

### Must NOT touch:
- `pointer-events: auto !important` / `z-index: 1100 !important` on canvas (lines 383-384)
- Any logic above `UVEditor.tsx:2868` — frozen zone
- `UVEditor.animations.css` — must stay dead (not imported)
- Existing `.uv-tools-dock .tool-button.active` generic rule — keep as fallback; per-tool variants override it

### Potential regressions:
1. **Checkerboard covers canvas events** — mitigated by `pointer-events: none` on `::before` and canvas `z-index: 1100 !important` overriding everything
2. **Specificity war** — title-attr selectors (0,3,1) beat generic rule (0,3,0) ✓ confirmed
3. **Performance-mode `*::before` rule** (line 470) sets `transition/animation: none !important` on `::before` but NOT `display: none` — checkerboard `::before` still renders; explicit `display:none` rule is required ✓ included
4. **Milestone JSX edit count** — this is JSX edit #2 of 3; grep `style={{` after Phase 3 executes must return exactly 3 matches (textarea geometry, mask cursor geometry, swatch color) — image button className change is NOT a `style={{` change, so count unaffected
5. **`viewport-canvas::before` z-index 0 vs viewport-canvas z-index 1000** — `.viewport-canvas` has `z-index: 1000` scoped within its stacking context; the `::before` at `z-index: 0` is INSIDE that stacking context so it is correctly below canvas (`z-index: 1100 !important`)

---

## Validation Architecture

### UV-01 Visual Verification
- Open editor, click each tool button → corresponding neon color appears (cyan/red/purple/cyan/neutral)
- At any time, exactly ONE tool shows neon glow; others are dormant
- Glow visible: `box-shadow` colored + `border-color` colored
- Image tool: click 🖼️ to open file picker → select image → tool enters `placeImage` mode → 🖼️ button shows purple glow

### UV-03 Visual Verification
- Open editor with an image that has transparent areas → dark checkerboard visible through transparent pixels
- Debug black background gone (was rgb(10 10 10 / 60%)) → canvas now transparent
- Mouse events still work over canvas (drawing still functional)
- Touch drawing still works

### Performance-mode Verification
- Toggle `body.performance-mode` class → tool glows disappear, checkerboard hides
- Layout and colors of editor remain intact
- No `!important` in new Phase 4 source rules (check with: `grep -A3 'Desenhar\|Borracha\|Imagem\|Texto\|Selecionar' UVEditor.css | grep '!important'` → 0 results)

### Canvas invariants (regression check)
- `pointer-events: auto !important` still on canvas — confirmed by inspecting element
- `z-index: 1100 !important` still on canvas — confirmed by inspecting element
- Drawing/erasing/pan/zoom works normally after checkerboard added

### Browser compatibility
- `conic-gradient` supported in Chrome/Edge 69+, Safari 12.1+, Firefox 83+ — ✓ all modern browsers
- `inset: 0` (shorthand for top/right/bottom/left) supported in Chrome 87+, Firefox 87+, Safari 14.1+ — ✓

---

## Validation Strategy

### Tests to run after implementation

```bash
# 1. No !important in new Phase 4 CSS source rules
grep -c "!important" src/components/tools/UVEditor.css
# Compare to baseline count — should increase only for performance-mode suppression rules (2 new rules)
# Actually: source rules must have 0 !important; only perf-mode suppressions are allowed

# 2. JSX edit count — milestone constraint
grep -c "style={{" src/components/tools/UVEditor.tsx
# Must still == 3 after edit (textarea, mask-cursor, swatch — unchanged)

# 3. No new import of UVEditor.animations.css
grep "animations" src/components/tools/UVEditor.tsx
# Must return 0 results (file stays dead)

# 4. Build passes
npm run build
# Must exit 0 with no TypeScript errors
```

---

## Sources

### Primary (HIGH confidence)
- `src/components/tools/UVEditor.css` — full read, key sections: lines 1-32 (tokens), 167-200 (tool-button rules), 355-405 (viewport-canvas), 468-488 (perf-mode), 1080-1214 (end of file — no Phase 3 section yet)
- `src/components/tools/UVEditor.tsx:2849-2886` — root class toggles + dock JSX + button titles + image tool className
- `.planning/phases/04-canvas-area-upgrades-uv-01-uv-03/04-CONTEXT.md` — locked decisions D-01..D-09
- `.planning/phases/04-canvas-area-upgrades-uv-01-uv-03/04-UI-SPEC.md` — approved design contract

### Secondary (MEDIUM confidence)
- `.planning/ROADMAP.md` — Phase 4 success criteria SC#1-4, `Depends on: Phase 3`
- `.planning/REQUIREMENTS.md` — UV-01, UV-03 definitions

---

## RESEARCH COMPLETE

Phase 4 is ready for planning. All technical decisions resolved:
- Selector mechanism: title-attribute selectors (specificity 0,3,1) for all 5 tools
- viewport-canvas already has `position: relative` — checkerboard `::before` works immediately
- JSX edit #2 identified and verified: line 2884, `tool === 'placeImage'` condition
- Performance-mode: 2 new suppression rules needed (glow + checkerboard)
- Execution order: Wave 1 (CSS) → Wave 2 (JSX) — no parallel risk
