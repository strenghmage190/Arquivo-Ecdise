# Arquivo Ecdise

**Arquivo Ecdise** e uma aplicacao web imersiva para investigacoes de RPG e ARG, inspirada em terminal operacional da Ordo Realitas. O projeto combina um quadro investigativo colaborativo, pistas com diferentes niveis de acesso, ferramentas forenses, enigmas, audio, imagem, chat falso e modos separados para Mestre e jogadores.

Aplicativo desenvolvido com **React 18**, **TypeScript**, **Vite**, **Tailwind CSS/PostCSS**, **Supabase** e **Wavesurfer.js**.

---

## Sumario

- [Acesso e paginas](#acesso-e-paginas)
- [Funcionalidades do quadro](#funcionalidades-do-quadro)
- [Criacao e edicao de pistas](#criacao-e-edicao-de-pistas)
- [Inspecao de evidencias](#inspecao-de-evidencias)
- [Arsenal forense](#arsenal-forense)
- [Casos e convites](#casos-e-convites)
- [Controles de usuario e Mestre](#controles-de-usuario-e-mestre)
- [Dados e integracoes](#dados-e-integracoes)
- [Tecnologias](#tecnologias)
- [Execucao local](#execucao-local)
- [Scripts](#scripts)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Seguranca e operacao](#seguranca-e-operacao)

---

## Acesso e paginas

### Login e recrutamento

- `/login`: tela unica para entrar ou criar conta.
- Login por email e senha usando Supabase Auth.
- Troca entre **Iniciar sessao** e **Recrutamento de novos agentes**.
- Validacao visual da senha no cadastro: minimo de 8 caracteres, com letras maiusculas, minusculas e numeros.
- Confirmacao por email no cadastro.
- Redirecionamento automatico para a rota solicitada apos autenticacao.
- `/reset-password`: solicitacao de email com link para redefinir a senha.
- Rotas internas protegidas redirecionam visitantes nao autenticados para o login.

### Paginas do sistema

| Rota | Funcao |
|---|---|
| `/login` | Login e cadastro |
| `/reset-password` | Recuperacao de senha |
| `/` | Galeria/arquivo dos casos |
| `/case/:id` | Quadro de investigacao do caso |
| `/invite/:inviteCode` | Entrada em caso por convite |
| `/mobile-test` | Teste do quadro em tela mobile |
| `/__dev/forensic-benchmark` | Benchmark forense em ambiente de desenvolvimento |

---

## Funcionalidades do quadro

O quadro em `/case/:id` funciona como uma mesa infinita para posicionar, organizar e conectar evidencias.

### Navegacao e camera

- Pan/origem da camera no desktop e no mobile.
- Roda do mouse para zoom entre 10% e 300%.
- Arrasto com dois dedos para zoom e movimento no toque.
- Botao de reset da camera e zoom.
- Centralizacao em uma pista encontrada por busca ou terminal.
- Modo pan com a barra de espaco.
- Controles de zoom visiveis na barra desktop e no menu mobile.

### Pistas no quadro

- Criacao de pistas em uma posicao escolhida ou no centro da tela.
- Posicao X/Y persistida no Supabase.
- Arrastar uma ou varias pistas selecionadas.
- Selecao individual ou por area retangular.
- Multisselecao para mover, organizar ou alterar estado.
- Ordem Z para trazer para frente ou enviar para tras.
- Edicao rapida pelo teclado.
- Exibicao/ocultacao de pistas dependendo da visao Mestre ou Jogador.
- Recurso visual para localizar pista criada recentemente.
- Estados visuais de status:
  - confirmada/verificada;
  - teoria;
  - descartada/falsa;
  - sem classificacao.

### Conexoes

- Modo de conexao com escolha da pista inicial e da pista final.
- Tipos de conexao:
  - fato confirmado;
  - teoria;
  - sobrenatural/mistico.
- Cores por tipo de conexao.
- Renderizacao grafica das linhas no quadro.
- Menu de contexto para apagar uma conexao.
- Persistencia das conexoes no Supabase.

### Organizacao

- Organizacao por linha do tempo.
- Organizacao por elemento.
- Organizacao em grade por colunas.
- Desempilhamento dos cards.
- Historico de desfazer e refazer para movimentacoes, organizacoes e conexoes.
- Atualizacao em lote das coordenadas.

### Busca

- Busca por texto no terminal ou painel de busca.
- Filtro por titulo, metadados e conteudo localmente pesquisavel.
- Exibicao da quantidade de resultados.
- Navegacao automatica da camera ate a pista encontrada.
- Modo de pesquisa no mobile.

### Luz UV global

- Ativa/desativa uma luz UV sobre todo o quadro.
- Sobreposicao circular acompanha o cursor.
- Tem modos normal e de alta performance.
- Permite descobrir conteudo tratado visualmente com a camada UV.

### Luz UV global no quadro

A Luz UV e uma lente sobre o quadro, nao uma alteracao permanente das pistas. Ao ativa-la, o cursor passa a ter uma area de iluminacao circular que pode revelar desenhadas, textos ou camadas configurados como evidencias ocultas.

- No modo normal, o brilho usa camada radial, borrado e tela em modo `screen`.
- No modo performance, usa uma iluminacao menos custosa.
- A posicao da lente acompanha o mouse e considera o nivel atual de zoom.
- Ao desativar a ferramenta, o quadro volta ao aspecto original.

### UV Editor

O editor UV cria camadas sobre uma imagem-base em um canvas com suporte a zoom, pan, textos, imagens, desenho e mascaras.

- Ferramentas de selecao, desenho, borracha, texto e colocacao de imagens.
- Paleta UV com cores magenta, ciano, verde neon, rosa, azul, amarelo e laranja.
- Tamanho de pincel e ajuste visual da mascara.
- Modo censura para pintar area em preto.
- Gerenciamento de camadas: visibilidade, travamento, agrupamento, mascara e reordenacao.
- Desfazer e refazer com atalhos.
- Movimento, redimensionamento e rotacao dos objetos selecionados.
- Posicionamento por teclado e pela tela.
- Colagem de imagem pelo clipboard.
- Suporte a gestos e pinch-to-zoom.
- Exportacao da imagem composta para upload.

O modo RGB forense permite escolher o canal vermelho, verde ou azul como alvo. O modo de filtro usa camadas claras ou cinzas para criar uma mascara. O modo termal reaproveita o canvas com cores quentes e frias.

### Modo performance

- Reduz animacoes e efeitos de processamento.
- Mantem a utilizacao das ferramentas funcionais.
- Disponivel pela barra desktop e pela configuracao de desempenho.

### Teclado

| Atalho | Acao |
|---|---|
| Barra de espaco | Panning temporario |
| Setas | Move as pistas selecionadas |
| Shift + Setas | Move em passos maiores |
| Ctrl/Cmd + Z | Desfazer |
| Ctrl/Cmd + Y | Refazer |
| Ctrl/Cmd + Shift + Z | Refazer |
| ` ou ~ | Abre/fecha o Terminal C.R.I.S. |
| Ctrl/Cmd + K | Abre/fecha o Terminal C.R.I.S. |
| E | Edita a unica pista selecionada quando o Mestre pode editar |

---

## Criacao e edicao de pistas

O Hub de Criacao usa um modal organizado em abas. O modal moderno oferece:

### Aba Geral

- Titulo da pista.
- Descricao publica.
- Descricao oculta para Mestre ou revelacao posterior.
- Tags.
- Tipo de evidencia.
- Codigo de descoberta.
- Pista escondida.
- Pista bloqueada.
- Senha de desbloqueio.
- Insights com custo e visibilidade:
  - oculto;
  - grupo;
  - jogador;
  - lista de usuarios destinatarios.

### Aba Visual

- Upload de imagem base.
- Imagem por URL.
- Preview em tempo real.
- Camada UV.
- Editor UV com desenho, tratamento e configuracao forense.
- Editor termal.
- Editor de canais RGB.
- Camada de filtro visual.
- Posicao e transformacao da camada.
- Suporte a imagem de mascara/preview bloqueado.
- Upload de video.
- URL externa de video.
- Player e preview de video.

### Aba Audio

- Audio base.
- Audio oculto.
- Upload de arquivos de audio.
- Preview e reproducao.
- Audio Forge para transformacao.
- Mixer de audio com ajuste de canais.
- Laboratorio avancado de audio.
- Frequencia alvo.
- Tempo de gatilho.
- Sincronizacao estatica.
- Visibilidade configuravel:
  - sempre;
  - apenas com glitch ativo;
  - apenas apos resolver um puzzle.
- Narrativa ligada entre audio, visual e codigo.

### Aba Cifra e Hex

- Codigo associado a descoberta.
- Decodificador manual.
- Decodificador universal.
- Visualizador hexadecimal.
- Inspecao binaria/ASCII.
- Enigma para cifra e decifragem.

### Aba Glitch

Disponivel para evidencias do tipo `glitch_puzzle`.

- Arquivo base e arquivo de revelacao.
- Upload de imagem para puzzle.
- Configuracao da senha/solucao.
- Dificuldade e pistas.
- Preview do card de glitch.
- Estados em que a pista fica visivel.
- Resolucao que pode desbloquear audio ou conteudo oculto.
- Rastreamento local da resolucao em determinados modulos.

### Aba Tipos Especiais

Disponivel para pistas mega-clue ou tipos especiais.

- Mega-pista com lista de pistas exigidas.
- Conteudo de desbloqueio.
- Visibilidade por resolucao.
- Chat/telefone falso com construtor de conversas.
- Contato e remetente.
- Mensagens com texto e imagens.
- Puzzle de documentos triturados.
- Puzzle de numeros ou padrao de celular.

### Aba Seguranca

- Ativacao da camada de seguranca.
- Senha textual.
- Modos de revelacao:
  - sempre visivel;
  - apenas alinhado;
  - alinhado por palavra-chave.
- Vinculos de sinal visual e sonoro.
- Ocultar preview no quadro.
- Exigencia de desbloqueio antes da visualizacao completa.

### Aba Metadados

- Metadados EXIF/simulados.
- Data falsa.
- Localizacao ficticia.
- Nota tecnica.
- Fabricante/camera.
- GPS.
- Proprietario.
- Selo, stamp e link externo.
- Arquivos e propriedades associadas.

### Aba Campos

- Configuracao individual de visibilidade dos campos.
- Presets de visibilidade.
- Controle do que jogadores veem em cada modulo.

### Aba Display

- Configuracao visual de exibicao da pista.
- Intensidade, proporcoes e opcoes da camada.
- Estilos individuais de revelacao.

### Templates

- Buscar templates existentes.
- Criar template com nome e descricao.
- Salvar o estado sanitizado da pista como JSONB.
- Templates privados ou publicos.
- Atualizar ou excluir templates.
- Remover automaticamente URLs temporarias, objetos `Blob` e `File` ao serializar.

### Persistencia

Os dados sao enviados para `investigation_cards`, incluindo titulo, descricao publica/oculta, tipos, posicoes, tags, insights, midia, metadados, chat, conexoes internas e campos de seguranca permitidos pela API.

---

## Inspecao de evidencias

O modal de inspecao abre uma pista em tamanho amplo e apresenta ferramentas contextuais conforme o tipo e os dados da evidencia.

### Modos gerais

- Conteudo publico sempre separado do conteudo oculto.
- Bloqueio por senha.
- Visualizacao para Mestre ignorando bloqueios normais.
- Alternancia UV local.
- Alternancia termica local.
- Filtros de brilho, contraste e saturacao.
- Tela cheia.
- Tratamento apenas em tela cheia.
- Menu mobile para visualizar imagens, videos e audio.
- Edicao pelo Mestre.

### Status da pista

- Confirmar como fato.
- Marcar como teoria.
- Marcar como falso/descartado.
- Trazer para frente ou enviar para tras.
- Atualizacao em tempo real pelo Realtime do Supabase.

### Midia

- Visualizador de imagem com camadas.
- Player de video.
- Player de audio com duracao e posicao.
- Waveform por Wavesurfer.
- Audio em expander/fullscreen.
- Material oculto revelado apos resolucao ou desbloqueio.

### Tipos especiais

- Visualizacao de celular e mensagens falsas.
- CCTV com timeline e controles.
- Hacking Terminal.
- Shredder Puzzle.
- Glitch Puzzle Solver.
- Decodificador numerico.
- Numeric Keypad.
- Pattern Lock.
- Mega-clue.

---

## Arsenal forense

### Laboratorio de Audio

- Audio Lab avancado.
- Espectrograma profissional.
- Espectrograma em tempo real.
- Espectrograma por URL.
- Mixer com niveis e canais.
- Isolador de canais.
- Reconstructor de sinal.
- Forge de audio.
- Decrypter de audio.
- Geracao de espectrograma.
- Esteganografia visual/sonora em camadas.
- Entrada por texto sintetizado.
- Worker dedicado para processamento.

#### Como o sistema trabalha com audio

**Advanced Audio Lab**

- Reproduz o audio base e sobrepoe um espectrograma ou faixa oculta sincronizada.
- Permite arrastar o ponto de gatilho para indicar em que instante o audio oculto deve comecar.
- Quando o usuario chega ao gatilho durante a reproducao, o audio secundario abre no ponto proporcional correspondente.
- Pode separar dados visuais e sonoros em uma timeline de investigacao.
- Mantem o estado de reproducao sincronizado ao evitar arrastos simultaneos conflitantes.

**Professional Spectrogram**

- Decodifica o arquivo em memoria ou busca um URL.
- Usa um worker dedicado para gerar os dados espectrais.
- Renderiza a frequencia no eixo vertical e o tempo no eixo horizontal.
- Permite consulta de frequencia e tempo ao passar o cursor.
- Pode inverter a escala vertical e mostrar uma sobreposicao.
- Clique no espectrograma pode buscar a reproducao no ponto selecionado.

**Real-Time Spectrogram**

- Cria um contexto Web Audio.
- Conecta o arquivo reproduzivel a um analyser.
- Analisa frequencias em loop animado.
- Exibe a intensidade por mapa de cor no canvas.
- Reduz a taxa de atualizacao automaticamente no modo performance.

**Audio Mixer**

- Exibe a forma de onda em canvas.
- Permite selecionar uma parte do audio.
- Suporta revertida da faixa, normalizacao e fades de entrada/saida.
- Permite ajustes de volume/canais antes da exportacao.
- Renderiza o resultado como novo arquivo WAV pelo navegador.

**Audio Forge e Channel Isolator**

- Oferecem manipulacao digital para criacao ou isolamento de sinais.
- A pista pode possuir um audio base e um audio oculto.
- `triggerTime` define o instante em que o conteudo oculto entra em sincronia.
- A visibilidade pode ser sempre, apos uma resolucao ou apenas quando o glitch estiver ativo.

### Imagem e filtros

- UV Editor completo.
- UV Editor interno com controles detalhados.
- Thermal Editor.
- Forensic Channel Editor.
- Glitch Image Engine.
- Glitch Maker.
- Decipher Lens.
- Processamento em Worker para tarefas forenses.

#### Editor termal

O Thermal Editor transforma os tons medios da imagem em um mapa cromatico IRONBOW:

- tons escuros tendem ao violeta/azul;
- tons medios passam por vermelho e laranja;
- tons claros chegam ao amarelo e branco.
- O Mestre define o texto termico, a escala da fonte e sua posicao vertical.
- O texto pode ser arrastado pela imagem e recebe brilho externo, intermediario e nucleo branco.
- O texto e a camada termal sao usados como configuracao visual da pista.

#### Editor de canais forenses

O Forensic Channel Editor cria uma composicao em `R`, `G` ou `B`.

- Seleciona o canal que recebera a mascara.
- Pode inserir texto ou uma segunda imagem.
- Ajusta intensidade, tamanho de texto e posicao.
- Mistura a base e a sobreposicao no pixel a partir da escolha do canal.
- A imagem final pode ser salva como PNG em alta resolucao.
- Permite zoom e pan para posicionar detalhes pequenos.

#### Decipher Lens

A lente decifradora usa uma lupa para examinar trechos da evidencia sem alterar o arquivo original. Ela e adequada para documentos, impressos, pequenas marcas e detalhes que precisam ser ampliados em uma inspecao visual.

#### Motor de glitch

O Glitch Engine combina alteracoes visuais controladas:

- frequencia do sinal;
- deslocamento horizontal;
- cromatic aberration;
- imagem focada;
- imagem original;
- camada UV;
- alinhamento de parametros.

O jogador ajusta controle deslizante ate aproximar a imagem do alvo. Quando frequencia, deslocamento e cromatismo ficam dentro da tolerancia configurada, a pista pode ser marcada como resolvida. A ferramenta pode entao:

- revelar um codigo de recompensa;
- desbloquear audio;
- desbloquear video;
- validar uma palavra-chave encontrada na imagem;
- ativar conteudo UV;
- abrir uma mega-pista.

### Criptografia e dados

- Universal Decoder.
- Manual Decoder.
- Enigma Machine.
- Hex Viewer.
- Encriptores e decodificadores de texto.
- Utilitarios Base64, hex, bytes e UTF-8.
- LSB Steganography Engine.
- Gerador de audio WAV.

#### Universal Decoder

O decodificador universal possui modos para:

- Cesar/ROT, exibindo o resultado positivo e negativo do deslocamento;
- Atbash;
- Vigenere;
- A1Z26;
- binario;
- hexadecimal;
- Base64;
- Maquina Enigma M3.

No modo hexadecimal, o sistema pode detectar texto, converter UTF-8, aplicar decodificacao XOR ou processar uma variante Enigma-simples com chave.

#### Manual Decoder

O manual primeiro gera um relatorio estatistico da entrada sem tentar adivinhar o algoritmo. O relatorio informa:

- alfabeto aparente;
- tamanho;
- quantidade de tokens;
- padding de Base64;
- densidade de Morse;
- pontuacao;
- maiusculas e minusculas;
- letras distintas;
- frequencia dos caracteres;
- entropia estimada.

Depois o operador escolhe o metodo para executar a traducao. Base64, hexadecimal, binario e Morse possuem rotinas locais de conversao. Cesar, Atbash, Vigenere e A1Z26 ficam como opcoes analisaveis no painel, mas devem ser combinados com o decoder adequado ao tipo de evidencia.

#### Hex Viewer

O Hex Viewer inspeciona o conteudo em representacao binaria/hexadecimal, permitindo comparar bytes, achar assinaturas de arquivo e correlacionar valores com texto ASCII sem alterar a evidencia original.

### Puzzle, exploracao e terminal

- CCTV Player.
- Phone Viewer.
- Fake Phone Chat Builder.
- System Terminal.
- Hacking Terminal.
- Forensic Terminal.
- Numeric Keypad.
- Pattern Lock.
- Shredder Puzzle.
- Sketchpad.
- File Explorer.
- File Properties.
- Code Prompt.
- Net Uplink.
- Mega Clue Card.
- Glitch Puzzle Card.

#### Shredder Puzzle

O Shredder Puzzle divide uma imagem em um numero configurado de pecas embaralhadas.

- O jogador seleciona duas pecas para trocar de posicao.
- Cada troca modifica o estado do puzzle.
- Ao restaurar todas as posicoes, o puzzle dispara `onSolved`.
- O progresso pode ser reiniciado.
- O Mestre pode revelar ou ocultar pecas individualmente com Ctrl+clique.
- O Mestre pode revelar todas ou uma quantidade aleatoria.
- O estado das pecas reveladas e a resolucao podem ser registrados no localStorage.
- O modo de auto-resolucao existe para operacao administrativa.

#### Teclado numerico

O Numeric Keypad aceita ate seis digitos.

- A entrada aparece mascarada.
- Backspace apaga o ultimo digito.
- Limpar reinicia o campo.
- `OK` compara o valor com o codigo configurado.
- Codigo correto ativa sucesso e executa o desbloqueio.
- Codigo incorreto informa “Acesso Negado” e limpa o campo.

#### Pattern Lock

O Pattern Lock apresenta uma matriz de nove pontos.

- Cada ponto pode ser selecionado uma vez em cada tentativa.
- A sequencia usa formato `1-2-3-6-9`.
- O usuario limpa ou confirma a sequencia.
- No modo de configuracao, informa a sequencia criada ao Mestre.
- No modo jogador, compara com o codigo esperado.
- A tentativa correta libera o conteudo; a incorreta limpa o padrao.

#### Phone Viewer

O Phone Viewer simula um aparelho protegido.

- Exibe hora atual na barra superior.
- Pode iniciar bloqueado por PIN ou padrao.
- Aceita mensagens de remetente, texto, imagem, hora e legenda.
- Identifica bolhas enviadas e recebidas.
- Faz auto-scroll para a ultima mensagem.
- Pode ser exibido em largura normal ou fullscreen.
- A lista vazia mostra uma mensagem de chat protegido.

O construtor de chat permite adicionar texto e anexar imagens, gravar remetente e nome do contato e salvar a conversa na pista.

#### CCTV Player

O CCTV Player oferece uma interface de camera de seguranca.

- Reprodução em loop, automatica e silenciosa.
- Velocidades de 0.25x, 0.50x e 1.0x.
- Zoom digital entre 1x e 4x.
- Overlay com indicador REC, identificador da camera e hora.
- Modos normal, visao noturna e termal.
- Substituicao e remocao do video pelo Mestre.
- Relogio atualizado em intervalo otimizado para performance.

---

## Casos e convites

### Arquivo de casos

- Lista todos os casos do usuario disponiveis na consulta.
- Contador de registros ativos.
- Busca visual por cards.
- Criacao de caso.
- Edicao de titulo, descricao e capa.
- Exclusao de caso.
- Elementos tematicos: sangue, conhecimento, energia, morte, medo.
- Evolucoes: 0 a 4/Transcender, classificacao visual adicional.
- Arte padrao escolhida por elemento ou por hash do ID.
- Capa personalizada por URL.
- Upload de capa para `investigation-assets/case-covers`.

### Convites

- O Mestre gera um codigo de convite por caso.
- O link usa `/invite/:inviteCode`.
- O convite mostra o titulo do caso.
- Aceitar adiciona o usuario em `investigation_members`.
- Recusar retorna ao inicio.
- Convites invalidos ou expirados mostram um estado de erro.
- Usuarios autenticados sao redirecionados ao quadro apos aceitar.

### Colaboracao

- Sincronizacao em tempo real de cards e posicoes.
- Sincronizacao em tempo real de investigacoes.
- Atualizacoes enviadas por movimento sao salvas com throttling/debounce.
- Membros podem ser consultados na visao War Room.

---

## Controles de usuario e Mestre

### Permissoes

- Apenas o proprietario do caso (`owner_id`) recebe automaticamente a visao Mestre.
- A interface distingue Mestre de jogador.
- A visao jogador esconde controles de criacao e edicao.
- O Mestre pode alternar entre visao Mestre e visao Jogador.
- O Mestre pode mostrar pistas escondidas.
- Pistas bloqueadas continuam protegidas, mas o Mestre pode inspeciona-las diretamente.
- A criacao e a edicao usam `canEdit`, combinado com o estado de visao.

### GM Overwatch

- Painel dedicado ao Mestre.
- Lista pistas configuradas no caso.
- Permite acompanhar o estado da mesa.
- Pode ser alternado pela barra.

### War Room

- HUD de agentes ativos.
- Overlay de cursores.
- Indicacao colaborativa de participantes.
- Perfis de agentes configuraveis.

### Interface mobile

- Barra inferior fixa.
- Menu lateral/gaveta de ferramentas.
- Criacao, conexao, terminal, busca, UV, organizacao, reset, decoder e desfazer.
- Botoes “Criar” apenas para Mestre.
- Pinch-to-zoom.
- Bottom Sheet para ferramentas.
- FAB para alternar entre modo panoramico e modo de edicao.
- Tratamento responsivo de classicos desktop.

---

## Dados e integracoes

### Supabase

As chamadas de dados utilizam as seguintes tabelas:

- `investigations`: casos, proprietario, descricao, capa e dados do quadro.
- `investigation_cards`: pistas, midia, posicoes, seguranca e metadados.
- `investigation_connections`: links entre pistas.
- `investigation_invites`: convites com codigo unico.
- `investigation_members`: associacao de usuarios aos casos.
- `clue_templates`: templates publicos e privados de pistas.
- `profiles`: dados de agentes para War Room.

O bucket publico configurado no projeto e:

- `investigation-assets`

Exemplos de caminhos usados:

- `case-covers/<arquivo>`
- `<investigationId>/<arquivo>`
- arquivos enviados diretamente por modulos de pistas e chat

### Realtime

- Atualiza cards apos insercao, mudanca ou exclusao.
- Atualiza posicoes em tempo real.
- Atualiza o estado do Doomsday Clock.
- Recarrega conexoes e investigacoes.
- Reage a atualizacoes em canais Supabase.

### Outros recursos

- Supabase Auth.
- Upload de imagens, capas, videos e audio.
- localStorage para classificacoes, puzzles resolvidos e estados locais.
- Framer Motion e CSS para transicoes.
- Sonner e React Hot Toast para notificacoes.
- Driver.js para tours guiados.
- Worker threads para benchmark, espectrograma e processamento forense.
- Axe Core e testes Testing Library disponiveis no projeto.

---

## Tecnologias

- React 18
- React Router DOM 7
- TypeScript 5
- Vite 7
- Supabase JS
- Zustand
- Framer Motion
- Tailwind CSS 4/PostCSS
- SASS/SCSS
- Wavesurfer.js
- Lucide React
- React Hot Toast / Sonner
- Excalidraw
- LameJS
- Jest e Testing Library

---

## Execucao local

### Requisitos

- Node.js 20 ou superior recomendado
- npm
- Projeto configurado no Supabase

### Instalacao

```bash
npm install --legacy-peer-deps
```

### Variaveis de ambiente

Crie um arquivo `.env.local` na raiz:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima-publica
```

As duas variaveis sao usadas por `src/supabaseClient.ts`.

### Supabase necessario

Configure no projeto:

1. Autenticacao por email/senha.
2. Site URL e redirect URLs para login e redefinicao.
3. As tabelas citadas em [Dados e integracoes](#dados-e-integracoes).
4. Row Level Security e politicas de leitura/escrita adequadas aos casos e membros.
5. Realtime habilitado para tabelas usadas pelo quadro.
6. Bucket publico `investigation-assets`.
7. Politicas de storage para uploads de capas e evidencias.

Sem essas configuracoes, a tela pode carregar, mas criacao, login, convites e persistencia nao funcionarao corretamente.

### Desenvolvimento

```bash
npm run dev
```

Por padrao, o Vite abre em uma porta local exibida no terminal.

### Build de producao

```bash
npm run build
npm run preview
```

O arquivo `vercel.json` ja contem rewrite SPA para `/index.html` e headers de seguranca/HSTS/CSP.

---

## Scripts

| Comando | Funcao |
|---|---|
| `npm run dev` | Servidor de desenvolvimento Vite |
| `npm run build` | Build de producao |
| `npm run preview` | Preview local do build |
| `npm run typecheck` | Verificacao de tipos TypeScript |
| `npm test` | Testes Jest |

Pacotes podem ser instalados com `--legacy-peer-deps` por haver overrides/compatibilidades especificas no projeto.

---

## Estrutura do projeto

```text
src/
  api/                 Operacoes Supabase e allowlists
  components/
    auth/              Provedor de sessao e rota protegida
    board/             Quadro, cards, relacoes e GM Overwatch
    modals/            Criacao, inspecao, convites e modulos
      createclueTabs/  Abas do criador de pistas
      investigationTabs/ Abas do editor legado
      forms/           Formularios de puzzle
    tools/             Ferramentas forenses e enigmas
    ui/                Overlays, toast, clock e janelas
    war-room/          Presenca e cursores
  config/              Presets de campos e display
  hooks/               Mobile, mouse, teclado, tour e performance
  pages/               Login, casos, convites e benchmark
  reducers/            Estado de formularios
  store/               Estado Zustand
  styles/              Tokens, layouts e CSS global
  utils/               Audio, cifra, imagem, storage e workers
  workers/             Processamento em segundo plano
```

---

## Seguranca e operacao

- A chave usada no frontend deve ser a **anon/public key**, nunca a service role key.
- RLS, politicas de tabela e politicas de Storage sao essenciais.
- Um desbloqueio feito apenas no frontend nao substitui controles no banco.
- Senhas de pista e pistas ocultas nao devem ser tratadas como segredo criptografico de alto valor sem validacao server-side.
- O arquivo `vercel.json` ja aplica CSP, frame denial, MIME sniffing prevention e outros headers defensivos.
- Os dados sensiveis exibidos pelo Mestre precisam continuar filtrados pela RLS.
- Links de convite devem ser invalidados ou controlados no backend se precisarem ser temporarios.

---

## Autor

Projeto Arquivo Ecdise / Ordo Realitas - Terminal C.R.I.S.
