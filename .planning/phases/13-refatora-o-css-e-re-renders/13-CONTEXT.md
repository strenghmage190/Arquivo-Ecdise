# Phase 13: Refatoração CSS e Re-renders - Context

**Gathered:** 2026-09-24T15:05:30Z
**Status:** Ready for planning

<domain>
## Phase Boundary

Blindar componentes com React.memo e remover estilos CSS pesados para otimização visual sem gargalos de CPU/GPU.
</domain>

<decisions>
## Implementation Decisions

### Estética CSS
- **D-01:** Trocar `backdrop-blur` por opacidade sólida (`bg-black/80`) sem blur em listas/cards repetidos, mantendo as bordas neon atuais (estilo Cyberpunk preservado).

### Abordagem de Memoização
- **D-02:** Focar no `InvestigationBoard`, `EvidenceCard` e `ClueNodes` (onde mais ocorre renderização e scroll).
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above
</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `EvidenceCard`: Necessário adicionar `React.memo` e remover shadows extremas/blurs de Tailwind.
- `InvestigationBoard`: Alvo primário para evitar re-renders na árvore de nós.

### Established Patterns
- Uso extensivo de classes Tailwind; a troca será de utilitários como `backdrop-blur` para `bg-opacity`.

### Integration Points
- Não há novos sistemas, apenas alteração nas props de componentes puramente visuais e exportação encapsulada por memo.
</code_context>

<specifics>
## Specific Ideas

- Focar na remoção de `shadow-2xl` e usar bordas (borders) mais marcadas se for preciso compensar.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope
</deferred>

---

*Phase: 13-Refatoração CSS e Re-renders*
*Context gathered: 2026-09-24*
