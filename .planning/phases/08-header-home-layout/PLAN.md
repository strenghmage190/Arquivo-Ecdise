# Phase 8: Header & Home Layout Redesign

**Goal:** Replace the current generic header with the institutional Ordo Realitas header featuring the Brasão da Ordem, and implement the telemetry footer ticker.

## Requirements Covered
*   HEAD-01: Brasão da Ordem + texto "ARQUIVOS // DIVISÃO FORENSE" como identidade
*   FOOT-01: Ticker monoespaçado (Share Tech Mono) com animação horizontal e mensagens do sistema

## 1. Asset Configuration
- [ ] Mover/importar a imagem `assets/ordem/Simbolo da Ordem.png` para que possa ser renderizada no Vite (se já não estiver acessível).

## 2. Header (`src/pages/Home.tsx` & `src/pages/Home.module.scss`)
- [ ] Substituir `<div className="nexus-header">` e `<h1 className="nexus-title">` pelo novo layout.
- [ ] Inserir a imagem do Brasão da Ordem com tamanho proporcional.
- [ ] Inserir o texto "ARQUIVOS // DIVISÃO FORENSE" utilizando a classe `.font-terminal` (Share Tech Mono).
- [ ] Remover classes antigas de estilo neon do header no `.scss` associado.

## 3. Footer Ticker (`src/pages/Home.tsx` & `src/pages/Home.module.scss`)
- [ ] Adicionar uma div no rodapé da Home (ou no layout global se aplicável).
- [ ] Criar a animação CSS `marquee` ou `ticker` para mover texto da direita para a esquerda.
- [ ] O texto deve ser monoespaçado, mostrando mensagens do sistema (ex: "SISTEMA ONLINE... SINCRONIZANDO EVIDÊNCIAS... STATUS DA MEMBRANA: ESTÁVEL...").

## 4. Layout Clean-up
- [ ] Limpar o `background` com gradientes da classe `.home-screen` no `Home.module.scss`, mantendo apenas o fundo `var(--bg)` e talvez um sutil ruído se necessário, sem cores neon.

## Verification
- O Brasão da Ordem deve aparecer com boa resolução.
- O header não deve conter cores além de texto e monocromático (DSYS rules).
- O footer animado deve rolar suavemente no fundo da tela, sem atrapalhar a interação.
