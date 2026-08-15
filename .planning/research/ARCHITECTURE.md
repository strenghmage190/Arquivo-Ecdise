# Architecture Research

**Domain:** UVEditor "Mini-Photoshop" UI/UX refactor — CSS/JSX skeleton restructuring of an existing 3163-line canvas editor
**Researched:** 2026-08-14
**Confidence:** HIGH (all claims verified against current source files, line-anchored)

## Standard Architecture

### System Overview

The UVEditor is a single monolithic component with three architectural layers. This refactor touches ONLY the presentation layer (Layer 3). Layers 1-2 are off-limits per the zero-risk rule.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                LAYER 1: CANVAS MATH (untouched)                          │
│  getCanvasCoordinates · bounds handling · pan/zoom (wheel, panRef)       │
│  handlePointerDown/Move/UpGeneric · handleCanvasClick/DoubleClick        │
├──────────────────────────────────────────────────────────────────────────┤
│                LAYER 2: RENDER + STATE (untouched)                       │
│  redrawAll + requestAnimationFrame (rafIdRef/redrawRafIdRef)             │
│  useState hooks: tool, selectedLayer, layers, brushSize,                 │
│  maskBrushSoftness/Opacity, textValue, textSize, imageScale,             │
│  targetChannel, expandedSections, inlineTextEdit, maskCursor             │
│  useRef hooks: canvasRef, canvasContainerRef, fileInputRef, rootRef,     │
│  panRef, scaleRef, prevToolRef, rafIdRef, ...                            │
│  useEffect: tool→class toggle (L2849-2856) · markPerfKeep (L2859-2866)   │
├──────────────────────────────────────────────────────────────────────────┤
│                LAYER 3: PRESENTATION (refactor scope)                    │
│  JSX skeleton (L2868-3163) = 42 inline styles + class names              │
│  UVEditor.css (1213 lines, class contract)                               │
│  UVEditor.animations.css (122 lines, purple-glow layers CSS — NOT        │
│  currently imported anywhere → dead code, UV-07 must integrate it)       │
│  NEW: uv-insertion-banner (reads tool, presentational only)              │
└──────────────────────────────────────────────────────────────────────────┘
```

DOM tree after refactor (new classes in **bold**, refs in `[brackets]`):

```
div.uv-editor-panel.uv-workspace [rootRef]        ← alias class added, NOT renamed
├── div.uv-editor-header
│   ├── div.uv-editor-title                        (was inline fontWeight:600)
│   └── div.uv-editor-actions                      (was inline marginLeft:auto)
│       ├── button.btn-save        → :active added (UV-06)
│       └── button.btn-close       → :active added (UV-06)
├── div.uv-tools-dock
│   └── button.tool-button(.active) ×5  ← image btn gains placeImage active state (UV-01)
├── input.uv-hidden [fileInputRef #1]              (dock picker, always mounted, L2889)
├── div.uv-editor-viewport
│   ├── **div.uv-insertion-banner**  (NEW, conditional: tool==='placeText'||'placeImage')
│   │   ├── span.uv-insertion-banner__text   "[ MODO DE INSERÇÃO ATIVO - ... ]"
│   │   └── button.uv-insertion-banner__cancel  "✕ CANCELAR" → setTool('draw')
│   └── div.viewport-canvas [canvasContainerRef]  (checkerboard shows through it)
│       ├── canvas.uv-canvas [canvasRef]          (inline style → class; touch-action kept)
│       ├── textarea.uv-inline-text-editor        (dynamic geometry stays inline, L2935)
│       └── div.mask-cursor                       (dynamic geometry stays inline, L2954)
├── div.uv-right-panel.uv-sidebar                 ← alias class added, NOT renamed
│   ├── div.uv-right-tabs > div.tab(.active) ×3
│   ├── div.properties-panel
│   │   ├── div.uv-property-group  (Paleta: swatch .uv-color-swatch + color input)
│   │   ├── div.uv-property-group.uv-channel-group (RGB target: .uv-channel-btn--r/g/b)
│   │   ├── div.uv-property-group  (Pincel: input.uv-range-slider)
│   │   ├── div.uv-property-group  (Máscara: 2× .uv-range-slider)
│   │   ├── div.uv-property-group  (Texto: .uv-text-input + .uv-actions-row)
│   │   ├── div.uv-property-group  (Imagem: .uv-file-input [fileInputRef #2] + .uv-image-preview)
│   │   └── div.uv-mask-edit-block (Editar Máscara: Inverter/Limpar → .uv-action-btn)
│   └── div.uv-sidebar-section.layers-section  (LayersPanel, EXISTING — untouched)
│       └── ... layer-item / layer-preview / drag states (purple glow via
│           UVEditor.animations.css once imported)
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| UVEditor.tsx | Canvas editor: drawing, masks, layers, text/image placement, pan/zoom, save | Monolithic; L1-2 logic in handlers, L3 JSX skeleton L2868-3163 |
| UVEditor.css | Full class contract for editor chrome (grid layout, tools dock, viewport, right panel, properties, layers overrides) | 1213 lines, anchored on `.uv-editor-panel`, `.uv-right-panel`, `.properties-panel`, `.uv-tools-dock`, `.uv-editor-viewport` — must keep matching |
| UVEditor.animations.css | Layers panel polish: purple glow (#b366ff), drag feedback, input glow, layer-count pulse | 122 lines; **currently imported NOWHERE** (grep across src/ = 0 hits) → UV-07 must add `import './UVEditor.animations.css'` |
| LayersPanel.tsx | Layers list, drag-and-drop (react-beautiful-dnd), context menu, batch actions | Separate component; root class `.uv-sidebar-section.layers-section` is queried at document level (LayersPanel L72) — class + position must survive |
| LayerItem / LayerPreview | Row internals (`.layer-item`, `.layer-preview`, `.layer-item-type`, drag classes) | Consumed by LayersPanel only; untouched by this refactor |

## Recommended Project Structure

```
src/components/tools/
├── UVEditor.tsx                # L1-2 logic (untouched) + L3 JSX skeleton (refactored)
├── UVEditor.css                # MODIFIED: +new semantic classes, +banner, +slider, +active states, strengthened checkerboard + tool active glow
├── UVEditor.animations.css     # INTEGRATED: add `import './UVEditor.animations.css'` to UVEditor.tsx (currently dead code)
└── (no new files — component stays monolithic, per milestone scope)
```

### Structure Rationale

- **UVEditor.tsx:** Kept monolithic — the milestone is skeleton+CSS only; decomposing the component would violate the zero-risk rule. Only className strings and one conditional banner block change.
- **UVEditor.css:** All new classes appended to this file (existing selectors untouched). The file already owns the editor chrome contract; a second editor CSS file would create selector-order/specificity races.
- **UVEditor.animations.css:** Import (one line) rather than merging rules in — the rules are already correct and classed; merging risks duplication. Flag: it also contains a fragile legacy selector `.layer-item[style*="borderWidth: 2px"]` (L94) which is inert until LayerItem emits that inline style — harmless, leave as-is.
- **LayersPanel.tsx / LayerItem.tsx:** NOT refactored. UV-04's scope is "UVEditor.tsx contains no inline styles" — LayersPanel retains ~15 inline styles (context menu L174-201, root L210, row wrappers L345/399). Out of scope; flag for a future milestone, do not chase it in this one.

## Architectural Patterns

### Pattern 1: Alias Class Composition (backward-compatible semantic naming)

**What:** Add new semantic classes alongside existing structural classes instead of renaming: `className="uv-editor-panel uv-workspace"` and `className="uv-right-panel uv-sidebar"`.
**When to use:** When the existing class is load-bearing across a large CSS surface and external selectors.
**Trade-offs:** Slight class-list verbosity; zero selector churn. Renaming `.uv-editor-panel → .uv-workspace` would break ~40 selectors in UVEditor.css, the `tool-draw`/`tool-erase` effect (L2849), `markPerfKeep` scoping (L2859), and every `.uv-right-panel .layers-panel` / `.uv-right-panel .layers-list` override (L945-1213) that makes LayersPanel work.
**Example:**
```tsx
<div className="uv-editor-panel uv-workspace" ref={rootRef}>
...
<div className="uv-right-panel uv-sidebar">
```

### Pattern 2: Class Contract for State → Presentation Mapping

**What:** Every visual state derived from React state becomes a className expression, never an inline style. The existing precedent: `tool-button ${tool === 'select' ? 'active' : ''}`.
**When to use:** tool state (UV-01), targetChannel state (channel buttons, selected-channel hint), expandedSections (tabs — already classed).
**Trade-offs:** Class names get longer; but all visuals live in CSS where hover/:active/pseudo-elements work.
**Example (channel buttons, L2986-3036 — the 3 biggest inline style blocks):**
```tsx
<button
  type="button"
  onClick={() => handleTargetChannelChange('R')}
  className={`uv-channel-btn uv-channel-btn--red ${targetChannel === 'R' ? 'active' : ''}`}
>
  🔴 Red
</button>
```
```css
.uv-channel-btn--red { color:#ff8888; border:1px solid rgb(255 68 68 / 20%); background:rgb(255 68 68 / 10%); }
.uv-channel-btn--red.active { background:#ff4444; color:#fff; border:2px solid #ff4444; font-weight:600; box-shadow:0 0 12px rgb(255 68 68 / 40%); }
```

### Pattern 3: Data-Driven Geometry Stays Inline; Static Visuals Go to Classes

**What:** Dynamic pixel values computed from canvas coordinates or state (left/top/fontSize, brush cursor size, current color) cannot be static CSS. Extract only the constant visual properties; keep the variable ones inline (or as CSS custom properties).
**When to use:** inlineTextEdit textarea (L2935-2948), maskCursor div (L2954), color swatch (L2972).
**Trade-offs:** The milestone's "zero inline styles" is satisfied for styling; 3 documented exceptions remain that are *data, not style*. Forcing them into classes would require JS class-juggling (worse) or CSS vars set inline anyway.
**Example:**
```tsx
<textarea
  className="uv-inline-text-editor"
  style={{
    left: inlineTextEdit.cssX + 'px',
    top: inlineTextEdit.cssY + 'px',
    fontSize: inlineTextEdit.fontSize + 'px',
  }}
/>
```
```css
.uv-inline-text-editor { background:transparent; color:white; border:1px solid rgb(255 255 255 / 12%); padding:4px; min-width:80px; max-width:600px; resize:vertical; outline:none; }
```

### Pattern 4: Non-Intercepting Overlay (`pointer-events` sandwich)

**What:** An overlay above the canvas must never steal canvas pointer events (canvas math depends on the canvas receiving them). Container `pointer-events: none`, interactive child `pointer-events: auto`.
**When to use:** Insertion banner over `.uv-editor-viewport`. Critical because canvas rules force `pointer-events: auto !important` + `z-index: 1100 !important` (UVEditor.css L380-385) — the banner needs `z-index: 1200` and must sit above the canvas visually but pass clicks through everywhere except its cancel button.
**Trade-offs:** The banner strip over the top of the canvas won't receive hover; acceptable for a status banner.
**Example:**
```css
.uv-insertion-banner {
  position:absolute; top:16px; left:50%; transform:translateX(-50%);
  z-index:1200; display:flex; align-items:center; gap:12px;
  padding:10px 16px; border-radius:8px;
  background:rgb(0 0 0 / 85%); border:1px solid rgb(255 60 60 / 60%);
  box-shadow:0 0 24px rgb(255 60 60 / 45%);
  pointer-events:none;                    /* canvas clicks pass through */
  animation:uv-banner-blink 1.2s ease-in-out infinite;  /* opacity floor ~0.55, readable */
}
.uv-insertion-banner__cancel { pointer-events:auto; }   /* only the button intercepts */
```

## Data Flow

### Request Flow

```
[User clicks tool button]  →  setTool('placeText'|'placeImage')  →  re-render
     →  className expressions (tool-button.active, banner visibility)  →  CSS state change
     →  NO data/state changes beyond `tool` (presentational only)

[Image path — existing, untouched]  Dock picker → fileInputRef.click() → onChange → setImageFile
     → useEffect(L1136-1164) img.onload → setTool('placeImage')  →  banner appears
```

### State Management

```
tool (useState L66)  ──reads──▶  uv-insertion-banner render condition
tool (useState L66)  ──reads──▶  tool-button .active class derivation (×5 buttons)
targetChannel (useState L136) ──reads──▶ uv-channel-btn--r/g/b .active + .uv-channel-strong--*
setTool('draw')  ◀──writes──  banner cancel button
```

**No new hooks. No new state. No new effects.** The banner cancel button calls the existing `setTool('draw')` — same as the Cancelar buttons already in the properties blocks (L3067, L3088). Do not add cleanup logic (clearing imageFile/imageEl) to the banner — that stays in the properties-block Cancelar handlers; the banner is presentational per milestone.

### Key Data Flows

1. **Insertion mode flow (UV-02):** `tool === 'placeText'` (dock Text button, L2885) or `tool === 'placeImage'` (set only after image load, L1146 — both the dock picker L2894 and the properties picker L3075 converge on `setImageFile` → same effect) → banner renders. Banner is placed in `.uv-editor-viewport` (NOT uv-right-panel) because `@media (width <= 900px)` sets `.uv-right-panel { display: none }` (UVEditor.css L892-894) — a banner in the right panel would vanish mid-insertion on narrow screens. The viewport is where the user must click anyway.
2. **Checkerboard flow (UV-03):** `.uv-editor-viewport::before` (existing, L330-359) sits at `z-index: 0`; `.viewport-canvas` has `background: transparent` and `z-index: 1000`; the `<canvas>` keeps its own semi-transparent bg (L401-403 `rgb(10 10 10 / 60%)`) as the transparency indicator. Pattern shows through canvas transparent areas. The refactor **strengthens the existing `::before` pattern contrast** (dark two-tone cells, e.g. `rgb(255 255 255 / 5%)` / `rgb(255 255 255 / 1.5%)` on the `#0a0a0a` viewport bg) — it does NOT touch the canvas element's background. This is already the correct architecture; the milestone just needs the pattern to be more visible.
3. **Cursor flow (inline → CSS, pure equivalence):** Inline L2913 currently yields: draw → crosshair, erase → cell, select/placeText/placeImage → default. CSS `!important` overrides draw/erase to `none` (brush preview, L393-398). After removing the inline style, the base `cursor: crosshair` (L387) would wrongly apply to select/placeText/placeImage — add one pure-CSS rule, no JS:
   ```css
   .uv-editor-panel:not(.tool-draw):not(.tool-erase) .uv-editor-viewport canvas { cursor: default; }
   ```
   `touch-action: none` (inline L2913) is behavior-critical for pan/zoom pointer handling — relocate to `.uv-canvas { touch-action: none; display: block; }` (display:block already duplicated at L420-421).

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k lines / this milestone | Monolithic component is fine. Refactor = CSS class contract + TSX class swaps only. Do not decompose. |
| 1k-100k (component churn grows) | The real scaling problem is the 3163-line monolith. Deferred: extract `properties-panel` sections into subcomponents (ColorChannelGroup, BrushControls, TextInsertBlock, ImageInsertBlock) — future milestone, requires prop drilling design. |
| 100k+ / multi-developer | Split UVEditor.css by region (base, tools, viewport, right-panel, layers) with a defined class contract; add a naming convention doc. Out of scope now. |

### Scaling Priorities

1. **First bottleneck:** CSS specificity collisions as new classes pile onto the existing 1213-line sheet. Mitigate now: write new slider/banner/button rules at the END of UVEditor.css with at least `.uv-editor-panel .uv-range-slider` specificity — a bare `.uv-range-slider` (0,1,0) LOSES to the existing `.properties-panel input[type="range"]` (0,2,1). Either replace the legacy `.uv-range` block (L490-511) + `.properties-panel input[type="range"]` block (L771-789) with the new `.uv-range-slider` block (safe: every range inside `.properties-panel` gets the class; the only other range in the app, LayersPanel context menu L192, is outside `.properties-panel` and unaffected), or match specificity explicitly.
2. **Second bottleneck:** Inline-style regressions in future commits. Mitigate: UV-04's definition of done is `Select-String -Path UVEditor.tsx -Pattern 'style=\{\{'` returning only the 3 documented geometry exceptions (L2935, L2954, L2972's backgroundColor).

## Anti-Patterns

### Anti-Pattern 1: Renaming load-bearing structural classes

**What people do:** Rename `.uv-editor-panel` → `.uv-workspace` and `.uv-right-panel` → `.uv-sidebar` wholesale to get "semantic" names.
**Why it's wrong:** Breaks ~40 CSS selectors, the `tool-draw`/`tool-erase` class-toggle effect (L2849-2856), `markPerfKeep` scope, and the layers override block (L945-1213) that LayersPanel depends on. One missed selector = invisible layer rows or a broken grid.
**Do this instead:** Alias composition (Pattern 1). Add the semantic class as a second token; keep the original. New CSS may target the new name; old CSS keeps working untouched.

### Anti-Pattern 2: Static-izing dynamic geometry

**What people do:** Try to move the textarea's `left/top/fontSize` or the mask cursor's `width/height` into CSS classes to hit "zero inline styles".
**Why it's wrong:** These are per-placement canvas coordinates — they can only be expressed as inline values or CSS vars. Class-juggling them requires JS that doesn't exist, and CSS vars still need `style={{ '--x': ... }}` — the inline style just moves.
**Do this instead:** Pattern 3. Class everything static; keep 3 documented exceptions; note them in the code review checklist.

### Anti-Pattern 3: Banner/canvas z-index wars

**What people do:** Give the banner `z-index: 2000` and large hit area over the canvas.
**Why it's wrong:** The canvas rules force `pointer-events: auto !important; z-index: 1100 !important` (L380-385). A full-width banner with `pointer-events: auto` silently eats clicks near the top of the canvas → `getCanvasCoordinates` never fires there → "CLIQUE NO CANVAS PARA POSICIONAR" stops working at the top edge.
**Do this instead:** Pattern 4 — `pointer-events: none` on the banner shell, `auto` only on the cancel button, `z-index: 1200` (just above 1100).

### Anti-Pattern 4: Deleting legacy CSS blocks without auditing consumers

**What people do:** Delete the `.uv-range` / `.properties-panel input[type="range"]` blocks during the slider rework.
**Why it's wrong:** The LayersPanel context-menu opacity slider (LayersPanel L192) is an unclassed `input[type="range"]` — it's outside `.properties-panel` so safe today, but any future range added under `.properties-panel` without the class silently loses styling.
**Do this instead:** Replace those blocks with `.uv-range-slider` rules AND audit all `input[type="range"]` occurrences in the properties panel subtree (5 total: L3047, L3053, L3055, L3077, L3141 — all get the class).

### Anti-Pattern 5: Moving the shared `fileInputRef` inputs

**What people do:** "Clean up" the duplicate hidden file inputs (L2889 dock + L3075 properties) because both share `fileInputRef`.
**Why it's wrong:** React assigns the ref to the last-mounted element. L2889 always mounts; L3075 mounts when `tool === 'placeImage'` (after L2890 in DOM order) → in image mode the ref points at the properties input, in other modes at the dock input. The dock image button's `fileInputRef.current.click()` (L2884) behavior depends on this exact order. Refactoring them = breaking image insertion.
**Do this instead:** Keep both inputs exactly where they are. Only swap `style={{ display:'none' }}` (L2893) → `className="uv-hidden"` and the L3075 inline style → `.uv-file-input`. Preserve mount order: dock input BEFORE viewport, properties input inside the placeImage block.

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| None | — | No backend/network. The only "external" consumer is the parent via `onSave`/`onClose` props — untouched. |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| UVEditor ↔ UVEditor.css | Class contract | All 42 inline styles map to classes below. Existing structural classes MUST keep matching: `.uv-editor-panel`, `.uv-editor-header`, `.uv-tools-dock`, `.tool-button(.active)`, `.uv-editor-viewport`, `.viewport-canvas`, `.mask-cursor`, `.uv-right-panel`, `.uv-right-tabs .tab(.active)`, `.properties-panel`, `.uv-range` (replaced), `.uv-sidebar-section.layers-section` |
| UVEditor ↔ UVEditor.animations.css | Import | **Currently dead CSS (no import anywhere in src/).** UV-07 = add `import './UVEditor.animations.css';` next to L2. Delivers the purple glow (#b366ff: layer-count pulse L64-85, inputGlow L49-61, dropZoneHighlight L94-107) + drag affordances (L4-21) |
| UVEditor ↔ LayersPanel | Props (unchanged, L3094-3119) + DOM contract | LayersPanel L72 does `document.querySelector('.uv-sidebar-section.layers-section')` at document level → the root class and its parentage inside `.uv-right-panel` must survive. All 23 props pass-through unchanged |
| UVEditor ↔ DOM refs | Refs (MUST preserve) | `rootRef`→L2869 div · `canvasRef`→L2904 canvas · `canvasContainerRef`→L2902 `.viewport-canvas` · `fileInputRef`→L2890 AND L3075 (two inputs, order matters, see Anti-Pattern 5) |
| tool state → presentation | State-derived classes | `tool` L66 → `.active` on tool buttons (L2881-2885) + banner condition + cursor rule. `targetChannel` L136 → channel button `.active` + `.uv-channel-strong--*` |

### Full Inline-Style → Class Mapping (UV-04, the 42 blocks, line-anchored)

Legend: **NEW** = new class; **MOD** = modified existing class/rule; ✱ = documented exception (dynamic data stays inline)

| # | Line | Element | Inline style | New class | Type |
|---|------|---------|--------------|-----------|------|
| 1 | 2871 | header title | fontWeight:600 | `.uv-editor-title` | NEW |
| 2 | 2874 | header actions wrapper | marginLeft:auto, flex, gap:8 | `.uv-editor-actions` | NEW |
| 3 | 2893 | dock file input | display:none | `.uv-hidden` | NEW |
| 4 | 2913 | `<canvas>` | touchAction, cursor, display | `.uv-canvas` (+ `:not(.tool-draw):not(.tool-erase)` cursor rule; touch-action MUST survive) | NEW |
| 5 | 2935-48 | inline-text textarea | pos/left/top/fontSize (dynamic) + visuals | `.uv-inline-text-editor` + keep geometry inline ✱ | NEW+✱ |
| 6 | 2954 | mask cursor div | left/top/width/height (dynamic) | `.mask-cursor` (class already exists) + keep geometry inline ✱ | MOD+✱ |
| 7 | 2969 | palette block | marginBottom:12 | `.uv-property-group` | NEW |
| 8 | 2971 | palette row | flex, align, gap, marginTop:8 | `.uv-flex-row` | NEW |
| 9 | 2972 | color swatch | 28px, radius, bg:color (dynamic), border | `.uv-color-swatch` + keep `style={{backgroundColor: color}}` ✱ | NEW+✱ |
| 10 | 2980 | RGB channel group | marginTop/padding/bg/border/radius | `.uv-property-group.uv-channel-group` | NEW |
| 11 | 2981 | channel label | 14px/600/#00d7ff/block/mb8 | `.uv-group-title` | NEW |
| 12 | 2982 | channel hint | 12px/opacity.85/mb12/lh1.4 | `.uv-helper-text` | NEW |
| 13 | 2985 | channel row | flex, gap:8 | `.uv-flex-row` | NEW |
| 14 | 2989 | 🔴 Red btn | full state-driven block | `.uv-channel-btn.uv-channel-btn--red` + `.active` | NEW |
| 15 | 3006 | 🟢 Green btn | same | `.uv-channel-btn.uv-channel-btn--green` + `.active` | NEW |
| 16 | 3023 | 🔵 Blue btn | same | `.uv-channel-btn.uv-channel-btn--blue` + `.active` | NEW |
| 17 | 3038 | selected hint | 11px/op.7/mt8/italic | `.uv-helper-text--small` | NEW |
| 18 | 3039 | `<strong>` channel | color by state | `.uv-channel-strong--r\|--g\|--b` (class from `targetChannel.toLowerCase()`) | NEW |
| 19 | 3045 | brush group | marginTop:12 | `.uv-property-group` | NEW |
| 20 | 3051 | mask sliders group | marginTop:12 | `.uv-property-group` | NEW |
| 21 | 3054 | mask opacity label | marginTop:8 | drop — `.uv-property-group` label spacing rule | MOD |
| 22 | 3060 | text-insert group | marginTop:12 | `.uv-property-group` | NEW |
| 23 | 3062 | text input | width100/boxSizing/mt6 | `.uv-text-input` | NEW |
| 24 | 3063 | text size label | marginTop:8 | drop — group spacing | MOD |
| 25 | 3064 | number input | width:100% | `.uv-text-input--number` | NEW |
| 26 | 3065 | text actions row | flex/gap/mt8 | `.uv-actions-row` | NEW |
| 27 | 3073 | image-insert group | marginTop:12 | `.uv-property-group` | NEW |
| 28 | 3075 | image file input | display:block/mt6 | `.uv-file-input` — **KEEP ref + position** | NEW |
| 29 | 3076 | Escala label | marginTop:8 | drop — group spacing | MOD |
| 30 | 3079 | preview container | marginTop:8 | `.uv-image-preview` | NEW |
| 31 | 3080 | preview label | 12px/op.8 | `.uv-helper-text` | NEW |
| 32 | 3081 | preview img | maxWidth/mt6 | `.uv-image-preview img` | NEW |
| 33 | 3084 | loading text | mt8/13px/op.9 | `.uv-helper-text` | NEW |
| 34 | 3086 | image actions row | flex/gap/mt8 | `.uv-actions-row` | NEW |
| 35 | 3126 | mask-edit block | padding/borderTop/mt8 | `.uv-mask-edit-block` | NEW |
| 36 | 3127 | mask-edit header row | flex/gap/align/mb8 | `.uv-flex-row` | NEW |
| 37 | 3129 | mask-edit actions | marginLeft:auto/flex/gap | `.uv-flex-row--end` | NEW |
| 38 | 3134 | mask paint row | flex/gap/align | `.uv-flex-row` | NEW |
| 39 | 3135 | Modo pintura label | fontSize:13 | `.uv-inline-label` | NEW |
| 40 | 3140 | Tamanho label | 13px/ml12 | `.uv-inline-label--gap` | NEW |
| 41 | 3153 | mask eraser btn | marginLeft:8 | `.uv-action-btn--gap` (+ `.uv-action-btn` base) | NEW |
| 42 | 3154 | mask hint | marginLeft:auto/12px/op.85 | `.uv-helper-text--right` | NEW |

**Additional class swaps (UV-05, not part of the 42 — these are className changes, not inline styles):**
- L3047 `uv-range` → `uv-range-slider` (Pincel), L3053, L3055 (Máscara suavidade/opacidade), L3077 unclassed → `uv-range-slider` (Escala), L3141 unclassed → `uv-range-slider` (mask Tamanho)
- L2904 `<canvas>` gets `className="uv-canvas"`
- L2884 image tool button: `className={`tool-button`}` → add `${tool === 'placeImage' ? 'active' : ''}` (**this is the UV-01 bug** — the dock image button never shows active today because it doesn't set a tool; active must key off `tool`, which becomes `'placeImage'` after load, L1146)
- L3130 Inverter / L3131 Limpar: add `className="uv-action-btn"` (UV-06 target — Inverter Máscara)

**New DOM nodes (none moved, one added):**
- **ADDED:** `.uv-insertion-banner` block inside `.uv-editor-viewport`, as the first child BEFORE `.viewport-canvas` (L2902), rendered when `tool === 'placeText' || tool === 'placeImage'`. Cancel button → `setTool('draw')`. See Pattern 4 + Data Flow for placement rationale (right-panel placement fails at ≤900px where `.uv-right-panel { display:none }`).

**Explicit preserve list (refs/handlers the refactor MUST NOT break):**
1. `rootRef` (L2869) + the `tool-draw`/`tool-erase` class-toggle effect (L2849-2856) — do not touch the effect; the cursor `:not()` CSS rule removes any need to add a `tool-select` toggle.
2. `canvasRef` (L2904) — keep ref on the canvas; only its inline style moves to `.uv-canvas`.
3. `canvasContainerRef` (L2902) — keep ref on `.viewport-canvas`; keep it transparent so the checkerboard shows through.
4. `fileInputRef` — TWO inputs (L2890 dock, L3075 properties), mount order fixed (dock first). See Anti-Pattern 5.
5. `inlineTextEdit` textarea (L2915) — keep `autoFocus`, blur/Enter/Escape handlers, and dynamic geometry inline.
6. `maskCursor` div (L2951) — keep conditional render + dynamic geometry inline.
7. `LayersPanel` invocation (L3094-3119) — all 23 props byte-identical.
8. Hidden file inputs stay `display:none` (via `.uv-hidden` class) so programmatic `.click()` still works.
9. All `onClick`/`onChange`/`onWheel`/`onPointer*` handlers on canvas — untouched.

## Build Order (dependency-ordered)

1. **CSS foundation (UVEditor.css additions)** — all new classes: `.uv-property-group`, `.uv-range-slider` (+ replace legacy `.uv-range`/`.properties-panel input[type="range"]` blocks — see Scaling Priorities), `.uv-flex-row(-*)`, `.uv-actions-row`, `.uv-helper-text(-*)`, `.uv-group-title`, `.uv-channel-btn(-*/.active)`, `.uv-channel-strong--*`, `.uv-color-swatch`, `.uv-text-input(-*)`, `.uv-image-preview`, `.uv-inline-text-editor`, `.uv-mask-edit-block`, `.uv-inline-label(-*)`, `.uv-action-btn(-*)`, `.uv-editor-title`, `.uv-editor-actions`, `.uv-hidden`, `.uv-canvas`, strengthened `.uv-editor-viewport::before` checkerboard, strengthened `.tool-button.active` glow, `:active` states for `.btn-save/.btn-close/.uv-action-btn`, `:not(.tool-draw):not(.tool-erase)` cursor rule, `.uv-insertion-banner(*__cancel/__text)` + blink keyframes. Zero TSX changes → zero logic risk; visual diff is empty until step 2. *Rationale: everything depends on the class contract existing.*
2. **TSX class swaps (UV-04)** — mechanical 1:1 replacement of the 42 inline styles per the mapping table + the 5 slider class swaps + `className="uv-canvas"` + `.uv-hidden` on both file inputs + `.uv-action-btn` on Inverter/Limpar. No DOM moves, no ref changes, no handler changes. *Rationale: pure substitution; steps 3-5 build on the stabilized skeleton.*
3. **Tools dock active state (UV-01)** — one-line TSX fix on L2884 (`${tool === 'placeImage' ? 'active' : ''}`) + verify the strengthened `.tool-button.active` glow. *Rationale: needs step 1 CSS; trivial.*
4. **Insertion banner (UV-02)** — add the conditional block in `.uv-editor-viewport`; verify canvas clicks still land (pointer-events sandwich) and banner survives the ≤900px breakpoint. *Rationale: needs step 1 CSS + step 2 skeleton stability.*
5. **Layers integration (UV-07)** — add `import './UVEditor.animations.css'` (purple glow, drag animations come alive); visual-verify layers rows, `.dragging`/`.drag-over`/`.drag-preview` states (UVEditor.css L1059-1073), and the LayersPanel document-level selector. *Rationale: needs step 2 structure stabilized so selector drift is caught early.*
6. **Slider + button polish verification (UV-05/UV-06)** — specificity audit of `.uv-range-slider` (thumb glow on `:hover`, dark translucent track) and `:active` transitions on Salvar/Fechar/Inverter; manual test. *Rationale: last because it's refinement on top of steps 1-2.*
7. **Full regression pass** — canvas math, redrawAll/RAF, pan/zoom, touch-action on touch devices, both image-insertion paths (dock picker + properties picker), all 3 tabs, mask edit, save/close.

**Research flags for the planner:**
- **UV-07 flag (HIGH):** The purple glow is dead CSS (`UVEditor.animations.css` unimported — verified by grep across `src/`, 0 hits). The milestone's "integrate, not recreate" means: import the file. Do NOT rewrite the glow into UVEditor.css (duplication).
- **UV-04 flag (MEDIUM):** "No inline styles" cannot be literal for 3 data-driven exceptions (L2935 textarea geometry, L2954 cursor geometry, L2972 swatch backgroundColor). Plan the review checklist around the 42→3 rule.
- **Scope flag:** LayersPanel.tsx/LayerItem.tsx keep their own inline styles (UV-04 scope is UVEditor.tsx only). Do not creep.
- **Zero-risk guardrails:** no edits above L2868 except the two permitted presentation lines: `import './UVEditor.animations.css'` (near L2) and nothing else — the class-toggle effect (L2849), refs, handlers, hooks stay untouched.

## Sources

- Primary: `src/components/tools/UVEditor.tsx` — state/refs L60-136, JSX skeleton L2868-3163, image-load effect L1136-1164, tool toggle effect L2849-2856, save handler L2834-2847 (HIGH — read in full)
- Primary: `src/components/tools/UVEditor.css` — full 1213 lines read; class contract anchors L105-129 (panel/grid), L147-199 (tools dock + active), L314-403 (viewport/checkerboard/canvas), L490-511 (`.uv-range`), L519-597 (right panel/properties), L771-789 (range inputs), L938-1213 (layers overrides, incl. drag states) (HIGH)
- Primary: `src/components/tools/UVEditor.animations.css` — full 122 lines read; purple glow L64-107 (HIGH); import status verified by grep (LOW→HIGH after confirming zero matches in src/)
- Primary: `src/components/LayersPanel.tsx` — full read; document-level selector L72, root class L210, context-menu ranges L192, shared-prop surface L8-33 (HIGH)
- Primary: `src/components/LayerItem.tsx` — class usage (`layer-item`, `active`, drag) L55-152 (HIGH)
- `.planning/PROJECT.md` — milestone v1.2 targets UV-01…UV-07, constraints, decisions (HIGH)

---
*Architecture research for: UVEditor "Mini-Photoshop" UI/UX refactor (v1.2 milestone)*
*Researched: 2026-08-14*
