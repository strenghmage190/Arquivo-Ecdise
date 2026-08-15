# Roadmap: UVEditor UI/UX Refactor & Layers Modernization

## Milestone Overview

Modernize, reorganize, and refactor the `UVEditor` and `LayersPanel` forensic editing tools across 4 focused phases.

---

## Phases

### Phase 1: Design System & Iconography Modernization
- **Goal:** Replace all emojis across `UVEditor`, `LayersPanel`, and `LayerItem` with Lucide React icons and apply consistent Nexus Cyberpunk CSS styles.
- **Scope:**
  - Audit and replace all emoji symbols in toolbar, header, channel selectors, and layer list.
  - Standardize button sizes, active states, hover glows, and tooltips.
  - Refactor channel selection badges (`R`, `G`, `B`) to use sleek cyber badges.
- **Deliverables:**
  - Updated `UVEditor.tsx`, `LayersPanel.tsx`, `LayerItem.tsx`, `LayerIcons.tsx`
  - Polished `UVEditor.css` with zero inline emoji dependencies
- **Success Criteria:** Zero emojis remaining; all buttons use crisp Lucide icons with proper hover states.

---

### Phase 2: LayersPanel & Layer Operations Refactor
- **Goal:** Overhaul the layer management subsystem for intuitive creation, image placement, deletion, grouping, and batch operations.
- **Scope:**
  - Create prominent, clear action buttons for "Adicionar Imagem", "Nova Camada de Desenho", "Adicionar Texto", "Criar Grupo", "Limpar / Apagar".
  - Streamline image file selection with immediate canvas placement and layer registration.
  - Add single-click delete per layer and multi-select batch deletion with instant canvas update and history logging.
  - Polish layer item drag-and-drop visuals, thumbnail rendering, visibility toggle, lock toggle, and group collapsing.
- **Deliverables:**
  - Refactored `LayersPanel.tsx`, `LayerItem.tsx`, `LayerPreview.tsx`
  - Enhanced layer action handlers and context menus
- **Success Criteria:** Users can effortlessly add images, remove layers, reorder via drag-and-drop, and perform batch operations without visual clutter.

---

### Phase 3: Canvas Cursor, Pointer Feedback & Interactions
- **Goal:** Fix and enhance cursor visibility, brush size circles, and mouse tracking across canvas drawing, text placement, and code cipher modes.
- **Scope:**
  - Implement active brush/eraser circular cursor follower that scales dynamically with brush size.
  - Fix mouse cursor styles for selection mode, transform handles, and code/text editing areas.
  - Ensure cursor is visible across dark/bright canvas backgrounds and multi-spectrum layers.
- **Deliverables:**
  - Canvas cursor overlay and dynamic crosshair components
  - Refined mouse event listeners and pointer coordinate transforms
- **Success Criteria:** Mouse pointer and brush preview are clearly visible at all times across all editor modes.

---

### Phase 4: Modularization, Subcomponent Extraction & Final Cleanup
- **Goal:** Decompose the 3,100+ line monolithic `UVEditor.tsx` into modular subcomponents and custom hooks, eliminating raw inline styles and technical debt.
- **Scope:**
  - Extract `UVToolbar`, `UVViewport`, `UVColorPalette`, `UVPropertiesPanel`, and `UVMaskControls` into `src/components/tools/uveditor/`.
  - Extract canvas drawing math and layer history into `useUVCanvasState` and `useUVHistory`.
  - Migrate all remaining inline styles to CSS utility classes.
  - Run typechecks and end-to-end regression validation.
- **Deliverables:**
  - Modularized `src/components/tools/uveditor/` directory structure
  - Slim `UVEditor.tsx` acting as a clean orchestrator
  - Automated typecheck verification (`npm run typecheck`)
- **Success Criteria:** `UVEditor.tsx` line count reduced by >60%; zero TypeScript errors; all forensic tools functioning smoothly.

---

## Progress Tracking

- [ ] **Phase 1: Design System & Iconography Modernization**
- [ ] **Phase 2: LayersPanel & Layer Operations Refactor**
- [ ] **Phase 3: Canvas Cursor, Pointer Feedback & Interactions**
- [ ] **Phase 4: Modularization, Subcomponent Extraction & Final Cleanup**

---
*Roadmap initialized: 2026-08-15*
