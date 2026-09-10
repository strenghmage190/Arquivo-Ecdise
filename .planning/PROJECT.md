# Arquivo Ecdise — CRIS (Sistema de Investigação Forense)

## What This Is

Uma ferramenta de investigação forense sobrenatural para o RPG Ordem Paranormal. O sistema permite criar, editar e conectar pistas (evidências) com ferramentas de análise de imagem (UV, RGB, filtros), áudio (espectrograma, esteganografia), e um tabuleiro de investigação com nós conectados. A UI segue a estética de um terminal institucional da Ordo Realitas — austero, monocromático, corrompido pelos Elementos do Outro Lado.

## Core Value

Um sistema forense imersivo onde o chrome é invisível (monocromático) e a única cor que o jogador vê vem dos dados do caso — tornando cada Elemento sobrenatural instantaneamente legível e cinematográfico.

## Current State

**v2.0 Terminal Ordo Realitas** (Concluído)
- Sistema de cores institucional monocromático
- Tipografia forense (JetBrains Mono/Space Mono, Rajdhani, Special Elite)
- Header e layout da Home com temática Ordo Realitas (Radar Elemental, Membrana)
- Cards de caso paranormais com miniatura, selo elemental e metadados
- Modal de criação com suporte a escolha de imagem, upload ao Supabase e alteração de elemento
- Toolbar flutuante unificada (cápsula)
- Formulários padronizados

## Next Milestone Goals

(A definir via `/gsd-new-milestone`)

<details>
<summary>Archived Milestone v2.0</summary>

**Goal:** Redesign visual completo da Home e sistema de design — substituir a estética "hacker genérico" por um terminal institucional da Ordo Realitas com paleta monocromática no chrome e cor exclusivamente nos dados do caso.

**Target features:**
1. **Sistema de Cores Institucional:** Paleta monocromática para chrome, vermelho institucional apenas para ações destrutivas, cores dos Elementos exclusivamente nos dados dos casos
2. **Tipografia Forense:** JetBrains Mono/Space Mono para sistema, Rajdhani para títulos
3. **Header Ordo Realitas:** Brasão da Ordem, Radar Elemental, Medidor de Membrana, "Purgar Sessão"
4. **Cards de Caso Sobrenaturais:** Selo elemental, dossiê mono, miniatura com hover, metadados paranormais
5. **Card "+ Novo Caso":** Ritual de Abertura com sigilo translúcido
6. **Toolbar Flutuante Unificada:** Cápsula única (999px radius), divisores finos, zero cor nos botões
7. **Formulários Reestilizados:** Inputs/selects/checkboxes com padrão do sistema
8. **Rodapé de Telemetria:** Ticker monoespaçado com transmissões da Ordem
</details>

## Requirements

### Validated

- ✓ Multi-mode canvas editing (`uv`, `rgb`, `filter`) — v1.0
- ✓ Photoshop/GIMP-style layers mechanics with locked background and explicit rasterization — v1.0
- ✓ Full Lucide React iconography and zero emojis — v1.0
- ✓ Full-screen portal workspace for image forensics — v1.0
- ✓ Spectrogram Steganography: Encode hidden visual patterns/text into audio frequencies without harsh auditory distortion. — v1.1
- ✓ Unified Audio Workstation: Combine fragmented audio tools into a cohesive studio UI. — v1.1
- ✓ Audio Editing & Filtering: Waveform trimming, pitch shifting, speed modulation, bandpass/notch filtering, and audio export. — v1.1
- ✓ Real-time Spectrogram & Waveform Visualizer: High-FPS WebAudio-powered real-time spectrogram and spectrum analyzer. — v1.1
- ✓ Modal UX & Performance: Clean integration into `CreateClueModal` with lazy loading and responsive full-screen capability. — v1.1
- ✓ **CreateClueModal Modularization**: Monolithic CreateClueModal.tsx broken down into tab-specific components with Context orchestration — v1.2
- ✓ **State Management Consolidation**: Refactored isolated state variables into cohesive logical groups — v1.2
- ✓ **Cyberpunk UX Polish**: framer-motion and contextual Neon UI implemented for fluid modal transitions — v1.2
- ✓ **In-App Mini-Tutorials**: Contextual info tooltips and help blocks inside complex tabs like Glitch Calibration and Shredder added — v1.2

### Active

- (A definir no próximo milestone)

### Out of Scope

- Changes to the backend logic of how clues are saved/uploaded (only the UI state handling changes).
- Tabuleiro de investigação (canvas de nós/pistas) — deferred to v2.1
- Lentes Ocultistas no visualizador de evidências — deferred to v2.1
- Efeitos reativos da Membrana (lodo/chamas/névoa invadindo UI) — deferred to v2.1+
- Cards de evidência com 3 estados visuais (Verificada/Contestada/Reescrita) — deferred to v2.1

## Context

O sistema é construído em React + TypeScript + Vite com Tailwind CSS (apesar da regra de projeto mencionar vanilla CSS, o codebase existente usa Tailwind extensivamente). Ícones via lucide-react. O universo é Ordem Paranormal — RPG de terror investigativo com 5 Elementos (Sangue, Morte, Conhecimento, Energia, Medo) que corrompem a realidade.

**Design System — Regras Absolutas:**
- Proibido glassmorphism (backdrop-blur, fundos translúcidos, bordas com glow suave)
- Proibido múltiplas cores de acento no chrome — monocromático puro
- Proibido cantos arredondados (exceto toolbar flutuante)
- Proibido texto de código cru na tela
- border-radius: 0 como padrão global
- Sem box-shadow colorido, sem filter: drop-shadow neon
- Transições: transition-colors duration-150 apenas

**Paleta:**
```css
/* Chrome do sistema — monocromático */
--bg: #0A0A0B;
--surface: #131315;
--border: #2A2A2C;
--text-primary: #E8E8EA;
--text-secondary: #8A8A8C;

/* Vermelho institucional — apenas ações destrutivas */
--institutional-red: #8B1414;

/* Elementos — cor nos DADOS, nunca no chrome */
--el-sangue: #8B1414;
--el-morte: #1C1C1E;      --el-morte-border: #3A3A3C;
--el-energia: #3D2E7C;
--el-conhecimento: #B08D2E;
```

## Constraints

- **Styling**: Tailwind CSS (codebase existente), lucide-react para ícones
- **Design**: Regra "Sistema em preto e branco, Evidência em cor"
- **Performance**: Transições leves (duration-150), sem animações decorativas pesadas
- **Compatibilidade**: Manter funcionalidade existente dos modais e ferramentas de edição

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Tab Modularization | Reduces CreateClueModal.tsx from a 4k+ line monolith to a clean orchestrator | ✓ Good |
| Driver.js | Lightweight and easy to style for the Cyberpunk Onboarding requirement | ✓ Good |
| Paleta monocromática + cor nos dados | Hierarquia visual instantânea — o olho lê o Elemento sem processar | — Pending |
| JetBrains Mono + Rajdhani | Mono para dados/terminal, condensada para títulos de caso = identidade forense | — Pending |
| Toolbar cápsula única | Elimina blocos desalinhados com cores diferentes do design atual | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-10 (Milestone v2.0 completed)*
