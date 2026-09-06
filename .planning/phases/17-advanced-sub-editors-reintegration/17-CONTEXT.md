# Phase 17: Advanced Sub-editors Reintegration - Context

**Gathered:** 2026-09-06
**Status:** Ready for planning
**Source:** User Discussion

<domain>
## Phase Boundary

Migrar e reconectar os submódulos de editores complexos (`UVEditor`, `AudioLab`, `PhoneViewer`, `GlitchImageEngine`, etc.) do arquivo legado `CreateClueModal.tsx` para o novo ecossistema do `CreateClueModal_Refactored.tsx`. Isso garantirá que os botões nas abas refatoradas de fato abram as ferramentas.
</domain>

<prior_decisions>
## Carrying Forward from Earlier Phases
- O design Cyberpunk (3D Flips, `.cc-tab-content`, etc.) implementado nas Phases 12-16 deve permanecer intocado.
- A comunicação entre Abas e o Modal Pai ocorre via `ClueModalContext.tsx`.
</prior_decisions>

<decisions>
## Implementation Decisions

### Sub-editor Loading Behavior
- **Importação Estática:** Todos os sub-editores (incluindo o AudioLab que era *lazy loaded*) devem ser importados estaticamente no `CreateClueModal_Refactored.tsx`. Não usaremos `React.lazy` para evitar loadings e spinners irritantes, visto que a aplicação é voltada para Desktop e o tamanho do bundle não é uma restrição crítica.

### State Management
- **Context-Driven Triggers:** Os estados que controlam a abertura dos portais (ex: `editorMode`, `showAudioForgeFor`, `uvEditorBaseUrl`) devem ser elevados para dentro do `ClueModalContext.tsx`, permitindo que qualquer Aba (como a `TabVisual` ou `TabAudio`) dispare a abertura dos modais com facilidade.
- **Rendering:** A renderização real (`createPortal`) deve ficar no final do arquivo `CreateClueModal_Refactored.tsx`, para garantir que os editores cubram todo o Modal Cyberpunk.
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

- `src/components/modals/CreateClueModal.tsx` — Origem do código e das funções (ex: `processRGBMerge`, `uploadAudio`) que precisam ser migradas.
- `src/contexts/ClueModalContext.tsx` — Destino dos estados que gerenciam a exibição dos modais.
</canonical_refs>

<deferred>
## Deferred Ideas
None
</deferred>

---

*Phase: 17-advanced-sub-editors-reintegration*
*Context gathered: 2026-09-06 via GSD discussion*
