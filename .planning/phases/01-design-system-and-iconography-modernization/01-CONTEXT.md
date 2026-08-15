# Phase 1: Design System & Iconography Modernization - Context

**Phase:** 01-design-system-and-iconography-modernization
**Date:** 2026-08-15
**Status:** Ready for Planning

## Domain

Complete elimination of all emojis from `UVEditor`, `LayersPanel`, `LayerItem`, and `LayerIcons`. Implementation of crisp, scalable Lucide React SVG icons styled with the Nexus Cyberpunk design system (neon cyan `#00f3ff`, neon magenta `#ff0055`, neon green `#00ff66`, dark glass surfaces, glowing borders).

## Implementation Decisions

### 1. Toolbar & Action Iconography
- **Icon Format:** 100% SVG icons via `lucide-react` components (`MousePointer`, `Pencil`, `Eraser`, `Image`, `Type`, `Save`, `X`, `Layers`, `Settings`, `Trash2`, `Copy`, `Plus`, `FolderPlus`, `Folder`, `Eye`, `EyeOff`, `Lock`, `Unlock`, `Sparkles`, `Radio`).
- **Toolbar Layout:** Sleek icon buttons with cyberpunk active glow states (`0 0 12px var(--nexus-cyan)`), dark frosted background, and standard 36x36px hit targets.
- **Header & Modals:** Replace emojis in title bars (`🔬`, `🎨`, `💡`) with corresponding Lucide icons (`Sparkles`, `Palette`, `Eye`) alongside styled text.

### 2. RGB Forensic Channel Selectors
- **Visual Design:** Cyberpunk neon badges for Red (`#ff4444`), Green (`#00ff66`), and Blue (`#00d7ff`) channels.
- **Active State:** Solid neon border with outer radial glow and high-contrast active indicator.

### 3. Layer Item Controls & Interaction
- **Persistent Controls:** Dedicated SVG toggle buttons for Visibility (`Eye` / `EyeOff`) and Lock state (`Lock` / `Unlock`) on every layer row.
- **Action Controls:** Secondary actions (`Duplicate`, `Delete`, `Edit Mask`) revealed cleanly on layer item hover to avoid visual clutter while remaining accessible.
- **Layer Type Indicators:** Custom SVG icons for Drawing (`Pencil`), Text (`Type`), Image (`Image`), and Group (`Folder`).

## Canonical References

- `src/components/tools/UVEditor.tsx` — Main editor component containing emoji toolbars and header.
- `src/components/tools/UVEditor.css` — Stylesheet to be overhauled with Nexus tokens.
- `src/components/LayersPanel.tsx` — Layers container component.
- `src/components/LayerItem.tsx` — Individual layer row component.
- `src/components/LayerIcons.tsx` — Icon helper components.
- `src/styles/nexus.css` — Core Cyberpunk design tokens, colors, and neon glows.

## Deferred Ideas

- Full WebGL pixel shader pipeline (remain on 2D Canvas + Web Workers for now).

---
*Context captured: 2026-08-15*
