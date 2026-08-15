---
phase: 3
slug: semantic-class-foundation-uv-04
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-15
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Jest (ts-jest, jsdom, identity-obj-proxy CSS mock) — existing |
| **Config file** | jest.config.js (exists) |
| **Quick run command** | `npm test -- --watch=false -- uv04-semantic-classes` |
| **Full suite command** | `npm test` + `npm run typecheck` + manual browser walkthrough |
| **Estimated runtime** | ~30 seconds (CSS refactor: automated checks are fs-grep based; jest mocks CSS, so UI-SPEC Verification Hooks are the authoritative gate) |

---

## Sampling Rate

- **After every task commit:** `Select-String -Pattern 'style=\{\{' src/components/tools/UVEditor.tsx | Measure-Object` count equals the §Implementation Order checkpoint value, plus `npm run typecheck`
- **After every plan wave:** `npm test` + `npm run typecheck` + the focused jest guard test
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| TBD | 01 | 1 | UV-04 (SC#1) | T-3-01 / — | style={{ count == 3; remaining are documented exceptions | static fs-grep unit | `npm test -- uv04-semantic-classes` | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | UV-04 (SC#2) | T-3-01 / — | load-bearing selectors byte-identical (.uv-editor-panel, .uv-right-panel, .uv-range, .tool-draw, .tool-erase) | static fs-grep unit | same test file | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | UV-04 (SC#4) | T-3-01 / — | "Semantic classes" block at END of UVEditor.css, zero `!important` | static fs-grep unit | same test file | ❌ W0 | ⬜ pending |
| TBD | 01 | 1 | UV-04 (SC#3/SC#4) | T-3-01 / — | canvas interactivity, touch drawing, file pickers, perf-mode visuals | manual (jest mocks CSS; no screenshot baseline) | manual walkthrough per §Implementation Order | n/a | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/uv04-semantic-classes.test.ts` — fs-based guard: regex-counts `style=\{\{` in UVEditor.tsx, asserts == 3 and each remaining match line context contains a live-state token (`inlineTextEdit` / `maskCursor` / `brushSize` / `background: color`); reads UVEditor.css, asserts the "Semantic classes" block starts with a `Semantic classes` comment AFTER the last existing rule and contains zero `!important`
- [ ] No framework install needed — Jest exists; the test file is the only Wave 0 gap

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Canvas draw (mouse + touch) | UV-04 (SC#3) | jest mocks CSS; no Cypress screenshot-diff baseline exists | Open CreateClueModal, draw with mouse and touch; verify strokes render identically to pre-refactor |
| Both file pickers | UV-04 (SC#3) | jest mocks CSS; no E2E harness | Open image file picker and texture picker; verify dialogs open and previews render |
| Performance-mode visuals | UV-04 (SC#4) | jest mocks CSS | Toggle performance mode; verify canvas/toolbar visuals match pre-refactor |
| Pixel-identical grid/header/Save/Close | UV-04 (SC#2) | no screenshot baseline | Screenshot-compare panel against pre-refactor build (manual visual diff) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
