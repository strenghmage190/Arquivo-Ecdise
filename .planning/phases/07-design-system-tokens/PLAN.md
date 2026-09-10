# Phase 7: Design System Tokens

**Goal:** Define the monochrome chrome palette, element/evolution color tokens, and global CSS constraints as CSS custom properties.

## Requirements Covered
*   DSYS-01: Sistema define paleta monocromática do chrome
*   DSYS-02: Vermelho institucional (#8B1414) usado exclusivamente para ações destrutivas
*   DSYS-03: Tokens de Elementos definidos para uso nos dados de caso
*   DSYS-04: Tokens de Evoluções com gradientes duais
*   DSYS-05: border-radius: 0 global como padrão
*   DSYS-06: Proibições aplicadas (sem glassmorphism, sem shadow colorido)
*   TYPO-01 a TYPO-05: Tipografia completa importada e configurada

## 1. Global CSS (`src/index.css`)
- [ ] Atualizar os imports do Google Fonts para incluir `Cinzel`, `Share Tech Mono`, `Special Elite`, e `Teko` com `font-display: swap`.
- [ ] Definir a paleta monocromática no escopo `:root`.
- [ ] Definir as cores dos Elementos estruturais.
- [ ] Definir os gradientes de Evolução.
- [ ] Aplicar o reset global `* { border-radius: 0; }` com exceção das classes utilitárias de borda arredondada (`.rounded-full`).
- [ ] Criar classes utilitárias para fontes (`.font-oculto`, `.font-terminal`, `.font-documento`, `.font-ameaca`).
- [ ] Limpar antigas variáveis css (--nexus-blue, etc) e keyframes não mais necessários, ou migrar se usados.

## 2. Tailwind Config (`tailwind.config.js`)
- [ ] Mapear as novas variáveis CSS no objeto `theme.extend.colors` do Tailwind para uso com `bg-`, `text-`, `border-`.
- [ ] Mapear as fontes no `theme.extend.fontFamily`.

## 3. Integração Base
- [ ] Testar a alteração aplicando o tema no `body`.

## Verification
- Testar a legibilidade do texto no fundo `#0A0A0B`.
- Verificar se cantos de botões genéricos ficam retos.
- Confirmar no devtools se as fontes estão sendo carregadas corretamente.
