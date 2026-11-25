# MASTER_ROADMAP.md — Plano Diretor Unificado "Arquivo Ecdise" (5 Ondas / Zero-Conflict)

> **Modo de Execução:** Compatível com `/swarm` e `Orchestrator` em *Git Worktrees* paralelas (`workspace: "share"` / `"branch"`).
> **Garantia de Isolamento:** Nenhum arquivo de código-fonte aparece em mais de um worker dentro da mesma onda (nem mesmo repetido entre ondas sem necessidade — propriedade exclusiva 1-para-1 validada por script automatizado: **`AUDIT RESULT: ZERO CONFLICTS`**).

---

## 🔬 0. Diagnóstico Técnico da Auditoria & Causas-Raiz

### 0.1 Mapa de Código Ativo vs. Legado / Código Morto (Regra Anti-Desperdício)

Para que nenhum worker edite cópias órfãs ou monólitos descontinuados, este é o grafo real de importações verificado em `src/`:

| Domínio | Arquivo(s) ATIVOS em Produção (Editar) | Arquivo(s) LEGADOS / MORTOS (NÃO editar — deletar na Onda 5 `@css-dedup-a11y`) |
| :--- | :--- | :--- |
| **Criação de Pistas** | `src/components/modals/CreatorHub.tsx` (+ `.css`), `src/components/modals/CreateClueModal_Refactored.tsx` (+ `.css`), `src/components/modals/createclueTabs/Tab*.tsx` (10 abas), `FakePhoneChatBuilder.tsx`, `createclueTabs.css`, `src/contexts/ClueModalContext.tsx`, `src/hooks/useCreateClueState_v3.ts` (re-exportado por `useCreateClueState.ts`) | `src/components/modals/CreateClueModal.tsx` (monólito legado de 4.256 linhas, hoje usado apenas via `showLegacyModal` em `InvestigationBoard.tsx:45,3348` — migrar fluxo de edição para `CreateClueModal_Refactored` na Onda 3 e aposentar), `src/components/modals/tabs/Clue*Tab.tsx` (6 abas órfãs + `index.ts`), `src/components/modals/forms/GlitchPuzzleForm.*`, `src/components/modals/forms/MegaClueForm.*`, `src/components/modals/components/ClueSummary.tsx` |
| **Inspeção & Edição Rápida** | `src/components/modals/InspectionModal.tsx` (+ `.css`), `src/components/modals/InvestigationCardModal.tsx` (nota: montado **duas vezes** por engano em `InvestigationBoard.tsx:2332` e `L3245`) | `src/components/modals/InvestigationCardModal_Refactored.tsx` (+ `.css`), `src/components/modals/investigationTabs/Investigation*Tab.tsx` (5 abas + `investigationTabs.css` + `index.ts`) — 0 imports em rotas ativas |
| **Quadro Infinito** | `src/pages/Investigation.tsx` → `src/components/board/InvestigationBoard.tsx` (+ `investigation.css`, `investigation.lenses.css`, `InvestigationBoard.css`), `EvidenceCard.tsx` (+ `.css`), `EvidenceCardContent.tsx` (+ `.css`), `MysteryImage.tsx` (+ `MysteryEffects.css`) | `src/components/board/index.tsx` (container antigo não usado por `Investigation.tsx`), `src/components/board/EvidenceCardDebug.tsx`, `src/components/board/EvidenceCardTest.tsx`, componentes inline `EvidenceCard`/`InspectionModal` e `<BottomNavigationBar />` duplicado dentro de `src/App.tsx:20-64,149,160` |
| **Áudio Forense** | `src/components/tools/audiolab/AudioLab.tsx` (+ subpainéis ativos), `AdvancedAudioLab.tsx`, `AudioMixer.tsx`, `ProfessionalSpectrogram.tsx`, `SpectrogramAnalyzer.tsx`, `RealTimeSpectrogram.tsx`, `UrlRealTimeSpectrogram.tsx`, `SpectrogramCreator.tsx`, `AudioForge.tsx`, `AudioDecrypter.tsx` | `src/components/tools/audiolab/outdated/InteractiveWaveform.tsx`, `src/components/tools/audiolab/outdated/SpectrogramPreviewCanvas.tsx`, worker duplicado `src/components/tools/textSynthWorker.ts` (manter apenas `src/utils/textSynthWorker.ts`) |
| **Folhas de Estilo Globais & Páginas** | `src/index.css` (Tailwind + tokens `:root`), `src/styles/nexus.css`, `src/styles/animations.css`, `src/styles/performance.css`, `src/mobile-cleanup.css`, `src/pages/Home.module.scss` | `src/styles/global.css` (0 imports), `src/styles/main.scss` + `abstracts/*` + `base/*` + `components/*` + `layout/_editor.scss` (0 imports em `main.tsx`), `src/pages/Home.css` (substituído por `Home.module.scss`), `src/components/modals/AgentProfileConfig.css` (0 imports), quaisquer `.bak`/`.backup` residuais |

---

### 0.2 Causas-Raiz Exatas dos Bugs Visuais Auditados

1. **Imagem ficando VERMELHA ao dar zoom no `InspectionModal` (`MysteryImage.tsx` + `InspectionModal.css` + `InspectionModal.tsx`):**
   - **Vetor 1 — Dupla camada empilhada com compositing divergente (`MysteryImage.tsx:545` + `L599` e `InspectionModal.css:137,1078-1081`):** `MysteryImage` renderiza simultaneamente um `<div style={filterStyle} />` (`z-index: 5` com `backgroundImage: url(baseSrc)`) e um `<img className="main-evidence" />` (`z-index: 10`), enquanto `InspectionModal.css` aplica `will-change: transform; transition: transform 200ms, filter 120ms` em `.uv-container > div` e `transform: translateZ(0)` em `.main-evidence`. Durante `scale > 1` e pan (`willChange = 'transform'` em `InspectionModal.tsx:818`), as camadas desalinham/recompõem sobre o palco.
   - **Vetor 2 — Vazamento de filtros residuais e overlays quentes (`MysteryImage.tsx:140,186-207`, `InspectionModal.css:53-56,1430-1447`, `MysteryEffects.css:75-107`):**
     - `forensicChannel === 'r'` aplica `contrast(1.25) saturate(2.2) sepia(0.6) hue-rotate(-22deg)` e desenha pixels vermelhos puros (`cr = 255`) no `forensic-canvas` sem reset garantido ao alternar zoom/modo;
     - `.thermal-overlay` usa `mix-blend-mode: screen` com `radial-gradient(rgb(255 120 60 / 6%))` e `.inspect-visual-area.is-glitching` aplica `filter: sepia(0.5) contrast(1.2)`;
     - `.corrompido::before` aplica clone deslocado com `text-shadow: 2px 0 red`.
   - **Vetor 3 — Seleção nativa acidental em controles adjacentes (`InspectionModal.css:2408-2441`):** o reset de `::selection` cobre `.inspect-visual-area`, mas cliques rápidos/duplo-clique nos botões `.image-controls` ou `.inspect-header` disparam seleção de DOM antes do `preventDefault()`.
   - **Correção na Onda 3 (`@inspect-modals`) + Onda 2 (`@board-uv` em `MysteryImage`):** renderizar uma única camada base limpa quando `forensicChannel === 'all'`, isolar `mix-blend-mode` estritamente a `isUVMode`/`localThermal`, remover `sepia`/`hue-rotate` não solicitados no zoom e aplicar `user-select: none` em todo `.inspect-file` (exceto `.public-desc`/textos copiáveis).

2. **Colisão de Cascata CSS em `src/main.tsx` (`L7-13`) e `:root` Redeclarados:**
   - `main.tsx` importa `index.css` (onde os tokens Ordo Realitas estão dentro de `@layer base`) **antes** de `./styles/nexus.css` (que está **fora** de `@layer` e redefine `:root { --nexus-blue: #00f3ff; --nexus-dark: #05080a; --nexus-glitch: #ff003c; --radius-sm: 6px; }` e `body { color: var(--nexus-blue) }`). No CSS Cascade Layers, qualquer regra fora de `@layer` vence `@layer base`!
   - Além disso, `ShredderPuzzleModal.css:6-15` e `investigation.css:3-33` redeclaram `:root` localmente, alterando variáveis globais conforme modais/rotas são carregados.

3. **Cortes no Topo/Direita e Split View do `InspectionModal` (`InspectionModal.css:690-704, 1689-1698`):**
   - `.inspect-header` força `flex-wrap: nowrap !important; overflow: visible;` (`L1693,1697`), fazendo `.meta-info` (`EVIDÊNCIA #...` + `.media-toggle`) empurrar `.actions` (`EXPANDIR`, `TELA CHEIA`, `TRATAMENTO`, `LUZ UV`, `MAIS ▾`, `X`) para fora da borda direita entre `960px` e `1280px`.
   - Desktop (`>= 960px`) deve consolidar Grid Split View `minmax(0, 68fr) minmax(320px, 32fr)` (65%–70% para mídia + sidebar lateral com `overflow-y: auto` independente), e Mobile (`< 960px`) `52dvh–60dvh` fixo para mídia no topo com metadados roláveis abaixo.

4. **Card do Shredder Deslocado à Direita e Contraste Reprovado (`InspectionModal.tsx:1031-1089`, `InspectionModal.css:2509-2522`):**
   - O card `DOCUMENTO TRITURADO DETECTADO` renderiza sem `height: 100%; margin: 0 auto; box-sizing: border-box` dentro de `.inspect-visual-area` (que divide largura com a sidebar e possui `.btn-toggle-sidebar` absoluto), parecendo deslocado em relação ao modal.
   - O botão `.btn-reconstructor` usa `background: linear-gradient(90deg, #00f3ff, #ff003c); color: #051018` (contraste ~3.1:1 sobre `#ff003c`, abaixo de 4.5:1 WCAG AA) e emojis crus (`🗂️`, `🧩`) em vez de ícones `Lucide` (`Scissors` / `Puzzle` / `FileWarning`).

5. **Quadro (`/case/:id`) — Opacidade, `MEMBRANA LOCAL` e Duplicação de Barras:**
   - Padronizar superfície de todos os cards (especialmente `TELEFONE`/`CELULAR DA ANA`) em `rgba(10, 14, 21, 0.96)` para zero vazamento das colunas hex de fundo; manter dimming `brightness(0.88)` em repouso para miniaturas claras (`E-MAIL`) restaurando `1.0` no hover/inspeção.
   - `MEMBRANA LOCAL` (`SystemOverlays.tsx`) deve operar em escala semântica de **Ruptura/Tensão** (verde/ciano estável até 40% → âmbar de alerta 41%–79% → carmesim crítico pulsante acima de 80%).
   - Eliminar duplicação entre `.investigation-sidebar` (esquerda) e `.investigation-toolbar` (inferior), consolidando criação/modo na esquerda ou unificando responsabilidades claras sem botões repetidos (`NOVA PISTA`/`PISTA`, `LUPA`/`Buscar`).

---

### 0.3 Inventário de Novos Arquivos e Primitivos Mobile/PWA (Propriedade Exclusiva)

> **Nota de Auditoria:** Quatro primitivos UI (`MobileDrawer.tsx`, `TouchContextMenu.tsx`, `FloatingNudgePad.tsx`, `ModalSurface.tsx`) e `public/manifest.webmanifest` + `public/sw.js` já possuem implementação base no repositório, mas precisam de acabamento/integração completa. Os demais serão criados do zero:

| Arquivo | Status Atual | Worker Proprietário Único | Onda |
| :--- | :--- | :--- | :---: |
| `src/components/ui/MobileDrawer.tsx` | Existente (refinar a11y/swipe) | `@foundation` | Onda 1 |
| `src/components/ui/TouchContextMenu.tsx` | Existente (integrar long-press global) | `@foundation` | Onda 1 |
| `src/components/ui/FloatingNudgePad.tsx` | Existente (ajustar step/Shift step) | `@foundation` | Onda 1 |
| `src/components/ui/ModalSurface.tsx` | Existente (padronizar `min(94vw,...)`/`100dvh`) | `@foundation` | Onda 1 |
| `src/hooks/useHaptics.ts` | **[NOVO]** Criar wrapper seguro `navigator.vibrate` | `@foundation` | Onda 1 |
| `src/components/board/TacticalMinimap.tsx` | **[NOVO]** Minimapa tático + `Zoom to Fit` (oculta `is_hidden` p/ players) | `@board-uv` | Onda 2 |
| `src/components/board/TacticalMinimap.css` | **[NOVO]** Estilos do minimapa tático | `@board-uv` | Onda 2 |
| `src/components/board/BoardZonesLayer.tsx` | **[NOVO]** Molduras/Zonas no fundo + Guias Magnéticas / Snap-to-Grid | `@board-uv` | Onda 2 |
| `src/hooks/useAudioUnlock.ts` | **[NOVO]** Unlock universal de `AudioContext` para iOS/Android | `@forensic-audio` | Onda 4 |
| `src/components/ui/CrisEmptyState.tsx` | **[NOVO]** Empty States diegéticos C.R.I.S. + Skeletons zero-CLS | `@css-dedup-a11y` | Onda 5 |
| `src/components/ui/CrisEmptyState.css` | **[NOVO]** Estilos de Empty States e Skeletons | `@css-dedup-a11y` | Onda 5 |
| `src/utils/registerSW.ts` | **[NOVO]** Registro seguro do Service Worker PWA | `@ux-atmosphere` | Onda 5 |
| `src/components/ui/RealtimeStatusBanner.tsx` | **[NOVO]** Indicador discreto de reconexão Supabase Realtime | `@ux-atmosphere` | Onda 5 |
| `public/manifest.webmanifest` & `public/sw.js` | Existentes (validar ícones maskable, cache offline e link no `index.html`) | `@ux-atmosphere` | Onda 5 |

---

## 🌊 ONDA 1: Fundações, Design System Anti-Colisão, HUD & Páginas Autônomas

### 🛠️ Worker 1: `@foundation`
**Escopo Técnico:**
1. **Unificação CSS (`@layer`) e Design System único:**
   - Encapsular `nexus.css`, `animations.css` e `mobile-cleanup.css` em `@layer base, components, utilities, overrides;` para que `nexus.css` nunca atropele `index.css` por especificidade acidental.
   - Consolidar tokens oficiais em `src/index.css`: alturas de controles (`--control-h-sm: 32px`, `--control-h-md: 40px` desktop / `44px` mobile, `--control-h-lg: 48px`), espaçamentos (`4/8/12/16/24px`), `border-radius` (`0/4/8/12/9999px`), tipografia fluida `clamp()`, tamanhos fluidos de modais (`min(94vw, ...)` / `100dvh`), `@container`, `tabular-nums`, `min-width: 0`, `overflow-wrap: anywhere`, `scrollbar-gutter: stable`, scrollbars dark finas e `:focus-visible` WCAG AA.
   - Centralizar escala `--z-*` (`--z-board: 1` → `--z-connections: 10` → `--z-cards: 100` → `--z-marquee: 500` → `--z-uv: 800` → `--z-hud: 1000` → `--z-mobile-bars: 1200` → `--z-modals: 2000` → `--z-cris: 3000` → `--z-toasts: 4000` → `--z-tooltip: 4500` → `--z-driver: 5000`).
   - Fallback sólido imediato para `backdrop-filter` em `src/styles/performance.css` + remoção de `!important` desnecessários.
2. **Primitivos Touch & Hooks Base:**
   - Finalizar `BottomSheet.tsx`, `MobileDrawer.tsx`, `TouchContextMenu.tsx`, `FloatingNudgePad.tsx` e `ModalSurface.tsx` com suporte a safe-area, foco acessível e gestos touch sem conflito.
   - Criar `useHaptics.ts` (`navigator.vibrate` respeitando `prefers-reduced-motion` e suporte do browser) e auditar `useBlobUrl.ts` (`URL.revokeObjectURL` garantido no unmount).

**Arquivos Exclusivos (`@foundation`):**
- `src/index.css`
- `src/mobile-cleanup.css`
- `src/styles/nexus.css`
- `src/styles/animations.css`
- `src/styles/performance.css`
- `tailwind.config.js`
- `postcss.config.js`
- `.stylelintrc.json`
- `src/hooks/useIsMobile.ts`
- `src/hooks/useIsMobile.test.ts`
- `src/hooks/useWindowSize.ts`
- `src/hooks/useCyberpunkUI.ts`
- `src/hooks/useThrottledMouse.ts`
- `src/hooks/useGlobalMouseEvents.ts`
- `src/hooks/useBlobUrl.ts`
- `src/hooks/useFileUpload.ts`
- `src/hooks/useNexoMetadata.ts`
- `src/hooks/useHaptics.ts` *(NOVO)*
- `src/components/ui/BottomSheet.tsx`
- `src/components/ui/MobileDrawer.tsx`
- `src/components/ui/TouchContextMenu.tsx`
- `src/components/ui/FloatingNudgePad.tsx`
- `src/components/ui/ModalSurface.tsx`
- `src/components/ui/Button.tsx`
- `src/components/ui/Button.module.scss`
- `src/components/ui/DiegeticWindow.tsx`
- `src/components/ui/DiegeticWindow.css`
- `src/components/ui/Tooltip.tsx`
- `src/components/ui/ErrorBoundary.tsx`
- `src/ErrorBoundary.tsx`

---

### 🖥️ Worker 2: `@hud-pages`
**Escopo Técnico:**
1. **HUD Overlay Anti-Colisão (`SystemOverlays.tsx` + `.css`):**
   - Estruturar Grid/Flex de zonas seguras (`env(safe-area-inset-*)`) coordenando `War Room HUD` (`ActiveAgentsHud`), `DoomsdayClock`, monitor `MEMBRANA LOCAL` e `Toast` (com botão de ação **"Localizar"** que dispara evento para centralizar pista no quadro) sem sobreposição em 320px–1920px.
   - Ajustar `MEMBRANA LOCAL` para escala progressiva de ruptura: verde/ciano até 40%, âmbar entre 41%–79% e carmesim crítico pulsante acima de 80%, sincronizado via evento `ordo:membrane-state` e pausado no Modo Performance; manter atualização lenta (1.5s) de apenas 2 caracteres nas colunas hex laterais.
2. **War Room & GM Overwatch Mobile:**
   - `ActiveAgentsHud` compacto com avatares/presença touch; `CursorOverlay` com `pointer-events: none` e desligamento em Modo Performance; `GMOverwatch` adaptado em `MobileDrawer`/`BottomSheet` no mobile.
3. **Paridade 100% Mobile nas Rotas Autônomas:**
   - `/login`, `/reset-password`, `/` (`Home.tsx` + `Home.module.scss`), `/invite/:inviteCode` (+ `InviteModal`), `/__dev/forensic-benchmark` e `/mobile-test`: zero scroll horizontal em `320px`, inputs `>= 16px`, botões `>= 44px` no touch.

**Arquivos Exclusivos (`@hud-pages`):**
- `src/components/ui/SystemOverlays.tsx`
- `src/components/ui/SystemOverlays.css`
- `src/components/ui/DoomsdayClock.tsx`
- `src/components/ui/Toast.tsx`
- `src/components/ui/Toast.css`
- `src/components/war-room/ActiveAgentsHud.tsx`
- `src/components/war-room/CursorOverlay.tsx`
- `src/components/war-room/index.ts`
- `src/hooks/useWarRoom.ts`
- `src/components/board/GMOverwatch.tsx`
- `src/pages/Home.tsx`
- `src/pages/Home.module.scss`
- `src/pages/Login.tsx`
- `src/pages/Login.css`
- `src/pages/ResetPassword.tsx`
- `src/pages/Invite.tsx`
- `src/pages/Invite.css`
- `src/components/modals/InviteModal.tsx`
- `src/components/modals/InviteModal.css`
- `src/pages/MobileTestPage.tsx`
- `src/pages/__dev/ForensicBenchmarkPage.tsx`
- `src/components/bench/ForensicBenchmark.tsx`
- `src/workers/benchmarkWorker.ts`
- `src/components/auth/AuthProvider.tsx`
- `src/components/auth/ProtectedRoute.tsx`

### 🔍 Verificador da Onda 1: `@verifier`
- Testar viewports `320x568`, `375x812`, `768x1024` e `1440x900` em `/login`, `/reset-password`, `/`, `/invite/:code` e `/__dev/forensic-benchmark` sem overflow horizontal.
- Validar que `nexus.css` não sobrescreve tokens `:root` de `index.css` e que `DoomsdayClock`, `War Room HUD`, `MEMBRANA LOCAL` e `Toast` nunca colidem.

---

## 🌊 ONDA 2: O Quadro Infinito (`/case/:id`), Navegação Touch & Board Pro

### 🎯 Worker Único: `@board-uv`
**Escopo Técnico:**
1. **Gestos Espaciais Mobile & Paridade de Quadro (`/case/:id`):**
   - Pan fluido com 1 dedo (modo Pan) ou 2 dedos (modo Edição), pinch-zoom contínuo `10%–300%` ancorado no ponto médio dos dedos, arraste de cards sem conflito com scroll/pinch e debounce nas mutações Realtime.
   - Criar pista no centro da câmera atual ou via long-press / modo "Toque para Posicionar"; seleção Marquee touch; barra contextual com `FloatingNudgePad` (substituindo `Setas` / `Shift+Setas`); conexões toque-a-toque + long-press abrindo `TouchContextMenu` (substituindo clique direito); menu "Organizar" em `BottomSheet`; busca `TerminalSearch` keyboard-safe (`visualViewport`, substituindo `` ` ``/`~`/`Ctrl+K`); Luz UV Global com modo **"Seguir o Toque"** e FAB Pan/Edição (`InteractionToggleButton`).
   - Remover a duplicação confusa entre `.investigation-sidebar` (esquerda) e `.investigation-toolbar` (inferior) e remover a segunda instância duplicada de `<InvestigationCardModal />` em `InvestigationBoard.tsx`.
2. **Correções Visuais dos Cards (`EvidenceCard*` / `MysteryImage`):**
   - Fundo opaco `rgba(10, 14, 21, 0.96)` em todos os cards (como `TELEFONE`/`CELULAR DA ANA`) impedindo vazamento de hex no texto; mini previews SVG diegéticos para cards sem foto; dimming `brightness(0.88)` em repouso para miniaturas claras (`E-MAIL`) voltando a `1.0` no hover; blocos `[REDIGIDO]` estilo dossiê; `@container` query no card.
   - Em `MysteryImage.tsx` + `MysteryEffects.css`: eliminar dupla renderização desnecessária da imagem base quando `forensicChannel === 'all'` e remover regras `.corrompido` vermelhas indevidas para erradicar a causa raiz de tintura no zoom.
3. **Board Pro & Animações Ambientais Leves (ligadas ao Modo Performance `⚡` e `prefers-reduced-motion`):**
   - **Zoom Semântico (`< 48%`):** colapsar detalhes secundários dos cards exibindo título legível, badge de tipo e cor de status/elemento.
   - **Minimapa Tático (`TacticalMinimap.tsx`) + `Zoom to Fit`:** filtrar estritamente pistas `is_hidden` para não-Mestres (ou em `playerView`).
   - **Cross-Highlight & Filtro por Esmaecimento (`opacity: 0.25`):** destacar vizinhos conectados ao selecionar/focar um card.
   - **Conexões Pro (`ConnectionLine.tsx`):** rótulos opcionais editáveis no fio + ação "Pular para nó ligado" quando o destino estiver fora da tela.
   - **Zonas & Alinhamento (`BoardZonesLayer.tsx`):** molduras/zonas temáticas no fundo do quadro + Guias Magnéticas e `Snap to Grid` opcional.
   - **Animações CSS/SVG (`opacity`/`transform` apenas, `pointer-events: none`):** scanline sutil (`<= 0.05`, ciclo 10s), pulso luminoso nas conexões confirmadas/místicas, entrada/revelação (~350ms), equalizador em áudio ativo e vinheta reativa à `MEMBRANA LOCAL > 75%`.

**Arquivos Exclusivos (`@board-uv`):**
- `src/pages/Investigation.tsx`
- `src/components/board/InvestigationBoard.tsx`
- `src/components/board/InvestigationBoard.css`
- `src/components/board/investigation.css`
- `src/components/board/investigation.lenses.css`
- `src/components/board/TacticalMinimap.tsx` *(NOVO)*
- `src/components/board/TacticalMinimap.css` *(NOVO)*
- `src/components/board/BoardZonesLayer.tsx` *(NOVO)*
- `src/components/board/EvidenceCard.tsx`
- `src/components/board/EvidenceCard.css`
- `src/components/board/EvidenceCardContent.tsx`
- `src/components/board/EvidenceCardContent.css`
- `src/components/board/MysteryImage.tsx`
- `src/components/board/MysteryEffects.css`
- `src/components/ConnectionLine.tsx`
- `src/components/ConnectionLine.css`
- `src/components/BottomNavigationBar.tsx`
- `src/components/BottomNavigationBar.css`
- `src/components/InteractionToggleButton.tsx`
- `src/components/InteractionToggleButton.css`
- `src/components/LayersPanel.tsx`
- `src/components/LayerItem.tsx`
- `src/components/LayerPreview.tsx`
- `src/components/LayerIcons.tsx`
- `src/components/board/TerminalSearch.tsx`
- `src/components/board/TerminalSearch.css`
- `src/store/boardStore.ts`
- `src/utils/layoutAlgorithms.ts`

### 🔍 Verificador da Onda 2: `@verifier`
- Validar pinch-zoom `10%–300%`, Zoom Semântico `< 48%`, Minimapa (sem vazar pistas `is_hidden` na visão jogador), conexões com rótulo/salto, `FloatingNudgePad` e `TouchContextMenu`.
- Verificar desligamento instantâneo de todas as animações ambientais ao ativar o Modo Performance (`⚡`).

---

## 🌊 ONDA 3: Hub de Criação (10 Abas) & Reforma do Modal de Inspeção

### 🎨 Worker 1: `@creation-tabs`
**Escopo Técnico:**
1. **Unificação no `CreateClueModal_Refactored` e Paridade Mobile (`100dvh`):**
   - Garantir que `CreateClueModal_Refactored` cubra 100% da edição de pistas existentes (permitindo aposentar o monólito legado `CreateClueModal.tsx`).
   - Tornar todas as **10 abas** (`TabGeneral`, `TabVisual`, `TabAudio`, `TabCipher`, `TabGlitch`, `TabMegaClue`, `TabFieldsVisibility`, `TabDisplayConfig`, `TabSecurity`, `TabMetadata`) acessíveis em telas verticais via barra de abas com scroll horizontal + indicador/seletor rápido, layout de formulário em **1 coluna** no mobile, todos os inputs com `font-size >= 16px` e rodapé fixo seguro (`env(safe-area-inset-bottom)`) mantendo **Salvar/Cancelar** sempre visíveis.
2. **Builders & Tour Guiado:**
   - Adaptar `CreatorHub` (templates responsivos), `FakePhoneChatBuilder` (edição e preview empilhados sem esmagar colunas) e `Driver.js` em `useClueTour.ts` (`--z-driver: 5000`, popovers contidos na viewport mobile).

**Arquivos Exclusivos (`@creation-tabs`):**
- `src/components/modals/CreatorHub.tsx`
- `src/components/modals/CreatorHub.css`
- `src/components/modals/CreateClueModal_Refactored.tsx`
- `src/components/modals/CreateClueModal_Refactored.css`
- `src/components/modals/CreateClueModal.tsx` *(manter apenas shim/compatibilidade até limpeza na Onda 5)*
- `src/components/modals/CreateClueModal.css`
- `src/components/modals/createclueTabs/TabGeneral.tsx`
- `src/components/modals/createclueTabs/TabVisual.tsx`
- `src/components/modals/createclueTabs/TabAudio.tsx`
- `src/components/modals/createclueTabs/TabCipher.tsx`
- `src/components/modals/createclueTabs/TabGlitch.tsx`
- `src/components/modals/createclueTabs/TabMegaClue.tsx`
- `src/components/modals/createclueTabs/TabFieldsVisibility.tsx`
- `src/components/modals/createclueTabs/TabDisplayConfig.tsx`
- `src/components/modals/createclueTabs/TabSecurity.tsx`
- `src/components/modals/createclueTabs/TabMetadata.tsx`
- `src/components/modals/createclueTabs/createclueTabs.css`
- `src/components/modals/createclueTabs/index.tsx`
- `src/components/modals/createclueTabs/FakePhoneChatBuilder.tsx`
- `src/components/tools/FieldVisibilityEditor.tsx`
- `src/components/tools/FieldVisibilityEditor.css`
- `src/components/tools/FieldVisibilityButton.tsx`
- `src/components/tools/FieldVisibilityButton.css`
- `src/components/tools/DisplayConfigPanel.tsx`
- `src/components/tools/DisplayConfigPanel.css`
- `src/components/tools/DisplayConfigButton.tsx`
- `src/components/tools/DisplayConfigButton.css`
- `src/config/displayConfig.ts`
- `src/config/fieldVisibilityConfig.ts`
- `src/contexts/ClueModalContext.tsx`
- `src/reducers/clueFormReducer.ts`
- `src/schemas/clueValidation.ts`
- `src/hooks/useCreateClueState.ts`
- `src/hooks/useCreateClueState_v3.ts`
- `src/hooks/useClueTour.ts`
- `src/api/templates.ts`

---

### 🔎 Worker 2: `@inspect-modals`
**Escopo Técnico:**
1. **Correção Definitiva dos Bugs Visuais do `InspectionModal`:**
   - **Fim da imagem vermelha ao dar zoom:** remover transições/filtros conflitantes em `.uv-container > div`, resetar `forensicChannel` ao abrir nova pista, isolar `.thermal-overlay` (`mix-blend-mode: screen` apenas quando `localThermal === true`), remover `.is-glitching { filter: sepia(0.5) }` sobre a mídia normal e travar `user-select: none` nos controles de zoom/header.
   - **Split View Desktop (`>= 960px`) & Mobile (`52dvh–60dvh`):** garantir destaque de **65%–70%** de largura para o palco de mídia no desktop (`grid-template-columns: minmax(0, 68fr) minmax(320px, 32fr)`) com painel lateral rolável independente, e **52–60dvh** para a mídia no topo em mobile.
   - **Centralização e Header sem Cortes:** corrigir alinhamento do `.inspect-file` no `.inspect-backdrop` e refatorar `.inspect-header` para que `EVIDÊNCIA #...` no topo e botões `TRATAMENTO` / `LUZ UV` / `MAIS` / `Fechar` à direita nunca sejam cortados em nenhuma resolução.
   - **Card do Shredder (`DOCUMENTO TRITURADO DETECTADO` / `ABRIR RECONSTRUTOR`):** centralizar perfeitamente em ambos os eixos (`width: 100%; height: 100%; margin: 0 auto`), substituir emojis (`🗂️`, `🧩`, `📸`, `🎥`, `💬`, `🔦`, `🧪`) por ícones `Lucide` nítidos e padronizar `.btn-reconstructor` com contraste WCAG AA (`>= 4.5:1`).
2. **Paridade Mobile na Inspeção & Áudio:**
   - Pinch-to-zoom suave na imagem dentro do modal (além de duplo-toque e botões `+`/`-`), UV/Térmica local seguindo o toque, sliders de filtros em `BottomSheet`, status/Ordem Z, bypass Mestre, vídeo responsivo e Wavesurfer com touch scrubbing + `wavesurfer.destroy()` garantido no cleanup.

**Arquivos Exclusivos (`@inspect-modals`):**
- `src/components/modals/InspectionModal.tsx`
- `src/components/modals/InspectionModal.css`
- `src/components/modals/InvestigationCardModal.tsx`
- `src/components/modals/AudioViewerModal.tsx`
- `src/components/modals/AudioViewerModal.css`
- `src/components/modals/AudioExpanderModal.tsx`
- `src/components/modals/AudioExpanderModal.css`
- `src/components/modals/useEscapeClose.ts`
- `src/components/modals/index.tsx`
- `src/utils/ModalManager.ts`
- `src/components/tools/MegaClueCard.tsx`
- `src/components/tools/MegaClueCard.css`

### 🔍 Verificador da Onda 3: `@verifier`
- Inspecionar evidências com zoom `1x` a `8x` confirmando fidelidade absoluta de cores (zero tintura vermelha).
- Validar Split View `>= 960px` (65%–70% mídia), mobile `52–60dvh`, centralização e contraste WCAG AA do card `DOCUMENTO TRITURADO DETECTADO` / `ABRIR RECONSTRUTOR`, e navegação completa pelas 10 abas de criação em `360x740`.

---

## 🌊 ONDA 4: Arsenal Forense Completo, Criptoanálise, Puzzles & Terminais

### 🎧 Worker 1: `@forensic-audio`
**Escopo Técnico:**
1. **Desbloqueio Mobile & Ciclo de Vida WebAudio:**
   - Criar `useAudioUnlock.ts` para destravar `AudioContext.resume()` no primeiro gesto do usuário em iOS Safari / Android Chrome; garantir fechamento/suspensão limpa de `AudioContext`, `wavesurfer.destroy()` e `cancelAnimationFrame` ao desmontar.
   - Persistir estado global de **Mute SFX** em `localStorage` (`AudioManager.ts` / `sound.ts` / `audio.ts`).
2. **Ferramentas Forenses de Áudio 100% Touch:**
   - `AdvancedAudioLab`: seleção de `triggerTime` e marcadores via touch.
   - `SpectrogramAnalyzer`, `ProfessionalSpectrogram`, `RealTimeSpectrogram`, `UrlRealTimeSpectrogram` e `SpectrogramCreator`: tooltip de frequência/tempo posicionado **acima do dedo** (offset `-56px` Y) + redução automática de FPS no Modo Performance (`⚡`).
   - `AudioMixer`: alças de fader/crossfade com área de toque `>= 44px` + exportação WAV funcional no mobile.
   - Responsividade 1 coluna e touch targets em `AudioLab`, `AudioForge`, `ChannelIsolator`, `SignalReconstructor` e `AudioDecrypter`.

**Arquivos Exclusivos (`@forensic-audio`):**
- `src/hooks/useAudioUnlock.ts` *(NOVO)*
- `src/components/tools/AdvancedAudioLab.tsx`
- `src/components/tools/AdvancedAudioLab.css`
- `src/components/tools/AudioMixer.tsx`
- `src/components/tools/AudioMixer.css`
- `src/components/tools/AudioForge.tsx`
- `src/components/tools/AudioDecrypter.tsx`
- `src/components/tools/ChannelIsolator.tsx`
- `src/components/tools/SignalReconstructor.tsx`
- `src/components/tools/SignalReconstructor.css`
- `src/components/tools/SpectrogramAnalyzer.tsx`
- `src/components/tools/ProfessionalSpectrogram.tsx`
- `src/components/tools/ProfessionalSpectrogram.css`
- `src/components/tools/RealTimeSpectrogram.tsx`
- `src/components/tools/UrlRealTimeSpectrogram.tsx`
- `src/components/tools/SpectrogramCreator.tsx`
- `src/components/tools/SpectrogramCreator.css`
- `src/components/tools/spectrogramColormap.ts`
- `src/components/tools/spectrogramWorker.ts`
- `src/components/tools/audiolab/AudioLab.tsx`
- `src/components/tools/audiolab/AudioLab.css`
- `src/components/tools/audiolab/AudioLayerPanel.tsx`
- `src/components/tools/audiolab/DSPFiltersPanel.tsx`
- `src/components/tools/audiolab/DSPFiltersPanel.css`
- `src/components/tools/audiolab/FrequencyControls.tsx`
- `src/components/tools/audiolab/SignalGeneratorPanel.tsx`
- `src/components/tools/audiolab/SignalGeneratorPanel.css`
- `src/components/tools/audiolab/SteganoInputPanel.tsx`
- `src/utils/audio.ts`
- `src/utils/audioGenerator.ts`
- `src/utils/AudioManager.ts`
- `src/utils/dspAudioEngine.ts`
- `src/utils/sound.ts`
- `src/utils/spectrogramSynthesizerWorker.ts`
- `src/workers/spectrogram.worker.ts`
- `src/types/wavesurfer.d.ts`
- `src/types/wavesurfer-spectrogram.d.ts`

---

### 🔬 Worker 2: `@forensic-canvas-crypto`
**Escopo Técnico:**
1. **Editores Visuais & Lentes Touch:**
   - `UVEditor`: 1 dedo aplica pincel/ferramenta ativa, 2 dedos fazem pinch-zoom + pan; painel de camadas em `BottomSheet` no mobile com botões explícitos **Subir/Descer Camada** (sem depender de HTML5 drag-and-drop) + botão de importar imagem/câmera (`accept="image/*"`). Encapsular `UVEditor.css` para não poluir estilos globais.
   - `ThermalEditor`: paleta IRONBOW responsiva + arraste touch de rótulos/textos térmicos.
   - `ForensicChannelEditor`, `GlitchImageEngine`, `GlitchMaker` e `Sketchpad` (`Excalidraw` ocupando viewport útil sem cortar toolbar mobile).
   - `DecipherLens`: lupa deslocada **acima do dedo** (`-64px` Y) em dispositivos touch para a mão não cobrir a área decifrada.
2. **Criptoanálise, Hex & Esteganografia:**
   - `HexViewer`: colapsar automaticamente de **16 bytes** (desktop) para **8 bytes** por linha em telas `< 640px` mantendo alinhamento `tabular-nums` entre offset, hex e ASCII.
   - `EnigmaMachine`, `UniversalDecoder`, `ManualDecoder` e `lsbStegoEngine` adaptados para mobile sem scroll horizontal.

**Arquivos Exclusivos (`@forensic-canvas-crypto`):**
- `src/components/tools/UVEditor.tsx`
- `src/components/tools/UVEditorInner.tsx`
- `src/components/tools/UVEditor.css`
- `src/components/tools/UVEditor.animations.css`
- `src/components/tools/uveditor/types.ts`
- `src/components/tools/uveditor/UVColorPalette.tsx`
- `src/components/tools/uveditor/UVEditorContext.tsx`
- `src/components/tools/uveditor/UVMaskControls.tsx`
- `src/components/tools/uveditor/UVPropertiesPanel.tsx`
- `src/components/tools/uveditor/UVToolbar.tsx`
- `src/components/tools/ThermalEditor.tsx`
- `src/components/tools/ThermalEditor.css`
- `src/components/tools/ForensicChannelEditor.tsx`
- `src/components/tools/ForensicChannelEditor.css`
- `src/components/tools/GlitchImageEngine.tsx`
- `src/components/tools/GlitchImageEngine.css`
- `src/components/tools/GlitchMaker.tsx`
- `src/components/tools/GlitchMaker.css`
- `src/components/tools/glitchHooks.ts`
- `src/utils/glitchPlaceholder.ts`
- `src/components/tools/DecipherLens.tsx`
- `src/components/tools/DecipherLens.css`
- `src/components/tools/Sketchpad.tsx`
- `src/components/tools/Sketchpad.css`
- `src/utils/imageUtils.ts`
- `src/utils/lsbStegoEngine.ts`
- `src/workers/forensicWorker.ts`
- `src/components/tools/HexViewer.tsx`
- `src/components/tools/HexViewer.css`
- `src/components/tools/EnigmaMachine.tsx`
- `src/components/tools/EnigmaMachine.css`
- `src/components/tools/ManualDecoder.tsx`
- `src/components/tools/ManualDecoder.css`
- `src/components/tools/UniversalDecoder.tsx`
- `src/components/tools/UniversalDecoder.css`
- `src/utils/ciphers.ts`
- `src/utils/hexEncoders.ts`

---

### 🧩 Worker 3: `@puzzles-terminals`
**Escopo Técnico:**
1. **Puzzles Táteis Sem Dependência de Teclado/Mouse:**
   - `ShredderPuzzle` & `ShredderPuzzleModal`: remover redeclaração `:root` em `ShredderPuzzleModal.css`, garantir troca por **2 toques** (selecionar tira A → tocar tira B para trocar) além de drag pointer, e adicionar botão explícito **"Modo Revelar/Ocultar Peças"** para o Mestre (substituindo `Ctrl+clique`).
   - `PatternLock`: `touch-action: none` + hit radius ampliado nos nós + feedback háptico leve.
   - `NumericKeypad` e `CodePromptModal`: teclas `>= 48px` confortáveis ao polegar, inputs `>= 16px`.
   - `GlitchPuzzleCard` & `GlitchPuzzleSolver`: sliders empilhados abaixo do preview com altura touch `44px`.
2. **Dispositivos Diegéticos, CCTV & Terminais:**
   - `PhoneViewer`: moldura adaptativa (`100%` em mobile sem moldura dupla cortada).
   - `CCTVPlayer`: controles touch para velocidade `0.25x–1x`, zoom `1x–4x` com pan por arraste e filtros `night`/`thermal`.
   - `HackingTerminal`, `SystemTerminal` e `ForensicTerminalModal`: barra horizontal de **chips de comandos rápidos** (`help`, `ls`, `cat`, `scan`, `decrypt`, `clear`) acima do input + layout keyboard-safe (`visualViewport`).
   - `FileExplorer`, `FileProperties` e `NetUplink`: navegação em lista/breadcrumb responsiva para mobile.

**Arquivos Exclusivos (`@puzzles-terminals`):**
- `src/components/tools/GlitchPuzzleCard.tsx`
- `src/components/tools/GlitchPuzzleCard.css`
- `src/components/tools/GlitchPuzzleSolver.tsx`
- `src/components/tools/GlitchPuzzleSolver.css`
- `src/components/tools/PatternLock.tsx`
- `src/components/tools/PatternLock.css`
- `src/components/tools/NumericKeypad.tsx`
- `src/components/tools/NumericKeypad.css`
- `src/components/modals/CodePromptModal.tsx`
- `src/components/modals/CodePromptModal.css`
- `src/components/tools/ShredderPuzzle.tsx`
- `src/components/tools/ShredderPuzzle.css`
- `src/components/modals/ShredderPuzzleModal.tsx`
- `src/components/modals/ShredderPuzzleModal.css`
- `src/components/tools/PhoneViewer.tsx`
- `src/components/tools/PhoneViewer.css`
- `src/components/tools/CCTVPlayer.tsx`
- `src/components/tools/CCTVPlayer.css`
- `src/components/tools/HackingTerminal.tsx`
- `src/components/tools/HackingTerminal.css`
- `src/components/tools/SystemTerminal.tsx`
- `src/components/tools/SystemTerminal.css`
- `src/components/modals/ForensicTerminalModal.tsx`
- `src/components/modals/ForensicTerminalModal.css`
- `src/components/tools/FileExplorer.tsx`
- `src/components/tools/FileProperties.tsx`
- `src/components/tools/NetUplink.tsx`
- `src/components/tools/index.tsx`
- `src/utils/textSynthWorker.ts`

### 🔍 Verificador da Onda 4: `@verifier`
- Testar `AudioContext` em emulação mobile, `UVEditor` (1 dedo pintura / 2 dedos zoom-pan + reordenação de camadas via `BottomSheet`), `HexViewer` em 8 colunas (`375px`), `ShredderPuzzle` em 2 toques + botão GM "Modo Revelar/Ocultar Peças", `PatternLock` contínuo, `CCTVPlayer` (`0.25x-1x` + zoom `1x-4x`) e chips nos terminais.

---

## 🌊 ONDA 5: Faxina de Código Morto, Acessibilidade WCAG AA, Bundle Splitting, PWA & Segurança

### 🧹 Worker 1: `@css-dedup-a11y`
**Escopo Técnico:**
1. **Deleção Definitiva de Arquivos Mortos, Órfãos e Duplicados:**
   - Remover todos os CSS/SCSS não referenciados, abas órfãs, modais refatorados/legados mortos e arquivos de debug mapeados na Seção 0.1.
2. **Empty States C.R.I.S., Skeletons Zero-CLS & Acessibilidade WCAG AA:**
   - Criar `CrisEmptyState.tsx` (+ `.css`) com skeletons `aspect-ratio` (zero Cumulative Layout Shift).
   - Revisar contraste WCAG AA (`>= 4.5:1`), `aria-label` em todos os botões somente-ícone, estados `:active` táteis, `@media (hover: hover)` e suite automatizada com `axe-core` cobrindo componentes principais.

**Arquivos Exclusivos (`@css-dedup-a11y`):**
- **Criar:**
  - `src/components/ui/CrisEmptyState.tsx` *(NOVO)*
  - `src/components/ui/CrisEmptyState.css` *(NOVO)*
- **Auditar / Polir:**
  - `src/components/dice/index.tsx`
  - `src/components/notes/index.tsx`
  - `src/components/layout/BootScreen.tsx`
  - `src/components/layout/BootScreen.css`
  - `src/components/layout/Desktop.tsx`
  - `src/components/layout/Desktop.css`
  - `src/components/ui/FalseLogDisplay.tsx`
  - `src/components/ui/NPC.tsx`
  - `src/rules/diceRules.ts`
  - `src/utils/codeTracking.ts`
  - `src/utils/EventManager.ts`
  - `src/utils/validatePolyfills.ts`
  - `src/setupTests.ts`
- **Deletar (Código Morto Confirmado):**
  - `src/styles/global.css` *(DELETE)*
  - `src/styles/main.scss` *(DELETE)*
  - `src/styles/abstracts/_mixins.scss` *(DELETE)*
  - `src/styles/abstracts/_variables.scss` *(DELETE)*
  - `src/styles/base/_animations.scss` *(DELETE)*
  - `src/styles/base/_base.scss` *(DELETE)*
  - `src/styles/components/_buttons.scss` *(DELETE)*
  - `src/styles/components/_layers.scss` *(DELETE)*
  - `src/styles/components/_scrollbar.scss` *(DELETE)*
  - `src/styles/layout/_editor.scss` *(DELETE)*
  - `src/pages/Home.css` *(DELETE)*
  - `src/components/modals/AgentProfileConfig.css` *(DELETE)*
  - `src/components/board/index.tsx` *(DELETE)*
  - `src/components/board/EvidenceCardDebug.tsx` *(DELETE)*
  - `src/components/board/EvidenceCardTest.tsx` *(DELETE)*
  - `src/utils/cardTestHelper.ts` *(DELETE)*
  - `src/components/modals/InvestigationCardModal_Refactored.tsx` *(DELETE)*
  - `src/components/modals/InvestigationCardModal_Refactored.css` *(DELETE)*
  - `src/components/modals/investigationTabs/index.ts` *(DELETE)*
  - `src/components/modals/investigationTabs/InvestigationBasicsTab.tsx` *(DELETE)*
  - `src/components/modals/investigationTabs/InvestigationChatTab.tsx` *(DELETE)*
  - `src/components/modals/investigationTabs/InvestigationMediaTab.tsx` *(DELETE)*
  - `src/components/modals/investigationTabs/InvestigationMegaClueTab.tsx` *(DELETE)*
  - `src/components/modals/investigationTabs/InvestigationStatusTab.tsx` *(DELETE)*
  - `src/components/modals/investigationTabs/investigationTabs.css` *(DELETE)*
  - `src/components/modals/tabs/index.ts` *(DELETE)*
  - `src/components/modals/tabs/ClueBasicsTab.tsx` *(DELETE)*
  - `src/components/modals/tabs/ClueConfigTab.tsx` *(DELETE)*
  - `src/components/modals/tabs/ClueMediaTab.tsx` *(DELETE)*
  - `src/components/modals/tabs/CluePreviewTab.tsx` *(DELETE)*
  - `src/components/modals/tabs/CluePublishTab.tsx` *(DELETE)*
  - `src/components/modals/tabs/ClueValidationTab.tsx` *(DELETE)*
  - `src/components/modals/components/ClueSummary.tsx` *(DELETE)*
  - `src/components/modals/forms/GlitchPuzzleForm.tsx` *(DELETE)*
  - `src/components/modals/forms/GlitchPuzzleForm.css` *(DELETE)*
  - `src/components/modals/forms/MegaClueForm.tsx` *(DELETE)*
  - `src/components/modals/forms/MegaClueForm.css` *(DELETE)*
  - `src/components/tools/audiolab/outdated/InteractiveWaveform.tsx` *(DELETE)*
  - `src/components/tools/audiolab/outdated/SpectrogramPreviewCanvas.tsx` *(DELETE)*
  - `src/components/tools/textSynthWorker.ts` *(DELETE — duplicado de `src/utils/textSynthWorker.ts`)*

---

### ⚡ Worker 2: `@perf-bundle`
**Escopo Técnico:**
1. **Code Splitting (`React.lazy` + `Suspense` + `manualChunks`):**
   - Quebrar o chunk monolítico `InvestigationBoard` (~1.94 MB minificado) separando `@excalidraw/excalidraw`, `UVEditor`, `AudioLab`/`AdvancedAudioLab` e modais pesados em chunks sob demanda.
   - Limpar `src/App.tsx`: remover `EvidenceCard`/`InspectionModal` inline mortos, remover `<BottomNavigationBar />` global duplicado fora das rotas e o botão `.fab-toggle-mode` órfão.
   - Ajustar `src/main.tsx` (ordem limpa de CSS + registro condicional do SW) e `index.html` (remover `maximum-scale=1.0, user-scalable=no` para conformidade WCAG/Lighthouse, adicionar `viewport-fit=cover`, `theme-color` e `<link rel="manifest" href="/manifest.webmanifest" />`).
2. **GPU & Motor de Performance:**
   - Remover `will-change` estático fora de interações ativas e consolidar `performance.ts` / `performance_control.ts` / `usePerformanceMode.tsx` sem duplicar regras já presentes em `performance.css`.

**Arquivos Exclusivos (`@perf-bundle`):**
- `src/App.tsx`
- `src/main.tsx`
- `index.html`
- `vite.config.ts`
- `package.json`
- `tsconfig.json`
- `jest.config.js`
- `src/polyfills/process-shim.ts`
- `src/env.d.ts`
- `src/types/global.d.ts`
- `src/utils/performance.ts`
- `src/utils/performance_control.ts`
- `src/utils/perf_helpers.ts`
- `src/utils/usePerformanceMode.tsx`
- `src/utils/__tests__/performance.test.ts`

---

### 🛡️ Worker 3: `@ux-atmosphere`
**Escopo Técnico:**
1. **Upload Seguro para Forense / Esteganografia LSB:**
   - Em `storage.ts` / `fileValidators.ts`: comprimir imagens comuns para economia de banda, mas **preservar pixels 100% intactos (PNG lossless sem recompressão Canvas/WebP)** sempre que a pista contiver esteganografia LSB, camada forense RGB ou flag `preserveExactPixels`.
2. **Resiliência Supabase Realtime & Segurança:**
   - Criar `RealtimeStatusBanner.tsx` exibindo status discreto de reconexão/sincronização quando o WebSocket cair e garantindo `supabase.removeChannel()` rigoroso no cleanup.
   - Auditar políticas RLS (`sql/` / `rpc_setup.sql`) e endurecer `vercel.json`: ajustar `Permissions-Policy` para permitir `camera=(self)` (usada na importação de evidência mobile) e refinar `Content-Security-Policy` (conexões Supabase REST/WSS, workers `blob:`, fontes locais/Google, `frame-ancestors 'none'`).
3. **PWA Instalável:**
   - Criar `src/utils/registerSW.ts` e revisar `public/manifest.webmanifest` + `public/sw.js` (bypass estrito para endpoints Supabase Auth/REST/Realtime e cache seguro de estáticos).

**Arquivos Exclusivos (`@ux-atmosphere`):**
- `public/manifest.webmanifest`
- `public/sw.js`
- `vercel.json`
- `src/utils/registerSW.ts` *(NOVO)*
- `src/components/ui/RealtimeStatusBanner.tsx` *(NOVO)*
- `src/utils/fileValidators.ts`
- `src/utils/validationSchemas.ts`
- `src/utils/storage.ts`
- `src/utils/storagePath.ts`
- `src/utils/validateClue.ts`
- `src/supabaseClient.ts`
- `src/utils/supabaseHelpers.ts`
- `src/api/connections.ts`
- `src/api/investigations.ts`
- `src/api/index.ts`

### 🔍 Verificador Final da Onda 5: `@verifier`
- Executar `npm run typecheck && npm test && npm run build`, verificando queda expressiva do chunk principal (`InvestigationBoard` < 750 kB após split de Excalidraw/Modais/Editores).
- Executar auditoria `axe-core` (0 violações críticas/sérias WCAG AA), validar instalação PWA + funcionamento offline básico e testar integridade bit-a-bit de upload PNG com LSB Stego.

---

## ✅ Matriz de Verificação Automatizada de Isolamento

- **Onda 1:** `@foundation` (30 arquivos) ∩ `@hud-pages` (25 arquivos) = **0 interseções**
- **Onda 2:** `@board-uv` (28 arquivos) = **worker único na onda (0 interseções)**
- **Onda 3:** `@creation-tabs` (36 arquivos) ∩ `@inspect-modals` (12 arquivos) = **0 interseções**
- **Onda 4:** `@forensic-audio` (37 arquivos) ∩ `@forensic-canvas-crypto` (37 arquivos) ∩ `@puzzles-terminals` (29 arquivos) = **0 interseções**
- **Onda 5:** `@css-dedup-a11y` (55 arquivos entre criações, polimentos e deleções) ∩ `@perf-bundle` (15 arquivos) ∩ `@ux-atmosphere` (15 arquivos) = **0 interseções**
- **Interseção Global Entre Ondas (Onda 1..5):** **0 arquivos repetidos em todo o plano** (319 caminhos únicos mapeados — 100% dos 299 arquivos existentes em `src/` + `public/`, configs e novos arquivos, `Unmapped src/ files: 0`).

```text
AUDIT RESULT: ZERO CONFLICTS
```
