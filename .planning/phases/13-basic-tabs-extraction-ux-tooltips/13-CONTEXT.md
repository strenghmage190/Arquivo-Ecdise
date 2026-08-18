# Phase 13: Basic Tabs Extraction & UX Tooltips

## Domain
Extraction of the General, Visual, and Audio tabs into modular components (`TabGeneral.tsx`, `TabVisual.tsx`, `TabAudio.tsx`), and the implementation of UX tooltips to explain features like Fake Phone and UV Light.

## Decisions

### 1. Tooltips Appearance
- **Decision:** React Tooltip with Cyberpunk styling
- **Rationale:** Tooltips will use `react-tooltip` with a dark, neon-bordered style. They will appear when hovering over an `(i)` info icon next to the relevant feature.

### 2. Audio Lab Integration
- **Decision:** Context integration & Auto-close
- **Rationale:** The AudioLab will save its resulting Blob/URL directly into the shared `ClueModalContext` and then automatically close. The user is returned to the Audio tab, which will now display the newly loaded track without manual file selection.

### 3. Tooltip Tone (Diegetic vs Functional)
- **Decision:** Mixed (Diegetic Titles, Functional Explanations)
- **Rationale:** The tooltips will have in-universe titles (e.g., "Protocolo Fake Phone") but the body text will be functional and direct to ensure the user understands exactly what the feature does, preventing confusion while maintaining immersion.

## Canonical Refs
- N/A

## Code Context
- `src/components/modals/CreateClueModal_Refactored.tsx` (the skeleton)
- `src/contexts/ClueModalContext.tsx` (the state manager)
- `src/components/modals/CreateClueModal.tsx` (current monolith to extract from)
