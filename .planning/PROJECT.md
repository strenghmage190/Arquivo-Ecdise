# Audio Lab & Spectrogram Steganography Suite Overhaul

## What This Is

A complete architectural refactoring, functional overhaul, and visual modernization of the forensic audio suite: `AudioForge`, `AdvancedAudioLab`, `SpectrogramCreator`, `ProfessionalSpectrogram`, and `UrlRealTimeSpectrogram`. The project unifies fragmented audio tools into a cohesive Cyberpunk studio interface, implements high-fidelity spectrogram steganography (embedding hidden images/text into audio frequencies without jarring or destructive auditory artifacts), enhances audio manipulation capabilities (filters, pitch, reverse, slice, synthesizer), and optimizes modal integration in `CreateClueModal`.

## Core Value

A studio-grade forensic audio workstation enabling investigators to craft, manipulate, synthesize, and encode subtle, high-clarity spectrogram steganography seamlessly.

## Current Milestone: v1.1 Audio Lab & Spectrogram Steganography Suite

**Goal:** Overhaul audio tools, unbundle chaotic modals into an integrated workspace, and provide clean, high-fidelity spectrogram image/text steganography.

**Target Features:**
1. **Spectrogram Steganography Engine:** Encode images and text directly into audio frequency bins with subtle auditory masking and high visual contrast in spectrogram analyzers.
2. **Audio Suite Unification:** Consolidate `AudioForge`, `AdvancedAudioLab`, and `SpectrogramCreator` into a single modular workstation with clear tabbed navigation.
3. **Forensic Audio Manipulation & Synthesis:** Pitch shift, reverse, bandpass/notch filters, waveform visualizer, and multi-track tone generator.
4. **Professional UI & Modal Overhaul:** High-performance responsive modal workspace with Wavesurfer / WebAudio integration and Cyberpunk theme aesthetics.

## Requirements

### Validated

- ✓ Multi-mode canvas editing (`uv`, `rgb`, `filter`) — v1.0
- ✓ Photoshop/GIMP-style layers mechanics with locked background and explicit rasterization — v1.0
- ✓ Full Lucide React iconography and zero emojis — v1.0
- ✓ Full-screen portal workspace for image forensics — v1.0

### Active

- [ ] **Spectrogram Steganography:** Encode hidden visual patterns/text into audio frequencies without harsh auditory distortion.
- [ ] **Unified Audio Workstation:** Combine fragmented audio tools (`AudioForge`, `AdvancedAudioLab`, `SpectrogramCreator`) into a cohesive studio UI.
- [ ] **Audio Editing & Filtering:** Waveform trimming, pitch shifting, speed modulation, bandpass/notch filtering, and audio export.
- [ ] **Real-time Spectrogram & Waveform Visualizer:** High-FPS WebAudio-powered real-time spectrogram and spectrum analyzer.
- [ ] **Modal UX & Performance:** Clean integration into `CreateClueModal` with lazy loading and responsive full-screen capability.

### Out of Scope

- Cloud-based AI voice cloning or neural audio synthesis.
- Proprietary VST plugin host.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Frequency Bin Steganography | Synthesize sine waves mapped to pixel brightness for clear spectrogram rendering | — Pending |
| Unified Audio Studio UI | Eliminates confusion from multiple disconnected audio modals | — Pending |
| Web Audio API + Web Worker | Keeps audio synthesis and FFT processing off the main UI thread | — Pending |

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
*Last updated: 2026-08-15 for v1.1 milestone*
