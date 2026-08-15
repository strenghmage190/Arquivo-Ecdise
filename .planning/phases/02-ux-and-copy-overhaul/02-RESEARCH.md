# Phase 2: UX and Copy Overhaul - Research

## Context
We are refactoring CreateClueModal.tsx to use "Investigative Terminal" diegetic language. We also need to add GM tooltips and handle empty state warnings without breaking the extensive existing logic (which includes many complex hooks for audio forging, thermal editing, UV overlay, forensic image processing, glitch processing, etc.).

## Findings
1. **Component Complexity**: CreateClueModal.tsx is a massive component (>4000 lines) with extensive local state management. It's crucial that we **only** alter the JSX text content, placeholders, and add tooltip icons.
2. **Tooltips**: The lucide-react library will be used to import Info or HelpCircle. Tooltips should appear on hover/tap.
3. **Empty States**: Required fields should have a subtle "Aguardando input" placeholder/state. On submit, if they are empty, they should show a neon red warning.

## Recommendations for Planner
- **Target File**: src/components/modals/CreateClueModal.tsx
- **Scope**: Identify the eturn block and JSX elements. Replace static text labels (e.g. "Título da Pista") with diegetic ones (e.g. "Matriz Visual Não Estabelecida" or "Identificador da Evidência").
- **Constraint Check**: Ensure no useState, useEffect, or API call logic is touched.
