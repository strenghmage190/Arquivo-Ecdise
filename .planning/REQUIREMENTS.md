# Requirements: Milestone v1.1 Audio Lab & Spectrogram Steganography Suite

## Overview

A complete overhaul of the forensic audio suite, replacing fragmented, poorly-designed modals (`AudioForge`, `AdvancedAudioLab`, `SpectrogramCreator`, `ProfessionalSpectrogram`, `UrlRealTimeSpectrogram`) with a unified, professional Cyberpunk audio workstation featuring high-fidelity spectrogram steganography and advanced audio manipulation.

## Functional Requirements

### 1. Spectrogram Steganography Engine (STEG)
- [ ] **STEG-01:** Implement image-to-spectrogram encoding where custom user images or drawn masks are synthesized into frequency bins with adjustable frequency range (min/max Hz) and intensity.
- [ ] **STEG-02:** Implement text/code-to-spectrogram encoding allowing direct cipher text insertion rendered as clear visual text in the frequency spectrum.
- [ ] **STEG-03:** Provide acoustic masking and harmonic blending algorithms so hidden spectrogram data blends musically/subtly into background audio or ambient noise without harsh screeching.
- [ ] **STEG-04:** Real-time spectrogram decoder/preview window with customizable color colormaps (Inferno, Viridis, Cyber Neon, Thermal) and FFT resolution controls (1024 to 8192 FFT bins).

### 2. Unified Audio Workstation & UI (AUDW)
- [ ] **AUDW-01:** Consolidate disparate audio tools (`AudioForge`, `AdvancedAudioLab`, `SpectrogramCreator`, `UrlRealTimeSpectrogram`) into a single unified `AudioLab` workstation.
- [ ] **AUDW-02:** Modularize the workstation into clear operational tabs: "Sintetizador & Gerador", "Processamento & Efeitos", "Esteganografia Espectrográfica", "Analisador & Player".
- [ ] **AUDW-03:** Professional Cyberpunk/Nexus UI with full-screen portal modal support, responsive layout, clear Lucide icons, and zero emojis.
- [ ] **AUDW-04:** Seamless integration into `CreateClueModal.tsx`, replacing raw scattered buttons with a unified "Abrir Laboratório de Áudio" launcher.

### 3. Audio Manipulation & DSP Filters (DSP)
- [ ] **DSP-01:** Waveform timeline editor with trim, slice, silence, reverse, and volume envelope controls.
- [ ] **DSP-02:** Forensic DSP filter chain: Bandpass, Highpass, Lowpass, Notch filter (frequency removal), Pitch Shifter, and Speed modifier.
- [ ] **DSP-03:** Multi-source tone/noise generator (Sine, Square, Sawtooth, White/Pink noise, DTMF/Morse generator) for background bed generation.
- [ ] **DSP-04:** High-quality WAV/MP3 audio export and direct upload to Supabase storage (`investigation-assets`).

## Non-Functional Requirements

- [ ] **NFR-PERF:** Web Worker offloading for heavy FFT calculations and image-to-audio inverse FFT synthesis to keep UI responsive at 60fps.
- [ ] **NFR-AUDIO:** 44.1kHz / 48kHz 16-bit PCM lossless WAV buffer generation without clipping or audio buffer stutter.
- [ ] **NFR-A11Y:** Keyboard shortcuts for playback (Space for Play/Pause, Ctrl+Z for Undo) and descriptive accessible tooltips.

## Acceptance Criteria

1. Users can embed an image or text cipher into an audio file and view it clearly in the built-in and external spectrogram analyzers.
2. The hidden spectrogram sound is blended and masked without ruining listening aesthetics.
3. All legacy standalone audio modals are unified into the new `AudioLab` component.
4. `npm run typecheck` passes with zero errors.

---
*Requirements defined: 2026-08-15*
