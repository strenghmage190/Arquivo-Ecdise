# Phase 11: AudioLab Spectrogram Preview & Player Parity - Context

## Domain
Unify the AudioLab center spectrogram preview with the high-quality ProfessionalSpectrogram visualization used in the InspectionModal, removing layout visual bugs and overlapping the steganography payload preview on top of the real base audio.

## Canonical Refs
- `src/components/tools/ProfessionalSpectrogram.tsx`
- `src/components/tools/audiolab/AudioLab.tsx`
- `src/components/tools/audiolab/SpectrogramPreviewCanvas.tsx`
- `src/components/modals/InspectionModal.tsx`

## Codebase Context
The user specifically requested that the visualization from `InspectionModal.tsx` (the player tool for the final clue) is matched identically inside the AudioLab (the creator tool). `ProfessionalSpectrogram.tsx` is the component used for high-fidelity rendering, coupled with `InteractiveWaveform` for time/region navigation.

## Decisions

### 1. Spectrogram Synchronization & Layout
- **Decision:** The central area of `AudioLab` will dedicate its full space to `ProfessionalSpectrogram.tsx` to visualize the base audio, just like `InspectionModal`.
- **Details:** The Wavesurfer instance (`InteractiveWaveform`) will act as a thin timeline/navigation bar on top (or immediately below) the `ProfessionalSpectrogram` to control playback, region selection, and zooming, removing the "Limpar Seleção" button clutter from the visual center.

### 2. CSS Overlay Mechanics for Mix-Blend
- **Decision:** The steganography payload preview (`SpectrogramPreviewCanvas.tsx`) will be positioned `absolute` on top of the `ProfessionalSpectrogram.tsx`.
- **Details:** We will use a CSS `mix-blend-mode` like `screen` or `lighten` on the `SpectrogramPreviewCanvas`. This ensures that when the user types text or adds an image mask, they see exactly how the bright payload frequencies blend over the real audio frequencies of the base audio without fully obscuring them.

### 3. Performance & Rendering Strategy
- **Decision:** Maintain FFT calculation on the main thread via `ProfessionalSpectrogram.tsx`.
- **Details:** Reusing the exact component from `InspectionModal` guarantees visual parity and avoids complex Web Worker synchronization solely for UI preview. WebAudio FFT chunking in the current implementation is performant enough for the preview state.

## Deferred Ideas
- None.

