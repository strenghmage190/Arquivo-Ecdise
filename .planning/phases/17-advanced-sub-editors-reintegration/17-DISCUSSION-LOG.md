# Phase 17: Advanced Sub-editors Reintegration - Discussion Log

**Date:** 2026-09-06

## Gray Area: Sub-editor Loading Behavior
**Question:** Phase 17 Sub-editors Reintegration: How should we handle the loading of these heavy sub-editors in the new modal?
**Options presented:**
1. Keep all as static imports to avoid loading spinners, since they are core tools and the bundle size is fine for desktop.
2. Lazy-load all heavy sub-editors (UVEditor, ThermalEditor, GlitchEngine) with React.lazy to drastically speed up the modal's initial render.
**User selected:** Keep all as static imports
**Notes:** O usuário preferiu imports estáticos diretos para garantir responsividade imediata (zero spinners) na versão Desktop. O `React.lazy` atualmente presente no AudioLab legado será removido.

---

## Deferred Ideas
- Nenhuma.
