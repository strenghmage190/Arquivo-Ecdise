# CreateClueModal Refactoring & Cyberpunk UX Onboarding

## What This Is

A complete architectural refactoring of the monolithic `CreateClueModal.tsx` component into modular, focused tab components. Alongside this structural cleanup, this project introduces a premium Cyberpunk User Experience featuring an interactive onboarding tour (via `driver.js`), smooth animations (`framer-motion`), immersive sound design (`use-sound`), and neon notifications (`sonner`).

## Core Value

A highly maintainable, organized codebase for clue creation that simultaneously delivers an AAA-tier "hacker" experience for the Game Master, ensuring they understand complex systems like Glitches and Cipher puzzles through built-in tutorials.

## Current Milestone: v1.2 CreateClueModal Refactoring & Cyberpunk UX

**Goal:** Deconstruct `CreateClueModal.tsx` into modular sub-tabs, consolidate React state into logical domains, and implement a first-time interactive tutorial and advanced UX polish.

**Target Features:**
1. **Modular Tabs Extraction:** Split the God Component into `TabGeneral`, `TabVisual`, `TabAudio`, `TabCipher`, `TabGlitch`, `TabMegaClue`, `TabFieldsVisibility`, and `TabDisplayConfig`.
2. **State Orchestration:** Create centralized state objects (`clueData`, `glitchConfig`, etc.) to pass down to tabs instead of prop-drilling 50+ individual states.
3. **Cyberpunk Onboarding:** Integrate `driver.js` for an automatic first-visit guided tour with dark/neon CSS styling.
4. **UX Polish Library Integrations:** Add `framer-motion` (animations), `sonner` (neon toasts), and `use-sound` (UI interactions) for maximum immersion.

## Requirements

### Validated

- ✓ Multi-mode canvas editing (`uv`, `rgb`, `filter`) — v1.0
- ✓ Photoshop/GIMP-style layers mechanics with locked background and explicit rasterization — v1.0
- ✓ Full Lucide React iconography and zero emojis — v1.0
- ✓ Full-screen portal workspace for image forensics — v1.0
- ✓ Spectrogram Steganography: Encode hidden visual patterns/text into audio frequencies without harsh auditory distortion. — v1.1
- ✓ Unified Audio Workstation: Combine fragmented audio tools (`AudioForge`, `AdvancedAudioLab`, `SpectrogramCreator`) into a cohesive studio UI. — v1.1
- ✓ Audio Editing & Filtering: Waveform trimming, pitch shifting, speed modulation, bandpass/notch filtering, and audio export. — v1.1
- ✓ Real-time Spectrogram & Waveform Visualizer: High-FPS WebAudio-powered real-time spectrogram and spectrum analyzer. — v1.1
- ✓ Modal UX & Performance: Clean integration into `CreateClueModal` with lazy loading and responsive full-screen capability. — v1.1

### Active

- [ ] **CreateClueModal Modularization**: Break down the monolithic CreateClueModal.tsx into tab-specific components (`TabGeneral`, `TabVisual`, etc.) and establish a strong Context/Prop orchestration.
- [ ] **State Management Consolidation**: Refactor dozens of isolated state variables into cohesive logical groups (`clueData`, `mediaState`, `glitchConfig`).
- [ ] **Interactive Onboarding Tour**: Implement a first-time user tour via `driver.js` with custom Cyberpunk CSS and `localStorage` tracking.
- [ ] **Cyberpunk UX Polish**: Integrate `framer-motion` for fluid modal/tab transitions, `sonner` for neon toast notifications, and `use-sound` for mechanical/holographic UI sound effects.
- [ ] **In-App Mini-Tutorials**: Add contextual Lucide React `Info` tooltips and help blocks inside complex tabs like Glitch Calibration and Shredder.

### Out of Scope

- Changes to the backend logic of how clues are saved/uploaded (only the UI state handling changes).

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tab Modularization | Reduces CreateClueModal.tsx from a 4k+ line monolith to a clean orchestrator | — Pending |
| Driver.js | Lightweight and easy to style for the Cyberpunk Onboarding requirement | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-18 for v1.2 milestone*
