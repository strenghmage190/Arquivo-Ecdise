# Roadmap: CreateClueModal Refactoring & Cyberpunk UX

## Milestones

- 🔄 **v1.2 CreateClueModal Refactoring & Cyberpunk UX** — Phases 12-16 (Active)
- ✅ **v1.1 Audio Lab & Spectrogram Steganography Suite** — Phases 7-11 (shipped 2026-08-18)
- ✅ **v1.0 UVEditor UI/UX Refactor & Layers Modernization** — Phases 1-6 (shipped 2026-08-15)

## Phases

### Phase 12: Core State Orchestration & Skeleton
- **Goal:** Create `CreateClueModal_Refactored.tsx`, group state variables, and build the DiegeticWindow skeleton with tabs header and footer.
- **Requirements Covered:** `MOD-08`, `UX-04`, `UX-06`
- **Success Criteria:** The new modal can be opened with fluid framer-motion transitions and plays SFX on mount. The core state is cleanly grouped into contexts or unified state objects.

### Phase 13: Basic Tabs Extraction & UX Tooltips
- **Goal:** Extract General, Visual, and Audio tabs, and embed contextual tooltips.
- **Requirements Covered:** `MOD-01`, `MOD-02`, `MOD-03`, `UX-03`
- **Success Criteria:** `TabGeneral.tsx`, `TabVisual.tsx`, and `TabAudio.tsx` render correctly and communicate with the main modal state. The "Info" icons explain the Fake Phone and UV Light/Revealer features.

### Phase 14: Complex Tabs Extraction & UX Warnings
- **Goal:** Extract Cipher, Glitch, and MegaClue tabs with contextual warnings.
- **Requirements Covered:** `MOD-04`, `MOD-05`, `MOD-06`, `UX-03`
- **Success Criteria:** `TabCipher.tsx`, `TabGlitch.tsx`, and `TabMegaClue.tsx` are fully functional, correctly managing complex data schemas like Glitch settings. The Shredder puzzle has its help block.

### Phase 15: Configuration Tabs Extraction
- **Goal:** Extract the Visibility and Display Config tabs.
- **Requirements Covered:** `MOD-07`
- **Success Criteria:** `TabFieldsVisibility.tsx` and `TabDisplayConfig.tsx` correctly bind to the settings state.

### Phase 16: Final Integration, Onboarding Tour & Polish
- **Goal:** Connect `handleSave`, add `driver.js` onboarding, and integrate `sonner` toasts.
- **Requirements Covered:** `UX-01`, `UX-02`, `UX-05`
- **Success Criteria:** The `driver.js` tour auto-plays only once for new users, highlighting the core tabs and save button with a Cyberpunk aesthetic. Saving triggers a neon toast notification, and all data properly uploads and persists.

## Progress Tracking

- [ ] **Phase 12: Core State Orchestration & Skeleton**
- [ ] **Phase 13: Basic Tabs Extraction & UX Tooltips**
- [ ] **Phase 14: Complex Tabs Extraction & UX Warnings**
- [ ] **Phase 15: Configuration Tabs Extraction**
- [ ] **Phase 16: Final Integration, Onboarding Tour & Polish**

<details>
<summary>✅ v1.1 Audio Lab & Spectrogram Steganography Suite (Phases 7-11) — SHIPPED 2026-08-18</summary>

- [x] Phase 7: High-Fidelity Spectrogram Steganography Engine — completed 2026-08-18
- [x] Phase 8: Forensic Audio DSP & Manipulation Suite — completed 2026-08-18
- [x] Phase 9: Unified AudioLab Workstation Architecture & UI — completed 2026-08-18
- [x] Phase 10: CreateClueModal Integration, Performance & E2E Validation — completed 2026-08-18
- [x] Phase 11: AudioLab Spectrogram Preview & Player Parity — completed 2026-08-16

</details>
