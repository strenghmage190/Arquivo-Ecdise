---
phase: 13
slug: refatora-o-css-e-re-renders
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-09-24
---

# Phase 13 — Plan

> Blindar componentes com React.memo e remover estilos CSS pesados para otimização visual sem gargalos de CPU/GPU.

---

## 🌊 Wave 1: Refatoração Visual (CSS & Tailwind)

| Task ID | Task Description | Verification | Assigned To | Status |
|---------|------------------|--------------|-------------|--------|
| 13-01-01 | Remover `backdrop-filter: blur` de `EvidenceCard.css` e `.clue-card`, substituindo por cor de fundo sólida com opacidade (`background-color: rgba(10, 15, 20, 0.8)`), preservando bordas neon (CSS-01) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |
| 13-01-02 | Remover classes de Tailwind `shadow-2xl` e equivalentes em `InvestigationBoard.tsx`, `EvidenceCard.tsx` e `EvidenceCardContent.tsx`, compensando com bordas sutis (CSS-02) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |
| 13-01-03 | Remover/Ajustar `backdrop-filter` no css do `.card-content-container` para remover o glassmorphism pesado, mantendo o glow neon (CSS-01) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |

---

## 🌊 Wave 2: Otimização de Re-renders (React.memo & hooks)

| Task ID | Task Description | Verification | Assigned To | Status |
|---------|------------------|--------------|-------------|--------|
| 13-02-01 | Refatorar `InvestigationBoard.tsx` para assegurar que props (funções como `onToggleStatus`, `onOpen`, `onEdit`) passadas para `EvidenceCard` sejam memoizadas com `useCallback`, evitando que a recriação da função na renderização do Board force re-render de 50+ cards (RND-02) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |
| 13-02-02 | Otimizar `InvestigationBoard.tsx`: Garantir que estados locais não-relacionados (como a posição do mouse para arraste/pan) não disparem renderização de todos os cards | `<automated>` npm run lint | 🤖 AI | ⬜ pending |
| 13-02-03 | Refinar `EvidenceCard.tsx` e `EvidenceCardContent.tsx`: Melhorar a função `propsAreEqual` do `React.memo` para não renderizar ao abrir cards individuais ou atualizar propriedades que não afetam aquele card (RND-02) | `<automated>` npm run lint | 🤖 AI | ⬜ pending |

---

## 📝 Files Modified

- `src/components/board/EvidenceCard.css`
- `src/components/board/EvidenceCard.tsx`
- `src/components/board/EvidenceCardContent.css`
- `src/components/board/EvidenceCardContent.tsx`
- `src/components/board/InvestigationBoard.tsx`

---

## 🔐 Threat Model

- **Security Requirements:** N/A (Alterações estritamente visuais e de performance no front-end; sem introdução de novas superfícies de ataque, manipulação de estado do DOM é local).
