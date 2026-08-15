# Feature Research

**Domain:** UVEditor "Mini-Photoshop" UI/UX refactor — tool states, insertion-mode feedback, transparency checkerboard, Nexus-styled controls (skeleton + CSS only)
**Researched:** 2026-08-14
**Confidence:** HIGH (codebase verified by direct read; pro-tool behavior verified via Adobe/Figma official docs and industry UX references)

## Executive Summary

The UVEditor already has 80% of the machinery the target features need — it is missing the *visual and structural polish*, not the logic. The `tool` state, `placeText`/`placeImage` placement flow, `handleCanvasClick`, tool dock classes (`.tool-button.active`), layers drag-and-drop, and even a subtle checkerboard `::before` all exist. What Photoshop/Figma/photopea do that UVEditor doesn't: (1) make the selected tool *unmistakable* (full-contrast fill + border, not a 18%-opacity glow), (2) give insertion mode a *persistent, dismissible* indicator at the point of action (pro tools use an options bar with Commit/Cancel + cursor change — they do NOT blink banners, so the blinking banner is a deliberate differentiator, not a table stake), (3) use a *two-tone* transparency checkerboard (pro dark editors use dark grays, not white), (4) give range thumbs hover/active glow states, and (5) give action buttons a snappy pressed state (100–150ms, scale/inset-shadow).

**Critical codebase findings:**
- The image tool dock button (line 2884) does **not** carry `tool === 'placeImage' ? 'active' : ''` — it opens the picker directly; `setTool('placeImage')` happens later in the file-load effect (line 1146). The dock will never show the image tool as active without a one-token skeleton change.
- `UVEditor.animations.css` (not `UVEditor.css`) holds the layers purple glow (`#b366ff`: `inputGlow`, `.layers-section h4::after`, `dropZoneHighlight`) and drag cursors. It also contains a brittle `[style*="borderWidth: 2px"]` selector hack — flag for cleanup but DO NOT recreate the glow.
- The canvas element currently has `background-color: rgb(10 10 10 / 60%)` (UVEditor.css line 401–403) which is nearly opaque and will **hide** any checkerboard placed behind it. The checkerboard must live on the canvas element (shows through transparent pixels) or the canvas background must be made transparent — a pure CSS change.
- Several `input[type="range"]` elements (placeImage scale line 3077, mask-edit size line 3141) lack the `.uv-range` class — skeleton-only additions needed.
- No `:active` styles exist anywhere for `.btn-save`, `.btn-close`, or the bare mask-control buttons ("Inverter"/"Limpar" are bare `<button>`s, line 3130–3131).
- The canvas cursor is an inline `style={{ cursor: tool === 'draw' ? 'crosshair' : ... }}` — moving it to CSS requires either a `data-tool={tool}` attribute on the root panel (pure JSX attribute, zero logic) or extending the existing `tool-draw`/`tool-erase` class-toggle effect (line 2849–2856). The `data-tool` route is the safer, logic-free option.
- Dynamic inline styles (mask cursor `left/top/width/height`, inline text edit `left/top/fontSize`) cannot be deleted — they must become **CSS custom properties** (`style={{ '--mask-x': ... }}` + class using `var(--mask-x)`), the standard pattern that keeps the `style` attribute but removes presentation rules.

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Selected tool is unmistakable at a glance | Every pro editor (PS/Figma/photopea/Aseprite) marks the active tool with full-contrast fill + border; a 18%-opacity border (current `.tool-button.active`) reads as "inactive" to most users — this is the #1 "horrível de mexer" contributor | LOW | Pure CSS on existing `.tool-button.active`; add `tool === 'placeImage' ? 'active' : ''` to the image dock button (one-token JSX change). Figma selected-state guidance: "stays on until turned off… bold visual hints, full color for selected vs muted for unselected" (Figma resource library). NNG: feedback must register in 100–150ms |
| Insertion mode has a persistent, dismissible indicator | Pro tools show mode in an options bar + cursor change (PS: Place Embedded → Free Transform + Commit ✓/Cancel ✗ in options bar; Escape cancels; Figma text: click canvas, type). User must never wonder "why isn't my click doing anything" | MEDIUM | New JSX conditional block (renders when `tool === 'placeText' \|\| tool === 'placeImage'`) + CSS. Must include: explicit cancel (red button + reuse existing `setTool('draw')` cancel handlers at lines 3067/3088), Escape support only if already present in logic (do NOT add new key handlers — logic freeze) |
| Canvas shows transparency distinctly from content | Photoshop popularized the two-tone checkerboard (v6.0, 2000); every raster editor since (photopea, Aseprite, Krita, Affinity) treats it as the universal transparency language | LOW | CSS only. **Must be dark-toned** (PS Preferences → Transparency → Grid Colors has Light/Medium/Dark presets; dark editors use e.g. `#1e1e1e`/`#2d2d2d` or `#161616`/`#232323`). Current `::before` (2% white) + canvas `rgb(10 10 10 / 60%)` background both need work — see Critical finding above. Use the canonical 4-layer gradient trick (Lea Verou; confirmed by StackOverflow "exact replica of Photoshop checkerboard") with `background-size` driven by a CSS var |
| Sliders are visibly draggable and respond to hover | Dark-mode design-system sliders (Material 3, VS Code, Figma properties) = translucent dark track, accent-filled, thumb that grows + glows on hover/active | LOW | CSS on `.uv-range` + new `.uv-range-slider` semantic class; add class to the 2 bare ranges (lines 3077, 3141). `appearance: none`, track `height: 4–6px` at `rgb(255 255 255 / 6%)`, thumb 14px, neon `box-shadow` on `:hover`/`:active`, `:focus-visible` ring (accessibility — already partially present) |
| Action buttons give press feedback (100–150ms) | NNG + UXPin + LogRocket all agree: pressed state = color darkening, inset shadow, or scale reduction; "brief and immediate… snappy… reverses cleanly". Users rage-click when clicks appear to do nothing | LOW | CSS `:active` on `.btn-save`, `.btn-close`, mask buttons: `transform: translateY(1px) scale(0.97)` + inset shadow + glow boost, `transition ~80–120ms`. Compositor-only properties (transform/box-shadow) — no layout thrash in the render loop |
| Layers panel styling survives the refactor untouched | Existing purple glow + DnD animations are shipped behavior (UV-07); regressing them is unacceptable to the user | LOW | Preservation task: `UVEditor.animations.css` purple tokens (`#b366ff`), `.layer-item.dragging/.drag-over/.drag-preview`, draggable cursors must keep working; unify under the semantic class system without deleting rules |

### Differentiators (Competitive Advantage)

Features that set the product apart. Not required, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Per-tool neon color-coded active state | Photoshop/Figma use ONE blue highlight for every tool. UVEditor can color-code by tool function (Pincel=cyan `--nexus-blue`, Borracha=red/pink, Seleção=blue, Texto=green, Imagem=purple `#b366ff` matching layers glow) — reinforces the Cyberpunk identity and speeds tool scanning | LOW | CSS only via `.uv-tools-dock .tool-button.active` variants; icon can inherit glow color via `currentColor`. Aligns with Core Value (Cyberpunk aesthetics preserved) |
| Giant blinking PT-BR insertion banner + big red cancel | Nothing in PS/Figma does this — it's a deliberate attention guarantee for the "confusing placement" complaint. Over-communication beats under-communication for this user base | MEDIUM | New JSX + CSS `@keyframes` blink. **Must respect `prefers-reduced-motion`** and WCAG 2.3.1 (max 3 flashes/second — use a slow 1.2–1.6s cycle, opacity 1 → 0.55, no hard on/off strobe). Positioned at top of `.uv-editor-viewport`, `z-index` above canvas, `pointer-events` only on the cancel button (never block canvas clicks) |
| Dark checkerboard tinted to Nexus palette | Generic editors use neutral gray grids; a subtle blue-tinted dark checkerboard (e.g. `#10161c`/`#1a232d` with a whisper of `--nexus-blue` at ~4–6% alpha) keeps empty space readable without fighting the theme | LOW | Two `--uv-checker-a/b` CSS vars on `:root`; pure gradients, zero image bytes, recolors instantly |
| "Power surge" button press (glow spike on `:active`) | Standard pressed = darken/shrink. Nexus twist: on press, glow jumps to 150% intensity then settles back on release — tactile, matches C.R.I.S. language, distinct from the hover glow | LOW | CSS `:active` box-shadow swap + `transition` on release only; cheap (compositor) |
| Layers purple-glow selection identity | The `#b366ff` glow + drag-pulse animation is already the panel's signature — as differentiator, keep it as the *only* purple in the UI so the layers panel has a unique visual identity vs cyan tool dock | LOW | Preservation + consistency rule: new insertion banner uses red/amber, tools use cyan family, layers keep purple — no color collisions |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Fast/strobing banner blink | "Make it impossible to miss" | WCAG 2.3.1 caps 3 flashes/sec; strobe triggers photosensitive seizures and is perceived as an error alert (users think the app crashed). Professional tools never strobe | Slow pulse (1.2–1.6s, 45% amplitude) + `prefers-reduced-motion: reduce` → static banner. Urgency comes from size + color, not frequency |
| White/light checkerboard | "That's what Photoshop defaults to" | In a dark UI a white grid is a blinding beacon and dominates the workspace; defeats dark-mode eye comfort (82% of users prefer dark, per Chrome survey cited in dark-mode guides) | Dark two-tone grid (PS's own "Dark" grid preset exists for this reason) with subtle Nexus tint |
| Auto-exit insertion mode after placing (auto-select) | The mobile-canvas UX thread suggests it prevents accidental double-inserts | **Strict constraint: NO logic changes.** Line 1779 explicitly keeps `placeImage` active for repeated placement. Changing this is behavior modification, out of scope | Keep multi-insert; the banner + cancel button make the mode explicit instead. Flag as future-milestone idea only |
| Adding keyboard shortcuts (V/B/E/T/I, Esc-to-cancel) | Every pro tool has them | Keyboard handling = logic changes (new key listeners) — violates the skeleton-only constraint | Defer to a future logic milestone; document in roadmap backlog |
| Full-screen modal for insertion mode | "Guarantee the user sees it" | A modal **blocks the canvas** — the very surface the user must click. Modal best-practice also says don't use modals for frequent/transient states | Non-blocking banner bar inside the viewport (below the header), canvas remains clickable |
| Rewriting the emoji tool icons as inline SVG | Emojis look unprofessional vs PS/SVG icons | Icon replacement is a big visual diff across 5 tools + layers panel; risky without logic changes; user didn't request it | Keep emojis this milestone; note SVG icon pass as future differentiator |
| Global glow escalation (every hover glows) | "Neon looks cool" | Glow-on-everything destroys hierarchy — nothing stands out, and `box-shadow` on many elements costs paint time near the canvas render loop | Reserve strong glow for: active tool, active slider thumb, pressed button, insertion banner |
| Reusing the v1.1 skipped "copy overhaul" ideas (tooltips, immersive copy) | They were scoped before and skipped | Out of scope per PROJECT.md; banner + PT-BR terminology already deliver the copy wins requested | Keep copy to the banner + existing PT-BR labels; tooltip pass stays deferred |

## Feature Dependencies

```
UV-01 Tools dock active state (neon + colored border)
    └──requires──> UV-04 Semantic class taxonomy (.uv-workspace, .uv-tools-dock blocks)
                        └──requires──> Class-based tool dock already present in JSX (✓ exists, lines 2880–2886)

UV-02 Insertion banner
    └──requires──> tool state condition (✓ exists: tool === 'placeText' | 'placeImage')
    └──requires──> UV-04 (banner gets semantic classes, not inline styles)
    └──enhances──> UV-01 (banner reinforces which tool is active)

UV-03 Dark checkerboard
    └──requires──> Canvas background-color made transparent (CSS, UVEditor.css line 401–403)
    └──conflicts──> (weakly) UV-07 — none; but the layers-panel bg must NOT adopt the checkerboard

UV-04 Inline-style removal
    └──requires──> Dynamic values → CSS custom properties pattern (mask cursor, inline text edit)
    └──requires──> Canvas cursor: data-tool attribute on root panel (JSX attribute) or extend class-toggle effect
    └──enhances──> EVERY other UV feature (they all land as classes)

UV-05 Range sliders (dark track, neon thumb)
    └──requires──> UV-04 class taxonomy (.uv-range-slider)
    └──requires──> Adding .uv-range-slider to 2 bare ranges (lines 3077, 3141) — skeleton-only

UV-06 :active transitions on action buttons
    └──requires──> UV-04 (btn classes exist: .btn-save, .btn-close; mask buttons need .uv-btn class added)
    └──independent of──> UV-01 (different pseudo-classes: :active vs .active)

UV-07 Layers panel styling integration (purple glow, DnD)
    └──requires──> UVEditor.animations.css preserved (already exists — do not touch glow rules)
    └──enhances──> UV-01 (purple = layers identity, cyan = tools identity — color separation)
```

### Dependency Notes

- **UV-04 is the foundation of everything.** Every other requirement is "land this feature as a semantic class," so the class taxonomy (`.uv-workspace`, `.uv-sidebar`, `.uv-property-group`, `.uv-range-slider`, plus existing `.uv-editor-panel` children) must be defined first. Without it, UV-01/03/05/06 have nowhere to attach.
- **UV-02 enhances UV-01:** the banner text names the active tool ("MODO DE INSERÇÃO"), reinforcing the dock highlight — but the banner is independently useful, so order doesn't matter; it only needs `tool` state (exists).
- **UV-03's conflict is internal, not cross-feature:** the checkerboard only works if the canvas element's own background stops being near-opaque. This is a one-rule CSS change that must be coordinated with the checkerboard rule — same edit, same phase.
- **UV-07 is a preservation dependency, not a build one:** nothing new is built; the risk is *breaking* existing rules during the UV-04 class migration. Do the migration in a way that keeps `UVEditor.animations.css` rules matching (class names on layer items must not change).
- **`data-tool` attribute (canvas cursor) is the only cross-cutting JSX addition** beyond the banner and the image-button active class — keep it to these three skeleton edits total.

## MVP Definition

### Launch With (v1 — this milestone, all 7 UV requirements)

- [ ] **UV-04 semantic class taxonomy + inline-style removal** — foundation; everything else lands on these classes. Static styles → classes; dynamic (mask cursor, inline text edit) → CSS custom properties; canvas cursor → `data-tool` attribute + CSS.
- [ ] **UV-01 tools dock active state (strong neon glow + colored border)** — direct answer to "which tool am I using"; one-token JSX fix (image button active class) + CSS.
- [ ] **UV-03 dark checkerboard** — transparency legibility; CSS only (checkerboard on canvas element + transparent canvas bg).
- [ ] **UV-05 Nexus range sliders** — dark translucent track + neon glowing thumb on `:hover`; CSS + 2 class-name additions.
- [ ] **UV-06 satisfying `:active` on Salvar/Fechar/Inverter Máscara** — press feedback; CSS only.
- [ ] **UV-07 layers purple glow + DnD animations preserved** — regression-proofing; verify `UVEditor.animations.css` intact after migration.
- [ ] **UV-02 giant blinking insertion banner + red cancel** — the headline UX fix for "placing texts/images is confusing"; JSX conditional + CSS blink (reduced-motion safe) + cancel wiring reusing existing handlers.

### Add After Validation (v1.x)

- [ ] Esc-key cancel for insertion banner — needs a key handler (logic change) — trigger: user confirms they want keyboard escape; do NOT add in this milestone.
- [ ] Keyboard shortcuts for tools (V/B/E/T) — logic milestone; trigger: user request after using the improved dock.

### Future Consideration (v2+)

- [ ] SVG icon set replacing emoji tool icons — visual polish; defer until UX copy overhaul is re-scoped.
- [ ] Auto-select after placement / single-vs-multi insert toggle — behavior change, explicitly deferred by milestone constraints; only if user revisits.
- [ ] Zoom-synced checkerboard square size (PS behavior: squares grow/shrink with zoom) — would need render-loop/zoom coupling; out of skeleton scope; note as a "nice-to-have someday" pitfall-adjacent item.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| UV-04 class taxonomy + inline-style removal | HIGH (maintainability; unblocks all) | MEDIUM (biggest diff; risk of visual regression) | P1 |
| UV-01 tool dock strong active state | HIGH ("horrível de mexer" root cause) | LOW | P1 |
| UV-02 insertion banner + red cancel | HIGH (confusing placement complaint) | MEDIUM | P1 |
| UV-03 dark checkerboard | MEDIUM-HIGH (empty-space confusion) | LOW | P1 |
| UV-05 Nexus range sliders | MEDIUM (looks unfinished now) | LOW | P1 |
| UV-06 button `:active` transitions | MEDIUM (tactile polish) | LOW | P1 |
| UV-07 layers styling preserved | HIGH (regression risk) | LOW (verification) | P1 |
| Esc-key cancel (banner) | MEDIUM | MEDIUM (logic — out of scope) | P3/defer |
| SVG icons | LOW-MEDIUM | HIGH | P3/defer |
| Auto-select after insert | MEDIUM | HIGH (logic — out of scope) | P3/defer |

**Priority key:**
- P1: Must have for launch (all 7 UV requirements are committed milestone scope)
- P2: Should have, add when possible (none this milestone — scope is locked)
- P3: Nice to have, future consideration (logic changes deferred by constraint)

## Competitor Feature Analysis

| Feature | Photoshop | Figma | Photopea | Our Approach (UVEditor) |
|---------|--------------|--------------|--------------|--------------|
| Active tool indicator | Blue-tinted highlight fill on toolbar icon; options bar updates | Filled blue-tinted background on tool icon; "stays on until turned off" | Same as PS — blue highlight fill | Strong neon glow + tool-colored border (`--nexus-blue` cyan family, purple reserved for layers); icon inherits glow via `currentColor` |
| Insertion/placement mode feedback | Options bar shows context: Free Transform box + Commit ✓ / Cancel ✗ (Enter commits, Esc cancels) | Text tool: cursor + immediate typing; tool stays selected | Mirrors PS options bar pattern | Giant blinking PT-BR banner "[ MODO DE INSERÇÃO ATIVO - CLIQUE NO CANVAS PARA POSICIONAR ]" + big red cancel button — over-communicates on purpose |
| Transparency background | Two-tone gray/white checkerboard; user-selectable Light/Medium/Dark grid colors; squares scale with zoom | Gray/white checkerboard in asset previews | Gray/white checkerboard (PS clone) | **Dark** two-tone checkerboard (Nexus-tinted, `#10161c`/`#1a232d` family) via 4-layer CSS gradients; no zoom coupling this milestone |
| Slider design language | Thin track, dark-on-light thumb, subtle | Thin 2–3px track, blue accent fill, small thumb | PS-style | Dark translucent track (`rgb(255 255 255 / 6%)`), 14px neon thumb, glow intensifies on `:hover`/`:active` — C.R.I.S identity |
| Button press feedback | Inset shadow + subtle darkening while pressed | Scale-down microinteraction on press | Inset shadow + darkening | `translateY(1px) scale(0.97)` + inset shadow + **glow spike** on `:active` (power-surge), 100–120ms |
| Layers panel identity | Gray rows, blue selection | Purple-tinted selection in dark mode | Blue selection | Already shipped: `#b366ff` purple glow + drag-pulse — preserved as-is (UV-07), the only purple in the UI |

## Sources

**Codebase (HIGH — read directly):**
- `src/components/tools/UVEditor.tsx` — tools dock (lines 2880–2886), image tool lacks `placeImage` active class; insertion flows (lines 3059–3091); inline styles inventory (header, palette, RGB channel buttons, text/image property groups, mask controls, canvas cursor, dynamic mask-cursor/textarea); `getToolInstructions` (2813); image-load → `setTool('placeImage')` (1146); multi-insert note (1779); tool class-toggle effect (2849–2856)
- `src/components/tools/UVEditor.css` — `.tool-button.active` (189–195, subtle), canvas `background-color: rgb(10 10 10 / 60%)` (401–403) hiding checkerboard, `.uv-range` (491–511, white thumb), no `:active` rules anywhere, layers drag/selection rules (1059–1073, 1143+)
- `src/components/tools/UVEditor.animations.css` — layers purple glow `#b366ff` (`inputGlow` 53–61, `.layers-section h4::after` 64–74, `dropZoneHighlight` 98–107), draggable cursors (15–21), brittle `[style*="borderWidth: 2px"]` hack (94–96)
- `src/components/LayersPanel.tsx` — inline styles on panel shell + context menu (dynamic x/y positioning must stay); `src/components/LayerItem.tsx`

**Pro-tool behavior (MEDIUM-HIGH — official docs / established references):**
- Adobe Help: "Place files in Photoshop" (helpx.adobe.com/photoshop/using/placing-files.html) — Enter/Return commits, Esc cancels placement — HIGH
- Adobe Help: "Change transparency preferences in Photoshop" (helpx.adobe.com/photoshop/desktop/create-manage-layers/get-started-layers/change-transparency-preferences.html) — Grid Colors Light/Medium/Dark presets — HIGH
- Figma Resource Library: "Understanding button states" (figma.com/resource-library/button-states) — selected state is a toggle that stays on — HIGH
- Figma Learn: "Access design tools from the toolbar" (help.figma.com/hc/en-us/articles/360041064174) — tool selection mechanics — HIGH
- UX StackExchange 153788: "Best UX pattern for exiting insert mode" (ux.stackexchange.com/questions/153788) — multi-insert vs auto-select tradeoffs, visual cue necessity — MEDIUM
- NN/g: "Button States: Communicate Interaction" (nngroup.com/articles/button-states-communicate-interaction) — pressed state must appear within 100–150ms — HIGH
- UXPin: "Button States Explained 2026" (uxpin.com/studio/blog/button-states) — active = darkening/inset shadow/scale reduction, snappy, reverses cleanly — MEDIUM
- LogRocket: "Designing button states" (blog.logrocket.com/ux-design/designing-button-states) — selected/toggle uses bold full-color vs muted — MEDIUM
- Lea Verou: "Checkerboard, striped & other background patterns with CSS3 gradients" (lea.verou.me/blog/2010/12/checkered-stripes-other-background-patterns-with-css3-gradients) — canonical 4-gradient checkerboard — HIGH
- StackOverflow 27277641: "exact replica of what a checkered background looks in a graphic design editor (ALL CSS)" — verified 4-layer implementation — MEDIUM
- FixTools CSS pattern generator docs — checkerboard CSS technique + dark-mode recolor via custom properties — MEDIUM
- Photoshop checkerboard history (version 6.0, 2000) — essential-photoshop-elements.com — MEDIUM
- WCAG 2.3.1 (Three Flashes or Below Threshold) — blink/any animation must not exceed 3 flashes/second — HIGH (spec)

---
*Feature research for: UVEditor "Mini-Photoshop" UI/UX refactor (v1.2 milestone)*
*Researched: 2026-08-14*
