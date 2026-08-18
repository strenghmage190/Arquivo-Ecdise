# Roadmap: Milestone v1.1 Audio Lab & Spectrogram Steganography Suite

## Milestone Overview

Overhaul and unify all forensic audio and spectrogram tools into a single modular workstation (`AudioLab`) with high-fidelity steganography, harmonic masking, advanced DSP effects, and full-screen Cyberpunk UI.

---

## Phases

### Phase 7: High-Fidelity Spectrogram Steganography Engine
- **Goal:** Build a high-performance Web Worker-driven audio synthesis engine capable of encoding images and text into audio spectrograms with subtle harmonic masking.
- **Scope:**
  - Image/Text to audio FFT frequency synthesizer (`spectrogramSynthesizerWorker.ts`).
  - Frequency range selector (e.g. 1kHz - 18kHz) and brightness-to-amplitude curve mapping.
  - Acoustic masking algorithms (dither, pink noise bed, harmonic blending) to hide visual cues from direct acoustic detection.
  - High-res real-time spectrogram previewer with colormaps (Inferno, Viridis, Cyber Neon).
- **Requirements Covered:** `STEG-01`, `STEG-02`, `STEG-03`, `STEG-04`
- **Success Criteria:** Images and text ciphers rendered in audio files are clearly visible in spectrogram viewers while sounding subtle and non-abrasive.

---

### Phase 8: Forensic Audio DSP & Manipulation Suite
- **Goal:** Implement comprehensive audio editing and forensic filtering tools.
- **Scope:**
  - Interactive waveform timeline editor (slice, trim, silence, reverse, fade in/out).
  - Web Audio DSP filters: Bandpass, Highpass, Lowpass, Notch, Pitch shifter, Speed control.
  - Synthesizer / Bed generator (Sine, Morse code encoder, DTMF tones, noise generators).
  - Lossless WAV export and audio buffer management.
- **Requirements Covered:** `DSP-01`, `DSP-02`, `DSP-03`, `DSP-04`
- **Success Criteria:** Users can import an existing audio file or generate tone beds, apply filters, and manipulate waveforms smoothly.

---

### Phase 9: Unified AudioLab Workstation Architecture & UI
- **Goal:** Unify fragmented components (`AudioForge`, `AdvancedAudioLab`, `SpectrogramCreator`, `UrlRealTimeSpectrogram`) into a modern, full-screen `AudioLab` suite.
- **Scope:**
  - Create modular `src/components/tools/audiolab/` directory structure with tabbed navigation.
  - Build Cyberpunk HUD interface with Wavesurfer waveform visualizer, real-time frequency analyzers, and Lucide React icons.
  - Responsive full-screen portal modal layout matching the styling of `UVEditor`.
- **Requirements Covered:** `AUDW-01`, `AUDW-02`, `AUDW-03`
- **Success Criteria:** All audio operations exist under a single intuitive workstation with zero UI clutter or emoji dependencies.

---

### Phase 10: CreateClueModal Integration, Performance & E2E Validation
- **Goal:** Streamline `CreateClueModal.tsx` audio workflows, lazy load heavy audio engines, and run E2E validation.
- **Scope:**
  - Refactor `CreateClueModal.tsx` to replace fragmented audio buttons with a single "Abrir Laboratório de Áudio" launcher.
  - Implement seamless payload handoff (generated audio → clue attachment with metadata).
  - Run typechecks, audio buffer benchmarks, and cross-browser validation.
- **Requirements Covered:** `AUDW-04`, `NFR-PERF`, `NFR-AUDIO`
- **Success Criteria:** Seamless audio creation flow inside `CreateClueModal`; 0 TypeScript errors; smooth 60fps UI performance.

---

### Phase 11: AudioLab Spectrogram Preview & Player Parity
- **Goal:** Unify the AudioLab center spectrogram preview with the high-quality ProfessionalSpectrogram visualization used in the InspectionModal, removing layout visual bugs.
- **Scope:**
  - Replace the Wavesurfer Spectrogram plugin in the center view with ProfessionalSpectrogram.tsx for visual parity with player tools.
  - Overlay the steganography payload preview (SpectrogramPreviewCanvas) directly on top of the base audio spectrogram using CSS mix-blend modes to allow users to visualize the real-time mix of payload and base audio.
  - Remove extraneous controls (like the 'Limpar Seleção' button) from the center preview area.
- **Requirements Covered:** AUDW-05
- **Success Criteria:** The center preview shows the full-height ProfessionalSpectrogram of the base audio, perfectly overlaid with the SpectrogramPreviewCanvas preview when typing text/adding images, with no visual gaps.

---

## Progress Tracking

- [ ] **Phase 7: High-Fidelity Spectrogram Steganography Engine**
- [ ] **Phase 8: Forensic Audio DSP & Manipulation Suite**
- [ ] **Phase 9: Unified AudioLab Workstation Architecture & UI**
- [ ] **Phase 10: CreateClueModal Integration, Performance & E2E Validation**
- [x] **Phase 11: AudioLab Spectrogram Preview & Player Parity** (completed 2026-08-16)

---
*Roadmap defined: 2026-08-15*
