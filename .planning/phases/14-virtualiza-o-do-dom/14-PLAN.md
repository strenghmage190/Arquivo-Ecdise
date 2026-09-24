---
phase: 14
slug: virtualiza-o-do-dom
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-24
---

# Phase 14 — Plan

> Implementar scroll virtual em listas gigantes para eliminar travamentos

---

## 🌊 Wave 1: Virtualização de Listas 1D (Painéis e Modais)

| Task ID | Task Description | Verification | Assigned To | Status |
|---------|------------------|--------------|-------------|--------|
| 14-01-01 | Instalar `react-virtuoso` via npm (DOM-01) | `<automated>` npm list react-virtuoso | 🤖 AI | ⬜ pending |
| 14-01-02 | Refatorar `TerminalSearch.tsx` para utilizar `<Virtuoso>` na renderização do array de history (DOM-02) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |
| 14-01-03 | Refatorar `CreatorHub.tsx` para utilizar `<VirtuosoGrid>` ou `<Virtuoso>` na renderização do catálogo de cards, lidando corretamente com CSS (DOM-02) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |

---

## 🌊 Wave 2: Virtualização Customizada 2D (Quadro Principal)

| Task ID | Task Description | Verification | Assigned To | Status |
|---------|------------------|--------------|-------------|--------|
| 14-02-01 | Implementar algoritmo de culling 2D em `InvestigationBoard.tsx`: Computar os limites visíveis baseados em `origin`, `zoom`, e dimensões da janela, aplicando overscan alto (500px) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |
| 14-02-02 | Integrar o culling ao fluxo de renderização: Filtrar o array de `cards` e `connections` (se aplicável) renderizando apenas instâncias que cruzam os limites visíveis (DOM-02) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |

---

## 📝 Files Modified

- `package.json`
- `src/components/board/TerminalSearch.tsx`
- `src/components/modals/CreatorHub.tsx`
- `src/components/board/InvestigationBoard.tsx`

---

## 🔐 Threat Model

- **Security Requirements:** N/A (Apenas otimização de renderização front-end DOM)
