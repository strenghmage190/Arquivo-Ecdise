# Phase 11 Discussion Log

## Area 1: Spectrogram Synchronization
- **Options presented:** `InteractiveWaveform` as a top navigation bar controlling zoom vs overlaying directly on the spectrogram.
- **Selection:** `InteractiveWaveform` as top navigation bar over `ProfessionalSpectrogram`.
- **Notes:** Matches the behavior and layout of `InspectionModal.tsx`, unifying the player and creator tools.

## Area 2: CSS Overlay Mechanics
- **Options presented:** `screen` vs `lighten` blend modes.
- **Selection:** `screen` / `lighten` via CSS `mix-blend-mode`.
- **Notes:** Ensures the steganography payload is clearly visible in the preview while preserving the base audio's visual presence.

## Area 3: Performance & Rendering Strategy
- **Options presented:** Keep on main thread (existing `ProfessionalSpectrogram` logic) vs migrate to Web Worker.
- **Selection:** Keep on main thread.
- **Notes:** Existing WebAudio FFT chunking logic is fast enough for the preview visualization, avoiding unnecessary architectural complexity.
