# Phase 10 Context: CreateClueModal Integration, Performance & E2E Validation

## Domain
Integração final do `AudioLab` no modal principal de criação de pistas (`CreateClueModal.tsx`), otimização de bundle e validação final da suíte.

## Locked Decisions
Essas são as decisões de implementação acordadas para esta fase:

### Performance e Otimização do Bundle
- **Lazy Loading:** O componente `AudioLab` inteiro (incluindo o Wavesurfer e todos os nós Web Audio) será encapsulado via `React.lazy` e renderizado dentro de um `Suspense` com um fallback apropriado. Isso remove a carga da biblioteca gráfica do bundle principal inicial do `CreateClueModal`.

### Handoff (Salvar na Pista)
- **Formato Final:** Ao invés de salvar nativamente no formato gigante `WAV`, a função "Salvar na Pista" fará o encode do buffer para `.mp3` usando a biblioteca `lamejs` (já instalada), de modo a economizar preciosos megabytes no banco de dados e garantir uploads mais rápidos.

### Integração UI (Pré-implementada)
- *Nota:* A limpeza da UI antiga e a inserção do botão único "Abrir Laboratório de Áudio" já foram concluídas e comitadas no código atual.

## Canonical References
*Nenhuma referência externa anotada no Roadmap.* Considere as decisões acima como verdade canônica para a implementação.
