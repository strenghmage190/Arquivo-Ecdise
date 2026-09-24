# Phase 14 Discussion Log

## Q1: Alvo da Virtualização (Onde aplicar o react-virtuoso?)
**Options:**
- Apenas listas em painéis e modais (CreatorHub, TerminalSearch) - Mais seguro, biblioteca otimizada para listas 1D.
- Listas 1D + O quadro principal (InvestigationBoard) - Requer implementação customizada complexa para virtualização 2D.
- Todos os lugares onde houver um array extenso - Cobertura total, mas risco maior de bugs de UI.
**Selection:** All of the above (Cobertura total, incluindo 1D e 2D)

## Q2: Comportamento de Renderização Antecipada (Overscan)
**Options:**
- Overscan alto (ex: 500px extras renderizados fora da tela) - Evita clarões/fundo vazio em scroll super rápido.
- Overscan baixo (ex: 50px) - Máxima performance de GPU, mas pode piscar fundo vazio se rolar muito rápido.
**Selection:** Overscan alto
