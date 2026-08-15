# Phase 5 Research: Photoshop/GIMP-Style Layers Panel

## Findings

### 1. LayersPanel.tsx Structure
- **Current State**: The panel has a header (search + actions), a hidden batch action bar, a list of `LayerItem` components, and a footer with creation/deletion buttons.
- **Opacity/Blend Mode**: Currently, Opacity is only available via the right-click context menu (lines 218-219). Blend Mode is rendered inside every single `LayerItem` (line 175 of LayerItem.tsx).
- **Selection State**: Uses `selectedLayers` string array for batch, and a single `selectedLayer` prop for the currently active one. `groupChecks` is also used for a separate checkbox selection system.
- **Proposed Changes**: 
  - Add an "Active Layer Controls" section at the top of the panel (below header, above list) containing Opacity slider and Blend Mode dropdown. These should apply to `selectedLayer` or `selectedLayers`.
  - Enhance `handleSelectLayer` to support `Shift-click` range selection by tracking the `lastSelectedIndex`.

### 2. LayerItem.tsx Structure
- **Current State**: Row contains Group Checkbox, Visibility (Eye), Lock, Thumbnail, Name/Edit input, Type Icon, and a bulky `layer-item-actions` div (Blend Mode, Mask Edit, Duplicate, Delete).
- **Proposed Changes**:
  - Remove the explicit `layer-item-actions` block to achieve the clean, dense look of Photoshop.
  - Remove the `groupCheck` checkbox (Photoshop uses standard OS multi-select, not checkboxes).
  - Enforce Medium thumbnail size (approx 32-40px).
  - The row should strictly contain: Visibility icon, Lock icon, Thumbnail, and Layer Name.

### 3. Action Bars
- **Current State**: `LayersPanel` has both a "batch action bar" and a "footer" for actions.
- **Proposed Changes**: 
  - Consolidate actions into a single dedicated bottom action bar (Footer) with: `[Group]`, `[New Drawing]`, `[New Text]`, `[New Image]`, and `[Delete]`.
  - Ensure the delete button applies to all selected layers.
