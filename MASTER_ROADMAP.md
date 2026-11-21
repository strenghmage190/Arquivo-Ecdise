# MASTER_ROADMAP.md — Plano Diretor de Reforma (5 Ondas)

> **Regra de Isolamento de Conflito (Zero Git Conflict):**
> Nenhum arquivo aparece em mais de um worker dentro da mesma onda. Todas as branches e worktrees de um mesmo ciclo operam sobre conjuntos de arquivos estritamente disjuntos.

---

## 🌊 ONDA 1: Fundações, HUD Anti-Colisão & Páginas Autônomas

### 🛠️ Worker 1: `@foundation`
**Foco:** Sistema de estilos unificado, variáveis fluidas, reset de layout móvel, hooks de viewport e componentes base reutilizáveis.
- **Estilos Globais e SCSS/Tailwind:**
  - `src/styles/animations.css`
  - `src/styles/global.css`
  - `src/styles/nexus.css`
  - `src/styles/performance.css`
  - `src/styles/main.scss`
  - `src/styles/abstracts/_mixins.scss`
  - `src/styles/abstracts/_variables.scss`
  - `src/styles/base/_animations.scss`
  - `src/styles/base/_base.scss`
  - `src/styles/components/_buttons.scss`
  - `src/styles/components/_layers.scss`
  - `src/styles/components/_scrollbar.scss`
  - `src/styles/layout/_editor.scss`
  - `src/index.css`
  - `src/mobile-cleanup.css`
  - `tailwind.config.js`
  - `postcss.config.js`
- **Hooks Fundacionais:**
  - `src/hooks/useIsMobile.ts`
  - `src/hooks/useIsMobile.test.ts`
  - `src/hooks/useWindowSize.ts`
  - `src/hooks/useCyberpunkUI.ts`
  - `src/hooks/useThrottledMouse.ts`
  - `src/hooks/useGlobalMouseEvents.ts`
  - `src/hooks/useBlobUrl.ts`
  - `src/hooks/useFileUpload.ts`
  - `src/hooks/useNexoMetadata.ts`
- **Componentes Base Padronizados:**
  - `src/components/ui/BottomSheet.tsx`
  - `src/components/ui/Button.tsx`
  - `src/components/ui/Button.module.scss`
  - `src/components/ui/DiegeticWindow.tsx`
  - `src/components/ui/DiegeticWindow.css`
  - `src/components/ui/Tooltip.tsx`
  - `src/components/ui/ErrorBoundary.tsx`
  - `src/ErrorBoundary.tsx`

---

### 🖥️ Worker 2: `@hud-pages`
**Foco:** Sistema anti-colisão de HUD (`fixed`/`absolute`), z-index, toasts, status operacional, salas de guerra e telas de autenticação/rotas independentes.
- **HUD & Camadas Operacionais:**
  - `src/components/ui/SystemOverlays.tsx`
  - `src/components/ui/DoomsdayClock.tsx`
  - `src/components/ui/Toast.tsx`
  - `src/components/ui/Toast.css`
  - `src/components/war-room/ActiveAgentsHud.tsx`
  - `src/components/war-room/CursorOverlay.tsx`
  - `src/components/war-room/index.ts`
  - `src/hooks/useWarRoom.ts`
  - `src/components/board/GMOverwatch.tsx`
- **Rotas e Páginas Autônomas:**
  - `src/pages/Home.tsx`
  - `src/pages/Home.css`
  - `src/pages/Home.module.scss`
  - `src/pages/Login.tsx`
  - `src/pages/Login.css`
  - `src/pages/ResetPassword.tsx`
  - `src/pages/Invite.tsx`
  - `src/pages/Invite.css`
  - `src/components/modals/InviteModal.tsx`
  - `src/components/modals/InviteModal.css`
  - `src/pages/MobileTestPage.tsx`
  - `src/components/bench/ForensicBenchmark.tsx`
  - `src/workers/benchmarkWorker.ts`
  - `src/components/auth/AuthProvider.tsx`
  - `src/components/auth/ProtectedRoute.tsx`

---

### 🔍 Verificador: `@verifier`
- Validação de renderização sem scroll horizontal em 320px, 375px e 768px.
- Verificação de não-colisão entre Doomsday Clock, Toasts e cabeçalhos.
- Smoke test de login e rotas estáticas.

---

## 🌊 ONDA 2: O Quadro Infinito & Navegação Espacial Touch

### 🎯 Worker: `@board-uv`
**Foco:** O coração da aplicação (`/case/:id`). Gestos de pinça (pinch-to-zoom), pan touch de 2 dedos, seleção retangular por toque (marquee), barras de camadas responsivas, linhas de conexão SVG com drag seguro em mobile, Luz UV Global e Terminal C.R.I.S.
- **Página & Orquestrador:**
  - `src/pages/Investigation.tsx`
- **Canvas & Quadro:**
  - `src/components/board/InvestigationBoard.tsx`
  - `src/components/board/InvestigationBoard.css`
  - `src/components/board/investigation.css`
  - `src/components/board/investigation.lenses.css`
- **Cards e Conteúdos do Quadro:**
  - `src/components/board/EvidenceCard.tsx`
  - `src/components/board/EvidenceCard.css`
  - `src/components/board/EvidenceCardContent.tsx`
  - `src/components/board/EvidenceCardContent.css`
  - `src/components/board/MysteryImage.tsx`
  - `src/components/board/MysteryEffects.css`
  - `src/components/board/EvidenceCardDebug.tsx`
  - `src/components/board/EvidenceCardTest.tsx`
- **Conexões & Linhas de Ligação:**
  - `src/components/ConnectionLine.tsx`
  - `src/components/ConnectionLine.css`
- **Barra de Navegação e Controles de Interação:**
  - `src/components/BottomNavigationBar.tsx`
  - `src/components/BottomNavigationBar.css`
  - `src/components/InteractionToggleButton.tsx`
  - `src/components/InteractionToggleButton.css`
- **Painéis de Camadas e Busca:**
  - `src/components/LayersPanel.tsx`
  - `src/components/LayerItem.tsx`
  - `src/components/LayerPreview.tsx`
  - `src/components/LayerIcons.tsx`
  - `src/components/board/TerminalSearch.tsx`
  - `src/components/board/TerminalSearch.css`
- **Estado e Geometria:**
  - `src/store/boardStore.ts`
  - `src/utils/layoutAlgorithms.ts`
  - `src/utils/cardTestHelper.ts`

---

### 🔍 Verificador: `@verifier`
- Testar pan e zoom touch no quadro infinito (sem scroll da página externa).
- Testar toque longo e menu de ações em card no mobile.
- Testar desenho e exclusão de linha de conexão sem mouse.

---

## 🌊 ONDA 3: Hub de Criação & Modais de Inspeção de Evidências

### 🎨 Worker 1: `@creation-tabs`
**Foco:** O ecossistema de criação de pistas e puzzles. Responsividade das 10 abas, conversão de layout com scroll horizontal/drawer móvel, builder de chat falso e controles de campo.
- **Hub e Modais de Criação:**
  - `src/components/modals/CreatorHub.tsx`
  - `src/components/modals/CreatorHub.css`
  - `src/components/modals/CreateClueModal.tsx`
  - `src/components/modals/CreateClueModal.css`
  - `src/components/modals/CreateClueModal_Refactored.tsx`
  - `src/components/modals/CreateClueModal_Refactored.css`
- **As 10 Abas do Criador:**
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
- **Ferramentas Integradas na Criação:**
  - `src/components/modals/createclueTabs/FakePhoneChatBuilder.tsx`
  - `src/components/tools/FieldVisibilityEditor.tsx`
  - `src/components/tools/FieldVisibilityEditor.css`
  - `src/components/tools/FieldVisibilityButton.tsx`
  - `src/components/tools/FieldVisibilityButton.css`
  - `src/components/tools/DisplayConfigPanel.tsx`
  - `src/components/tools/DisplayConfigPanel.css`
  - `src/components/tools/DisplayConfigButton.tsx`
  - `src/components/tools/DisplayConfigButton.css`
- **Contextos e Hooks do Criador:**
  - `src/contexts/ClueModalContext.tsx`
  - `src/hooks/useCreateClueState.ts`
  - `src/hooks/useCreateClueState_v3.ts`
  - `src/hooks/useClueTour.ts`
  - `src/api/templates.ts`

---

### 🔎 Worker 2: `@inspect-modals`
**Foco:** O modal de investigação que o jogador abre ao clicar em uma pista. Apresentação diegética, abas de análise, wavesurfer touch-friendly e visualizadores modais.
- **Modais Principais de Inspeção:**
  - `src/components/modals/InspectionModal.tsx`
  - `src/components/modals/InspectionModal.css`
  - `src/components/modals/InvestigationCardModal.tsx`
  - `src/components/modals/InvestigationCardModal_Refactored.tsx`
  - `src/components/modals/InvestigationCardModal_Refactored.css`
- **Sub-Modais e Visualizadores Auxiliares:**
  - `src/components/modals/AudioViewerModal.tsx`
  - `src/components/modals/AudioViewerModal.css`
  - `src/components/modals/AudioExpanderModal.tsx`
  - `src/components/modals/AudioExpanderModal.css`
  - `src/components/modals/CodePromptModal.tsx`
  - `src/components/modals/CodePromptModal.css`
  - `src/components/modals/AgentProfileConfig.css`
  - `src/components/modals/useEscapeClose.ts`
  - `src/components/modals/index.tsx`
  - `src/utils/ModalManager.ts`
  - `src/components/tools/MegaClueCard.tsx`
  - `src/components/tools/MegaClueCard.css`

---

### 🔍 Verificador: `@verifier`
- Abertura de todas as 10 abas do CreatorHub em telas verticais mobile sem corte de botões Salvar/Cancelar.
- Inspeção de evidência em tela cheia mobile com fechamento touch fácil (swipe down / close handle).

---

## 🌊 ONDA 4: Todo o Arsenal Forense, Puzzles & Criptoanálise

### 🎧 Worker 1: `@forensic-audio`
**Foco:** Toda a suíte forense de áudio. Suporte touch a scrubs, faders verticais, espectrogramas gerados via Web Worker e controle de memória do AudioContext.
- **Laboratórios e Mixers:**
  - `src/components/tools/AdvancedAudioLab.tsx`
  - `src/components/tools/AdvancedAudioLab.css`
  - `src/components/tools/AudioMixer.tsx`
  - `src/components/tools/AudioMixer.css`
  - `src/components/tools/AudioForge.tsx`
  - `src/components/tools/AudioDecrypter.tsx`
- **Espectrograma & Síntese:**
  - `src/components/tools/SpectrogramAnalyzer.tsx`
  - `src/components/tools/ProfessionalSpectrogram.tsx`
  - `src/components/tools/ProfessionalSpectrogram.css`
  - `src/components/tools/RealTimeSpectrogram.tsx`
  - `src/components/tools/UrlRealTimeSpectrogram.tsx`
  - `src/components/tools/SpectrogramCreator.tsx`
  - `src/components/tools/SpectrogramCreator.css`
  - `src/components/tools/spectrogramColormap.ts`
  - `src/components/tools/spectrogramWorker.ts`
- **Módulos do `audiolab/`:**
  - `src/components/tools/audiolab/AudioLab.tsx`
  - `src/components/tools/audiolab/AudioLab.css`
  - `src/components/tools/audiolab/AudioLayerPanel.tsx`
  - `src/components/tools/audiolab/DSPFiltersPanel.tsx`
  - `src/components/tools/audiolab/DSPFiltersPanel.css`
  - `src/components/tools/audiolab/FrequencyControls.tsx`
  - `src/components/tools/audiolab/SignalGeneratorPanel.tsx`
  - `src/components/tools/audiolab/SignalGeneratorPanel.css`
  - `src/components/tools/audiolab/SteganoInputPanel.tsx`
  - `src/components/tools/audiolab/outdated/InteractiveWaveform.tsx`
  - `src/components/tools/audiolab/outdated/SpectrogramPreviewCanvas.tsx`
- **Utilitários DSP e Workers:**
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
**Foco:** Canvas interativo (UV, Térmico, Canais RGB, Glitch), desenho/anotações (Sketchpad), extração de LSB e decifradores criptográficos.
- **Canvas Visual, UV & Térmico:**
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
- **Canais & Glitch:**
  - `src/components/tools/ForensicChannelEditor.tsx`
  - `src/components/tools/ForensicChannelEditor.css`
  - `src/components/tools/ChannelIsolator.tsx`
  - `src/components/tools/GlitchImageEngine.tsx`
  - `src/components/tools/GlitchImageEngine.css`
  - `src/components/tools/GlitchMaker.tsx`
  - `src/components/tools/GlitchMaker.css`
  - `src/components/tools/glitchHooks.ts`
  - `src/utils/glitchPlaceholder.ts`
- **Lentes, Esteganografia & Anotação:**
  - `src/components/tools/DecipherLens.tsx`
  - `src/components/tools/DecipherLens.css`
  - `src/components/tools/Sketchpad.tsx`
  - `src/components/tools/Sketchpad.css`
  - `src/utils/imageUtils.ts`
  - `src/utils/lsbStegoEngine.ts`
  - `src/workers/forensicWorker.ts`
- **Criptografia, Hex e Decodificadores:**
  - `src/components/tools/HexViewer.tsx`
  - `src/components/tools/HexViewer.css`
  - `src/components/tools/EnigmaMachine.tsx`
  - `src/components/tools/EnigmaMachine.css`
  - `src/components/tools/ManualDecoder.tsx`
  - `src/components/tools/ManualDecoder.css`
  - `src/components/tools/UniversalDecoder.tsx`
  - `src/components/tools/UniversalDecoder.css`
  - `src/components/tools/SignalReconstructor.tsx`
  - `src/components/tools/SignalReconstructor.css`
  - `src/utils/ciphers.ts`
  - `src/utils/hexEncoders.ts`

---

### 🧩 Worker 3: `@puzzles-terminals`
**Foco:** Puzzles de interação tátil (Shredder sem depender de mouse hover/click complexo, Pattern Lock touch, Teclados numéricos), CCTV responsivo, e emulação de terminais hackers.
- **Puzzles e Desafios Táteis:**
  - `src/components/tools/GlitchPuzzleCard.tsx`
  - `src/components/tools/GlitchPuzzleCard.css`
  - `src/components/tools/GlitchPuzzleSolver.tsx`
  - `src/components/tools/GlitchPuzzleSolver.css`
  - `src/components/tools/PatternLock.tsx`
  - `src/components/tools/PatternLock.css`
  - `src/components/tools/NumericKeypad.tsx`
  - `src/components/tools/NumericKeypad.css`
  - `src/components/tools/ShredderPuzzle.tsx`
  - `src/components/tools/ShredderPuzzle.css`
  - `src/components/modals/ShredderPuzzleModal.tsx`
  - `src/components/modals/ShredderPuzzleModal.css`
- **Dispositivos Diegéticos & CCTV:**
  - `src/components/tools/PhoneViewer.tsx`
  - `src/components/tools/PhoneViewer.css`
  - `src/components/tools/CCTVPlayer.tsx`
  - `src/components/tools/CCTVPlayer.css`
- **Terminais e Sistemas Operacionais Fictícios:**
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

---

### 🔍 Verificador: `@verifier`
- Testar toque contínuo no Pattern Lock em celular/touchscreen.
- Montagem do Shredder Puzzle por arraste/touch sem quebrar coordenadas.
- Terminal hacker com teclado virtual no mobile sem empurrar layout para fora da tela.

---

## 🌊 ONDA 5: Otimização Final, WCAG AA, Resiliência e Produção

### 🧹 Worker 1: `@css-dedup-a11y`
**Foco:** Limpeza e remoção de artefatos CSS duplicados, eliminação de arquivos mortos/backup, estados vazios (C.R.I.S. Empty States), esqueletos de carregamento e conformidade de acessibilidade (WCAG AA).
- **Remoções e Limpeza de CSS:**
  - `src/styles/layout/_editor.scss.bak` (deleção)
  - `src/styles/performance.css.backup` (deleção)
- **Componentes Restantes & Acessibilidade:**
  - `src/components/dice/index.tsx`
  - `src/components/notes/index.tsx`
  - `src/components/ui/FalseLogDisplay.tsx`
  - `src/components/ui/NPC.tsx`
  - `src/components/layout/BootScreen.tsx`
  - `src/components/layout/BootScreen.css`
  - `src/components/layout/Desktop.tsx`
  - `src/components/layout/Desktop.css`
  - `src/utils/codeTracking.ts`
  - `src/utils/EventManager.ts`
  - `src/utils/validatePolyfills.ts`

---

### ⚡ Worker 2: `@perf-bundle`
**Foco:** Bundle Splitting (`React.lazy`), otimizações de GPU e framerate, aceleração de hardware e profiling de renderização.
- **Entrypoints & Configuração de Build:**
  - `src/App.tsx`
  - `src/main.tsx`
  - `vite.config.ts`
  - `package.json`
  - `index.html`
- **Motores de Performance e Throttling:**
  - `src/utils/performance.ts`
  - `src/utils/performance_control.ts`
  - `src/utils/perf_helpers.ts`
  - `src/utils/usePerformanceMode.tsx`
  - `src/utils/__tests__/performance.test.ts`

---

### 🛡️ Worker 3: `@ux-atmosphere`
**Foco:** PWA (manifest, service worker, touch icons), upload com preservação de LSB (sem recompressão que danifique esteganografia), reconexão Supabase Realtime e CSP/Headers de produção.
- **PWA & Configuração de Servidor:**
  - `public/` (criação de `manifest.json`, service worker se aplicável)
  - `vercel.json`
- **Validação de Uploads e Storage:**
  - `src/utils/fileValidators.ts`
  - `src/utils/validationSchemas.ts`
  - `src/utils/storage.ts`
  - `src/utils/storagePath.ts`
  - `src/utils/validateClue.ts`
- **Infraestrutura Supabase & Realtime:**
  - `src/supabaseClient.ts`
  - `src/utils/supabaseHelpers.ts`
  - `src/api/connections.ts`
  - `src/api/investigations.ts`
  - `src/api/index.ts`

---

### 🔍 Verificador: `@verifier`
- `npm run build` limpo e sem warnings críticos de chunk size desproporcional.
- Lighthouse Audit mobile: PWA instalável, sem violações críticas de contraste WCAG AA.
- Auditoria de segurança de headers do `vercel.json`.
