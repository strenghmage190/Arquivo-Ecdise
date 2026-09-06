---
phase: 14
name: Complex Tabs Extraction & UX Warnings
wave: 1
status: Executed
requirements:
  - MOD-04
  - MOD-05
  - MOD-06
  - UX-03
autonomous: true
files_modified:
  - src/contexts/ClueModalContext.tsx
  - src/components/modals/createclueTabs/TabCipher.tsx
  - src/components/modals/createclueTabs/TabGlitch.tsx
  - src/components/modals/createclueTabs/TabMegaClue.tsx
  - src/components/modals/CreateClueModal_Refactored.css
  - src/components/modals/CreateClueModal_Refactored.tsx
---

# Phase 14: Complex Tabs Extraction & UX Warnings

**Goal:** Extract `TabCipher`, `TabGlitch`, and `TabMegaClue` from the monolithic `CreateClueModal.tsx` into modular components, group their state in `ClueModalContext`, and add contextual neon warning boxes for destructive/complex actions.

**Status:** Executed — code complete as of 2026-08-18. This plan documents the implementation for formal verification.

## must_haves

- `TabCipher.tsx`, `TabGlitch.tsx`, and `TabMegaClue.tsx` exist and render inside `CreateClueModal_Refactored.tsx`
- `ClueModalContext.tsx` groups state into `cipherState`, `glitchState`, and `megaClueState` nested objects
- `.neon-warning-box` CSS class exists with amber/red neon borders and cyberpunk aesthetic
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0

---

## Wave 1 — State Orchestration

### Task 1.1: Group Complex States in ClueModalContext

<read_first>
- src/contexts/ClueModalContext.tsx
- .planning/phases/14-complex-tabs-extraction-ux-warnings/14-CONTEXT.md
- .planning/phases/12-core-state-orchestration-skeleton/12-SUMMARY.md
</read_first>

<action>
Modify `src/contexts/ClueModalContext.tsx` to group complex puzzle states into nested objects:
- `cipherState: { isShredded, shredRows, shredCols, realText, cipherText }`
- `glitchState: { glitchCorrectFrequency, glitchCorrectShift, glitchCorrectChromatic, glitchRewardCode, glitchKeyword, glitchRequireKeyword, glitchUnlockMode, glitchDifficulty, glitchToleranceFreq, glitchToleranceShift, glitchToleranceChroma, glitchFocusedImageFile, glitchFocusedImagePreview, showGlitchDesigner, glitchHiddenAudioUrl, glitchHiddenVideoUrl, glitchHint, glitchAccessInstructions, glitchStartFrequency, glitchStartShift, glitchStartChromatic }`
- `megaClueState: { megaFinalTruthText, megaImageFile, megaImagePreview, megaRequiredPuzzleIds }`
- Expose partial setters: `setCipherState`, `setGlitchState`, `setMegaClueState` via functional spread: `prev => ({ ...prev, ...partial })`
</action>

<acceptance_criteria>
- `ClueModalContext.tsx` exports `cipherState`, `glitchState`, `megaClueState` from context value
- Each setter signature accepts `Partial<CipherState>` / `Partial<GlitchState>` / `Partial<MegaClueState>`
- No flat glitch/cipher/megaClue top-level state variables remain ungroup in context
- `npx tsc --noEmit` exits 0 with no ClueModalContext-related errors
</acceptance_criteria>

---

## Wave 2 — Tab Component Extraction

### Task 2.1: Create TabCipher.tsx

<read_first>
- src/components/modals/CreateClueModal.tsx
- src/contexts/ClueModalContext.tsx
- src/components/modals/createclueTabs/createclueTabs.css
</read_first>

<action>
Create `src/components/modals/createclueTabs/TabCipher.tsx`:
- Import `useClueModal` from `ClueModalContext`
- Port shredder inputs: `isShredded` toggle, `shredRows`/`shredCols` number inputs, `realText`/`cipherText` textareas
- Render `.neon-warning-box` with text: "⚠ Ativar Shredder substitui o texto real. Esta ação é destrutiva."
- Bind all inputs to `cipherState` and update via `setCipherState({ field: value })`
</action>

<acceptance_criteria>
- File `src/components/modals/createclueTabs/TabCipher.tsx` exists
- Component imports and calls `useClueModal()`
- `.neon-warning-box` element is rendered in the component JSX
- `isShredded`, `shredRows`, `shredCols`, `realText`, `cipherText` inputs are bound to `cipherState`
- `npx tsc --noEmit` exits 0
</acceptance_criteria>

### Task 2.2: Create TabGlitch.tsx

<read_first>
- src/components/modals/CreateClueModal.tsx
- src/contexts/ClueModalContext.tsx
- src/components/modals/createclueTabs/TabCipher.tsx
</read_first>

<action>
Create `src/components/modals/createclueTabs/TabGlitch.tsx`:
- Port glitch frequency/shift/chromatic inputs bound to `glitchState.glitchCorrectFrequency/Shift/Chromatic`
- Port reward code, keyword, unlock mode, difficulty fields
- Port tolerance sliders: `glitchToleranceFreq`, `glitchToleranceShift`, `glitchToleranceChroma`
- Port media hiding: `glitchHiddenAudioUrl`, `glitchHiddenVideoUrl`, `glitchFocusedImageFile/Preview`
- Port hint, access instructions, start calibration values
- All updates via `setGlitchState({ field: value })` partial pattern
</action>

<acceptance_criteria>
- File `src/components/modals/createclueTabs/TabGlitch.tsx` exists
- Component imports and calls `useClueModal()`
- Frequency, shift, and chromatic inputs are bound to `glitchState.glitchCorrectFrequency/Shift/Chromatic`
- `setGlitchState` is called with partial objects on each input change event
- `npx tsc --noEmit` exits 0
</acceptance_criteria>

### Task 2.3: Create TabMegaClue.tsx

<read_first>
- src/components/modals/CreateClueModal.tsx
- src/contexts/ClueModalContext.tsx
- src/supabaseClient.ts
</read_first>

<action>
Create `src/components/modals/createclueTabs/TabMegaClue.tsx`:
- Port `megaFinalTruthText` textarea bound to `megaClueState.megaFinalTruthText`
- Port `megaImageFile/Preview` with file upload input
- Implement `fetchAvailablePuzzles()` locally using `supabase.from(...)` to query available puzzle clues
- Build custom searchable checklist for `megaRequiredPuzzleIds`:
  - Text `<input>` filters puzzle list by title
  - Checkboxes add/remove IDs from array
- All state via `setMegaClueState({ field: value })` partial pattern
</action>

<acceptance_criteria>
- File `src/components/modals/createclueTabs/TabMegaClue.tsx` exists
- Component contains `fetchAvailablePuzzles` function with `supabase.from(...)` call
- Search input filters the rendered puzzle list
- Checkbox interaction adds/removes from `megaClueState.megaRequiredPuzzleIds` array
- `megaFinalTruthText` textarea is bound to `megaClueState.megaFinalTruthText`
- `npx tsc --noEmit` exits 0
</acceptance_criteria>

---

## Wave 3 — Styling & Integration

### Task 3.1: Add .neon-warning-box CSS

<read_first>
- src/components/modals/CreateClueModal_Refactored.css
- src/components/modals/createclueTabs/createclueTabs.css
</read_first>

<action>
Add `.neon-warning-box` to `CreateClueModal_Refactored.css` or `createclueTabs.css`:
- `background: rgba(255, 140, 0, 0.08)`
- `border: 1px solid #ff8c00`
- `box-shadow: 0 0 8px rgba(255, 140, 0, 0.4)`
- `color: #ffa500`
- `padding: 8px 12px`
- `border-radius: 4px`
- `font-size: 0.85rem`
</action>

<acceptance_criteria>
- `.neon-warning-box` class exists in a loaded CSS file
- Class contains `border` property with amber/orange color value
- Class contains `box-shadow` with neon glow
- Class is imported/available to TabCipher.tsx at runtime
</acceptance_criteria>

### Task 3.2: Integrate Tabs in CreateClueModal_Refactored.tsx

<read_first>
- src/components/modals/CreateClueModal_Refactored.tsx
- src/components/modals/createclueTabs/TabCipher.tsx
- src/components/modals/createclueTabs/TabGlitch.tsx
- src/components/modals/createclueTabs/TabMegaClue.tsx
- src/contexts/ClueModalContext.tsx
</read_first>

<action>
Modify `src/components/modals/CreateClueModal_Refactored.tsx`:
- Import `TabCipher`, `TabGlitch`, `TabMegaClue`
- Render each conditionally based on `activeTab` state (same pattern as Phase 13 tabs)
- Update `handleSave` to read from `cipherState`, `glitchState`, `megaClueState` when building save payload
- Fix any TypeScript errors from flat field references that now require nested access (e.g., `cipherState.isShredded`)
</action>

<acceptance_criteria>
- `CreateClueModal_Refactored.tsx` imports `TabCipher`, `TabGlitch`, `TabMegaClue`
- Each tab renders when the corresponding tab ID is active
- `handleSave` reads from `context.cipherState`, `context.glitchState`, `context.megaClueState`
- `npx tsc --noEmit` exits 0
- `npm run build` exits 0 with no errors
</acceptance_criteria>

---

## Verification

### Automated
```bash
npx tsc --noEmit
npm run build
```

### Manual Checklist
1. Open `CreateClueModal_Refactored` in browser
2. Navigate to **Cipher** tab → `.neon-warning-box` visible with amber styling
3. Toggle Shredder → state updates, rows/cols inputs appear
4. Navigate to **Glitch** tab → frequency/shift/chroma inputs respond
5. Navigate to **MegaClue** tab → search filters list, checkboxes toggle IDs
6. Click **Save** → no console errors, payload includes cipher/glitch/megaClue fields

### Requirements Traceability
| Req | Description | Status |
|-----|-------------|--------|
| MOD-04 | TabCipher extracted (shredder, hexadecimal, cipher texts) | ✓ Executed |
| MOD-05 | TabGlitch extracted (frequency, shift, chroma, media hiding) | ✓ Executed |
| MOD-06 | TabMegaClue extracted (required puzzles, final truth text) | ✓ Executed |
| UX-03 | Contextual warning box in TabCipher for shredder destructive action | ✓ Executed |
