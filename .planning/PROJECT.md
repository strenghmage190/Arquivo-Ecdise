# UVEditor UI/UX Refactor & Layers Modernization

## What This Is

A comprehensive UI/UX overhaul, functional reorganization, and modular refactoring of the `UVEditor` (`src/components/tools/UVEditor.tsx`), `LayersPanel` (`src/components/LayersPanel.tsx`), `LayerItem` (`src/components/LayerItem.tsx`), and associated stylesheets. The project replaces all emojis with crisp Lucide React icons, fixes missing/broken mouse cursor feedback in the canvas and code/cipher zones, streamlines layer management (image placement, deletion, batch operations, drag-and-drop), and breaks down monolithic components into modular subcomponents and custom hooks.

## Core Value

A responsive, high-performance forensic image editor with professional Cyberpunk/Nexus aesthetics, seamless layer manipulations, clear cursor feedback, and maintainable modular architecture.

## Current State

**Milestone v1.0 Shipped (2026-08-15)**
- Full Lucide React iconography (zero emojis).
- Photoshop/GIMP-style layers mechanics with locked background and explicit rasterization.
- Fullscreen modal workspace and pixel-perfect cursor tracking.
- Modularized architecture under `src/components/tools/uveditor/`.

## Requirements

### Validated

- ✓ Iconography & Styling Modernization (Zero emojis, Lucide React icons, Nexus tokens) — v1.0
- ✓ Layer Operations & UI Reorganization (Photoshop/GIMP layout, batch actions, drag-and-drop) — v1.0
- ✓ Canvas Cursor & Mouse Tracking (Scaled .mask-cursor, container-relative math, letterbox correction) — v1.0
- ✓ Monolith Decomposition (`src/components/tools/uveditor/` modular architecture) — v1.0
- ✓ Locked background protection & explicit rasterization pipeline — v1.0
- ✓ Full-screen portal integration from `CreateClueModal` — v1.0

### Active

(Next milestone requirements to be planned with `/gsd-new-milestone`)

### Out of Scope

- Rewriting canvas 2D rendering pipeline to WebGL.
- Modifying backend Supabase schemas or storage configurations.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Adopt `lucide-react` for all toolbar and layer icons | Replaces amateur emojis with consistent, high-contrast, scalable SVG icons | ✓ Good |
| Photoshop/GIMP layer model | Prevents accidental drawing layer auto-generation and enforces explicit workflow | ✓ Good |
| Portal-based Fullscreen | Guarantees unconstrained workspace for large forensic images | ✓ Good |
| Container-relative cursor math | Fixes mouse offset caused by canvas letterboxing | ✓ Good |

---
*Last updated: 2026-08-15 after v1.0 milestone*
