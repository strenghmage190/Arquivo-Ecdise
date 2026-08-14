# Requirements

## v1 Requirements

### Refactoring
- [ ] **REF-01**: Remove all `style={{...}}` from `CreateClueModal.tsx`.
- [ ] **REF-02**: Extract TSX hardcoded colors to CSS classes or `:root` variables.
- [ ] **REF-03**: Create reusable layout classes (`.nexus-row`, `.nexus-grid`, `.panel-header`).
- [ ] **REF-04**: Apply specific styling (backdrop-filter, neon borders) to internal panels.

### UI/UX Polish
- [ ] **UI-01**: Add hover/focus/disabled states with neon glow (`box-shadow`) to buttons/inputs.
- [ ] **UI-02**: Implement horizontal smooth scroll for `.tabs-header` on overflow.
- [ ] **UI-03**: Add fade-in animation to `.tab-content` switching.

## Out of Scope
- Modifying component logic or hooks — strictly structural HTML/CSS refactoring.
- Removing existing High-tech effects (glitch-anim, scanline, pulse).
