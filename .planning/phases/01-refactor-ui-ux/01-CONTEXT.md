# Phase 1: Refactor UI/UX

**Domain:** Component UI structural refactoring (TSX inline styles to CSS utility classes)
**Goal:** Clean TSX to CSS, add micro-interactions, protect Cyberpunk aesthetic

## 🔒 Locked Requirements (from PROJECT/REQUIREMENTS)
- Remove all `style={{...}}` from `CreateClueModal.tsx`.
- Create reusable layout classes (`.nexus-row`, `.nexus-grid`, `.panel-header`).
- Apply specific styling (backdrop-filter, neon borders) to internal panels.
- Add hover/focus/disabled states with neon glow (`box-shadow`) to buttons/inputs.
- Implement horizontal smooth scroll for `.tabs-header` on overflow.
- Add fade-in animation to `.tab-content` switching.
- **Constraints:** Do NOT modify component logic/hooks. Do NOT remove existing glitch/scanline/pulse animations.

## 🧠 Implementation Decisions
### Styling Approach
- **CSS Strategy**: Use pure CSS utility classes in `CreateClueModal.css`.
- **Variables**: Use existing Nexus design system variables (`--nexus-blue`, `--nexus-glass`, `--nexus-dark`, etc.). Extract any hardcoded hex colors to `:root` variables or semantic utility classes.
- **Micro-interactions**: Use CSS transitions for fade-ins and hover glows. Scroll behavior handled via native CSS overflow.

### Component Structure
- **Preservation**: The JSX structure (DOM nodes) should remain largely the same, just replacing `style={...}` with `className="..."`.

## 📚 Canonical References
- `src/components/modals/CreateClueModal.tsx`
- `src/components/modals/CreateClueModal.css`

## 🔎 Code Context
- **Existing Asset**: The file already has Cyberpunk/High-tech aesthetic base (Nexus variables, scanlines, glitch).

---
*Generated: 2026-08-14*
