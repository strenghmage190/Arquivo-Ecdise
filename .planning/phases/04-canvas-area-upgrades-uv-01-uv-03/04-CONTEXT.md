# Phase 4: Canvas-area Upgrades (UV-01, UV-03) - Context

**Gathered:** 2026-08-15
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver visual identity for the active tool in the dock (UV-01) and a dark two-tone transparency checkerboard behind the canvas (UV-03). Pure CSS additions + 1 JSX edit (the 2nd of 3 permitted milestone-wide). No logic changes.

</domain>

<decisions>
## Implementation Decisions

### Per-tool color identity (UV-01)

- **D-01:** Mechanism is agent's discretion — any approach that avoids `!important` and respects the flat `.uv-*` pattern (e.g., root-scope via `.uv-editor-panel.tool-draw .tool-button.active` or `data-tool` attribute — agent picks the cleanest option after reading the existing CSS specificity landscape).
- **D-02:** Glow intensity is agent's discretion — agent decides box-shadow spread, border width, and whether to include a subtle background tint, maintaining strong Cyberpunk/Nexus identity consistent with existing editor effects.
- **D-03:** Color palette (locked): Pincel = `--nexus-blue` (cyan token), Borracha = `#ff3b3b` (red), Imagem = `#b366ff` (purple — matches layers panel), Select = neutral (white/grey). Aligns with existing token system.

### Checkerboard (UV-03)

- **D-04:** Placement is agent's discretion — agent picks the cleanest selector/technique (pseudo-element `::before` on `.viewport-canvas` is the natural choice: no JSX needed, canvas keeps all its rules unmodified). `pointer-events: none`, `z-index: 0`.
- **D-05:** Colors and tile size are agent's discretion — agent chooses dark two-tone tones that don't compete with image content; replaces / zeroes the debug background `rgb(10 10 10 / 60%)` in the same edit.

### Image tool active state (JSX edit #2)

- **D-06:** The image tool button (currently `className="tool-button"`, no active condition) gains `${tool === 'placeImage' ? 'active' : ''}` in its className. The `tool` state already includes `'placeImage'` (`useState<'select' | 'draw' | 'erase' | 'placeImage' | 'placeText'>`). This is exactly the 2nd of the 3 permitted JSX edits.
- **D-07:** Active glow color for image tool = `#b366ff` (D-03 above) — consistent with layers panel identity.

### Performance-mode suppression

- **D-08:** Agent decides exactly what to zero in `body.performance-mode` for the new tool-glow rules, following the pattern of the existing performance-mode block in `UVEditor.css` (~lines 468-488). No `!important` in new rules.
- **D-09:** The checkerboard disappears in `body.performance-mode` — it is a heavy gradient and must be suppressed (agent zeroes or removes the `::before` background in the performance-mode block).

### Agent's Discretion

- Exact CSS mechanism for per-tool color (root-scope vs. `data-tool` attribute approach) — agent reads existing specificity and picks cleanest.
- Glow intensity values (spread, blur, opacity) — strong neon, Cyberpunk-consistent.
- Checkerboard technique (pseudo-element, direct selector) and exact tone values — dark, discrete, non-competing.
- Exact performance-mode suppression rules for new glow selectors.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Roadmap & Requirements

- `.planning/ROADMAP.md` — Phase 4 goal, success criteria (all 4 criteria), milestone-wide "exactly 3 JSX edits" constraint.
- `.planning/REQUIREMENTS.md` — UV-01 and UV-03 requirement definitions; Out of Scope (canvas math, render loops, hooks).
- `.planning/PROJECT.md` — Core value, Key Decisions, Constraints (vanilla CSS, no inline styles, preserve Cyberpunk identity).

### Source Code

- `src/components/tools/UVEditor.tsx:2880-2886` — The tools dock JSX; image tool button (line 2884) is target of JSX edit #2.
- `src/components/tools/UVEditor.tsx:2901-2914` — `.uv-editor-viewport` > `.viewport-canvas` > `canvas` structure; checkerboard target.
- `src/components/tools/UVEditor.tsx:2849-2856` — `useEffect` toggling `tool-draw`/`tool-erase` on root via `classList`.
- `src/components/tools/UVEditor.tsx` — `tool` state type includes `'placeImage'` — confirmed trigger for image button active state.
- `src/components/tools/UVEditor.css` — `.uv-tools-dock .tool-button.active` (generic base); performance-mode block (~lines 468-488); `:root` token palette; `.viewport-canvas` rules (includes debug bg to zero).
- `src/components/tools/UVEditor.animations.css` — Do NOT import or modify (Phase 7 concern; must stay dead).

### Pattern Reference

- `src/components/modals/CreateClueModal_Refactored.css` — Flat kebab-case precedent from Phase 1.
- `.planning/phases/03-semantic-class-foundation-uv-04/03-CONTEXT.md` — D-10 (cursor via root scope), D-12/D-13 (naming, `.active` toggle).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `root.classList.toggle('tool-draw', ...)` / `'tool-erase'` — root-level tool class already toggled; CSS can scope colors through `.uv-editor-panel.tool-draw .tool-button.active { ... }` with no new JSX.
- `.uv-tools-dock .tool-button.active` — generic active rule; Phase 4 adds per-tool color variants.
- `:root` token palette — `--nexus-blue` (cyan) and other tokens for consistent neon styling.
- `body.performance-mode` block (~468-488) — pattern for suppressing effects; follow exactly.

### Established Patterns

- Flat `.uv-*` kebab-case, `--` for variants, `.active` for boolean state on tool buttons (D-12/D-13 Phase 3).
- Additive-only CSS: new rules appended in new sectioned block; no existing rules modified.

### Integration Points

- `.viewport-canvas` — checkerboard target; existing `background-color: rgb(10 10 10 / 60%)` must be zeroed/replaced.
- `canvas` — must keep `pointer-events: auto !important` / `z-index: 1100 !important` untouched.
- `markPerfKeep` — already wired at `UVEditor.tsx:2862`; new classes must not break performance-mode behavior.

</code_context>

<specifics>
## Specific Ideas

- User locked color palette: Pincel=`--nexus-blue`, Borracha=`#ff3b3b`, Imagem=`#b366ff` (layers match), Select=neutral.
- Checkerboard disappears in `body.performance-mode` (user decision: heavy gradient = suppress).
- All implementation mechanics delegated to agent within established constraints.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 4-Canvas-area Upgrades (UV-01, UV-03)*
*Context gathered: 2026-08-15*
