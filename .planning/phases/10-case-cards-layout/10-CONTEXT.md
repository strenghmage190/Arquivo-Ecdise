# Phase 10 Context: Case Cards Layout & Metadata

## Domain
Redesign case cards with elemental badges, dossiê codes, cover preview, paranormal metadata, and themed borders.

## Locked Requirements
- **CARD-01**: Elemental badge (cor do Elemento) no canto superior.
- **CARD-02**: Código de dossiê monoespaçado (Share Tech Mono, ID: #XXX-NN).
- **CARD-03**: Cover miniature with hover zoom effect.
- **CARD-04**: Metadados paranormais (ameaça, evidências).
- **CARD-05**: Borda temática 1px com cor sutil do Elemento.
- **CARD-06**: Data em fonte carimbo (Special Elite) na base.
- **CARD-08**: Clicking card navigates to dossiê directly.

## Implementation Decisions

### 1. Dossiê Code Generation
- **Derivado do Título**: O código do dossiê será gerado usando as iniciais do título do caso mais um número sequencial (ou hash curto do ID). Ex: "Operação Membrana" -> `#OM-01`.

### 2. Elemental Badge Location
- **Canto Superior Direito**: O selo do Elemento ficará posicionado no canto superior direito do card, flutuando (absoluto) sobre a imagem de capa.

### 3. Card Border Style
- **Borda Contínua (1px solid)**: Para manter a elegância digital e clean, a borda do card será sólida, usando a cor do Elemento correspondente (ex: vermelho para Sangue, amarelo/ouro para Conhecimento).

## Canonical References
- `REQUIREMENTS.md` (CARD requirements)
- `ROADMAP.md` (Phase 10 scope)

## Code Context
- Modifies `src/pages/Home.tsx` to update the mapping of `cases`.
- Introduces mock element determination logic (e.g., modulo on ID) since the DB doesn't have an Element column yet.
- Updates `src/pages/Home.module.scss` with card styling (`.case-card`, `.elemental-badge`, `.dossier-code`).
