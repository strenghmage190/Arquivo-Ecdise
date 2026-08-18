# Phase 6: Discussion Log

## Discussion Date: 2026-08-15

### Clarification Questions & Answers
1. **Q:** Como a camada "Plano de Fundo" (Background) inicial deve se comportar?
   **A:** Branco, bloqueada por padrão (estilo Photoshop).
2. **Q:** Ao tentar desenhar em uma camada de Imagem/Texto:
   **A:** Toast de erro + cursor bloqueado (ex: "Rasterize a camada primeiro").
3. **Q:** Ao colar (Ctrl+V) uma imagem externa:
   **A:** Colar na camada de desenho atual (se vazia/adequada).

### Decisions Made
- O editor não vai mais criar camadas ao acaso (remover "Caso 2").
- O documento sempre começará com uma camada "Plano de Fundo" (branca, bloqueada).
- O usuário será bloqueado visualmente (cursor e toast) ao tentar pintar em camadas não rasterizadas (Imagem, Texto, Grupo).
- Adicionar opção "Rasterizar Camada" no menu de contexto.
- O evento de colar imagem (Ctrl+V) priorizará desenhar a imagem na camada de desenho ativa se possível, caso contrário criará uma nova.
