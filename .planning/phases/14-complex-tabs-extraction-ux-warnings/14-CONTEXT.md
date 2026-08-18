# Phase 14: Complex Tabs Extraction & UX Warnings
**Domain:** Extract Cipher, Glitch, and MegaClue tabs with contextual warnings from `CreateClueModal.tsx`.

## Decisions

### 1. State Organization
- Group puzzle-specific states into nested objects (e.g., `glitchState`, `megaClueState`, `cipherState`) within `ClueModalContext` to keep the context clean and structured, even if it requires spread updates.

### 2. UX Warnings Style
- Use inline neon warning boxes (e.g., amber/red borders) that are always visible for destructive or complex actions (like Shredder deleting real text).

### 3. MegaClue Requirements UI
- Use a searchable dropdown (multiselect) to select required puzzles, to scale well with many clues in the system.

## Canonical Refs
- `src/components/modals/CreateClueModal.tsx`
- `src/components/modals/CreateClueModal_Refactored.tsx`
- `src/contexts/ClueModalContext.tsx`
