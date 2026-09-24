# Phase 15 Research: Estado Global & Debounce

## Objective
Avaliar o impacto e a estratégia de migração do estado local massivo do `InvestigationBoard.tsx` para o `Zustand`, e documentar a otimização de Supabase Realtime (Debounce).

## Findings
1. **Debounce no Supabase Realtime**:
   - O Supabase envia eventos `UPDATE` via `postgres_changes`.
   - Se 60 eventos chegarem por segundo, o componente quebra por re-renders.
   - Solução adotada (e já testada localmente): Acumular as mudanças em um `useRef` (e.g. `pendingUpdatesRef`) e disparar o flush usando `setTimeout` com debounce de **300ms** (conforme contexto decidido pelo usuário).
   
2. **Setup do Zustand**:
   - `src/store/boardStore.ts` já deve ser criado para expor `cards`, `connections` e `localPositions`.
   - Evitar migração Big Bang: manter os 2.7k linhas do `InvestigationBoard.tsx` intactas e migrar apenas pequenos nós filhos um a um, utilizando o estado legado como "coexistência".

## Validation Architecture
- **Teste de Debounce**: Monitorar a Network/Console durante múltiplos cliques e drags. O estado deve sincronizar apenas 1 vez a cada 300ms.
- **Teste de Estado Zustand**: Componentes filhos extraídos devem ler do hook `useBoardStore()` e refletir no board principal.
