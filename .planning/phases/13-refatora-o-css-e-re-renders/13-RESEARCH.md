# Phase 13 Research: Refatoração CSS e Re-renders

## Contexto de Negócio & Objetivos
- **Alvo CSS**: Trocar `backdrop-blur` por opacidade sólida (`bg-black/80`), preservando bordas neon (estética cyberpunk) em componentes do quadro de investigação. Foco na redução da GPU no scroll.
- **Alvo React (Memo)**: Aplicar `React.memo` e refinar uso de hooks (`useCallback`, `useMemo`) principalmente em `InvestigationBoard`, `EvidenceCard` e sistema de nós interativos do board (onde ocorrem mais re-renders em massa).

## Descobertas Técnicas
- O componente `EvidenceCard` já possui um `React.memo` no final (`EvidenceCard.tsx:215`), mas deve ser revisado se a função `propsAreEqual` está correta ou se as referências a funções (ex: `onEdit`, `onOpen`, `onToggleStatus`) estão estragando o cache do memo no pai (`InvestigationBoard`).
- `InvestigationBoard.tsx` é o container pesado. As dicas/nós estão sendo mapeadas, precisaremos garantir que o estado local de inputs ou pan/zoom não force o re-render de todos os 50+ cards toda vez que o mouse se move.
- `EvidenceCard.css` (e afins como `InvestigationBoard.css`) devem ter classes de `.clue-card` alteradas. Em vez de `backdrop-filter: blur(8px)`, trocar para background sólido com opacity e manter a cor ou box-shadow externo (glow) moderado, removendo `shadow-2xl` interno se houver.

## Recomendações para o Planner
1. **Tarefa de Refatoração de CSS**: Focar no `EvidenceCard.css` (e similares de cards). Remover propriedades pesadas de renderização (`backdrop-filter`). Ajustar `background-color` para simular a translucidez.
2. **Tarefa de Refatoração de Callbacks**: No `InvestigationBoard.tsx`, assegurar que as funções passadas para o `EvidenceCard` (`onToggleStatus`, `onOpen`, `onEdit`) sejam envolvidas em `useCallback` atrelados corretamente às dependências, para que a memoização do filho funcione.
3. **Validação de Re-render**: Adicionar uma verificação no plano para testar (com React Profiler) se a movimentação no board ou digitação em modal ainda causa trigger na renderização de EvidenceCards não modificados.
