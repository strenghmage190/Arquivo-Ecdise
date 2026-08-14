---
phase: 01
slug: refactor-ui-ux
status: draft
wave_0_complete: false
created: 2026-08-14
---

# Phase 01: CreateClueModal UI/UX Refactor - Implementation Plan

## Goal
Despoluir o TSX do `CreateClueModal` movendo todos os estilos inline para `CreateClueModal.css`, padronizando classes utilitárias e componentes, sem alterar lógica e sem remover a identidade visual Cyberpunk (glitch, scanlines, cantoneiras, variáveis neon).

## Dependencies
- Nenhuma dependência externa. Apenas os arquivos do próprio modal.

## 🌊 Wave 1: Foundation (CSS)

### Task 01-01: Create Utility Classes
- **Description:** Adicionar no arquivo `.css` as classes utilitárias necessárias para substituir os inline styles (ex: `.relative`, `.text-center`, padding/margins, cores usando variáveis `--nexus-*`).
- **Files:** `src/components/modals/CreateClueModal.css`
- **Verification:** `<automated>` `npm run typecheck`

## 🌊 Wave 2: TSX Refactoring

### Task 01-02: Refactor Top-Level Layout & Form Fields
- **Description:** Substituir os `style={{...}}` nos containers principais (`form-row`, `.col`, inputs) por `className="..."` usando as novas classes.
- **Files:** `src/components/modals/CreateClueModal.tsx`
- **Verification:** `<automated>` `npm run typecheck`

### Task 01-03: Refactor Puzzles & Tools Components
- **Description:** Refatorar estilos inline dentro das abas complexas (AudioForge, Glitch Designer, Forensic, Thermal, Shredder, etc.).
- **Files:** `src/components/modals/CreateClueModal.tsx`
- **Verification:** `<automated>` `npm run typecheck`

## 🌊 Wave 3: Polish & Animations

### Task 01-04: Micro-interactions
- **Description:** Adicionar suporte a scroll na `.tabs-header`, padronizar neon glow nos botões/inputs, e garantir fade-in na `.tab-content`.
- **Files:** `src/components/modals/CreateClueModal.css`
- **Verification:** `<manual>` UI visual inspection for fade and scroll.
