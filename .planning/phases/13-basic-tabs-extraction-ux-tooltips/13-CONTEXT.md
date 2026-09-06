# Phase 13: Basic Tabs Extraction & UX Tooltips - Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** User Discussion

<domain>
## Phase Boundary

Extração e estilização das abas de Mídia Visual (`TabVisual`) e Áudio (`TabAudio`) do `CreateClueModal_Refactored.tsx`, implementando Tooltips de UX para campos complexos (ex: Filtros UV, Fake Phone/Data). A aba `TabGeneral` já foi predominantemente extraída na Phase 12.
</domain>

<prior_decisions>
## Carrying Forward from Phase 12
- O UI system utilizará as classes estabelecidas `.cc-field`, `.cc-input`, `.cc-checkbox`, `.cc-divider`.
- As abas devem seguir a mecânica do novo layout full-screen com 3D Flips.
</prior_decisions>

<decisions>
## Implementation Decisions

### Media Handling (TabVisual)
- **Preview Interativo:** Ao invés de um campo de arquivo simples, a interface terá um "Rich preview com Grid" inspirado no UVEditor. O preview da imagem carregada aparecerá sobre um grid Cyberpunk com suporte básico a exibição de dimensões/redimensionamento visual.

### UX Tooltips
- **Estilo Padrão:** Uso do componente `Tooltip` do `react-tooltip` atrelado a ícones `<Info />` da biblioteca `lucide-react`, mantendo a consistência do sistema. Tooltips devem adotar a classe CSS `.cyber-tooltip`.

### TabAudio
- **the agent's Discretion:** A interface de carregamento de áudio (AudioLab integrador ou simples file picker para `audioBase`/`audioHidden`) segue a critério do dev, priorizando o reuso dos hooks existentes da Phase 7-11 se cabível, ou apenas file inputs estilizados `.cc-input`.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `src/components/modals/CreateClueModal_Refactored.css` — Estilos Core Cyberpunk (cc-field, cc-checkbox).
- `src/components/modals/createclueTabs/TabGeneral.tsx` — Exemplo de layout e organização das abas no novo formato.
</canonical_refs>

<specifics>
## Specific Ideas
- O Grid no `TabVisual` deve remeter à estética do `UVEditor` para conectar a linguagem visual do projeto.
</specifics>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 13-basic-tabs-extraction-ux-tooltips*
*Context gathered: 2026-09-06 via GSD discussion*
