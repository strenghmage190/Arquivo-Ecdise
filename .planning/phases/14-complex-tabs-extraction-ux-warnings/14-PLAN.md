# Phase 14: Complex Tabs Extraction & UX Warnings
**Goal**: Extract Cipher, Glitch, and MegaClue tabs with contextual warnings.

## Overview
This phase breaks down the complex puzzle tabs from the monolithic `CreateClueModal.tsx` into modular components. The state for these complex puzzles will be grouped into nested objects in `ClueModalContext` to keep it clean. 

## Tasks

### 1. State Updates (`ClueModalContext.tsx`)
- **Modify** `ClueModalContext.tsx`:
  - Group `cipherState`: `{ isShredded, shredRows, shredCols, realText, cipherText }`
  - Group `glitchState`: `{ glitchCorrectFrequency, glitchCorrectShift, glitchCorrectChromatic, glitchRewardCode, glitchKeyword, glitchRequireKeyword, glitchUnlockMode, glitchDifficulty, glitchToleranceFreq, glitchToleranceShift, glitchToleranceChroma, glitchFocusedImageFile, glitchFocusedImagePreview, showGlitchDesigner, glitchHiddenAudioUrl, glitchHiddenVideoUrl, glitchHint, glitchAccessInstructions, glitchStartFrequency, glitchStartShift, glitchStartChromatic }`
  - Group `megaClueState`: `{ megaFinalTruthText, megaImageFile, megaImagePreview, megaRequiredPuzzleIds }`
  - Add state setters: `setCipherState`, `setGlitchState`, `setMegaClueState` which accept partial updates.

### 2. Tab Extraction
- **Create** `src/components/modals/createclueTabs/TabCipher.tsx`
  - Port over shredder inputs.
  - Implement an Inline Neon Warning Box for Shredder: "Warning: Enabling shredder overrides real text."
- **Create** `src/components/modals/createclueTabs/TabGlitch.tsx`
  - Port over glitch configuration inputs (frequency, shift, chroma, media hiding).
- **Create** `src/components/modals/createclueTabs/TabMegaClue.tsx`
  - Port over Mega Clue inputs.
  - Build a custom Searchable Checklist for `megaRequiredPuzzleIds` selection (since `react-select` is not installed).

### 3. UX Warnings & Styles
- **Modify** `CreateClueModal_Refactored.css`
  - Add `.neon-warning-box` styling with amber/red borders, glowing text, and cyberpunk aesthetic.

### 4. Integration
- **Modify** `CreateClueModal_Refactored.tsx`
  - Render `TabCipher`, `TabGlitch`, `TabMegaClue` conditionally.
  - Fix any compilation errors from the grouped state changes during the `save` function mapping.
