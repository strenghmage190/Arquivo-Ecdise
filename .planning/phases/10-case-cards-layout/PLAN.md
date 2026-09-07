# Phase 10: Case Cards Layout & Metadata

**Goal:** Redesign case cards with elemental badges, dossiê codes, cover preview, paranormal metadata, and themed borders.

## Requirements Covered
*   CARD-01: Elemental badge no canto superior.
*   CARD-02: Código de dossiê monoespaçado (ID: #XXX-NN).
*   CARD-03: Cover miniature with hover zoom effect.
*   CARD-04: Metadados paranormais (ameaça, evidências).
*   CARD-05: Borda temática 1px com cor sutil do Elemento.
*   CARD-06: Data em fonte carimbo (Special Elite) na base.
*   CARD-08: Clicking card navigates to dossiê directly.

## 1. Helper Functions (`src/pages/Home.tsx`)
- [ ] Implementar `generateDossierCode(title, id)`: extrai as iniciais do título e anexa um prefixo baseado no ID.
- [ ] Implementar `getCaseElement(id)` (mock): seleciona um elemento (Sangue, Morte, Energia, Conhecimento) determinística e visualmente baseado no ID do caso.
- [ ] Implementar metadados mockados (Nível de Ameaça e Evidências).

## 2. Card Refactor (`src/pages/Home.tsx`)
- [ ] Atualizar o markup do `.case-card` mapeado na Home.
- [ ] Inserir a div do selo do Elemento (canto superior direito).
- [ ] Inserir o código do dossiê no layout (`.font-terminal`).
- [ ] Inserir os metadados paranormais (Ameaça, Qtd. Evidências).
- [ ] Inserir a data de criação formatada (`.font-documento`).

## 3. Styling (`src/pages/Home.module.scss`)
- [ ] Adicionar variáveis CSS locais na div pai via estilo inline (ex: `--card-color: var(--el-sangue)`).
- [ ] Aplicar borda sólida 1px baseada na cor do elemento.
- [ ] Configurar a `.case-cover` para usar `transform: scale()` no hover, mantendo-se restrita à caixa usando `overflow: hidden`.
- [ ] Posicionar o badge absoluto no canto superior direito do card.

## Verification
- Cards devem apresentar bordas com as cores dos elementos corretos.
- Os códigos dos dossiês devem parecer gerar iniciais coerentes.
- Animação de zoom na capa não deve extravasar o card.
