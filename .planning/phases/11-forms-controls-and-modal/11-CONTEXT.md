# Phase 11: Forms Controls & Modal - Context

**Gathered:** 2026-09-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Reestilização e padronização completa dos controles de formulário (inputs, textareas, selects, checkboxes) com padrão institucional Ordo Realitas / Terminal Forense e atualização visual do Modal de Criação de Caso ("+ NOVO CASO").

</domain>

<decisions>
## Implementation Decisions

### Controles de Formulário e Foco
- **D-01:** Inputs e Textareas recebem borda neutra e foco com contorno fino de 1px em vermelho institucional (`var(--ordo-vermelho, #ff003c)`) sem glow neon excessivo.
- **D-02:** Checkboxes e Selects customizados seguindo padrão do sistema (surface escuro, contorno sutil, tipografia mono/terminal).
- **D-03:** Regras e estilos definidos de forma global em `nexus.css` para consistência em toda a aplicação.

### Modal de Criação de Caso ("+ NOVO CASO")
- **D-04:** Seleção de Elemento do Caso implementada via grid de chips/botões com os selos dos 4 Elementos (Sangue, Morte, Energia, Conhecimento).
- **D-05:** Campos de Título, Descrição, Imagem de Capa e Elemento integrados com validação visual no tema institucional.

### the agent's Discretion
- Microinterações de hover nos chips de elementos e transições de borda (150ms).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `.planning/REQUIREMENTS.md` — Seções FORM-01 a FORM-04 e CREA-01 a CREA-03.
- `src/styles/nexus.css` — Sistema de variáveis e tokens do tema institucional.
- `src/pages/Home.tsx` — Modal `showCreateModal` e fluxo de criação de caso.
- `src/pages/Home.module.scss` — Estilos do modal e inputs locais.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `Button.tsx`: Botões com variantes (`ghost`, `solid`, `close`).
- Variáveis elementais em CSS (`--el-sangue`, `--el-morte`, `--el-energia`, `--el-conhecimento`).
- Componentes de input em `Home.tsx` (`quick-modal`, `quick-input`, `quick-textarea`).

### Established Patterns
- Formulários monocromáticos com acento apenas no foco ou em dados de caso.
- `border-radius: 0` ou cantos discretos e contornos finos de 1px.

### Integration Points
- `src/styles/nexus.css`: Estilização global de `<input>`, `<textarea>`, `<select>`, e `.nexus-checkbox`.
- `src/pages/Home.tsx` e `Home.module.scss`: Refatoração do `quick-modal` para o seletor de elementos e inputs padronizados.

</code_context>

<specifics>
## Specific Ideas
- Seleção direta por chips dos 4 Elementos facilita atribuição rápida ao criar investigação.
- Contorno de foco fino de 1px em vermelho institucional para dar a sensação de terminal militar/forense sem poluição visual.

</specifics>

<deferred>
## Deferred Ideas
None — discussion stayed within phase scope.

</deferred>

---

*Phase: 11-forms-controls-and-modal*
*Context gathered: 2026-09-07*
