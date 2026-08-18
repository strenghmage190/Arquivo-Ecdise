# Phase 12: Core State Orchestration & Skeleton - Research

## 1. Domain & Goal
We are starting the refactoring of the massive `CreateClueModal.tsx` God Component into a modular architecture starting with `CreateClueModal_Refactored.tsx`. 
The goal of this phase is to build the shell/skeleton and the core state orchestration using React Context API.

## 2. State Orchestration Strategy (React Context)

The current `CreateClueModal.tsx` has over 100 `useState` declarations. Passing all these down as props to the tabs would cause extreme prop drilling.
Per the Context decision, we will create `src/contexts/ClueModalContext.tsx`.

### Context Structure Recommendation:
Instead of one massive state object, the Provider should maintain logical groupings of state:

1. **`coreState`**: title, descriptions, tags, discoveryCode, evidenceType, isHidden.
2. **`securityState`**: isLocked, lockPass, lockPasses, phone passwords.
3. **`mediaState`**: files (img, video, audio) and their preview URLs, visibility configs.
4. **`puzzleState`**:
   - `glitchConfig`
   - `cipherConfig` (shredder, hex, cipher texts)
   - `thermalConfig`
   - `forensicConfig`
   - `megaClueConfig`
5. **`fakeDataState`**: person dossier, fake metadata, chat data.
6. **`displayState`**: `fieldVisibilityConfig`, `displayConfig`.

**Actions/Mutators**:
The context must provide setter functions (e.g., `setCoreState`, `updateGlitchConfig`) or expose a `dispatch` function if using `useReducer` (useReducer is highly recommended here to avoid excessive re-renders).

## 3. UI & Animation Requirements (framer-motion)

The decision was **"Sliding Cyberpunk"**.
- **Modal Open**: The `DiegeticWindow` should mount with a `glitch` effect (scale up rapidly + opacity flicker).
- **Tab Transitions**: When `activeTab` changes, the `AnimatePresence` should slide the old tab out to the left/right and the new tab in from the opposite side.
- **Library**: `framer-motion`.

## 4. Audio UI Integration (use-sound)

The decision was **Rich Interactivity**.
- **Actions needing sound**: 
  1. Modal Mount (`sys_boot` or `terminal_on`)
  2. Tab switch (`click_holographic`)
  3. Input focus (`key_hover`)
  4. Save button click (`sys_process`)
  5. Close/Cancel button (`sys_error` or `sys_close`)
- **Sound Assets**: We need to use generic/synth sounds if specific assets are not present, or leverage a custom `useCyberpunkUI` hook.

## 5. Implementation Path for Phase 12

1. Create `src/contexts/ClueModalContext.tsx` with all the grouped states and a `useClueModal` hook.
2. Create `src/components/modals/CreateClueModal_Refactored.tsx`.
3. Scaffold the basic modal shell using `DiegeticWindow`.
4. Implement the header (Tab selectors with Framer Motion layout indicators).
5. Implement the body (`AnimatePresence` with placeholder components for the tabs).
6. Implement the footer (Save / Cancel buttons).
7. Inject `use-sound` into the interactions.
8. Do NOT implement the actual tabs yet (that's Phase 13-15). Just placeholders that consume the context.

## 6. Risks
- **Performance**: A single React Context for so many fields might cause the entire modal to re-render on every keystroke. 
  - *Mitigation*: We should split into multiple contexts (e.g., `ClueDataContext`, `ClueMediaContext`) OR use `useReducer` with memoized components, OR just accept the re-render cost for the modal since it's an admin form, but try to use uncontrolled inputs where possible.
- **Asset Cleanup**: Blob URLs (like previews) must be managed carefully in the context to avoid memory leaks on unmount.

## RESEARCH COMPLETE
