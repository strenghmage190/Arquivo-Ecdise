# Phase 13 Discussion Log

## Q1. Aparência dos Tooltips
- **Opções:**
  - (Recommended) Tooltips usando `react-tooltip` em estilo Cyberpunk (escuro, bordas neon) que aparecem ao passar o mouse sobre um ícone (i).
  - Textos inline escondidos que expandem como um acordeão ao clicar no botão "Ajuda".
  - Blocos de texto diegético fixos no topo de cada seção (como "MANUAL DO SISTEMA").
- **Seleção:** (Recommended) Tooltips usando `react-tooltip` em estilo Cyberpunk (escuro, bordas neon) que aparecem ao passar o mouse sobre um ícone (i).

## Q2. Integração do Audio Lab
- **Opções:**
  - (Recommended) O AudioLab salva o Blob/URL no contexto compartilhado (`ClueModalContext`) e fecha automaticamente, voltando para a aba Áudio do CreateClue, que exibirá a nova pista carregada.
  - A aba Áudio exibe o AudioLab embutido na própria tela, sem precisar abrir outro modal.
  - O AudioLab apenas avisa que salvou e o usuário precisa selecionar o arquivo manualmente na aba Áudio.
- **Seleção:** (Recommended) O AudioLab salva o Blob/URL no contexto compartilhado (`ClueModalContext`) e fecha automaticamente, voltando para a aba Áudio do CreateClue, que exibirá a nova pista carregada.

## Q3. Tom dos Tooltips
- **Opções:**
  - (Recommended) Misto: Título e estilo diegético (ex: "Protocolo Fake Phone"), mas o texto explicativo é direto e funcional para o usuário não ficar confuso.
  - 100% Diegético: Escrito como se o usuário fosse um detetive operando um software militar ("Atenção Agente: Este módulo ofusca sinais...").
  - 100% Funcional: Texto claro e direto ("Usa o visual de um celular. Oculta a barra de status.").
- **Seleção:** (Recommended) Misto: Título e estilo diegético (ex: "Protocolo Fake Phone"), mas o texto explicativo é direto e funcional para o usuário não ficar confuso.
