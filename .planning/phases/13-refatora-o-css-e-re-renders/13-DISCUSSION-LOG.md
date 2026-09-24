# Phase 13: Refatoração CSS e Re-renders - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-09-24T15:05:30Z
**Phase:** 13-refatora-o-css-e-re-renders
**Areas discussed:** Substituição de Estética CSS, Abordagem de Memoização

---

## Substituição de Estética CSS

| Option | Description | Selected |
|--------|-------------|----------|
| Trocar por opacidade sólida (ex: bg-black/80) sem blur, mantendo as bordas neon atuais. | | ✓ |
| Remover fundo translúcido e usar bg-black com brilho (glow) reduzido nas bordas. | | |

**User's choice:** Trocar por opacidade sólida (ex: bg-black/80) sem blur, mantendo as bordas neon atuais.
**Notes:**

---

## Abordagem de Memoização

| Option | Description | Selected |
|--------|-------------|----------|
| Focar no `InvestigationBoard`, `EvidenceCard` e `ClueNodes` (onde mais ocorre renderização e scroll). | | ✓ |
| Focar nos `Inputs` e modais interativos que atualizam estados globais repetidamente. | | |
| Blindar ambos (Cards/Nós no board e Inputs com alta taxa de digitação). | | |

**User's choice:** Focar no `InvestigationBoard`, `EvidenceCard` e `ClueNodes` (onde mais ocorre renderização e scroll).
**Notes:**

---

## the agent's Discretion

## Deferred Ideas
