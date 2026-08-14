---
phase: 01
slug: refactor-ui-ux
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-08-14
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (configured in Vite) / React Testing Library / manual UI check |
| **Config file** | none — UI manual check or existing vitest |
| **Quick run command** | `npm run typecheck` or UI visual inspection |
| **Full suite command** | `npm run build` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm run typecheck`
- **After every plan wave:** Run `npm run build`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | REF-01 | — | N/A | build | `npm run typecheck` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | REF-02 | — | N/A | build | `npm run typecheck` | ✅ | ⬜ pending |
| 01-01-03 | 01 | 2 | UI-01 | — | N/A | manual | `npm run dev` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Check existing component mounts (manual or test)

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Glitch Anim | REF-03 | CSS Animation | Verify neon text glitches. |
| Scanlines | REF-03 | CSS Overlay | Verify CRT lines visible over modal. |
| Cantoneiras | REF-03 | CSS ::before/after | Verify cyan corners exist. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
