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

### Active

- [ ] Remove all inline styles (`style={{...}}`) from `CreateClueModal.tsx`.
- [ ] Create reusable CSS classes for layout (e.g., `.nexus-row`, `.nexus-grid`, `.panel-header`).
- [ ] Extract hardcoded colors in TSX to CSS classes or CSS variables in `:root`.
- [ ] Create specific CSS classes for internal panels (warning boxes, config grids) with `backdrop-filter` and subtle neon borders.
- [ ] Enhance interactive states (`:hover`, `:focus`, `:disabled`) for buttons and inputs with neon glow (`box-shadow`).
- [ ] Implement smooth horizontal scrolling for `.tabs-header` if content overflows.
- [ ] Add fade-in animation when switching `.tab-content` contents.
- [ ] Leave all logic, hooks, file handling, and database functions completely untouched.

### Out of Scope

- Modifying component logic or hooks — to prevent breaking the existing evidence creation system.
- Altering the backend or database interactions — scope is strictly UI/UX structural refactoring.
- Removing existing High-tech effects (glitch-anim, scanline, pulse) — strictly prohibited by design rules.

## Current State

**v1.0 (Shipped)**: Refatoração concluída, estilos inline movidos para CSS, Cyberpunk preservado.

## Current Milestone: v1.1 CreateClueModal UX & Copy Overhaul

**Goal:** Transform the CreateClueModal into a true 'Investigative Terminal' by rewriting copy with Cyberpunk terminology, adding tooltips, and improving empty states without changing underlying logic.

**Target features:**
- Immersive Texts & Quotes (Diegetic/Cyberpunk terminology, system quotes)
- Tooltip Implementation (lucide-react Info/HelpCircle for GM guidance)
- Helper Text Refinement (Clear impact explanations)
- Alerts & Error Prevention (Visual warnings for empty fields/passwords)

*(TBD - pending /gsd-new-milestone)*

## Context

- The system is functionally complete and stable.
- The visual identity is Cyberpunk/High-tech, relying on specific CSS variables (e.g., `--nexus-blue`, `--nexus-glass`).
- The user is extremely strict about not losing any existing visual effects.

## Constraints

- **Scope**: Code refactoring ONLY — No logic changes.
- **Styling**: Must use vanilla CSS and classes, no inline styles allowed.
- **Design**: Must strictly protect the existing Cyberpunk identity and specific visual effects.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Transfer all inline styles to CSS | Improves maintainability and code readability | — Pending |

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
*Last updated: 2026-08-14 after initialization*

