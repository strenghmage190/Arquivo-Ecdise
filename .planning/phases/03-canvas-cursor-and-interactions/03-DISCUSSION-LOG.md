# Phase 3 Discussion Log: Canvas Cursor, Pointer Feedback & Interactions

**Date:** 2026-08-15
**Phase:** 03-canvas-cursor-and-interactions

## Q&A Records

### Q1: Feedback Visual do Cursor no Canvas
- **Pergunta:** Como deve ser o feedback visual do cursor no canvas ao desenhar/apagar?
- **Opção Escolhida:** Círculo neon dinâmico que acompanha o mouse e reflete o tamanho exato do pincel/borracha + mira crosshair central anti-ofuscamento.
- **Racional:** Proporciona precisão pixel-perfect em qualquer fundo e iluminação.

### Q2: Isolamento do Canal RGB Alvo
- **Pergunta:** Como deve funcionar o isolamento do canal RGB alvo (R, G, B)?
- **Opção Escolhida:** Isolamento completo em tempo real: o canvas e as camadas mostram e gravam os pixels apenas no canal selecionado (R, G ou B), permitindo revelação por lentes forenses.
- **Racional:** Essencial para a mecânica de investigação forense do jogo/aplicativo.

### Q3: Interação Visual de Seleção e Transformação
- **Pergunta:** Como prefere a interação visual ao selecionar elementos no canvas?
- **Opção Escolhida:** Bounding box neon com alças de canto interativas (redimensionar/rotacionar) e cursores contextuais (move, nesw-resize, text).
- **Racional:** Feedback tátil e intuitivo alinhado com ferramentas profissionais de edição gráfica.

---
*Discussion log generated: 2026-08-15*
