# Phase 15 Context: Estado Global & Debounce

## Domain
Extração de estados massivos para Zustand e adição de debounce no Supabase Realtime para evitar re-renders drásticos no InvestigationBoard.

## Decisions
### Estratégia de Migração Zustand
- **Decisão**: Apenas setup inicial e migração incremental sob demanda.
- **Motivação**: Refatorar 2.7k linhas (Big Bang) quebra o app. Manter os dois estados vivos e migrar os componentes pequenos aos poucos reduz o risco a quase zero.

### Frequência do Debounce (Supabase Realtime)
- **Decisão**: 300ms (economia máxima).
- **Motivação**: Otimiza para PCs e celulares mais fracos; poupa bateria e processamento ao agrupar múltiplos eventos rápidos.

## Deferred Ideas
- Refatoração total (Big Bang) de todas as 2.700 linhas. Manteve-se o escopo incremental.

## Canonical Refs
- ROADMAP.md
