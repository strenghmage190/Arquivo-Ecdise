# Phase 3: Canvas Cursor, Pointer Feedback & Interactions (including RGB Channel Isolation) - Context

**Phase:** 03-canvas-cursor-and-interactions
**Date:** 2026-08-15
**Status:** Ready for Planning

## Domain

Overhaul canvas cursor tracking, dynamic brush size circles, transform bounding boxes, and forensic RGB target channel isolation (pixel encoding & real-time channel mask).

## Implementation Decisions

### 1. Dynamic Canvas Cursor & Brush Follower
- **Visual:** Smooth SVG/canvas overlay circle matching the exact diameter of `brushSize`.
- **Anti-Glare Crosshair:** Integrated central crosshair with high-contrast blend mode (`mix-blend-mode: difference` or contrasting dual-ring border) so cursor is always visible on pure black, bright white, or colored spectra.
- **Contextual Cursors:** Dynamic switching based on tool and hover zone:
  - `draw` / `erase`: Brush circle + crosshair.
  - `select`: `default` or `grab` / `grabbing` when panning.
  - Transform handles: `nwse-resize`, `nesw-resize`, `ew-resize`, `ns-resize`, `crosshair` for rotation.
  - `placeText`: `text` cursor.

### 2. Forensic RGB Target Channel Isolation
- **Mechanism:** When `mode === 'rgb'`, the active drawing, text, and placed elements isolate data strictly to the selected channel (`targetChannel`: `'R' | 'G' | 'B'`).
- **Channel Routing:**
  - `R` channel: Pixel values `(intensity, 0, 0, alpha)` or blended into the Red component of the base image while zeroing out / preserving non-target channels.
  - `G` channel: Pixel values `(0, intensity, 0, alpha)`.
  - `B` channel: Pixel values `(0, 0, intensity, alpha)`.
- **Export & Preview:** During canvas export and live rendering, the output image data encodes secret clues into that specific color channel so standard forensic lenses (Red, Green, Blue channel filters) reveal the hidden message.

### 3. Interactive Transform Bounding Box
- **Visuals:** Neon cyan bounding box with corner handles and a rotation anchor.
- **Interactions:** Direct dragging on the canvas updates `layer.x`, `layer.y`, `layer.scale`, `layer.rotation`, and `layer.width` / `layer.height` with instant preview and history logging.

## Canonical References

- `src/components/tools/UVEditor.tsx` — Canvas viewport, mouse/pointer event listeners, and RGB channel pipeline.
- `src/components/tools/UVEditor.css` — Cursor styles, bounding box handles, and neon selection outlines.
- `src/components/tools/ForensicChannelEditor.tsx` — Reference implementation for channel pixel manipulation.

---
*Context captured: 2026-08-15*
