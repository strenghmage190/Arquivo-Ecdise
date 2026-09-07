# CreateClueModal Refactoring & Cyberpunk UX Onboarding

## What This Is

A complete architectural refactoring of the monolithic `CreateClueModal.tsx` component into modular, focused tab components. Alongside this structural cleanup, this project introduces a premium Cyberpunk User Experience featuring an interactive onboarding tour (via `driver.js`), smooth animations (`framer-motion`), immersive sound design (`use-sound`), and neon notifications (`sonner`).

## Core Value

A highly maintainable, organized codebase for clue creation that simultaneously delivers an AAA-tier "hacker" experience for the Game Master, ensuring they understand complex systems like Glitches and Cipher puzzles through built-in tutorials.

## Current Milestone: v1.3 Total CSS & UI/UX Overhaul

**Goal:** Melhoria geral do CSS, remoção de código/features mortas e refinamento das interfaces principais (Home, Modals, Tooltips, Light Mode).

**Target features:**
1. **Purga de features:** Remover página de Perfil e elementos "conspiração".
2. **Assets & Temas:** Substituição de emojis por SVGs (Lucide) e refinamento das variáveis do Light Mode.
3. **Componentes e UX:** Refatoração de Modais e Tooltips nativas/leves.
4. **Home Page Redesign:** Limpeza, hierarquia visual e respiro.

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
- ✓ **CreateClueModal Modularization**: Monolithic CreateClueModal.tsx broken down into tab-specific components with Context orchestration — v1.2
- ✓ **State Management Consolidation**: Refactored isolated state variables into cohesive logical groups — v1.2
- ✓ **Cyberpunk UX Polish**: framer-motion and contextual Neon UI implemented for fluid modal transitions — v1.2
- ✓ **In-App Mini-Tutorials**: Contextual info tooltips and help blocks inside complex tabs like Glitch Calibration and Shredder added — v1.2

### Active

- [ ] (No active requirements. Start new milestone to define next goals.)

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
*Last updated: 2026-09-06 for v1.3 milestone start*
