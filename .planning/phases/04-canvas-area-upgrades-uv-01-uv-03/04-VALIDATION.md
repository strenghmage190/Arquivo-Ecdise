---
phase: 4
slug: canvas-area-upgrades-uv-01-uv-03
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-15
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (existing in project) |
| **Config file** | `vite.config.ts` (no separate vitest config) |
| **Quick run command** | `npm run build` (TypeScript compilation check — fastest indicator) |
| **Full suite command** | `npm run build && grep -c "style={{" src/components/tools/UVEditor.tsx` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run build` (must exit 0)
- **After Wave 1 (CSS):** Run full CSS invariant checks (see map below)
- **After Wave 2 (JSX):** Run `npm run build` + JSX edit count verification
- **Before `/gsd-verify-work`:** Visual browser verification of UV-01 + UV-03

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| T-01 | CSS tokens | 1 | UV-01 | N/A | New CSS vars in :root | Source assertion | `grep "tool-erase-color" src/components/tools/UVEditor.css` | UVEditor.css | pending |
| T-02 | Per-tool glow rules | 1 | UV-01 | N/A | 5 title-attr selectors present | Source assertion | `grep -c "tool-button\[title" src/components/tools/UVEditor.css` → must be ≥5 | UVEditor.css | pending |
| T-03 | Checkerboard ::before | 1 | UV-03 | N/A | conic-gradient present, pointer-events:none | Source assertion | `grep "conic-gradient" src/components/tools/UVEditor.css` | UVEditor.css | pending |
| T-04 | Debug bg removal | 1 | UV-03 | N/A | background-color: transparent on canvas | Source assertion | `grep "background-color: transparent" src/components/tools/UVEditor.css` | UVEditor.css | pending |
| T-05 | Perf-mode glow suppression | 1 | UV-01 | N/A | box-shadow: none in perf-mode block | Source assertion | `grep -A2 "performance-mode.*tool-button" src/components/tools/UVEditor.css` | UVEditor.css | pending |
| T-06 | Perf-mode checkerboard suppression | 1 | UV-03 | N/A | display: none in perf-mode block | Source assertion | `grep -A2 "performance-mode.*viewport-canvas" src/components/tools/UVEditor.css` | UVEditor.css | pending |
| T-07 | No !important in source rules | 1 | SC#4 | N/A | Source glow/checkerboard rules have no !important | Source assertion | grep new rules block for !important → 0 results in Phase 4 source rules | UVEditor.css | pending |
| T-08 | JSX className edit | 2 | UV-01 | N/A | Image button gets active class | Source assertion | `grep "placeImage.*active" src/components/tools/UVEditor.tsx` | UVEditor.tsx | pending |
| T-09 | JSX style count unchanged | 2 | SC milestone | N/A | style={{ count remains 3 | Source assertion | `grep -c "style={{" src/components/tools/UVEditor.tsx` → 3 | UVEditor.tsx | pending |
| T-10 | Build passes | 2 | Global | N/A | No TS errors | Build check | `npm run build` → exit 0 | — | pending |

---

## Canvas Invariant Regression Checks

These must pass after every CSS edit:

| Invariant | Check | Expected |
|-----------|-------|----------|
| Canvas pointer-events | `grep "pointer-events: auto !important" src/components/tools/UVEditor.css` | 1+ match |
| Canvas z-index | `grep "z-index: 1100 !important" src/components/tools/UVEditor.css` | 1+ match |
| No animations import | `grep "animations" src/components/tools/UVEditor.tsx` | 0 matches |
