# Phase 8 Context: Header & Home Layout Redesign

## Domain
Replace the current generic header with the institutional Ordo Realitas header featuring the Brasão da Ordem, and implement the telemetry footer ticker.

## Locked Requirements
- **HEAD-01**: Brasão da Ordem + texto "ARQUIVOS // DIVISÃO FORENSE"
- **FOOT-01**: Ticker monoespaçado (Share Tech Mono) com animação horizontal e mensagens do sistema

## Implementation Decisions

### 1. Header Layout
- **Centralizado**: O Brasão da Ordem ficará no centro. Abaixo dele, os textos "ARQUIVOS" e "DIVISÃO FORENSE" ficarão empilhados. Isso criará um visual de carimbo oficial de documento no topo da tela.

### 2. Ticker Content
- **Lore Estático**: O footer exibirá uma mensagem estática contínua ("SISTEMA ONLINE... SINCRONIZANDO EVIDÊNCIAS... STATUS DA MEMBRANA: ESTÁVEL..."). Não usaremos arrays complexos de JS para rotação de texto neste momento, focando na atmosfera visual via CSS.

### 3. Mobile Behavior
- **Escala Proporcional**: No mobile, o brasão e o texto não serão ocultados. Eles serão escalados proporcionalmente para manter a identidade da Ordem visível em qualquer dispositivo.

## Canonical References
- `REQUIREMENTS.md` (HEAD-01, FOOT-01)
- `assets/ordem/Simbolo da Ordem.png` (Source asset for the header)

## Code Context
- Modifies `src/pages/Home.tsx` to insert the new HTML structure.
- Modifies `src/pages/Home.module.scss` to add the central layout Flexbox rules and the `@keyframes` for the ticker.
