# Phase 13: Basic Tabs Extraction & UX Tooltips

## Objective
Extract the General, Visual, and Audio tabs from the monolithic `CreateClueModal.tsx` into modular components, wire them up to `ClueModalContext`, and implement UX Tooltips with `react-tooltip`.

## Context
- **UI-SPEC:** Approved. Cyberpunk neon styling for tooltips, mixed tone (diegetic titles, functional text).
- **AudioLab:** Must save its result directly into `ClueModalContext` and auto-close.

## Tasks

### 1. Tooltip Setup (`react-tooltip`)
- [ ] Install/Verify `react-tooltip` in `package.json`.
- [ ] Create a reusable `CyberTooltip.tsx` or inject the styles from `13-UI-SPEC.md` into `CreateClueModal_Refactored.css`.
- [ ] Implement the `(i)` icons for Fake Phone and UV Light/Revealer features in their respective tabs.

### 2. Extract `TabGeneral.tsx`
- [ ] Create `src/components/modals/createclueTabs/TabGeneral.tsx`.
- [ ] Consume `ClueModalContext` to read/write `coreState` (title, descPublic, descHidden, tags, discoveryCode).
- [ ] Render the General tab JSX from `CreateClueModal.tsx`.

### 3. Extract `TabVisual.tsx`
- [ ] Create `src/components/modals/createclueTabs/TabVisual.tsx`.
- [ ] Consume `ClueModalContext` to read/write `mediaState` (imgFile, previewUrl, uvFile, filterFile).
- [ ] Render the Visual tab JSX (Image Upload, PhoneViewer config, UV Editor, Filter Editor, Forensic RGB).
- [ ] Add the UX tooltips for Fake Phone and UV Light.

### 4. Extract `TabAudio.tsx` & AudioLab Integration
- [ ] Create `src/components/modals/createclueTabs/TabAudio.tsx`.
- [ ] Consume `ClueModalContext` to read/write audio-related media state.
- [ ] Render the Audio tab JSX.
- [ ] Update `AudioLabModal.tsx` (if it's a modal) or `AudioLab.tsx` to accept a `onSaveToContext(blob)` prop or use the context directly, then close itself.
- [ ] Update `TabAudio.tsx` to display the AudioLab output.

### 5. Wire Up in `CreateClueModal_Refactored.tsx`
- [ ] Import `TabGeneral`, `TabVisual`, `TabAudio` into `CreateClueModal_Refactored.tsx`.
- [ ] Render them conditionally based on the active tab in the sidebar.

## Verification
- Test General tab state persistence when switching tabs.
- Test hovering over `(i)` icons shows the Cyberpunk tooltips.
- Test AudioLab saving a file returns to the Audio tab with the file loaded.
