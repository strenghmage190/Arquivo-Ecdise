# Phase 11: Forms Controls & Modal

**Goal:** Estilização padronizada de formulários e controles de input.

## Requirements Covered
*   **FORM-01:** Checkboxes customizados com padrão do sistema (surface/border)
*   **FORM-02:** Selects customizados
*   **FORM-03:** Inputs com foco vermelho institucional (contorno fino, sem glow)
*   **FORM-04:** Textareas padronizados
*   **CREA-01:** Card "+ INICIAR PROTOCOLO" com borda tracejada e sigilo translúcido, hover acende dourado
*   **CREA-02:** Mestre seleciona Elemento do caso na criação
*   **CREA-03:** Mestre pode atribuir Evolução ao caso (opcional, revelável pelo mestre)

## 1. Global Forms Standardization (`src/styles/nexus.css`)
- [ ] Reset e estilização de `.nexus-input` e `.nexus-textarea` com foco vermelho (`--ordo-vermelho`) usando contorno simples de 1px (sem `box-shadow` ou glow neon).
- [ ] Estilizar checkboxes padrão (`.nexus-checkbox`) com design minimalista (surface/border) e marcador limpo.
- [ ] Estilizar `select` nativos para `.nexus-select` com setas unificadas.

## 2. Element Selection Grid (`src/components/ui/ElementGrid.tsx` or inline)
- [ ] Criar o componente visual para seleção de Elemento: um grid 2x2 ou linha de chips usando as cores oficiais (`--el-sangue`, `--el-morte`, `--el-energia`, `--el-conhecimento`).
- [ ] Adicionar microinterações (hover 150ms).

## 3. Modal Refactor (`src/pages/Home.tsx` & `src/pages/Home.module.scss`)
- [ ] Substituir o estilo dos campos locais `quick-input` e `quick-textarea` pelas classes globais `.nexus-input` e `.nexus-textarea`.
- [ ] Integrar a Seleção de Elemento ao modal de Novo Caso.
- [ ] Integrar seleção de "Evolução" (NEX % / Nível) usando o novo `.nexus-select` (opcional/CREA-03).
- [ ] Refinar o layout visual e o esquema de cores do modal de Novo Caso para focar nos tons neutros com vermelho apenas onde há aviso/foco, conforme D-01 e D-05.
- [ ] Melhorar o estilo do card "+ NOVO CASO" na grade (CREA-01).

## Verification
- Ao focar nos inputs, o contorno deve ser vermelho sólido, sem aura neon.
- Checkboxes e dropdowns devem apresentar o visual consistente sem arredondamentos, adotando `border-radius: 0` ou muito sutil (1-2px).
- O grid de elementos deve permitir selecionar e salvar o elemento correto para novos casos.
