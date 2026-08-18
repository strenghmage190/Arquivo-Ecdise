# Phase 12: Core State Orchestration & Skeleton - Plan

## Target
Refactor the state management and core layout of `CreateClueModal.tsx` into a new `CreateClueModal_Refactored.tsx`, using React Context API for state orchestration, `framer-motion` for animations, and `use-sound` for UI interactions.

## Implementation Steps

### Step 1: Install Dependencies
- **Task:** Run `npm install framer-motion use-sound sonner driver.js`
- **Files Modified:** `package.json`, `package-lock.json`
- **Description:** Instala as dependências de animação, som, notificações e onboarding.

### Step 2: Create Sound Assets Map (Fallback)
- **Task:** Create `src/hooks/useCyberpunkUI.ts` (or similar) that wraps `use-sound`.
- **Files Modified:** `src/hooks/useCyberpunkUI.ts`
- **Description:** Centralize the SFX calls (click, hover, success, error) to be used across the new components. We will use simple placeholder paths for the sounds initially (e.g., `/sounds/click.mp3`), or rely on existing UI sound libraries if present.

### Step 3: Architect React Context for Modal State
- **Task:** Create `src/contexts/ClueModalContext.tsx`
- **Files Modified:** `src/contexts/ClueModalContext.tsx`
- **Description:** Define the complex `ClueModalState` interface, breaking down into `core`, `media`, `puzzle`, `security`, etc. Export a `ClueModalProvider` and a `useClueModal` hook. Add a dispatch or direct setters for these states. Include the cleanup of Object URLs inside a `useEffect` on unmount.

### Step 4: Scaffold Refactored Modal Component
- **Task:** Create `src/components/modals/CreateClueModal_Refactored.tsx`
- **Files Modified:** `src/components/modals/CreateClueModal_Refactored.tsx`, `src/components/modals/CreateClueModal_Refactored.css`
- **Description:** Build the modal shell. Use `framer-motion` for the `<motion.div>` opening glitch effect. Integrate `DiegeticWindow`. It should take standard props (`isOpen`, `onClose`, `existingCard`, etc.). Wrap its contents in `<ClueModalProvider>`.

### Step 5: Build Tabs Navigation & Footer
- **Task:** Implement Header & Footer in the Modal
- **Files Modified:** `src/components/modals/CreateClueModal_Refactored.tsx`
- **Description:** Add the left/top sidebar for tabs (General, Visual, Audio, Cipher, Glitch, Mega Clue, Visibilidade, Config). Use `use-sound` for clicks on these tabs. In the footer, implement the `handleSave` placeholder and Cancel button. Add `AnimatePresence` to handle tab transitions (Sliding left/right). Create simple placeholder divs for each tab content.

### Step 6: Validation and Export Substitution (Partial)
- **Task:** Ensure the new component renders without crashing and the contexts are wired.
- **Files Modified:** N/A (Manual test via Storybook or dropping it in the App).
- **Description:** We will not replace the old `CreateClueModal` entirely across the app yet, to avoid breaking the current features until phases 13-16 are done. We'll simply ensure the skeleton runs.

## Automated Verification Steps
1. Build the app `npm run build` and ensure no TypeScript errors exist in the new context files.
2. Ensure ESLint passes on the new files.
