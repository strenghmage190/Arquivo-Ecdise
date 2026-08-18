# Requirements: v1.2 CreateClueModal Refactoring & Cyberpunk UX

## 1. Modularization & Orchestration
- [ ] **MOD-01**: Extract `TabGeneral` to handle Sub-type, Title, Tags, Description, Password, Fake Data, and the Fake Phone (Chat Editor).
- [ ] **MOD-02**: Extract `TabVisual` to handle Image/Video uploads, UV Editor access, Revealer Filters, and Thermal Vision.
- [ ] **MOD-03**: Extract `TabAudio` to handle Layer A, Layer B (EVP), and the Spectrogram Mixer.
- [ ] **MOD-04**: Extract `TabCipher` to handle the Shredder puzzle, Hexadecimal, and Cipher Texts.
- [ ] **MOD-05**: Extract `TabGlitch` to handle Glitch Puzzle calibration (Freq, Shift, Chroma).
- [ ] **MOD-06**: Extract `TabMegaClue` to handle required clues selection and the Final Truth text.
- [ ] **MOD-07**: Extract `TabFieldsVisibility` and `TabDisplayConfig` for privacy and UI display settings.
- [ ] **MOD-08**: Consolidate state variables into grouped objects (`clueData`, `mediaState`, etc.) and connect the main `handleSave` function to read correctly from all tabs.

## 2. Cyberpunk UX & Onboarding
- [ ] **UX-01**: Implement `driver.js` interactive step-by-step tutorial for first-time users (using `localStorage` check `hasSeenTour`).
- [ ] **UX-02**: Style the `driver.js` popovers using the Nexus Cyberpunk Design System (dark backgrounds, neon borders/accents).
- [ ] **UX-03**: Add contextual `Info` tooltips to explain complex features directly in the tabs (e.g., UV Light, Revealer Filter, Shredder logic, Fake Phone vs Clue Passwords).
- [ ] **UX-04**: Integrate `framer-motion` for smooth modal openings and tab transitions.
- [ ] **UX-05**: Integrate `sonner` for immersive, neon-styled system toast notifications (e.g., "[ SISTEMA ] 📂 Evidência salva com sucesso.").
- [ ] **UX-06**: Integrate `use-sound` to add subtle mechanical/holographic sound effects on clicks and panel openings.

## Future / Backlog
- None for now.

## Out of Scope
- Backend modifications to the save endpoint.

## Traceability

| Requirement | Phase | Status | Evidence |
|-------------|-------|--------|----------|
| MOD-01 | | `[ ]` | |
| MOD-02 | | `[ ]` | |
| MOD-03 | | `[ ]` | |
| MOD-04 | | `[ ]` | |
| MOD-05 | | `[ ]` | |
| MOD-06 | | `[ ]` | |
| MOD-07 | | `[ ]` | |
| MOD-08 | | `[ ]` | |
| UX-01 | | `[ ]` | |
| UX-02 | | `[ ]` | |
| UX-03 | | `[ ]` | |
| UX-04 | | `[ ]` | |
| UX-05 | | `[ ]` | |
| UX-06 | | `[ ]` | |
