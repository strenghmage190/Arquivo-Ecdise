# Phase 2: LayersPanel & Layer Operations Refactor - Context

**Phase:** 02-layerspanel-and-layer-operations-refactor
**Date:** 2026-08-15
**Status:** Ready for Planning

## Domain

Overhaul and streamline the entire layer management experience across `LayersPanel.tsx`, `LayerItem.tsx`, `UVEditor.tsx`, and `UVEditor.css`. This includes seamless image ingestion, instant one-click layer deletion with undo support, unified persistent action bars for creating drawing/image/text layers, and fluid batch operations (grouping, locking, deleting).

## Implementation Decisions

### 1. Image Layer Ingestion & Placement
- **Trigger:** Dedicated "+ Imagem" / `ImageIcon` action buttons prominently available in the `LayersPanel` header and footer.
- **Workflow:** Selecting an image file automatically loads the image element, calculates default scaling to fit within the viewport, creates a new named `'image'` layer, and places it centered on the canvas without tedious intermediate prompts.
- **Preview:** Instant thumbnail generation in `LayerItem` / `LayerPreview`.

### 2. Layer Deletion & Undo Integration
- **Interaction:** Direct single-click deletion via the `Trash2` icon on the layer item row.
- **Safety & History:** Automatically registers an entry in the undo/history stack (`pushHistory()`) and supports `Ctrl+Z` to revert accidental deletions.
- **Batch Deletion:** Checkbox selection allows multi-layer deletion with a single click on the footer/header trash action.

### 3. Unified Actions Bar & Layer Controls
- **Action Bar:** Prominently placed top/bottom action bar with quick-create buttons:
  - `+ Desenho` (`Pencil` / `Plus`)
  - `+ Imagem` (`ImageIcon` / `Plus`)
  - `+ Texto` (`Type` / `Plus`)
  - `Agrupar` (`FolderPlus`)
  - `Excluir Selecionados` (`Trash2`)
- **Multi-Selection:** Checkbox toggle on each row (`groupCheck`) enables batch operations (batch delete, batch lock/unlock, group creation).
- **Group Hierarchy:** Nested child layer rendering with collapsible chevron indicators and group transform inheritance.

## Canonical References

- `src/components/LayersPanel.tsx` — Main layers management container.
- `src/components/LayerItem.tsx` — Individual layer row component.
- `src/components/LayerPreview.tsx` — Layer thumbnail preview renderer.
- `src/components/tools/UVEditor.tsx` — Host component maintaining `layers` state array, `pushHistory()`, and layer transformation handlers.
- `src/components/tools/UVEditor.css` — Stylesheet for layer panel layout, drag handles, and action toolbars.

---
*Context captured: 2026-08-15*
