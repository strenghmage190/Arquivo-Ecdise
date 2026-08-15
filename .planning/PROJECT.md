# UVEditor UI/UX Refactor & Layers Modernization

## What This Is

A comprehensive UI/UX overhaul, functional reorganization, and modular refactoring of the `UVEditor` (`src/components/tools/UVEditor.tsx`), `LayersPanel` (`src/components/LayersPanel.tsx`), `LayerItem` (`src/components/LayerItem.tsx`), and associated stylesheets. The project replaces all emojis with crisp Lucide React icons, fixes missing/broken mouse cursor feedback in the canvas and code/cipher zones, streamlines layer management (image placement, deletion, batch operations, drag-and-drop), and breaks down the 3,100+ line monolithic component into modular subcomponents and custom hooks.

## Core Value

A responsive, high-performance forensic image editor with professional Cyberpunk/Nexus aesthetics, seamless layer manipulations, clear cursor feedback, and maintainable modular architecture.

## Context

- `UVEditor.tsx` currently spans 3,164 lines and mixes canvas logic, history stacks, layer transformations, and UI rendering.
- Emojis (`🖱️`, `✏️`, `🩹`, `🖼️`, `🅰️`, `🔴`, `🟢`, `🔵`, `👁️`, `🚫`, `📁`, etc.) are scattered across toolbars and layer lists instead of standardized SVG icons.
- Mouse cursor feedback is lost or inconsistent across canvas drawing, text placement, and code cipher modes.
- Layer operations (image insertion, deleting layers, drag-and-drop reordering, masks, and groups) suffer from cluttered UI controls and poor visual hierarchy.

## Constraints

- **Visual Identity:** Must preserve and elevate the Nexus Cyberpunk theme (neon cyan/magenta accents, dark translucent surfaces, sleek borders).
- **Core Functionality:** Multi-spectrum modes (`uv`, `rgb`, `filter`), mask editing, layer blending, and export metadata must remain fully functional.
- **Dependencies:** Use existing libraries (`lucide-react`, vanilla CSS / CSS modules, `react-beautiful-dnd`) without introducing unnecessary external bloat.

## Requirements

### Validated

- ✓ Multi-mode canvas editing (`uv`, `rgb`, `filter`) — existing
- ✓ RGB channel targeting (`R`, `G`, `B`) and forensic layer export — existing
- ✓ Mask generation and inverted alpha rendering — existing
- ✓ Web Worker forensic benchmarking and FFT processing — existing
- ✓ Drag-and-drop layer reordering using `react-beautiful-dnd` — existing

### Active

- [ ] **Iconography & Styling Modernization:** Replace all emojis across `UVEditor`, `LayersPanel`, and `LayerItem` with Lucide React icons styled with Nexus Cyberpunk tokens.
- [ ] **Layer Operations & UI Reorganization:** Redesign `LayersPanel` with clear action toolbars, intuitive image/text/drawing layer creation, quick layer deletion, multi-select batch actions, and thumbnail previews.
- [ ] **Canvas Cursor & Mouse Tracking:** Fix mouse cursor rendering and crosshair/brush/selection indicators across canvas interaction zones and code/text overlays.
- [ ] **Monolith Decomposition:** Break down `UVEditor.tsx` into focused subcomponents (Toolbar, Viewport, ColorPalette, MaskControls, PropertiesPanel) and custom hooks (`useUVCanvas`, `useLayerHistory`).

### Out of Scope

- Rewriting the underlying canvas rendering engine to WebGL (existing 2D Canvas + Web Worker pipeline remains).
- Modifying backend Supabase storage schemas or database tables.
- Changes to unrelated audio or board modules.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Adopt `lucide-react` for all toolbar and layer icons | Replaces amateur emojis with consistent, high-contrast, scalable SVG icons matching the app design system | Pending |
| 4-Phase execution roadmap | Balances visual improvements, layer UX, canvas interaction fixes, and architectural cleanup without disrupting working features | Pending |
| Extract dedicated hooks for canvas & layers | Decouples complex pointer math, mask rasterization, and undo/redo stacks from React rendering | Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-15 after initialization*
