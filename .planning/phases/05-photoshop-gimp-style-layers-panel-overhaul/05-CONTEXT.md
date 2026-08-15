# Phase 5 Context: Photoshop/GIMP-Style Layers Panel Overhaul

## Goal
Redesign the Layers Panel UI to closely match professional graphics editors (Photoshop/GIMP).

## Canonical References
- `ROADMAP.md` (Phase 5 definition)
- User Reference: https://github.com/gnome/gimp

## Decisions

### Selection Mechanics
- **Decision:** Standard OS/Photoshop mechanics.
- **Details:** Ctrl-click adds/removes individual layers to/from the selection. Shift-click selects a range. A simple click replaces the selection with the clicked layer.

### Opacity & Blend Mode Positioning
- **Decision:** Top of the Layers Panel.
- **Details:** Global controls above the layer list that apply modifications to the currently selected layer(s).

### Thumbnail Size & Layout Density
- **Decision:** Medium thumbnails (32-40px).
- **Details:** A balance between seeing the layer content and maintaining vertical density to show multiple layers without excessive scrolling. Rows should be simplified to show: Eye (Visibility), Lock, Thumbnail, and Name.
