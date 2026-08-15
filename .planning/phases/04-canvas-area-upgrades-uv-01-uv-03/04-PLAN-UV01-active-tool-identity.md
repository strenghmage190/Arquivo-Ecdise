---
wave: 1
depends_on: []
files_modified:
  - src/components/tools/UVEditor.css
  - src/components/tools/UVEditor.tsx
requirements:
  - UV-01
autonomous: true
---

# Plan: UV-01 Active Tool Visual Identity

## Goal

Each tool button shows a distinct neon glow and colored border when active, making the active tool unmissable at a glance.

## Tasks

### Task T-01: Add per-tool color tokens to :root

<read_first>
- src/components/tools/UVEditor.css (lines 5-32 — the existing :root block; append after --transition-medium on line 31, before closing brace on line 32)
</read_first>

<action>
In `src/components/tools/UVEditor.css`, inside the existing `:root` block (lines 5-32), add two new custom properties after `--transition-medium: 180ms ease;` on line 31 and before the closing `}` on line 32:

```
  /* Tool-specific accent colors (UV-01) */
  --tool-erase-color: #ff3b3b;
  --tool-image-color: #b366ff;
```

These are additive only — no existing tokens are modified.
</action>

<acceptance_criteria>
- `grep "tool-erase-color" src/components/tools/UVEditor.css` → 1 match inside :root block
- `grep "tool-image-color" src/components/tools/UVEditor.css` → 1 match inside :root block
- `grep -c "!important" src/components/tools/UVEditor.css` → same count as before this edit (no new !important)
- `npm run build` exits 0
</acceptance_criteria>

---

### Task T-02: Append per-tool glow rules and performance-mode suppression

<read_first>
- src/components/tools/UVEditor.css (lines 167-200 — generic tool-button rules to understand existing specificity; lines 468-488 — performance-mode block to follow its pattern; line 1214 — current end of file where new section appends)
</read_first>

<action>
At the END of `src/components/tools/UVEditor.css` (after line 1214), append the following block verbatim:

```css
/* ===== Phase 4: Canvas-area Upgrades (UV-01) — per-tool active state identity ===== */

/* Override generic .uv-tools-dock .tool-button.active (specificity 0,3,0) with
   title-attribute selectors (specificity 0,3,1 = class+class+attribute).
   Each tool has a distinct neon color identity. */

/* Draw tool — cyan (#00d7ff = --nexus-blue) */
.uv-tools-dock .tool-button[title="Desenhar"].active {
  box-shadow:
    0 0 14px rgb(0 215 255 / 60%),
    0 0 4px rgb(0 215 255 / 80%),
    0 0 0 1px rgb(0 215 255 / 10%) inset;
  border-color: rgb(0 215 255 / 40%);
}

/* Erase tool — red (--tool-erase-color) */
.uv-tools-dock .tool-button[title="Borracha"].active {
  box-shadow:
    0 0 14px rgb(255 59 59 / 60%),
    0 0 4px rgb(255 59 59 / 80%),
    0 0 0 1px rgb(255 59 59 / 10%) inset;
  border-color: rgb(255 59 59 / 40%);
}

/* Image tool — purple (--tool-image-color, matches layers panel) */
.uv-tools-dock .tool-button[title="Inserir Imagem (picker)"].active {
  box-shadow:
    0 0 14px rgb(179 102 255 / 60%),
    0 0 4px rgb(179 102 255 / 80%),
    0 0 0 1px rgb(179 102 255 / 10%) inset;
  border-color: rgb(179 102 255 / 40%);
}

/* Text tool — cyan (same family as draw) */
.uv-tools-dock .tool-button[title="Texto"].active {
  box-shadow:
    0 0 14px rgb(0 215 255 / 60%),
    0 0 4px rgb(0 215 255 / 80%),
    0 0 0 1px rgb(0 215 255 / 10%) inset;
  border-color: rgb(0 215 255 / 40%);
}

/* Select tool — neutral white/grey */
.uv-tools-dock .tool-button[title="Selecionar"].active {
  box-shadow:
    0 0 10px rgb(255 255 255 / 20%),
    0 0 0 1px rgb(255 255 255 / 12%) inset;
  border-color: rgb(255 255 255 / 25%);
}

/* Phase 4: performance-mode suppression — disable per-tool glow */
body.performance-mode .uv-tools-dock .tool-button.active {
  box-shadow: none;
  border-color: rgb(255 255 255 / 6%);
}
```
</action>

<acceptance_criteria>
- `grep -c "tool-button\[title" src/components/tools/UVEditor.css` → 5 (one per tool)
- `grep "Desenhar\|Borracha\|Inserir Imagem\|Texto\|Selecionar" src/components/tools/UVEditor.css | grep "tool-button" | wc -l` → 5
- New source rules contain zero `!important` (only performance-mode suppression rule allowed)
- `grep "pointer-events: auto !important" src/components/tools/UVEditor.css` → still present (invariant)
- `npm run build` exits 0
</acceptance_criteria>

---

### Task T-03: JSX edit — image tool active state (JSX edit #2 of 3)

<read_first>
- src/components/tools/UVEditor.tsx (line 2884 — the image tool button; lines 2880-2886 — full dock JSX; lines 2849-2860 — tool state and root class toggle to confirm `tool` variable name and `placeImage` literal)
</read_first>

<action>
In `src/components/tools/UVEditor.tsx` at line 2884, change:

```tsx
<button className={`tool-button`} onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} title="Inserir Imagem (picker)">
```

to:

```tsx
<button className={`tool-button ${tool === 'placeImage' ? 'active' : ''}`} onClick={() => { if (fileInputRef.current) fileInputRef.current.click(); }} title="Inserir Imagem (picker)">
```

This is a className-only change. No logic changes permitted.
</action>

<acceptance_criteria>
- `grep "placeImage.*active" src/components/tools/UVEditor.tsx` → 1 match on line 2884
- `grep -c "style={{" src/components/tools/UVEditor.tsx` → 3 (unchanged from pre-Phase-4 baseline)
- `grep "tool-button.*placeImage" src/components/tools/UVEditor.tsx` → confirms the active condition is present
- `npm run build` exits 0 with no TypeScript errors
</acceptance_criteria>

---

## Verification

### must_haves
- Each of the 5 tool buttons shows a distinct visual identity when `.active`: cyan (draw/text), red (erase), purple (image), neutral (select)
- No other interactive elements receive neon glow (accent reserved for active tool only)
- Performance mode suppresses all glows without breaking layout

### Regression invariants
- `grep "pointer-events: auto !important" src/components/tools/UVEditor.css` → ≥1 match
- `grep "z-index: 1100 !important" src/components/tools/UVEditor.css` → ≥1 match
- `grep "animations" src/components/tools/UVEditor.tsx` → 0 matches (animations.css stays dead)
