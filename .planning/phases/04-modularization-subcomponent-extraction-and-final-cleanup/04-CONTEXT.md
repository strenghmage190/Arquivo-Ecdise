# Phase 4 Context

**Phase:** 04-modularization-subcomponent-extraction-and-final-cleanup
**Date:** 2026-08-15

## Domain
Decompose the 3,100+ line monolithic `UVEditor.tsx` into modular subcomponents and custom hooks, eliminating raw inline styles and technical debt.

## Decisions

### Gerenciamento de Estado
- **Decisão:** Criar um `UVEditorContext` (React Context API) para o estado global do editor.
- **Nota:** Isso evitará prop drilling excessivo ao extrair as sub-peças (Toolbar, Viewport, Layers).

### Estrutura de Diretórios
- **Decisão:** Os subcomponentes extraídos serão alocados na pasta dedicada `src/components/tools/uveditor/`.

### Estrutura CSS & Estilização
- **Decisão:** Usar Tailwind CSS em múltiplos arquivos/componentes divididos.
- **Nota Importante para o Planner:** O Tailwind **ainda não está instalado** no projeto. A fase de planejamento deverá incluir o setup do Tailwind (instalação e configuração `tailwind.config.js`) ou o uso de estilos utilitários análogos caso o usuário não queira alterar a build.

## Canonical Refs
- N/A

## Code Context
- Monolithic target: `src/components/tools/UVEditor.tsx`
- Monolithic stylesheet: `src/components/tools/UVEditor.css`
