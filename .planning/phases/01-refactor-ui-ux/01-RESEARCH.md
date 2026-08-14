## RESEARCH COMPLETE
# Phase 01: CreateClueModal UI/UX Refactor - Research

## Context
The user wants to remove `style={{...}}` from `CreateClueModal.tsx` and move them into utility classes in `CreateClueModal.css`.
The Cyberpunk visual identity (animations, variables, corner borders) must be preserved.

## Findings
- `CreateClueModal.tsx` is very large (~4300 lines) and contains many inline styles (`style={{ display: 'flex', gap: '6px' }}`, `style={{ padding: '16px', textAlign: 'center' }}`, etc.).
- `CreateClueModal.css` already has some utility classes like `.flex`, `.flex-col`, `.items-center`, `.justify-center`, `.gap-3`, `.text-gray-500`, `.text-sm`, etc.
- We need to create more utility classes for layout padding, fonts, and colors, to replace the existing inline styles. For example: `.relative`, `.text-center`, `.p-4` (or similar padding utils), `.cursor-pointer`, `.text-nexus-blue`, `.text-xs`, `.font-medium`, etc., or domain-specific ones like `.template-card`, `.template-list`, `.template-header`.
- The modal uses CSS variables heavily (`--nexus-blue`, `--nexus-glass`, `--nexus-dark`, `--nexus-border`, etc.). These must not be removed.
- Animations like `glitch-anim` and pseudo-elements (cantoneiras) in `.modal-dossier` must be protected.

## Recommended Approach
1.  **CSS Class Definitions:** Identify common inline style patterns (like Flexbox layouts, paddings, text colors/sizes, absolute positioning) and define corresponding CSS utility classes or component-specific classes in `CreateClueModal.css`.
2.  **TSX Refactoring:** Systematically replace `style={{...}}` objects with `className="..."` concatenations, retaining existing classes and appending the new ones.
3.  **Micro-interactions:** Add the requested neon glow hover/focus states to inputs and buttons (some already exist, but standardize them). Add fade-in animations to `.tab-content` and scroll support to `.tabs-header`.
4.  **No Logic Changes:** Keep all React hooks, state logic, and API calls completely intact.
