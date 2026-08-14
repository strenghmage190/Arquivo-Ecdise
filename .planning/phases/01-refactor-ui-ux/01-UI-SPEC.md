# Phase 01: CreateClueModal UI/UX Refactor - UI Spec

## Visual Identity Protection
- **Vibe:** High-tech / Cyberpunk
- **Animations:** `glitch-anim`, `pulse`, scanlines MUST remain intact.
- **Components:** `modal-overlay` vignette and `modal-dossier` corner decorators (`::before` / `::after`) MUST be preserved exactly as they are.
- **Variables:** Use `--nexus-blue`, `--nexus-glass`, `--nexus-dark`, `--nexus-border`, `--nexus-glitch`.

## Target Layout & Micro-interactions
- Transition all inline styles to CSS classes.
- Ensure inputs and buttons have neon glow states on hover/focus.
- Fade-in animation for `.tab-content`.
- Scrollbar support for `.tabs-header`.
- Keep component structure unchanged; replace `style={...}` with `className="..."`.
