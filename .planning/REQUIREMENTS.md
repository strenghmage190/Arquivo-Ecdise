# Requirements: UVEditor UI/UX Refactor & Layers Modernization

## Overview

Complete refactoring of the `UVEditor` forensic workstation and `LayersPanel` subsystem to eliminate amateur emoji icons, fix cursor and mouse tracking across canvas/code layers, provide an intuitive and efficient layer management interface, and decompose monolithic source files into clean modular components.

## Functional Requirements

### 1. Iconography & Visual Modernization (ICON)
- **ICON-01:** Replace all emojis in `UVEditor.tsx` toolbar (`select`, `draw`, `erase`, `placeImage`, `placeText`) with Lucide React icons (`MousePointer`, `Pencil`, `Eraser`, `Image`, `Type`).
- **ICON-02:** Replace all emojis in header, channel selectors (`R`, `G`, `B`), and mode indicators with Lucide icons (`Sparkles`, `Radio`, `Layers`, `Eye`, `Palette`, `Check`).
- **ICON-03:** Replace all emojis in `LayerItem.tsx` (type indicators, visibility toggle, lock toggle, delete, duplicate, mask icons) with Lucide icons.
- **ICON-04:** Ensure all icons adhere to the Cyberpunk/Nexus neon accent design tokens defined in `src/styles/nexus.css`.

### 2. Layer Management & Image Ingestion (LAYR)
- **LAYR-01:** Redesign `LayersPanel` header and action bars with intuitive buttons for "Nova Camada de Desenho", "Adicionar Imagem", "Adicionar Texto", "Criar Grupo" and "Limpar Tudo / Excluir".
- **LAYR-02:** Provide seamless image ingestion allowing users to pick an image, see an inline scaled preview, position it on the canvas, and automatically register it as a named image layer.
- **LAYR-03:** Streamline individual layer deletion and multi-select batch deletion with clear confirmation and undo/history push.
- **LAYR-04:** Improve visual feedback for layer drag-and-drop reordering, active layer selection highlight, locked status, and mask editing state.

### 3. Canvas Mouse Tracking & Interaction (CURS)
- **CURS-01:** Ensure accurate and visible mouse cursor styling across all active tools (`crosshair` for draw, `cell`/custom ring for eraser/mask, `move` for dragging layers, `text` for inline text editor).
- **CURS-02:** Implement a visible brush-size indicator / cursor circle following the pointer during brush and eraser operations on the canvas.
- **CURS-03:** Fix cursor rendering and selection bounds when hovering over cipher/code text overlays and transform bounding boxes.

### 4. Modularization & Architecture (MODU)
- **MODU-01:** Extract `UVToolbar`, `UVViewport`, `UVColorPalette`, `UVPropertiesPanel`, and `UVMaskControls` into standalone subcomponents under `src/components/tools/uveditor/`.
- **MODU-02:** Extract stateful canvas drawing and history management logic into dedicated custom hooks (e.g., `useUVCanvasState`, `useUVHistory`).
- **MODU-03:** Eliminate raw inline styles from `UVEditor.tsx` and migrate all layout and visual properties to `UVEditor.css` / scoped CSS classes.

## Non-Functional Requirements

- **NFR-PERF:** Canvas redrawing and layer transformations must maintain 60fps without lag on canvas drag/resize operations.
- **NFR-A11Y:** Interactive buttons must have descriptive `aria-label` and `title` attributes for tooltips.
- **NFR-COMPAT:** Backward compatibility with existing saved canvas states, mask channels, and Supabase image export payloads.

## Acceptance Criteria

1. Zero emojis present in `UVEditor.tsx`, `LayersPanel.tsx`, and `LayerItem.tsx`.
2. All 5 tools (`select`, `draw`, `erase`, `placeImage`, `placeText`) activate reliably with appropriate cursor indicators.
3. Adding and deleting image/drawing/text layers functions cleanly without UI glitches or canvas state desynchronization.
4. `UVEditor.tsx` line count is reduced significantly through clean subcomponent extraction.
5. All automated type checks pass (`npm run typecheck`).

---
*Requirements verified: 2026-08-15*
