# Phase 12: Core State Orchestration & Skeleton

## Domain
Construção do esqueleto do novo modal refatorado, centralização do estado que estava solto, e injeção de animações e sons core. Este esqueleto foi inicialmente construído de forma prematura durante as Phases 14-16, e agora será completamente **redesenhado** (refatorado) para adotar uma nova estrutura e sistema de transição visual.

## Decisions

### 1. Skeleton Layout & Structure
- **Decision:** Full-screen immersive view
- **Rationale:** Em vez de usar um modal flutuante tradicional (baseado no `DiegeticWindow`), o fluxo de edição/criação de pistas passará a usar um layout de tela cheia mais imersivo. Isso maximizará a área de conteúdo para as abas complexas e aprofundará a imersão na estética Cyberpunk.

### 2. Animation Style (framer-motion)
- **Decision:** 3D Cyberpunk Card Flips
- **Rationale:** A navegação entre as abas não usará mais o deslizamento horizontal básico. Em vez disso, usaremos animações 3D de rotação/flip de cartas (card flips) pelo `framer-motion` para trocar as abas, simulando um painel de dados holográfico sendo virado.

### 3. State Orchestration Approach
- **Decision:** React Context API (Mantido do design original)
- **Rationale:** Ideal for isolating the modal's state sem prop drilling. Já implementado no `ClueModalContext.tsx`.

### 4. Sound Effects (use-sound)
- **Decision:** Rich Interactivity via `useCyberpunkUI` (Mantido do design original)
- **Rationale:** SFX on clicks, hover, and processing using the existing hooks.

### 5. Tab Layout Polish & Separations
- **Decision:** Melhorar hierarquia visual (separadores, scroll) e isolar campos de Segurança/Telefone.
- **Rationale:** O usuário indicou que os controles estavam muito juntos (ex: Fake Phone/Security) e sem os estilos do sistema Cyberpunk (checkboxes feios, falta de linhas divisórias). O scroll não estava funcionando por causa de conflitos de `overflow`. Separaremos a segurança/telefone numa nova aba `TabSecurity.tsx` para deixar `TabGeneral` limpo, aplicaremos `<hr className="cc-divider" />` e classes `.cc-checkbox`.

## Canonical Refs
- N/A

## Code Context
- `src/components/modals/CreateClueModal_Refactored.tsx` (Componente alvo para o Redesign Full-screen + Animações 3D)
- `src/components/modals/CreateClueModal_Refactored.css` (Para os novos estilos full-screen e transformações 3D)
