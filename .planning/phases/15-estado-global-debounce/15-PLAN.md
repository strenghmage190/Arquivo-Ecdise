# Phase 15 Plan: Estado Global & Debounce

## Context
Migração inicial do estado do InvestigationBoard.tsx para Zustand e implementação do debounce (300ms) no Realtime do Supabase.

## Wave 1: Inicialização e Debounce
- **15-01-01**: Setup Zustand Store & Realtime Debounce
  - Implementar debounce no `postgres_changes` usando `setTimeout(300ms)` e `pendingUpdatesRef`.
  - Criar `boardStore.ts` com o esqueleto do estado (`cards`, `connections`, `localPositions`).
  - **Verification**: `npm run dev` e arrastar cards múltiplos sem engasgos no console.
