# Phase 4 Discussion Log

**Phase:** 4 — Canvas-area Upgrades (UV-01, UV-03)
**Date:** 2026-08-15
**Areas discussed:** 4

---

## Area 1: Per-tool color identity

| Q | Options presented | Selection |
|---|-------------------|-----------|
| Mechanism | Root-scope (.tool-draw/.tool-erase reuse) / data-tool attr / Agent decides | Agent decides |
| Glow intensity | Box-shadow+border / Box-shadow+border+bg / Agent decides | Agent decides |
| Color palette | nexus-blue/red/purple/neutral (locked) / orange instead of red / Agent decides | nexus-blue / #ff3b3b / #b366ff / neutral (locked) |

**Notes:** All mechanics delegated; palette locked to match existing token system and layers panel.

---

## Area 2: Checkerboard placement & selector

| Q | Options presented | Selection |
|---|-------------------|-----------|
| Placement | ::before on .viewport-canvas / bg on .viewport-canvas / div in JSX | Agent decides |
| Colors/size | Dark #1a1a1a/#0d0d0d / Cyberpunk tint / Agent decides | Agent decides |

**Notes:** Agent picks cleanest approach. Debug bg rgb(10 10 10/60%) must be zeroed in same edit.

---

## Area 3: Image tool active state (JSX edit #2)

| Q | Options presented | Selection |
|---|-------------------|-----------|
| Trigger condition | imageFile !== null / tool === 'placeImage' / CSS-only (no JSX) | tool === 'placeImage' |

**Notes:** Verified `tool` state type includes `'placeImage'`. Button at line 2884 is the target. This is exactly JSX edit #2 of 3.

---

## Area 4: Performance-mode suppression

| Q | Options presented | Selection |
|---|-------------------|-----------|
| What to zero | box-shadow only / box-shadow+filter+border / Agent decides (follow existing pattern) | Agent decides |
| Checkerboard in perf-mode | Remains visible / Disappears | Disappears (heavy gradient) |

**Notes:** Agent follows existing performance-mode block pattern (~lines 468-488). No !important in new rules.

---

## Agent's Discretion Items

- CSS mechanism for per-tool color
- Glow intensity values
- Checkerboard technique and exact tone values
- Perf-mode suppression selector details

## Deferred Ideas

None.
