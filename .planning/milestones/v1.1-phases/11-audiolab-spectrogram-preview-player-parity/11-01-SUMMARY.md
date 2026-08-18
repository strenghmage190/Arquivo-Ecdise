# Plan 11-01 Summary

## Objective
Implement the UI and logic changes to match the AudioLab center preview with the player's high-fidelity visualization, replacing the basic Wavesurfer spectrogram plugin with the main thread `ProfessionalSpectrogram` component.

## Changes Made
- Updated `AudioLayerPanel.tsx` to pass the loaded base audio blob URL to the parent component and removed duplicate export buttons to clear up workspace clutter.
- Modified `InteractiveWaveform.tsx` to accept a `timelineOnly` boolean flag which skips initialization of the spectrogram plugin for performance and visual consistency.
- Updated `ProfessionalSpectrogram.tsx` to accept a `hideDecorations` boolean flag which hides the textual headers and footers to allow full-canvas embedding.
- Updated `SpectrogramPreviewCanvas.tsx` to only render the payload pixels (using `intensity` and `mixRatio`) with a pure black background and no axes when a base audio is present.
- Overhauled the center column of `AudioLab.tsx` to stack `InteractiveWaveform` (as a 40px timeline), `ProfessionalSpectrogram` (rendering the base audio), and `SpectrogramPreviewCanvas` (composited via `mix-blend-mode: screen` and absolutely positioned over the spectrogram).

## Next Steps
- Validate that the UI accurately layers the pixels without jitter when scrolling.
- Verification via user interface.
