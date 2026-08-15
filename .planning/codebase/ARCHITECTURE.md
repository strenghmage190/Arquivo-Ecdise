<!-- refreshed: 2026-08-15 -->
# Architecture

**Analysis Date:** 2026-08-15

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           UI & Diegetic Shell Layer                         │
├──────────────────────┬──────────────────────┬───────────────────────────────┤
│    Route Pages       │   HUD & Overlays     │        Modals & Dialogs       │
│ `src/pages/Home.tsx` │`SystemOverlays.tsx`  │ `modals/CreateClueModal.tsx`  │
│ `src/pages/Invest...`│`BottomNavBar.tsx`    │ `modals/InspectionModal.tsx`  │
│ `src/pages/Login.tsx`│`DoomsdayClock.tsx`   │ `modals/AudioViewerModal.tsx` │
└──────────┬───────────┴──────────┬───────────┴───────────────┬───────────────┘
           │                      │                           │
           ▼                      ▼                           ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    Interactive Board & Forensic Tools Layer                 │
├─────────────────────────────────────┬───────────────────────────────────────┤
│         Investigation Board         │          Forensic Analysis Tools      │
│ `components/board/Investigation...` │ `components/tools/UVEditor.tsx`       │
│ `components/board/Conspiracy...`    │ `components/tools/AdvancedAudioLab...`│
│ `components/board/EvidenceCard.tsx` │ `components/tools/GlitchPuzzle...`    │
└──────────────────┬──────────────────┴───────────────────────┬───────────────┘
                   │                                          │
                   ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                       State, Hooks & Manager Layer                          │
├─────────────────────────────────────┬───────────────────────────────────────┤
│           React State & Hooks       │           Global System Managers      │
│ `hooks/useWarRoom.ts`               │ `utils/EventManager.ts`               │
│ `reducers/clueFormReducer.ts`       │ `utils/AudioManager.ts`               │
│ `hooks/useCreateClueState_v3.ts`    │ `utils/ModalManager.ts`               │
│ `hooks/useIsMobile.ts`              │ `utils/performance.ts`                │
└──────────────────┬──────────────────┴───────────────────────┬───────────────┘
                   │                                          │
                   ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        API & Service Gateway Layer                          │
│ `src/api/investigations.ts`  `src/api/connections.ts`  `src/api/whiteboard` │
│ `src/utils/storage.ts`       `src/supabaseClient.ts`   `workers/*.worker.ts`│
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
                                       ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    External Backend: Supabase (PostgreSQL)                  │
│       Relational DB  •  Realtime Channels  •  Storage Buckets  •  Auth      │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| `App` | Top-level routing, auth provider tree, responsive viewport classes, and global toast container | `src/App.tsx` |
| `InvestigationPage` | Wrapper page loading investigation case data, permissions, and board instance | `src/pages/Investigation.tsx` |
| `InvestigationBoard` | Main interactive investigation canvas supporting card drag/drop, pin connections, filters, and layer stacking | `src/components/board/InvestigationBoard.tsx` |
| `ConspiracyBoard` | Excalidraw-based whiteboard diagramming mode with freehand drawing and shapes | `src/components/board/ConspiracyBoard.tsx` |
| `CreateClueModal` | Authoring modal for Game Masters / Investigators to configure complex clue types (documents, audio, ciphers, UV/thermal layers, glitch puzzles) | `src/components/modals/CreateClueModal.tsx` |
| `InspectionModal` | Detailed clue inspection viewer for players to examine layers, enter unlock codes, and decipher clues | `src/components/modals/InspectionModal.tsx` |
| `UVEditor` | Interactive multi-spectrum lens filter and UV illumination visual analysis tool | `src/components/tools/UVEditor.tsx` |
| `AdvancedAudioLab` | Waveform visualizer, equalizer, frequency isolation, and spectrogram decoder | `src/components/tools/AdvancedAudioLab.tsx` |
| `useWarRoom` | Real-time presence, multiplayer cursor tracking, and live board event dispatcher | `src/hooks/useWarRoom.ts` |
| `supabaseClient` | Enforces a strict singleton client instance to Supabase BaaS | `src/supabaseClient.ts` |
| `EventManager` | Central event bus for cross-component decoupled messaging | `src/utils/EventManager.ts` |
| `AudioManager` | Web Audio sound effects, ambient tracks, and procedural tone generation | `src/utils/AudioManager.ts` |

## Pattern Overview

**Overall:** Client-Side Single Page Application (SPA) with Diegetic Cyberpunk Interface, Real-Time Synchronized Canvas, Event-Driven Subsystems, and Web Worker Offloading.

**Key Characteristics:**
- **Diegetic / Immersive UI:** Rich cyberpunk aesthetics, scanline overlays, neon accents, audio feedback, and terminal interfaces designed as an in-world operative workstation.
- **Hybrid Board Architecture:** Dual representation offering card-graph pinning (`InvestigationBoard`) alongside vector whiteboard diagramming (`ConspiracyBoard` powered by Excalidraw).
- **Decoupled Event Messaging:** Use of `EventEmitter3` wrapper (`EventManager`) allowing independent modals and tools to communicate without rigid prop drilling.
- **Worker-Assisted Forensic Processing:** Heavy pixel filtering and audio spectrum Fast Fourier Transforms are delegated to Web Workers to ensure a fluid 60fps UI.

## Layers

**UI & Presentation Layer:**
- Purpose: Render views, HUD elements, modals, and forensic tools
- Location: `src/pages/`, `src/components/`
- Contains: TSX components, CSS/SCSS modules, SVG icons
- Depends on: State layer, Hooks, Managers, API layer
- Used by: End users (Investigators & Game Masters)

**State & Manager Layer:**
- Purpose: Manage board interactions, form states, sound engine, modal queue, and multiplayer sessions
- Location: `src/hooks/`, `src/reducers/`, `src/utils/`
- Contains: Custom React hooks, Reducers (`clueFormReducer`), Singletons (`AudioManager`, `EventManager`, `ModalManager`)
- Depends on: API layer, Supabase client
- Used by: UI components

**API & Service Layer:**
- Purpose: Interface with Supabase backend, sanitize payloads, handle file uploads
- Location: `src/api/`, `src/utils/storage.ts`
- Contains: Async CRUD operations, payload mappers, storage upload routines
- Depends on: `src/supabaseClient.ts`
- Used by: Hooks and components

**Persistence & Infrastructure Layer:**
- Purpose: Database tables, RLS security policies, real-time channels, storage buckets
- Location: `sql/`, Supabase Cloud / Local
- Depends on: PostgreSQL, PostgREST

## Data Flow

### Primary Request Path (Investigation Loading & Card Retrieval)

1. User navigates to `/case/:id` (`src/App.tsx:98`)
2. `InvestigationPage` executes `getInvestigationById(id)` (`src/pages/Investigation.tsx:18`)
3. Data is fetched via Supabase REST API from `investigations` and `investigation_cards` tables (`src/api/investigations.ts:67-119`)
4. Investigation cards and connection lines are mounted into `InvestigationBoard` state (`src/components/board/InvestigationBoard.tsx`)

### Secondary Flow: Multi-Agent Real-time Synchronization

1. Investigator joins case; `useWarRoom` subscribes to Supabase Realtime channel for the case ID (`src/hooks/useWarRoom.ts:25`)
2. Mouse movement throttled via `useThrottledMouse` and broadcasted to peer clients (`src/hooks/useThrottledMouse.ts`)
3. Remote cursor coordinates and agent status are received and rendered via `CursorOverlay` and `ActiveAgentsHud` (`src/components/war-room/CursorOverlay.tsx`)

### Tertiary Flow: Clue Creation & Asset Ingestion

1. Game Master fills form in `CreateClueModal` (`src/components/modals/CreateClueModal.tsx`)
2. Files are uploaded to Supabase Storage via `uploadInvestigationImage` / `uploadInvestigationAudio` (`src/utils/storage.ts`)
3. Card metadata is validated using Zod schemas (`src/schemas/clueValidation.ts`)
4. Card record is saved via `createInvestigationCard` (`src/api/investigations.ts:131`)

**State Management:**
- Complex local form states handled via `useReducer` (`src/reducers/clueFormReducer.ts`)
- Multi-component communication handled via `EventManager` (`src/utils/EventManager.ts`)
- Global authentication stored in React Context (`src/components/auth/AuthProvider.tsx`)
- Display configurations cached in IndexedDB via `src/config/displayConfig.ts`

## Key Abstractions

**InvestigationCard:**
- Purpose: Represents a node on the conspiracy/investigation board with polymorphic capabilities (document, audio spectrogram, thermal/UV lens, cipher lock, phone interface)
- Examples: `src/api/investigations.ts:39`, `src/components/board/EvidenceCard.tsx`
- Pattern: Polymorphic entity with configurable metadata and unlock state

**EventManager:**
- Purpose: Publish/subscribe messaging pipeline for cross-tool events (card opening, audio playback, sound triggering)
- Examples: `src/utils/EventManager.ts`
- Pattern: Singleton Event Bus / Observer pattern

**AudioManager:**
- Purpose: Web Audio API sound generator and sample player for sci-fi interface feedback
- Examples: `src/utils/AudioManager.ts`
- Pattern: Singleton audio engine with fallback graceful degradation

## Entry Points

**Web Application Root:**
- Location: `src/main.tsx`
- Triggers: Browser document load of `index.html`
- Responsibilities: Polyfills loading, IndexedDB config initialization, mounting React DOM root (`<App />`)

**Router Entry:**
- Location: `src/App.tsx`
- Triggers: React tree initialization
- Responsibilities: Routing switch (`/`, `/login`, `/case/:id`, `/invite/:inviteCode`), mobile viewport detection, auth route protection

## Architectural Constraints

- **Threading:** Heavy forensic analysis (pixel decoding, spectrum transforms) must run inside dedicated Web Workers (`src/workers/`) to prevent freezing the single-threaded UI loop.
- **Global State / Singletons:** Supabase client MUST remain a singleton (`src/supabaseClient.ts`) to avoid duplicate WebSocket subscriptions.
- **Strict CSS Isolation:** Core visual effects rely on global CSS variables in `src/styles/nexus.css` and `src/styles/animations.css`; components must avoid inline styles in favor of CSS utility classes.

## Anti-Patterns

### Monolithic Super-Components

**What happens:** Large components (e.g. `CreateClueModal.tsx` >4500 lines, `InvestigationBoard.tsx` >3000 lines) mix form state, canvas manipulation, audio synthesis, and raw inline styles.
**Why it's wrong:** High cognitive load, merge conflict risks, difficult testability, and token bloat during development.
**Do this instead:** Split into tabbed subcomponents (`src/components/modals/createclueTabs/`) and dedicated reducer hooks (`src/reducers/clueFormReducer.ts`).

### Loose Type Safety via `as any`

**What happens:** Extensive use of `(supabase as any)` and `(card as any)` across API callers and components due to `strict: false` in `tsconfig.json`.
**Why it's wrong:** Masks schema discrepancies, runtime null dereferences, and payload structure breakages.
**Do this instead:** Use validated Zod schemas and strongly-typed interfaces from `src/schemas/clueValidation.ts`.

## Error Handling

**Strategy:** Layered defensive programming with error boundaries and graceful fallbacks.

**Patterns:**
- `ErrorBoundary.tsx` (`src/components/ui/ErrorBoundary.tsx`) for capturing rendering crashes in board tools
- Safe JSON parse and sanitize helpers (`src/api/templates.ts:sanitizeTemplateData`)
- Non-blocking `console.error` / `console.debug` guards with toast notifications (`react-hot-toast`)

## Cross-Cutting Concerns

**Logging:** Centralized debug logging methods in singletons (`ModalManager.debug()`, `EventManager.debug()`, `AudioManager.debug()`).
**Validation:** Zod schema validation in `src/schemas/` and `src/utils/validationSchemas.ts`.
**Authentication:** Context provider `AuthProvider` and Supabase JWT verification on protected routes.

---

*Architecture analysis: 2026-08-15*
