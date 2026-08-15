# Stack Research — UVEditor "Mini-Photoshop" UI/UX Refactor

**Domain:** Vanilla-CSS techniques for a Cyberpunk canvas-editor UI refactor (UVEditor, v1.2 milestone)
**Researched:** 2026-08-14
**Confidence:** HIGH (all techniques verified against MDN/caniuse/CSSWG; no new runtime dependencies required)

> **Headline: ZERO new npm packages.** This milestone needs no libraries. It needs ~6 CSS techniques, all Baseline or near-Baseline, all compatible with the existing `nexus.css` token architecture. The only "stack change" is a small set of new CSS custom properties in `UVEditor.css :root` and disciplined vendor-prefixing.

---

## Recommended Stack → Recommended Techniques

### Core Techniques

| Technique | Browser Support | Purpose | Why Recommended |
|-----------|-----------------|---------|-----------------|
| `repeating-conic-gradient()` checkerboard | Chrome 69+, FF 83+, Safari 12.1+ (Baseline 2020) | Dark transparency checkerboard (UV-03) | VS Code migrated its image-preview checkerboard FROM two overlapping `linear-gradient(45deg)` layers TO a single `conic-gradient` **specifically because the two-layer diagonal approach renders triangular subpixel artifacts at non-integer zoom levels** (github.com/microsoft/vscode#304958). This editor has pan/zoom → arbitrary canvas scale → same artifact class. Single-layer conic tile = artifact-free at every zoom. Also 70% less CSS. |
| `::-webkit-slider-thumb` + `::-moz-range-thumb` vendor pseudos | All evergreen browsers (via prefixes) | C.R.I.S/Nexus neon sliders (UV-05) | The standardized `::slider-thumb`/`::slider-track` pseudo-elements are **still not shipped in any browser** (CSSWG resolved on the `slider-*` names 2024-03; WebKit's experimental `::thumb`/`::track` is explicitly unshipped and renamable — w3c/csswg-drafts#9830). Vendor-prefixed pseudos are the ONLY authoring path that works today. Project precedent already exists: `ForensicChannelEditor.css`, `GlitchMaker.css`, `SignalReconstructor.css` all use the webkit+moz dual-prefix pattern. |
| `box-shadow` multi-layer neon glow | Universal | Pressed tool state, glowing thumb, glow buttons (UV-01/05/06) | Two-layer shadow (`tight` + `spread`) is the canonical neon recipe; combined with `color-mix()` it can be derived from `--nexus-blue` instead of hardcoded alpha RGBs. |
| `color-mix()` | Chrome 111+, FF 113+, Safari 16.2+ (Baseline 2023, ~89% global) | Derive glow/border variants from `--nexus-blue`/`--nexus-glitch` tokens | Removes the hardcoded `rgb(0 215 255 / 45%)`-style variants scattered through UVEditor.css. **Use `in srgb` for saturated neon colors** — mixing vivid cyan/red in `oklch` can silently clip out of gamut and render flatter than specified (solid-web.com, 2026-05). The existing `rgb(var(--nexus-blue-rgb), 0.45)` pattern works fine and is the drop-in fallback; `color-mix()` is the modernization, not a requirement. |
| `backdrop-filter` glassmorphism | Chrome 76+, FF 103+, Safari 18+ unprefixed; Safari 9+ with `-webkit-` prefix | Glass panels, glass banner (UV-02, existing header/docks) | Already used in UVEditor.css (`blur(4px) saturate(1.1)` on header, `blur(3px)` on docks) but **without the `-webkit-` prefix** — Safari <18 silently drops it. Add `-webkit-backdrop-filter` alongside every usage. Keep blur 3–8px (cheap); do NOT put it on the viewport/canvas container (large-area backdrop filters are the expensive ones). |
| `@keyframes` opacity blink | Universal | Giant blinking insertion banner (UV-02) | Blink `opacity` only — compositor-friendly, zero layout/paint cost (vs animating `box-shadow` in a loop, which repaints every frame). Soft blink (min opacity ~0.3–0.4, ~1.1s cycle) reads as "cyberpunk alert" without strobe; 1.1s cycle ≈ 0.9 flashes/sec, well under the WCAG 2.3.1 3-flashes/sec limit. Auto-neutralized by the existing `prefers-reduced-motion: reduce` block (UVEditor.css:97). |
| `:active` pressed transitions | Universal | Satisfying Salvar/Fechar/Inverter Máscara presses (UV-06) | `translateY/scale` + `inset box-shadow` + compressed `transition-duration` (~60ms) is the "mechanical click" feel. Codebase already has the `--transition-fast`/`--transition-medium` tokens — reuse them. |
| `@keyframes` + class toggles for DnD | Universal | Layers drag-drop animation (UV-07) | **Nothing to build** — `UVEditor.animations.css` already ships `dragPulse`, `dropZoneHighlight` (purple `#b366ff` glow), `inputGlow`, and `.dragging`/`.drag-over` states. This requirement is preserve-and-integrate, not create. |
| `color-scheme: dark` | Chrome 81+, FF 96+, Safari 13+ | Native dark form controls & scrollbars in the editor | One line on `.uv-workspace` makes range inputs, checkboxes, and scrollbars render dark by default — fixes "native white control flash" in a dark glass UI for free. |
| `scrollbar-color` / `scrollbar-width: thin` | FF 64+, Chrome 121+ (for the shorthand pair) | Firefox scrollbar parity | UVEditor.css styles `::-webkit-scrollbar` only → Firefox gets default chunky scrollbars. The `_scrollbar.scss` in `src/styles/components/` already uses this pattern; port it. |

### Supporting Techniques (small wins, low risk)

| Technique | Purpose | When to Use |
|-----------|---------|-------------|
| `-webkit-backdrop-filter` prefix mirror | Safari <18 glass fallback | Every place `backdrop-filter` is declared |
| `touch-action: manipulation` | Remove 300ms/double-tap delay on tool & action buttons | Tool dock buttons, banner cancel button (mobile) |
| `touch-action: none` on `[draggable="true"]` | Make layer drag work on touch | LayersPanel rows |
| `-webkit-appearance: none` + `margin-top: calc((track − thumb)/2)` | Center the WebKit slider thumb on its track | **Fixes an existing bug**: UVEditor.css:781 styles a 12px webkit thumb on a 6px track with NO negative margin-top → thumb sits misaligned in Chrome/Edge/Safari. Firefox auto-centers, which is why it went unnoticed. |
| `accent-color: var(--accent-cyan)` | Cheap native color for any range/checkbox NOT fully custom-styled | Fallback styling; the layers checkboxes are already custom (`appearance:none` + SVG check at UVEditor.css:1170) so they don't need it |
| `filter: brightness(1.1)` on `:active`/`:hover` | Extra "energy" on neon elements without hand-authoring glow variants | Buttons, tool icons |
| `@supports (color-mix(...))` guard | Progressive enhancement for glow variants | Optional; not needed since the `-rgb` alpha pattern is the fallback |

### Development Tools → "Token Additions" (the only code changes beyond CSS rules)

New custom properties to add to `UVEditor.css :root` (extend the existing token block at lines 5–32 — do NOT touch `nexus.css` globals):

```css
:root {
  /* Checkerboard (dark transparency) tokens — UV-03 */
  --uv-checker-size: 20px;                    /* tile size; matches 12px/24px rhythm */
  --uv-checker-a: rgb(255 255 255 / 3%);      /* light cell — barely-lit dark */
  --uv-checker-b: rgb(0 0 0 / 8%);            /* dark cell — pure shadow */

  /* Neon glow scale derived from the cyan token — UV-01/05 */
  --uv-glow-tight: 0 0 8px;
  --uv-glow-spread: 0 0 22px;

  /* Insertion-mode alert tokens — UV-02 */
  --uv-alert: var(--nexus-glitch);            /* #ff003c */
  --uv-alert-bg: rgb(255 0 60 / 12%);
  --uv-blink-duration: 1.1s;
}
```

Glow variants via `color-mix()` (optional modernization; `rgb(var(--nexus-blue-rgb), X)` is the drop-in fallback):

```css
:root {
  --uv-blue-glow-soft:  color-mix(in srgb, var(--nexus-blue) 15%, transparent);
  --uv-blue-glow-med:   color-mix(in srgb, var(--nexus-blue) 45%, transparent);
  --uv-blue-glow-strong: color-mix(in srgb, var(--nexus-blue) 80%, transparent);
}
```

## Installation

**Nothing to install.** No `npm install`. No build-tool changes. All additions live in `UVEditor.css` (new tokens + new/updated rules) and `UVEditor.tsx` (class names only — no inline styles, no logic).

```bash
# (intentionally empty — zero-dependency milestone)
```

## Copy-Paste CSS Recipes (mapped to UV requirements)

### UV-01 — Tools dock pressed/active state

The DOM hook already exists: `UVEditor.tsx:2881` renders `className={`tool-button ${tool === 'draw' ? 'active' : ''}`}`. Strengthen the existing `.active` rule (UVEditor.css:189) — keep the `will-change` hint:

```css
.uv-tools-dock .tool-button.active {
  color: var(--accent-cyan);
  background: color-mix(in srgb, var(--accent-cyan) 10%, transparent); /* fallback: rgb(var(--accent-cyan-rgb), 0.10) */
  border-color: var(--accent-cyan);
  box-shadow:
    var(--uv-glow-tight) var(--uv-blue-glow-med),
    var(--uv-glow-spread) var(--uv-blue-glow-soft),
    inset 0 0 12px rgb(var(--accent-cyan-rgb) / 25%);
  transform: translateY(-1px);
}
```

Per-tool colored borders (nice-to-have): the buttons have `title` but no data attribute — add `data-tool="draw"|"erase"|"select"|"placeText"` in TSX (attribute swap only, zero logic change) and key off it:

```css
.uv-tools-dock .tool-button[data-tool="erase"].active { border-color: #ff3c7a; box-shadow: 0 0 10px rgb(255 60 122 / 55%), ...; }
.uv-tools-dock .tool-button[data-tool="placeText"].active { border-color: #b366ff; box-shadow: 0 0 10px rgb(179 102 255 / 55%), ...; }
```

### UV-02 — Blinking insertion banner + red cancel

Blink opacity only (compositor, cheap); entry via plain `@keyframes` (robust — see Alternatives for why not `@starting-style`):

```css
.uv-insertion-banner {
  position: absolute; top: 10px; left: 50%;
  transform: translateX(-50%);
  z-index: 1200;                            /* above canvas overlays; below modals */
  display: flex; align-items: center; gap: 16px;
  padding: 10px 20px;
  font-size: 15px; letter-spacing: 2px; text-transform: uppercase;
  color: #ffe9ee;
  background: var(--uv-alert-bg);
  border: 1px solid var(--uv-alert);
  box-shadow: 0 0 18px rgb(255 0 60 / 25%), inset 0 0 24px rgb(255 0 60 / 8%);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  border-radius: 6px;
  animation:
    uv-banner-enter 220ms ease-out,
    uv-banner-blink var(--uv-blink-duration) steps(2, jump-none) infinite;
}
@keyframes uv-banner-enter {
  from { opacity: 0; transform: translateX(-50%) translateY(-8px); }
}
@keyframes uv-banner-blink {
  50% { opacity: 0.35; }                    /* soft blink: readable text, no strobe */
}
.uv-insertion-banner .uv-cancel-btn {
  padding: 8px 18px;
  background: var(--uv-alert);
  color: #05080a; font-weight: 700; font-family: inherit;
  border: 1px solid #ff5c8a;
  border-radius: 4px;
  box-shadow: 0 0 14px rgb(255 0 60 / 45%);
  cursor: pointer;
  transition: transform 120ms ease, box-shadow 120ms ease, filter 120ms ease;
}
.uv-insertion-banner .uv-cancel-btn:hover { filter: brightness(1.15); }
.uv-insertion-banner .uv-cancel-btn:active {
  transform: scale(0.94);
  box-shadow: 0 0 6px rgb(255 0 60 / 30%), inset 0 2px 6px rgb(0 0 0 / 40%);
}
```

The existing global reduced-motion block (UVEditor.css:97) kills `animation` automatically — no extra work.

### UV-03 — Dark checkerboard (transparency) background

**Replace** the two-layer `linear-gradient(45deg)` pattern currently on `.uv-editor-viewport::before` (UVEditor.css:330–359) with a single conic tile. Keep `pointer-events: none` and the `z-index: 0` layering so canvas math stays untouched:

```css
.uv-editor-viewport::before {
  content: "";
  position: absolute; inset: 0; z-index: 0;
  background:
    repeating-conic-gradient(
      var(--uv-checker-a) 0 25%,
      var(--uv-checker-b) 0 50%
    ) 0 0 / var(--uv-checker-size) var(--uv-checker-size);
  pointer-events: none;                    /* critical: events must reach canvas */
}
```

Why this is the right call here specifically: this editor zooms/pans the canvas to arbitrary scale factors, and the two-diagonal-linear-gradient checkerboard is **known to render triangular subpixel artifacts at non-integer zoom** (the exact bug VS Code fixed by switching to conic — vscode#304958). If a distinct "canvas is transparent" affordance is wanted only under the canvas element itself, apply the same background to `.viewport-canvas` (which already has `background: transparent`, UVEditor.css:370).

### UV-05 — C.R.I.S/Nexus range sliders (dark translucent track, neon thumb on :hover)

Follow the project's own dual-prefix precedent (ForensicChannelEditor.css, GlitchMaker.css). Also fixes the missing-`margin-top` thumb-alignment bug and adds the missing Firefox pseudos:

```css
/* Track — dark translucent, slightly inset */
.uv-range-slider {
  -webkit-appearance: none; appearance: none;
  width: 100%; height: 6px;
  border-radius: 999px;
  background: rgb(255 255 255 / 4%);
  border: 1px solid rgb(255 255 255 / 5%);
  box-shadow: inset 0 1px 3px rgb(0 0 0 / 40%);
  cursor: pointer;
}
.uv-range-slider::-webkit-slider-runnable-track {
  height: 6px; border-radius: 999px;
  background: rgb(255 255 255 / 4%);
}
.uv-range-slider::-moz-range-track {
  height: 6px; border-radius: 999px;
  background: rgb(255 255 255 / 4%);
}
.uv-range-slider::-moz-range-progress {     /* value-filled portion — Firefox only */
  height: 6px; border-radius: 999px;
  background: linear-gradient(90deg, var(--uv-blue-glow-soft), var(--nexus-blue));
}

/* Thumb — neon; glow intensifies + scales on :hover / :focus-visible */
.uv-range-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 14px; height: 14px;
  margin-top: -5px;                         /* (6px track − 14px thumb) / 2 — centers it */
  border-radius: 50%;
  background: var(--nexus-blue);
  border: 2px solid rgb(255 255 255 / 14%);
  box-shadow: 0 0 8px var(--uv-blue-glow-med), 0 0 16px var(--uv-blue-glow-soft);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast), background var(--transition-fast);
}
.uv-range-slider::-webkit-slider-thumb:hover,
.uv-range-slider:focus-visible::-webkit-slider-thumb {
  background: var(--accent-cyan);
  transform: scale(1.15);
  box-shadow: 0 0 14px var(--uv-blue-glow-strong), 0 0 30px var(--uv-blue-glow-med);
}
.uv-range-slider::-moz-range-thumb {
  width: 14px; height: 14px; border-radius: 50%;
  background: var(--nexus-blue);
  border: 2px solid rgb(255 255 255 / 14%);
  box-shadow: 0 0 8px var(--uv-blue-glow-med), 0 0 16px var(--uv-blue-glow-soft);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast), background var(--transition-fast);
}
.uv-range-slider::-moz-range-thumb:hover,
.uv-range-slider:focus-visible::-moz-range-thumb {
  background: var(--accent-cyan);
  transform: scale(1.15);
  box-shadow: 0 0 14px var(--uv-blue-glow-strong), 0 0 30px var(--uv-blue-glow-med);
}
```

C.R.I.S spec is a *static* dark translucent track, so WebKit's lack of a value-fill pseudo is a non-issue — the neon fill is a Firefox progressive enhancement via `::-moz-range-progress`.

### UV-06 — Satisfying :active on action buttons

Apply to the button base already transitioned at UVEditor.css:35–49 (`.uv-btn`, `.tool-button`, etc.). Compressed press duration = mechanical click:

```css
.uv-editor-panel .uv-btn:active,
.uv-editor-panel button:active,
.uv-editor-panel .tool-button:active {
  transform: translateY(1px) scale(0.96);
  box-shadow: inset 0 2px 8px rgb(0 0 0 / 45%);
  filter: brightness(1.1);
  transition-duration: 60ms;
}
/* Selected tool keeps its neon identity while pressed */
.uv-tools-dock .tool-button.active:active {
  box-shadow:
    var(--uv-glow-tight) var(--uv-blue-glow-med),
    inset 0 2px 8px rgb(0 0 0 / 45%);
}
```

Optionally add `touch-action: manipulation` on these buttons for mobile snappiness.

### UV-07 — Layers purple glow + DnD animation

**Do not recreate.** `UVEditor.animations.css` already has `dragPulse`, `dropZoneHighlight` (`#b366ff` glow), `inputGlow`, `.dragging`/`.drag-over` states, and grab/grabbing cursors. The integration work is:
1. Keep `LayersPanel.tsx` classes (`uv-sidebar-section layers-section`) and the existing purple CSS intact.
2. One perf cleanup: `UVEditor.animations.css:88` uses `transition: all 0.2s ease` — scope it to `transform, opacity, box-shadow` (compositor-friendly; `all` forces layout+repaint on unrelated changes).
3. Optionally add `touch-action: none` to `[draggable="true"]` for touch drag.

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Vendor-prefixed slider pseudos (`::-webkit-slider-thumb`/`::-moz-range-thumb`) | Standard `::slider-thumb`/`::slider-track` | **Never yet** — not shipped in any browser (CSSWG resolved 2024; WebKit's `::thumb` is unshipped/renamable, w3c/csswg-drafts#9830). Revisit in ~2+ years. |
| `@keyframes` for banner entry/blink | `@starting-style` + `transition-behavior: allow-discrete` | Only if a smooth display-toggle is desired AND target browsers are Chrome/Edge/Safari 18+ — Firefox 129+ still does not transition `display` itself (OpenReplay, 2026-08), and `@starting-style` has a silent-failure specificity gotcha (Josh Comeau, 2025-09). Keyframes are simpler and work everywhere. |
| `repeating-conic-gradient` checkerboard | Two overlapping `linear-gradient(45deg)` layers | Only if the exact current look must be pixel-preserved with zero zoom (not the case here — zoom is core to this editor). |
| `color-mix(in srgb, ...)` glow variants | Hardcoded `rgb(var(--nexus-blue-rgb), X)` alpha values | Keep the `-rgb` pattern if avoiding any browser-support risk; `color-mix` is Baseline 2023 (~89% global). |
| `backdrop-filter` (prefixed) glass | Opaque dark panels (`rgb(5 8 10 / 95%)`) | Low-end hardware / `performance-mode` — codebase already has a `body.performance-mode` escape hatch (UVEditor.css:469) that nulls backdrop-filter. |
| `color-scheme: dark` | Hand-styling every native control | Use both — `color-scheme` is the cheap baseline, custom styling adds the neon. |
| `accent-color: var(--accent-cyan)` | Full custom checkbox/range styling | As the styling floor for controls not worth hand-crafting. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `::slider-thumb` / `::slider-track` | Not shipped anywhere (verified CSSWG #9830) | `::-webkit-slider-thumb` + `::-moz-range-thumb` |
| Any UI framework (Tailwind, MUI, Radix) | Milestone constraint: vanilla CSS + classes; would orphan 1213 lines of working UVEditor.css | Semantic classes (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`) |
| CSS-in-JS (styled-components, Emotion) | Milestone constraint; breaks the token-architecture; runtime cost | Vanilla CSS + `:root` custom properties |
| Any npm package for sliders/checkerboards (react-range, checkerboard libs) | Both features are 3–10 lines of CSS; packages add bundle weight and styling fights | The recipes above |
| `@starting-style` / `transition-behavior: allow-discrete` as the primary banner mechanism | Firefox display-transition gap + specificity gotcha; keyframes achieve the same entry effect universally | `@keyframes uv-banner-enter` |
| Animating `box-shadow` inside the blink loop | Repaints every frame on a full-width banner — measurable jank | Animate `opacity` only (compositor thread) |
| `transition: all` (UVEditor.animations.css:88) | Forces layout+repaint on unrelated property changes; the existing comment even asks for scoping | `transition: transform, opacity, box-shadow` |
| `backdrop-filter` on `.uv-editor-viewport` / canvas container | Large-area backdrop filtering is the expensive case; the checkerboard is a painted background and needs no filter | Keep glass on small chrome surfaces (header, docks, panels, banner) |
| `will-change` sprayed everywhere | Over-commits memory; only matters on actively-animating elements | Keep existing hints (UVEditor.css:1117–1123); add to `.tool-button.active` |
| `animation-timeline` / scroll-driven animations | Overkill; no scroll-linked effect in scope | Plain keyframes |

## Technique Variants (context-dependent choices)

**If a specific tool must glow in its own color (Borracha red, Texto purple):**
- Add `data-tool` attribute in TSX (attribute only, no logic) and key per-tool `.active` rules as in the UV-01 recipe.
- Because the palette per tool stays static, hardcoded `rgb(... / 55%)` shadows are fine here; `color-mix` buys nothing for one-off variants.

**If the checkerboard must sit only under the canvas (not the whole viewport):**
- Move the conic background from `.uv-editor-viewport::before` onto `.viewport-canvas` (UVEditor.css:361) — it already declares `background: transparent`; add the pattern there and keep the canvas element itself transparent so drawn content composites over it.

**If Firefox slider fill is desired (value-dependent neon progress):**
- Add `::-moz-range-progress` (recipe above). WebKit has no author-facing fill pseudo (the UA filled-track is not exposed), so accept static-track on Chrome/Safari — consistent with the C.R.I.S "dark translucent track" spec anyway.

**If a Safari <18 visitor is a real audience:**
- Mirror every `backdrop-filter` with `-webkit-backdrop-filter` (two declarations per rule). Safari 18+ (Sept 2024) is the unprefixed cutoff; "Widely available" per web-platform-dx is expected 2027-03.

## Version Compatibility — Browser Support Matrix

| Technique | Chrome | Firefox | Safari | Prefixed? | Notes |
|-----------|--------|---------|--------|-----------|-------|
| `repeating-conic-gradient()` | 69+ | 83+ | 12.1+ | No | Baseline 2020 |
| `::-webkit-slider-thumb` | All | — | All | `-webkit-` (Chrome/Edge/Safari) | Needs `-webkit-appearance: none` + negative `margin-top` centering |
| `::-moz-range-thumb/track/progress` | — | All | — | `-moz-` (FF only) | FF auto-centers thumb; `::-moz-range-progress` = value fill |
| `box-shadow` neon glow | All | All | All | No | Two-layer (tight+spread) recipe |
| `color-mix()` | 111+ | 113+ | 16.2+ | No | Baseline 2023; use `in srgb` for neon (oklch clipping gotcha) |
| `backdrop-filter` | 76+ | 103+ | 9+ (prefixed) / 18+ (unprefixed) | `-webkit-` mirror for Safari <18 | Included in Interop 2025 |
| `@keyframes` + `animation` | All | All | All | No | Blink opacity only |
| `:active` transitions | All | All | All | No | Pairs with existing `--transition-fast` tokens |
| `@starting-style` / `allow-discrete` | 117+ | 129+ (no `display` transition) | 17.5+/18+ | No | Avoid for this milestone (see Alternatives) |
| `color-scheme: dark` | 81+ | 96+ | 13+ | No | One-liner; also affects scrollbars |
| `scrollbar-color` + `scrollbar-width` | 121+ (color) | 64+ | — | No | Firefox parity for `::-webkit-scrollbar` styles |
| `:has()`, CSS nesting, `@property` | 105+/112+/85+ | 121+/117+/128+ | 15.4+/16.5+/16.4+ | No | Available but **not needed** — flat vanilla CSS matches the codebase style |

## Integration Map — Existing UVEditor.css classes → New semantic classes

The milestone mandates new semantic names (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`). UVEditor.css is 1213 lines with ~100 selectors — **rename deliberately, alias to de-risk**:

| New semantic class | Current equivalent (UVEditor.css) | Integration strategy |
|--------------------|-----------------------------------|----------------------|
| `.uv-workspace` | `.uv-editor-panel` (grid root, line 105) | Root rename: update TSX root div + the handful of direct-children selectors (`.uv-editor-panel > .uv-tools-dock` etc. at lines 132–536). Keep `.uv-editor-panel` in the selector list during the milestone (`selector, .uv-workspace { ... }`), drop legacy at milestone end after a full-UI smoke pass. |
| `.uv-sidebar` | `.uv-right-panel` (line 520) | Same alias pattern. NOTE: `LayersPanel.tsx:210` already emits `uv-sidebar-section layers-section` with inline layout styles — migrating those inline styles into `.uv-sidebar` / `.uv-sidebar-section` is part of UV-04/UV-07. |
| `.uv-property-group` | property blocks inside `.properties-panel` (line 559) | New class for grouped label+control rows; add alongside existing `.properties-panel` scoping (both apply). |
| `.uv-range-slider` | `.uv-range` (line 491) + `.properties-panel input[type="range"]` (line 771) | One class, two-prefix pseudos (recipe above); supersedes the duplicated webkit-only thumb rules at lines 781–789 and the `.uv-range` track at 491–511. |
| `.uv-tools-dock` / `.tool-button.active` | Same (lines 148, 189) | **Keep as-is** — milestone explicitly names `.uv-tools-dock`; only strengthen `.active` (UV-01). |
| `.uv-editor-viewport::before` | Checkerboard (line 330) | Replace gradient technique in place (UV-03); keep `pointer-events: none` + z-index layering. |

**Refactor ordering recommendation:** CSS-first (tokens → checkerboard → sliders → dock state → banner → button presses), then TSX class swaps, then the smoke pass. Because canvas math/render loops/hooks are frozen (project constraint), all changes are additive to the DOM shell — the risk surface is purely visual regression.

## Sources

- **w3c/csswg-drafts#4410 + #9830** — standard `::slider-thumb`/`::slider-track` status: resolved 2024, NOT shipped in any engine; WebKit `::thumb`/`::track` explicitly unshipped/renamable. HIGH confidence.
- **github.com/microsoft/vscode#304958** — VS Code checkerboard migration to `conic-gradient`; documents triangular subpixel artifacts of two-overlapping-45deg-linear-gradients at non-integer zoom. HIGH confidence (primary-bug source, exactly matches this editor's zoom use case).
- **CSS-Tricks "Background Patterns, Simplified by Conic Gradients"** (2020) — conic checkerboard recipes, 70% CSS reduction. HIGH confidence (technique), MEDIUM (still canonical in 2026 — corroborated by cssbackground.net/guide/patterns, 2026-02, and CSS-Tricks "One Gradient" 2024-10).
- **MDN — color-mix()** (updated 2026-04) + caniuse — Baseline 2023, Chrome 111+/FF 113+/Safari 16.2+. HIGH confidence.
- **solid-web.com color-mix tutorial (2026-05)** — oklch gamut-clipping gotcha; use `in srgb` for saturated neon. MEDIUM confidence (single source, but consistent with color-spec behavior).
- **web-platform-dx web-features-explorer — backdrop-filter** — unprefixed Safari 18 (2024-09), Interop 2025, widely-available expected 2027-03. HIGH confidence.
- **web.dev "Now in Baseline: animating entry effects" (2024-08)** + **OpenReplay "How to Animate display: none" (2026-08)** — `@starting-style`/`allow-discrete` Baseline status AND the Firefox-129-no-display-transition caveat (2026 confirmation). HIGH confidence.
- **Josh Comeau "The Big Gotcha With @starting-style" (2025-09)** — specificity silent-failure; keyframes simpler/universal for entry effects. HIGH confidence.
- **caniuse mdn-css_at-rules_starting-style** — Chrome 117+, FF 129+, Safari 17.5+. HIGH confidence.
- **Project precedent (verified in-repo)** — `ForensicChannelEditor.css:346–380`, `GlitchMaker.css:65–115`, `SignalReconstructor.css:67–90` use the dual-prefix slider pattern; `src/styles/components/_scrollbar.scss` uses `scrollbar-color`; `UVEditor.css` global `prefers-reduced-motion` + `body.performance-mode` blocks already exist and auto-handle accessibility/perf.

---
*Stack research for: UVEditor v1.2 "Mini-Photoshop" UI/UX refactor*
*Researched: 2026-08-14*
