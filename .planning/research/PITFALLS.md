# Pitfalls Research

**Domain:** UVEditor "Mini-Photoshop" UI/UX refactor — inline-style → CSS class migration + new visual features (tools dock active state, blinking insertion banner, canvas checkerboard, Nexus sliders, `:active` button transitions, layers styling integration) on an existing canvas editor, WITHOUT touching canvas math, render loops, or state hooks.
**Researched:** 2026-08-14
**Confidence:** HIGH (codebase-verified) / MEDIUM (web-verified patterns)

## Critical Pitfalls

### Pitfall 1: Renaming / substituting the root or grid-container classes collapses the entire existing selector web

**What goes wrong:**
The milestone proposes "semantic CSS classes (.uv-workspace, .uv-sidebar, .uv-property-group, .uv-range-slider)". If "semantic" is interpreted as RENAMING the existing classes — `.uv-editor-panel` → `.uv-workspace`, `.uv-editor-viewport` → `.uv-sidebar` — the entire 1213-line `UVEditor.css` stops matching. The layout collapses to stacked blocks, the performance-mode guards die, and the editor becomes unusable.

**Why it happens:**
`UVEditor.css` is a dense web of exact-selector rules that all hang off the existing names:
- `grid-template: "uv-header uv-header uv-header" 48px "uv-tools uv-viewport uv-right" 1fr / 60px ...` (line 112) — children are placed by `grid-area` NAMES, so a reordered DOM or renamed child classes break the 3-column layout instantly.
- Child selectors use the `>` combinator: `.uv-editor-panel > .uv-editor-header`, `> .uv-tools-dock`, `> .uv-editor-viewport`, `> .uv-right-panel` (lines 132–536). The four grid children MUST stay direct children of `.uv-editor-panel` in the same order — wrapping them in a new container div breaks every one of these rules.
- Perf guards are rooted in it: `body.performance-mode .uv-editor-panel * { ... }` (lines 469–474), `body.performance-mode .uv-editor-panel .primary-glow-medium { ... }` (477–488).
- The root element `.uv-editor-panel` receives `ref={rootRef}` AND `markPerfKeep(root)` (UVEditor.tsx 2869, 2859–2866). Renaming the class does not move the `data-perf-keep="1"` attribute, so the perf-mode `all: initial` zone (performance.css 246–270) would apply to a root whose CSS no longer restores it.

**How to avoid:**
- ADD new classes as *additional* classes or as new *children*; never substitute existing ones. `.uv-editor-panel` stays on the root; `.uv-editor-viewport`, `.uv-tools-dock`, `.uv-right-panel` keep their exact names. New classes like `.uv-workspace` can be added alongside for future theming, but every existing selector must still match.
- Preserve the DOM skeleton shape exactly: `uv-editor-panel > (uv-editor-header | uv-tools-dock | uv-editor-viewport | uv-right-panel)` as the four direct children. New UI (insertion banner) must live INSIDE one of these containers (e.g., inside `.uv-editor-viewport` or `.uv-editor-header`), not as a new sibling that shifts the grid.
- Keep `ref={rootRef}`, `ref={canvasRef}` (canvas), `ref={canvasContainerRef}` (`.viewport-canvas`), and BOTH `ref={fileInputRef}` inputs (lines 2889 and 3075 — two elements share one ref; removing either breaks the dock's "Inserir Imagem" button or the placeImage panel).

**Warning signs:**
- After refactor, the editor renders as a vertical stack (grid areas gone) — check DevTools Computed on `.uv-editor-panel`: `display: grid` must survive.
- `grid-area` values no longer resolve; DevTools shows "invalid" or missing areas.
- Toggle performance mode and the editor loses its layout/colors entirely (see Pitfall 7).

**Phase to address:**
Phase that performs the skeleton refactor (UV-04). Success criterion: visual diff of the editor layout before/after the class rename — layout, grid areas, and panel backgrounds must be pixel-identical.

---

### Pitfall 2: Inline→class migration changes the cascade: specificity downgrades and silent state-style loss

**What goes wrong:**
Inline `style={{...}}` always wins over stylesheet rules. Moving them into plain classes silently changes the computed style wherever a higher-specificity existing rule competes. In this codebase, real examples where a (0,1,0) class will LOSE:
- `.uv-editor-header .btn-save` (0,2,0) sets `color: transparent; font-size: 0` — a new `.uv-header-title` class setting `font-size` will not win; the header text stays invisible.
- `.uv-right-panel .layers-panel .layers-list .layer-item` (0,4,0) and the `!important` selection block (lines 1143–1213) override anything a plain class sets on layer rows.
- `.uv-editor-panel button` base rule (line 35) sets `border: 1px solid transparent; background: transparent` — a new `.uv-btn--danger` class adding `background: #f44` with (0,1,0) specificity LOSES (1 class < 1 class+1 element... `.uv-editor-panel button` = (0,1,1); `.uv-btn--danger` = (0,1,0) → base rule wins). All new component classes need to be scoped under `.uv-editor-panel` (e.g., `.uv-editor-panel .uv-btn--danger` = (0,2,0)) to beat it.

Second failure mode — the 42 inline blocks include *state-driven* and *geometry* styles that cannot become static classes:
- Canvas: `style={{ touchAction: 'none', cursor: ..., display: 'block' }}` (line 2913) — `cursor` depends on `tool`. Must map to per-tool classes; `touch-action: none` is REQUIRED for pointer-move drawing on touch/pen and must be preserved as a CSS rule, not dropped.
- `maskCursor` (line 2954): `left/top/width/height` in px — per-pointer-move geometry. MUST stay inline (or via CSS variables set inline).
- `inlineTextEdit` textarea (2935–2948): `left/top/fontSize` dynamic; the rest (border, padding, background, min/max-width, resize, outline) can become a class.
- Color swatch (2972): `background: color` is state; keep the color inline (or a `--swatch-color` variable), move the static size/border to class.
- R/G/B channel buttons (2989–3033): the background/border/bold per selected channel is state → replace with a conditional `className={... 'active'}` pattern (exactly like `.tool-button ${tool === 'select' ? 'active' : ''}` already used at line 2881). This is the ONE JSX change pattern the refactor legitimately needs.
- Canvas `width/height` inline styles set by JS at runtime (UVEditor.tsx 652–653) are geometry — untouched.

**Why it happens:**
Inline styles mask specificity. During migration, it's easy to copy the *value* into a class and miss the *context* (which existing rules compete, whether the value is static styling or dynamic geometry).

**How to avoid:**
- For every inline block, classify: **static styling** → class; **dynamic geometry/state** → keep inline or conditional class. Draw the line explicitly in the phase plan (the `.mask-cursor` and textarea position stays inline is a hard boundary).
- Compute the exact specificity needed: DevTools → Computed on the live element → copy the winning values → write the class scoped to match or exceed that specificity (prefer `.uv-editor-panel .uv-*` scoping over `!important` — `!important` on new classes defeats the perf-mode kill rules, see Pitfall 7).
- After migrating each section, diff computed styles of every element in that section (screenshot before/after).
- The header title/buttons: keep the `.label` visually-hidden span pattern (lines 269–283) if text is shown; the pseudo-element icons (`::after` content "✔"/"✖") are the visible glyphs — don't replace them with text or the header breaks its compact size.

**Warning signs:**
- Text that was visible becomes invisible (`color: transparent` collision on header buttons).
- Elements lose hover/active/focus states after migration (they were relying on the inline `transition` that the base rule's `transition` now overrides).
- Slider/canvas/textarea interaction still works, but *looks* different — a specificity drift, not a logic change.

**Phase to address:**
Phase doing the skeleton refactor (UV-04), plus a dedicated visual-verification pass at the end of EVERY phase that touches JSX (the v1.0 CreateClueModal refactor set this precedent: success criteria included "hover glows, tab scroll, fade animations function correctly").

---

### Pitfall 3: Breaking the canvas interaction invariants (`touch-action`, cursor, pointer-events, z-index)

**What goes wrong:**
Drawing on touch/pen devices stops working, or overlays block canvas clicks — the classic "UI looks fine, canvas is dead" failure. The refactor is 100% CSS, so it's exactly the place where these invariants get lost.

**Why it happens:**
The canvas and its container carry several load-bearing CSS rules that any new checkerboard/banner/overlay must respect:
- `touch-action: none` currently inline on the `<canvas>` (line 2913) — without it, pointermove-drawing on touch does native scroll/zoom instead of drawing. Must be re-homed to a class.
- `.uv-editor-viewport .viewport-canvas, .uv-editor-viewport canvas, .viewport-canvas canvas { pointer-events: auto !important; z-index: 1100 !important }` (lines 380–385) — the canvas must stay above everything and always receive events.
- `.uv-editor-panel.tool-draw .uv-editor-viewport canvas { cursor: none !important }` / `.tool-erase` (393–398) — custom brush cursor behavior.
- `.viewport-canvas .mask-cursor` (406–416) — `pointer-events: none` overlay.
- Canvas `display: block; width/height: 100%` base (419–427) — but runtime inline `width/height` px wins; don't add CSS that fights it.

**How to avoid:**
- Extract `touch-action: none; display: block; cursor: crosshair|cell|default` into classes whose computed values exactly match the current inline ones, and verify with a touch-emulation pass (DevTools device mode → draw on canvas).
- Any new layer (checkerboard `::before`, insertion banner) must be `pointer-events: none` unless it's the interactive cancel button, and must sit at `z-index` BELOW 1100 (checkerboard) or ABOVE with pointer-events handling (banner button).
- Never "clean up" the `!important` pointer-events/z-index rules — they exist because past overlays stole canvas events.

**Warning signs:**
- After the refactor, pan/zoom/draw works with the mouse but not with touch (touch-action lost).
- The brush cursor no longer hides over the canvas (`.tool-draw`/`.tool-erase` class toggling on the root via `classList.toggle('tool-draw'|'tool-erase')` at lines 2850–2856 must keep working — don't rename these classes or add conflicting cursor rules).

**Phase to address:**
Any phase touching the viewport/canvas area (checkerboard phase, banner phase) AND the skeleton refactor phase.

---

### Pitfall 4: Checkerboard that doesn't show through the canvas — or that intercepts canvas pointer events

**What goes wrong:**
Two failure modes, both already present in this codebase:
1. **Invisible checkerboard.** A checkerboard ALREADY exists: `.uv-editor-viewport::before` (lines 330–359, `pointer-events: none`, `z-index: 0`, opacity 0.28). But the canvas element itself has a leftover DEBUG rule — `.uv-editor-viewport canvas { background-color: rgb(10 10 10 / 60%) }` (lines 400–403, literally commented "Debug: provide a subtle background so empty/transparent canvas is visible during development") — which paints 60% opaque dark over the pattern, hiding it exactly where it matters (the transparent areas of the image). The canvas IS cleared with `clearRect` on every redraw (UVEditor.tsx 658, 811), so transparent areas will show whatever is behind the canvas element — the checkerboard will appear the moment this background-color is removed/overridden.
2. **Dead canvas.** A new checkerboard layer added without `pointer-events: none`, or added at a z-index above the canvas, makes the whole canvas unclickable — pan/zoom/draw dies. The existing `.viewport-canvas` also has `background: transparent` (line 370) and the viewport `::before` covers the padding box (`inset: 0`), so the pattern is currently visible only around the canvas, not through it.

**Why it happens:**
Developers add a background pattern to the wrong element (above the canvas) or forget the canvas's own background wins over the layer behind it. The debug rule at lines 400–403 is the specific trap here — it looks harmless but is the reason UV-03 "doesn't work" today.

**How to avoid:**
- For UV-03: keep the pattern on `.uv-editor-viewport::before` (or move it onto `.viewport-canvas::before`) and change the canvas rule to `background-color: transparent` (or remove the debug rule). This is a pure CSS change — canvas math untouched.
- Ensure stacking: pattern `z-index: 0`, `.viewport-canvas` `z-index: 1000` (position: relative, line 361–377), canvas `z-index: 1100` — do NOT raise a new layer above the canvas without making it pointer-transparent.
- Always add `pointer-events: none` to any decorative layer (pattern, overlay, vignette).
- Verify: place the editor with an empty layer / transparent PNG region → checkerboard must be visible there; then draw with mouse AND touch to prove events still reach the canvas.

**Warning signs:**
- After "fixing" the checkerboard, the canvas no longer receives clicks (pattern above canvas).
- Checkerboard only visible in the viewport margins, not under transparent image areas (canvas background-color still opaque).

**Phase to address:**
Checkerboard phase (UV-03). Include a "does drawing still work" regression check in that phase's success criteria.

---

### Pitfall 5: Neon slider styling that only works in Chromium (Firefox keeps default thumb/track)

**What goes wrong:**
UV-05's "dark translucent track, neon glowing thumb on :hover" is applied only via `::-webkit-slider-thumb` → Firefox renders the OS-default thumb and/or unstyled track. This is NOT hypothetical — the codebase already has this bug in BOTH existing slider rules:
- `.uv-range { ... }` + `.uv-range::-webkit-slider-thumb` (UVEditor.css 491–511)
- `.properties-panel input[type="range"]` + `::-webkit-slider-thumb` (771–789)
Neither has `::-moz-range-thumb` / `::-moz-range-track`. The refactor must not copy this pattern into `.uv-range-slider`.

**Why it happens:**
`<input type="range">` renders via engine-specific pseudo-elements. `::-webkit-slider-thumb`/`::-webkit-slider-runnable-track` (Chromium/WebKit) and `::-moz-range-thumb`/`::-moz-range-track`/`::-moz-range-progress` (Firefox) are separate elements; `appearance: none` must be set on the input AND on the thumb; and — critical gotcha — you CANNOT comma-join vendor pseudo-elements: a selector like `input::-webkit-slider-thumb, input::-moz-range-thumb` is dropped entirely by Chrome when it hits the unknown `::-moz-range-thumb` part (verified by 2023 StackOverflow report; you must duplicate the rule blocks).

**How to avoid:**
- Write duplicated blocks: `::-webkit-slider-thumb` AND `::-moz-range-thumb` (with `appearance: none` on the input and both thumbs); `::-moz-range-track` for the Firefox track; `::-moz-range-progress` if the filled-left styling matters (the current `.uv-range` simulates fill with a gradient — replicate per-engine).
- Hover glow needs BOTH `input[type="range"]:hover::-webkit-slider-thumb` and `input[type="range"]:hover::-moz-range-thumb` (plus focus-visible variants — existing focus rule at line 85 only covers the input box).
- Transitions on range pseudo-elements are unreliable (Chromium supports them on `::-webkit-slider-thumb`; Firefox behavior is inconsistent — community-documented). Design the hover glow to look correct WITHOUT a transition in Firefox (instant state change acceptable), use `transition` as progressive enhancement only.
- Thumb size ≥ 20px (hit target); if styling the WebKit track via `::-webkit-slider-runnable-track`, remember the negative `margin-top` offset for thumb alignment; if styling the input's own background as the track (current approach), no margin needed — pick ONE convention.
- Test in both engines; the roadmap's verification phase must include a Firefox pass (this project's audit culture already treats "só funciona no Chrome" as a defect — same rule applies here).

**Warning signs:**
- Sliders look right in Chrome, default-looking in Firefox.
- A single comma-joined rule appears in the CSS containing both `-webkit-` and `-moz-` pseudo-elements.
- `:hover` glow works in one engine only.

**Phase to address:**
Slider phase (UV-05) + cross-browser verification in the final verification phase.

---

### Pitfall 6: Blinking banner that becomes invisible or unreadable under reduced-motion / performance-mode, blocks the very canvas clicks it instructs, or shifts layout

**What goes wrong:**
Four distinct failures for UV-02's "[ MODO DE INSERÇÃO ATIVO - CLIQUE NO CANVAS PARA POSICIONAR ]":
1. **Invisible under reduced-motion.** The existing reduced-motion guard (UVEditor.css 97–103) sets `animation-duration: 0.001ms !important; animation-iteration-count: 1 !important` on `.uv-editor-panel *`. A blink animation with keyframes that END at `opacity: 0` (a fade-out blink) leaves the banner invisible for reduced-motion users.
2. **Invisible/frozen under performance-mode.** `body.performance-mode *` sets `animation-play-state: paused !important; animation-duration: 0s !important` (performance.css 320–331) and the `:not(...)` mega rule (7–16) plus `body.performance-mode [data-perf-keep="1"] * { animation: initial !important }` (246–270) collectively leave the banner in its STATIC state (no animation runs). If the static state or the 0% keyframe is `opacity: 0`, the banner is invisible — in performance mode the user gets NO insertion guidance at all.
3. **Blocks canvas clicks.** The banner's entire purpose is "CLIQUE NO CANVAS" — if the banner overlays the canvas and intercepts the click (default `pointer-events: auto`), the placement flow is dead. The canvas sits at `z-index: 1100 !important`; a banner overlay must be z-index ABOVE it and `pointer-events: none` with the cancel button re-enabled via `pointer-events: auto`.
4. **Layout shift.** An in-flow banner (inserted as a grid row or flex child) appearing/disappearing shifts the canvas container and viewport scrollbars. Since the canvas has runtime inline `width/height` px (JS sets them at load), the canvas bitmap doesn't rescale, but the surrounding layout jumps. Also, inserting the banner as a new direct child of `.uv-editor-panel` breaks the `grid-template-areas` layout (see Pitfall 1).

**Why it happens:**
Blink animations are almost always written as opacity keyframes without considering what the element looks like when animation is disabled/paused — and in this app the animation is disabled by TWO independent systems (reduced-motion media query and performance-mode). Nobody designs the "animation off" frame.

**How to avoid:**
- Keyframes must start AND end at the visible state: `@keyframes uv-banner-blink { 0%, 100% { opacity: 1 } 50% { opacity: 0.35 } }` (or blink via a softer property like border-color/glow). The static element (no animation) must be a fully legible banner — the blink is an enhancement, not the readability mechanism.
- Blink rate ≤ 1 blink/sec (well under WCAG 2.2.2's "more than 3 per second" concern).
- Render the banner as an ABSOLUTE overlay inside `.uv-editor-viewport` (or `.uv-editor-header`), `position: absolute; z-index: 1200` (> 1100), `pointer-events: none` on the container, `pointer-events: auto` on the Cancel button. No layout shift, no grid break, canvas clicks pass through.
- The Cancel button IS the WCAG 2.2.2 "Pause/Stop/Hide" mechanism — it must stay visible, focusable, keyboard-accessible (tab), and NOT itself blink (don't animate the button's visibility, only the banner text frame).
- Prefer `role="status"` (or a static region) over `aria-live="assertive"` so the message announces ONCE on mount, not repeatedly; blinking via CSS opacity does not re-announce, which is what we want.
- Keep text contrast ≥ 4.5:1 on the dark banner (WCAG 1.4.3) — neon on dark is fine as long as the text color is bright enough.
- Add an explicit `@media (prefers-reduced-motion: reduce)` rule for the banner (static, fully visible) rather than relying only on the generic `.uv-editor-panel *` duration clamp — the generic clamp works (1 iteration at 0.001ms → final keyframe), but only if keyframe end-state is visible. Be explicit; don't rely on the accident.

**Warning signs:**
- Toggle `prefers-reduced-motion: reduce` in DevTools → banner disappears or stops blinking to invisible.
- Toggle performance-mode → banner invisible.
- In insertion mode, clicking the canvas center does nothing (banner intercepts).
- Banner appear/disappear causes the viewport to jump/scroll.

**Phase to address:**
Banner phase (UV-02) — success criteria must include: reduced-motion pass, performance-mode pass, canvas-click-through test, keyboard tab to Cancel.

---

### Pitfall 7: The performance-mode / data-perf-keep system being bypassed — and its `all: initial` zone nuking new class styling

**What goes wrong:**
Performance mode is a real user-toggleable mode (usePerformanceMode.tsx / performance_control.ts). The UVEditor root is unconditionally marked `data-perf-keep="1"` via `markPerfKeep(root)` (UVEditor.tsx 2859–2866 — a useEffect, i.e., OFF-LIMITS per the milestone constraints). In performance mode, `body.performance-mode [data-perf-keep="1"], body.performance-mode [data-perf-keep="1"] * { all: initial !important; ... }` (performance.css 246–270) resets EVERY property on the editor subtree and only re-restores layout props. Consequences:
- Colors/backgrounds/borders/fonts inside the editor revert to initial (black text, transparent panels, `border: none`) — the new semantic classes' backgrounds/borders are erased unless explicitly re-asserted.
- `display: revert` on `.uv-editor-panel` destroys the `display: grid` → the 3-column layout collapses (see Pitfall 1's perf-mode symptom).
- The good news (verified cascade): the `:not(...)` mega rule (0,8,1) and the local guard `body.performance-mode .uv-editor-panel * { transition: none !important; animation: none !important }` (UVEditor.css 469–474, (0,2,1), loaded after performance.css so it wins ties) DO kill transitions/animations inside the editor in performance mode — the banner blink and `:active` transitions get disabled automatically.
- The bad news: **new decorative effects are only killed if the kill rules can out-specify the data-perf-keep restoration.** `box-shadow` glows on new classes are already neutralized (perf-keep sets `box-shadow: initial !important`), so UV-01's strong tool glow will vanish in performance mode automatically — BUT if a developer writes the new glow with `!important`, it survives and bypasses performance mode.

**Why it happens:**
There are THREE performance-CSS sources in this app and only one is active: `src/styles/performance.css` (v2, imported in main.tsx line 8 — ACTIVE), `src/utils/performance.ts` (v3 `performanceCSS` string — defined but NEVER injected anywhere — dead), and the local guards in `UVEditor.css` (active). Developers "fix" a perf-mode issue in the wrong file (the dead v3), or add `!important` decorations that punch through the kill rules. The `data-perf-keep` "safe zone" mechanism is blunt (`all: initial`) and was designed for modal/inspect zones, not for a grid-based editor root — it demonstrably degrades the editor more than it preserves.

**How to avoid:**
- Add ALL new rules to `UVEditor.css` (or a file imported after performance.css). Never use `!important` in new classes (it defeats every perf-mode kill rule and the data-perf-keep restoration).
- Add explicit perf-mode restorations for the editor chrome that `all: initial` destroys, e.g. in UVEditor.css AFTER the perf-keep rules: `body.performance-mode .uv-editor-panel { display: grid !important; color: #e6eef6 !important; background: rgb(11 15 20 / 95%) !important; }` plus per-section background/border re-assertions (`body.performance-mode .uv-editor-panel .uv-editor-header { background: ... !important; border-bottom: 1px solid ... !important; }` etc.). Match-or-exceed (0,2,1) specificity and rely on later source order for ties.
- For the new features, explicitly verify in performance mode: tool active glow gone, banner static-but-visible, slider thumb plain (no glow), `:active` feedback reduced to the `opacity: 0.7` fallback (performance.css 110–113), and NO `!important` added anywhere.
- Do NOT touch `markPerfKeep`/the useEffect (off-limits) — compensate with CSS only.
- Flag to the roadmap: performance-mode walkthrough is a mandatory verification task in every phase, not just at the end.

**Warning signs:**
- A new CSS file imports its own `body.performance-mode` overrides with `!important` to "make the glow show" — wrong direction; perf mode should REMOVE effects.
- After enabling performance mode, editor text/panels turn black-on-transparent (the `all: initial` leak) — needs the explicit restoration block above.
- The banner blinks in performance mode (means a `!important` animation sneaked past the guards).

**Phase to address:**
All phases adding visual effects (UV-01, 02, 05, 06) — each has a "performance-mode behavior" acceptance item — plus a dedicated final verification phase.

---

### Pitfall 8: Drag-and-drop regressions in the Layers panel (react-beautiful-dnd) from touching shared classes

**What goes wrong:**
UV-07 ("integrate existing Layers panel styling: purple glow, drag-and-drop animations") is the highest-risk requirement because the layers list uses `react-beautiful-dnd` (LayersPanel.tsx line 5: `DragDropContext / Droppable / Draggable`), which animates by writing inline `transform` on the `.layer-item-wrapper` element. Two regression classes:
1. **rbd positioning breaks.** Any CSS `transform` (even `translateX(6px)` hover effects), `transition`, or `will-change` added to `.layer-item-wrapper` or ANY ancestor (`.layers-list`, `.layers-list-container`, `.uv-right-panel`, `.uv-sidebar-section`) corrupts rbd's drag math — the dragged row jumps to the wrong position or detaches from the cursor. rbd issue #128/#2230 document this for both transform-on-parent and `will-change: transform` on parents.
2. **The dead-file trap.** `UVEditor.animations.css` is NOT imported anywhere (verified — no import in src). It contains the purple-glow rules the milestone believes "already exist in UVEditor.css": `inputGlow`, `dropZoneHighlight`, `pulse` keyframes (with `#b366ff` purple), the `.layers-section h4::after` purple dot, `.layer-item[draggable="true"]` cursors, `.layer-controls button::after` tooltips, and — the dangerous one — `.layer-item, .layer-item * { transition: all 0.2s ease }`. If a developer "integrates" this file by importing it, the `transition: all` rule goes live on every layer-row descendant and makes rbd drops feel laggy/double-animated; and `.layer-item[style*="borderWidth: 2px"]` (an inline-style-matching selector) is exactly the fragile pattern this milestone is eradicating. Also note: the LIVE global `src/styles/animations.css` (main.tsx line 7) already defines `dragPulse`/`dropZoneHighlight`/`inputGlow` keyframes but NO rules apply them to layer items — so no purple glow is actually rendered today.

**Why it happens:**
The milestone context claims "Layers styling (purple glow, drag-and-drop animations) already exists in UVEditor.css — must be integrated, not recreated." That assumption is WRONG: the purple-glow rules exist only in the unloaded `UVEditor.animations.css`; the live `UVEditor.css` layers styling is cyan-based selection + `.dragging`/`.drag-over`/`.drag-preview` classes (lines 1059–1073) that NO code currently toggles (rbd uses inline styles instead; `draggedLayerId`/`isDraggingLayer` in UVEditor.tsx drive canvas-layer dragging, not list rows). "Integrate" therefore means CREATE new rules, and creating them naively (import the dead file) activates the `transition: all` landmine.

**How to avoid:**
- Never add `transform`/`transition`/`will-change` to `.layer-item-wrapper` or any ancestor of the Draggable (the `.uv-right-panel` already has `backdrop-filter: blur(3px) saturate(1.05)` — backdrop-filter makes ancestors containing blocks for fixed-position descendants; rbd sets `position: fixed` on the dragging item. This combination apparently works today, so do not add MORE filters/transforms to ancestors, and if you touch the existing backdrop-filter, re-test drag immediately — LOW confidence on exact browser behavior).
- Recreate the purple-glow effects as NEW rules in `UVEditor.css` targeting existing class names (`.layer-item`, `.layer-name-input`, `.layers-section h4::after`) with opacity/box-shadow animations, scoped and NON-`!important` (perf-mode safety). Do NOT import `UVEditor.animations.css`, and do NOT copy its `transition: all` rule (replace with `transition: transform var(--transition-fast)` if needed).
- Keep `.layers-list`/`.layer-item`/`.layer-preview` classes and their existing live rules byte-identical; the drag highlight should come from rbd's own snapshot (isDragging/drop animation) or from the existing `.drag-over` outline rules if wiring them to rbd's `draggingOver` state — but wiring is a LayersPanel.tsx change (out of scope; LayersPanel/LayerItem/LayerPreview are separate files the milestone must NOT edit — they still contain their own inline styles, which is fine and out of scope).
- Do not rename `.uv-sidebar-section.layers-section` (LayersPanel root class, used by context-menu logic at LayersPanel.tsx line 72: `document.querySelector('.uv-sidebar-section.layers-section')` — renaming breaks right-click menus).
- rbd is ARCHIVED (read-only, Aug 2025) — no fixes coming; the phase must treat it as frozen. Also note rbd 13.x peer-deps target React 16/17 and has StrictMode quirks — if it works today, leave it alone.

**Warning signs:**
- After adding "layer animations," reordering rows drags to the wrong slot or the row flies to the top of the screen.
- Drop animation is doubled/slow (a `transition: all` is now live on the row).
- Right-click context menu on layers stops working (class renamed).

**Phase to address:**
Layers integration phase (UV-07) — success criteria: drag-reorder still smooth, drop lands on the correct index, context menu still opens.

---

### Pitfall 9: `:active` transitions on action buttons that fight the existing base transitions or vanish in perf mode

**What goes wrong:**
UV-06 wants satisfying `:active` feedback on Salvar / Fechar / Inverter Máscara. Failures:
- The `.uv-editor-panel button` base rule (line 35–49) already declares `transition: box-shadow var(--transition-medium), transform var(--transition-fast), background var(--transition-fast)` — a new `.uv-action-btn { transition: all .2s }` or `:active { transform: scale(...) }` can be overridden by higher-specificity rules (e.g., `.uv-editor-header .btn-save` sets its own transition) or animate properties that were previously static (border) causing layout thrash.
- The header Salvar/Fechar buttons use `position: absolute` (lines 286–300) inside the header — an `:active` scale transform on an absolutely-positioned element is fine, but a translate/scale on the header row itself would offset them.
- In performance mode, `body.performance-mode button:active { opacity: 0.7 !important }` (performance.css 110–113) replaces the transition feedback — this is the DESIGNED perf-mode behavior; don't fight it with `!important` transforms.
- The mask-editing "Inverter"/"Limpar"/"Usar Borracha" buttons (UVEditor.tsx 3130–3153) are unstyled raw `<button>`s inside `.uv-right-panel` — they only get the base rule. Adding `:active` styling requires classing them (`.uv-mask-action` etc.) and adding them to the focus-visible selector list (lines 61–73) or they lose the keyboard outline the existing rules provide.

**How to avoid:**
- Reuse the existing transition tokens (`--transition-fast/medium`) and the base rule's pattern: `:active { transform: translateY(1px) scale(0.97); box-shadow: <stronger neon> }` with NO `!important`, defined scoped under `.uv-editor-panel`.
- Keep `:active` transforms to transform/box-shadow only (already GPU-cheap; `will-change: transform` exists on `.tool-button`).
- Add the new button classes to the focus-visible selector list (UVEditor.css 61–73) and the reduced-motion/perf-mode guard coverage is automatic (they're inside `.uv-editor-panel`).
- Verify perf mode: `:active` still gives SOME feedback (the opacity fallback) and no transition lag.

**Warning signs:**
- Button text jumps during click (transition on padding/border, not transform).
- Clicking Salvar/Fechar in perf mode feels dead (an `!important` transition or animation was added).

**Phase to address:**
Button phase (UV-06) or the skeleton phase that classes the header buttons.

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Import `UVEditor.animations.css` to "activate" the layers purple glow | Instant purple glow, zero new CSS | Activates `.layer-item, .layer-item * { transition: all 0.2s ease }` → janky rbd drags; `.layer-item[style*="borderWidth: 2px"]` selector is an inline-style dependency the milestone is eradicating | Never — recreate rules selectively in UVEditor.css |
| Grep `style={` count = 0 as the only UV-04 validation | Fast CI-ish check | Misses dynamic-geometry inline styles that MUST stay (maskCursor, textarea position, canvas px sizes); a "0 inline styles" fetish breaks the editor | Acceptable ONLY with an explicit allowlist of dynamic-geometry inline styles |
| New classes with `!important` to beat old high-specificity rules | Quick specificity wins | Defeats every performance-mode kill rule (Pitfall 7) and future overrides | Never for the new feature classes |
| Adding `transition: all` on new component classes "for smoothness" | Feels smooth | Repaint-heavy; fights rbd if near the layers list; perf-mode system kills it anyway | Never — enumerate properties |
| Copying `.uv-range` webkit-only slider CSS into `.uv-range-slider` | Fast, matches existing look | Propagates the Firefox-default-thumb bug (Pitfall 5) to the new feature | Never — write both engines' rules |
| Adding new `uv-*` classes that shadow existing names (`.uv-canvas`, `.uv-layer`, `.uv-visual`) | Feels semantic | performance.css 210–217 has dead selectors for exactly those names under `body.performance-mode` — introducing them activates restoration rules unexpectedly | Never — those three names are reserved |
| Keeping dead CSS (`.dragging`/`.drag-over` classes nobody toggles, `primary-glow-large` perf rule) | Zero risk of regression | Confuses future refactors; the milestone is about cleaning skeleton+CSS | Acceptable for this milestone (scope is JSX skeleton, not CSS cleanup) — note as follow-up |

## Integration Gotchas

Common mistakes when connecting new UI to the existing editor systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Performance-mode system (3 sources) | Adding perf-mode overrides to `src/utils/performance.ts` (the v3 string) — it's never injected, changes do nothing | Only `src/styles/performance.css` (active, imported main.tsx:8) and `UVEditor.css` guards matter; new guards go in `UVEditor.css` (loads after → wins ties) |
| `data-perf-keep` safe zone | Assuming it "preserves" the editor | It applies `all: initial !important` to the whole editor subtree in perf mode — it destroys colors/backgrounds/borders/grid; new classes must be explicitly re-asserted under `body.performance-mode` |
| Canvas pointer events | Adding any overlay/pattern without `pointer-events: none` | Every decorative layer: `pointer-events: none`; the canvas keeps `pointer-events: auto !important; z-index: 1100 !important` (UVEditor.css 380–385) |
| `touch-action` | Dropping the inline `touch-action: 'none'` during refactor | Re-home to a class; touch drawing breaks without it |
| react-beautiful-dnd layers list | Adding transform/transition/will-change to `.layer-item-wrapper` or ancestors | Never style the draggable wrapper or its ancestors with transforms; rbd is archived (Aug 2025) and breaks silently |
| LayersPanel right-click menu | Renaming `.uv-sidebar-section.layers-section` | Hard-coded in LayersPanel.tsx:72 (`document.querySelector(...)`) — renaming kills the context menu |
| Grid layout | Inserting the banner as a new direct child of `.uv-editor-panel` | Breaks `grid-template-areas` (Pitfall 1); banner must be an absolute overlay inside an existing grid cell |
| Two file inputs sharing `fileInputRef` (lines 2889, 3075) | "Deduplicating" them during refactor | Removing either breaks dock-image-insert or the placeImage panel; leave both |
| `.uv-editor-panel` root class + `markPerfKeep` useEffect | Renaming the root class | The `data-perf-keep="1"` attribute stays on the element; renamed root loses its CSS entirely (Pitfall 1) |

## Performance Traps

Patterns that work at small scale but fail as usage grows — for this editor, the scale is one canvas + a 60fps rAF render loop, so the traps are per-frame paint cost, not server scale.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Blink/glow implemented as animated `box-shadow` keyframes | CPU/fan spin-up while the banner blinks; janky rAF loop during insertion mode | Animate `opacity`/`border-color` only in keyframes; keep box-shadow static on the element | Immediately on low-end devices in insertion mode (banner is adjacent to the rAF canvas loop) |
| `:hover` glow transitions on sliders/buttons | Micro-stutter when moving across controls | Reuse `--transition-fast/medium` tokens, small repaint scopes; perf mode already clamps to 50ms | With many controls visible (right panel is dense) |
| New `will-change` hints on more elements | Memory growth; perf-mode `will-change: auto !important` makes them moot | Don't add new `will-change`; the existing block (UVEditor.css 1118–1123) is enough | Unbounded elements |
| Checkerboard `::before` with 2 layered gradients | (none — static, cheap) | Keep pattern static; don't animate it | N/A — but don't "improve" it with animated tiles |
| Banner rendered in-flow | Reflow + scroll jump on toggle | Absolute overlay (Pitfall 6) | Every toggle |

## Security Mistakes

Domain-specific issues for this refactor (mostly about preserving behavior and avoiding new injection surfaces).

| Mistake | Risk | Prevention |
|---------|------|------------|
| Moving the dynamic color swatch (line 2972) from inline `background: color` into a CSS file / building CSS strings from user color input | If any refactor step starts string-building CSS with user-controlled values (`style` prop computed from `color` state), it opens an injection-adjacent pattern | Keep user-state values inline (`style={{ background: color }}` or a CSS variable `--swatch-color` set inline); never interpolate user data into a `<style>` block or `url()` |
| Adding new `url()` data (checkerboard tiles, icons) with runtime-computed content | SVG/URL injection if content is user-derived | The checkerboard is static gradients (UVEditor.css 330–359 pattern) — keep it static, no `url()` needed |
| Touching the file inputs (`accept="image/*"`, both `fileInputRef`s) | Losing the accept restriction or breaking image load flow | Preserve attributes exactly; refactor only the `display: none` → class |
| Adding `dangerouslySetInnerHTML` to render the banner text | XSS if text ever becomes dynamic | Banner text is static PT-BR copy — render as plain text/JSX children |
| Weakening focus-visible styles on new interactive elements | Keyboard users lose the focus indicator; also a11y, not just security | Add new button classes to the focus-visible list (UVEditor.css 61–73) |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Banner covers the canvas it tells you to click | The insertion flow dead-ends; "horrível de mexer" complaint returns | `pointer-events: none` on banner frame, `auto` only on Cancel (Pitfall 6) |
| Blink rate > 3/sec or high-contrast flashing | Vestibular/epilepsy risk; distraction (WCAG 2.2.2) | ≤ 1 blink/sec, soft opacity dip (never full 0), keep the "off" frame ≥ 35% opacity |
| Active tool state communicated ONLY by color | Colorblind users can't tell Pincel/Borracha apart | UV-01's border + glow + (existing) transform lift; keep `aria-pressed`-style semantics via class + title |
| Slider thumb < 20px | Hard to grab on touch; frustrating fine adjustment | ≥ 20px thumb, generous padding; keep keyboard arrows working (don't remove native behavior) |
| Banner appears/disappears causing layout jump | Canvas position shifts mid-flow | Absolute overlay (Pitfall 6) |
| `:active` transitions delayed (>150ms) | Clicks feel unresponsive | Keep transitions ≤ 180ms (existing tokens) and `transition-delay: 0` |
| Cancel button not reachable by keyboard while blinking | Keyboard users trapped in insertion mode | Cancel is a real `<button>` with focus-visible styling; blinking must not affect focusability |
| Banner text all-caps + brackets with low-contrast neon | Hard to read | Keep contrast ≥ 4.5:1 (WCAG 1.4.3) on the dark banner |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **UV-04 (no inline styles):** `grep "style={{" UVEditor.tsx` returns 0 — EXCEPT the documented allowlist (canvas runtime px size, `maskCursor` geometry, `inlineTextEdit` geometry, color swatch value, any CSS-variable assignments). If the allowlist items were also removed, the refactor broke the editor.
- [ ] **UV-04 (specificity):** header title text still visible after refactor (`color: transparent` collision); header buttons still show the ✔/✖ pseudo-icons at the right size.
- [ ] **UV-04 (refs):** `rootRef`, `canvasRef`, `canvasContainerRef`, both `fileInputRef`s still attached; `classList.toggle('tool-draw'|'tool-erase')` still works (brush cursor hides).
- [ ] **UV-03 (checkerboard):** visible through TRANSPARENT AREAS of the canvas (remove the debug `background-color: rgb(10 10 10 / 60%)` on `.uv-editor-viewport canvas`, lines 400–403); drawing with mouse AND touch still works after.
- [ ] **UV-05 (sliders):** checked in FIREFOX, not just Chrome — thumb and track styled via `::-moz-range-thumb`/`::-moz-range-track`; `:hover` glow works in both engines.
- [ ] **UV-02 (banner):** with DevTools `prefers-reduced-motion: reduce` → banner visible and STATIC (not blinking, not invisible); with performance-mode → same; clicking the canvas through the banner places the item.
- [ ] **UV-01 (tools dock):** performance-mode ON → strong glow gone (no `!important` sneaked in); normal mode → glow clearly distinguishes the active tool.
- [ ] **UV-07 (layers):** drag-reorder still lands on the correct index after new purple-glow CSS; right-click context menu still opens; `.uv-sidebar-section.layers-section` unchanged.
- [ ] **Perf mode overall:** editor grid layout + colors survive performance mode (the `all: initial` leak is compensated with explicit `body.performance-mode` restorations — don't ship black-on-transparent editor).
- [ ] **UV-06 (buttons):** Salvar/Fechar/Inverter Máscara `:active` feedback works in normal mode and still gives opacity feedback in performance mode.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Root/container class renamed, layout collapsed | MEDIUM | `git revert` the class-rename commit (keep it to ONE commit per refactor section); re-add classes additively |
| Specificity drift (text invisible, styles lost) | LOW | Per-section visual diff; fix by scoping new classes under `.uv-editor-panel` (specificity (0,2,0)+) rather than adding `!important` |
| Canvas dead (touch-action/pointer-events lost) | LOW | Re-add `touch-action: none` class; verify the 1100 `!important` pointer-events rules untouched |
| Checkerboard invisible | LOW | Remove/override the debug canvas `background-color` (UVEditor.css 400–403) |
| Banner invisible in reduced-motion/perf-mode | LOW | Fix keyframes to start/end at opacity 1; banner static state fully legible |
| Banner blocks canvas clicks | LOW | `pointer-events: none` on frame, `auto` on Cancel button |
| Slider broken in Firefox | LOW | Add duplicated `::-moz-*` rule blocks (never comma-joined with `-webkit-*`) |
| rbd drag broken | HIGH | Revert ALL CSS touching `.layer-item-wrapper`/`.layers-list`/ancestors to the pre-refactor state; rbd is archived — there is no upstream fix; treat any rbd breakage as P0 and revert immediately |
| Perf-mode black-on-transparent editor | MEDIUM | Add `body.performance-mode .uv-editor-panel` restoration block (display: grid, colors, backgrounds) in UVEditor.css |
| Dead-file import activated `transition: all` on layers | LOW | Remove the import; recreate only the specific glow rules without the transition-all rule |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| P1: class renames / grid structure | Skeleton refactor phase (UV-04) — additive classes only | Computed `display: grid` on `.uv-editor-panel`; layout screenshot diff |
| P2: specificity drift + state styles | Skeleton refactor phase (UV-04) — per-section diff | DevTools Computed compare per section; dynamic-geometry allowlist documented |
| P3: canvas interaction invariants | Skeleton refactor phase + checkerboard phase (UV-03) | Touch-emulation draw test; brush cursor test |
| P4: checkerboard hidden / dead canvas | Checkerboard phase (UV-03) | Transparent-area visibility + draw-with-mouse-and-touch test |
| P5: webkit-only sliders | Slider phase (UV-05) | Firefox manual pass (thumb/track/hover) |
| P6: banner invisible/blocks/layout shift | Banner phase (UV-02) | reduced-motion pass, perf-mode pass, canvas-click-through, keyboard tab |
| P7: perf-mode bypass / all:initial leak | All feature phases + final verification phase | Perf-mode walkthrough each phase; explicit restoration block present |
| P8: rbd drag regressions | Layers integration phase (UV-07) | Drag-reorder index test; context-menu test |
| P9: `:active` button transitions | Button phase (UV-06) / skeleton phase | Click feedback test normal + perf-mode |
| Dead-file integration (animations.css) | Layers integration phase (UV-07) | `grep` for the imported file — must not be imported; no `transition: all` on `.layer-item` |

## Sources

- **Codebase (primary, HIGH):** `src/components/tools/UVEditor.tsx` (JSX skeleton 2868–3163, refs/effects 1–100, 2850–2866), `src/components/tools/UVEditor.css` (1213 lines), `src/components/tools/UVEditor.animations.css` (122 lines, NOT imported — verified via full-src import grep), `src/components/LayersPanel.tsx` (react-beautiful-dnd usage + `.uv-sidebar-section.layers-section` querySelector at line 72), `src/components/LayerItem.tsx`, `src/styles/performance.css` (active v2), `src/utils/performance.ts` (v3 string, never injected — verified), `src/utils/perf_helpers.ts`, `src/utils/usePerformanceMode.tsx`, `src/main.tsx` (import order: index → nexus → animations → performance.css → mobile-cleanup → UVEditor.css).
- **Range slider cross-browser (MEDIUM):** css-tricks.com/styling-cross-browser-compatible-range-inputs-css (appearance:none on input+thumb, `-moz-*` pseudo-elements, no comma-joining); stackoverflow.com/questions/75759434/input-range-thumb-not-changing-in-chrome (Chrome drops comma-joined `-moz-range-thumb` selectors — 2023 report); github.com/rishima17/LecturePulse/issues/154 (2026: unstyled thumb on Firefox from webkit-only CSS); runebook.dev/en/docs/css/::-webkit-slider-thumb (box-shadow/border quirks on pseudo-elements).
- **react-beautiful-dnd (HIGH):** github.com/atlassian/react-beautiful-dnd (archived Aug 18, 2025, read-only); issues #128 and #2230 (transform/will-change on parents breaks drag positioning); pkgpulse.com/guides/dnd-kit-vs-react-beautiful-dnd-vs-pragmatic-drag-drop-2026 and empire-ui.com/blog/react-drag-drop (deprecation status, React 18 findDOMNode warnings).
- **WCAG blinking/motion (HIGH):** w3.org/WAI/WCAG21/Understanding/pause-stop-hide (SC 2.2.2 — moving/blinking/auto-updating > 5s needs pause/stop/hide); github.com/w3c/wcag/issues/4319 (prefers-reduced-motion as a valid mechanism, on-screen control preferred); access-proof.com/wcag/2-2-2-pause-stop-hide and aaardvarkaccessibility.com/wcag-plain-english/2-2-2-pause-stop-hide (patterns that fail 2.2.2; testing approach); css-tricks.com/accessible-web-animation-the-wcag-on-animation-explained (blink limits, flashing > 3/sec risk).
- **Checkerboard/pointer-events (MEDIUM):** mimo.org/glossary/css/pointer-events (pointer-events: none pass-through, child re-enable); css gradient checkerboard pattern — stackoverflow.com/questions/35361986 (standard 45deg two-layer gradient pattern, already in use at UVEditor.css 330–359); uxdesign.cc/where-does-the-checkerboard-transparency-grid-come-from (why editors use it).
- **Previous-milestone precedent (HIGH):** v1.0 CreateClueModal refactor (`.planning/milestones/v1.0-ROADMAP.md` — success criteria included preserving hover glows, tabs, animations) — same acceptance discipline applies to UVEditor phases.

---
*Pitfalls research for: UVEditor v1.2 "Mini-Photoshop" UI/UX refactor*
*Researched: 2026-08-14*
