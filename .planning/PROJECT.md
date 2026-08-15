# CreateClueModal UI/UX Refactor

## What This Is

A complete UI/UX structural refactoring of the `CreateClueModal` component. The goal is to clean up the TSX by moving all inline styles to CSS utility classes while preserving the existing High-tech / Cyberpunk aesthetics and micro-interactions.

## Core Value

Clean, maintainable component code (no inline styles) without losing any of the complex visual identity (neon, glitch, scanlines).

## Requirements

### Validated

- ✓ Complex evidence creation panel functionality — existing
- ✓ High-tech/Cyberpunk visual base (Nexus variables, scanlines, glitch) — existing
- ✓ Decorative corners (::before/::after) and modal-overlay vignette — existing
- ✓ CreateClueModal.tsx without inline styles — Phase 1 (v1.0)
- ✓ Reusable CSS classes for layout (nexus-row, nexus-grid, panel-header) — Phase 1 (v1.0)
- ✓ Hardcoded colors extracted to CSS classes/variables — Phase 1 (v1.0)
- ✓ Internal panel classes with backdrop-filter and neon borders — Phase 1 (v1.0)
- ✓ Interactive states with neon glow (hover/focus/disabled) — Phase 1 (v1.0)
- ✓ Tabs-header smooth horizontal scrolling — Phase 1 (v1.0)
- ✓ Tab-content fade-in animation — Phase 1 (v1.0)

### Active

- [ ] **UV-01**: Tools dock shows obvious pressed/active state for the selected tool (strong neon glow + colored border)
- [ ] **UV-02**: Insertion mode shows a large blinking banner "[ MODO DE INSERÇÃO ATIVO - CLIQUE NO CANVAS PARA POSICIONAR ]" with a big red cancel button
- [ ] **UV-03**: Canvas container shows a dark checkerboard (transparency) background so empty space is distinguishable from content
- [ ] **UV-04**: UVEditor.tsx contains no inline styles — all moved to semantic CSS classes (.uv-workspace, .uv-sidebar, .uv-property-group, .uv-range-slider)
- [ ] **UV-05**: Range sliders use Nexus/C.R.I.S styling (dark translucent track, neon glowing thumb on :hover)
- [ ] **UV-06**: Action buttons (Salvar, Fechar, Inverter Máscara) have satisfying :active transitions
- [ ] **UV-07**: Layers panel styling (purple glow, drag-and-drop animations) is integrated and preserved

### Out of Scope

- Modifying component logic or hooks — to prevent breaking the existing evidence creation system.
- Altering the backend or database interactions — scope is strictly UI/UX structural refactoring.
- Removing existing High-tech effects (glitch-anim, scanline, pulse) — strictly prohibited by design rules.
- CreateClueModal UX & Copy Overhaul (tooltips, copy imersiva, empty states) — v1.1 escopado e pulado por decisão do usuário; pode voltar em milestone futuro.

## Current State

**v1.0 (Shipped)**: Refatoração concluída, estilos inline movidos para CSS, Cyberpunk preservado.

**v1.1 (Skipped)**: CreateClueModal UX & Copy Overhaul foi escopado mas não executado — substituído pelo v1.2 (decisão do usuário).

## Current Milestone: v1.2 UVEditor "Mini-Photoshop" UX/UI Refactor

**Goal:** Transform the UVEditor into a professional Cyberpunk design tool — obvious tool states, guided insertion flow, zero inline styles, Nexus-styled controls.

**Target features:**
- Tools dock com estado "pressionado" óbvio (neon forte + borda colorida) para Pincel/Borracha/Seleção/Texto/Imagem
- Banner gigante e piscante em modo de inserção + botão cancelar vermelho
- Background quadriculado escuro (dark checkerboard) no canvas
- Remover todos os `style={{...}}` do TSX → classes semânticas (integra estilos de Camadas)
- Controles Nexus/C.R.I.S: sliders com track escuro e thumb neon; `:active` satisfatório em botões

## Context

- The system is functionally complete and stable.
- The visual identity is Cyberpunk/High-tech, relying on specific CSS variables (e.g., `--nexus-blue`, `--nexus-glass`).
- The user is extremely strict about not losing any existing visual effects.
- The UVEditor (`src/components/tools/UVEditor.tsx`, 3163 lines) is a complex image editor: pincel, máscaras, camadas, texto/imagem, pan/zoom.
- User reported the UVEditor is "horrível de mexer" and that placing texts/images is confusing.
- Layers styling (purple glow, drag-and-drop animations) already exists in `UVEditor.css` — must be integrated, not recreated.

## Constraints

- **Scope**: Code refactoring ONLY — No logic changes.
- **Styling**: Must use vanilla CSS and classes, no inline styles allowed.
- **Design**: Must strictly protect the existing Cyberpunk identity and specific visual effects.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Transfer all inline styles to CSS | Improves maintainability and code readability | ✓ Good (v1.0) |
| Skip v1.1 (CreateClueModal copy overhaul) | Priority on UVEditor UX — user reported "horrível de mexer" | — Pending |
| UVEditor refactor is skeleton + CSS only | Protect canvas math, render loops and hooks | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-14 after v1.2 milestone start*

