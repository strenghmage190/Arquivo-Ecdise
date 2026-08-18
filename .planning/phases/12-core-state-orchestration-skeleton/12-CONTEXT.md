# Phase 12: Core State Orchestration & Skeleton

## Domain
Construção do esqueleto do novo modal refatorado, centralização do estado que estava solto, e injeção de animações e sons core.

## Decisions

### 1. State Orchestration Approach
- **Decision:** React Context API
- **Rationale:** Native, without extra libraries. Ideal for isolating the modal's state (clueData, mediaState, glitchConfig) without prop drilling, maintaining everything strictly contained within the modal's scope.

### 2. Animation Style (framer-motion)
- **Decision:** "Sliding Cyberpunk"
- **Rationale:** The modal opening will have a fast "glitch" aesthetic effect, and navigating between the internal tabs will cause them to slide in/out from the sides smoothly, matching the AAA military cyberpunk feel.

### 3. Sound Effects (use-sound)
- **Decision:** Rich Interactivity
- **Rationale:** SFX will trigger when switching tabs, focusing on inputs, clicking Save/Cancel buttons, and on notifications.

## Canonical Refs
- N/A

## Code Context
- `src/components/modals/CreateClueModal.tsx` (Current God Component to be analyzed)
