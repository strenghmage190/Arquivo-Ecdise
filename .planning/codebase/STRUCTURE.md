# Codebase Structure

**Analysis Date:** 2026-08-15

## Directory Layout

```
site-de-investigacao/
├── .agent/              # GSD agent configuration, workflows, and prompts
├── .planning/           # GSD planning directory (phases, milestones, codebase docs)
│   └── codebase/        # Structured architecture and codebase map documents
├── cypress/             # Cypress E2E test suites, fixtures, and plugins
│   ├── e2e/             # Integration and mobile responsiveness test specs
│   └── support/         # Cypress commands and configuration helpers
├── docs/                # Project documentation, guides, audits, and architectural notes
├── sql/                 # Supabase PostgreSQL migrations, table schemas, and RLS policies
├── src/                 # Application source code
│   ├── api/             # Supabase data access layer & backend API functions
│   ├── components/      # React components grouped by functional domain
│   │   ├── auth/        # AuthProvider & ProtectedRoute wrappers
│   │   ├── bench/       # Hardware benchmarking components
│   │   ├── board/       # Investigation board, cards, canvas pins, and search
│   │   ├── dice/        # Virtual dice roller components
│   │   ├── layout/      # Desktop shell, boot screen, and global navigation
│   │   ├── modals/      # System modals (CreateClueModal, InspectionModal, etc.)
│   │   ├── notes/       # Case notes and scratchpad widgets
│   │   ├── tools/       # Forensic analysis tools (UV, AudioLab, Glitch, Enigma, CCTV)
│   │   ├── ui/          # Generic UI primitives (Buttons, Overlays, Toasts, ErrorBoundary)
│   │   └── war-room/    # Real-time multi-agent collaboration (CursorOverlay, HUD)
│   ├── config/          # Display and field visibility configuration handlers
│   ├── hooks/           # Custom React hooks (useWarRoom, useIsMobile, useBlobUrl, etc.)
│   ├── pages/           # Route views (Home, Investigation, Login, ResetPassword, Invite)
│   ├── polyfills/       # Environment shims (process, EventEmitter)
│   ├── reducers/        # State reducers for complex forms (clueFormReducer)
│   ├── rules/           # In-game rulesets and mechanics (diceRules)
│   ├── schemas/         # Zod schemas for runtime form and data validation
│   ├── styles/          # Nexus design tokens, animations, SCSS abstracts, performance CSS
│   ├── types/           # Global ambient TypeScript definitions (.d.ts)
│   ├── utils/           # Helper functions, singletons, audio engine, storage, and ciphers
│   └── workers/         # Web Workers for heavy background computations
├── cypress.config.ts    # Cypress test runner configuration
├── jest.config.js       # Jest unit testing configuration
├── package.json         # Project metadata, dependencies, and build scripts
├── tsconfig.json        # TypeScript compiler options
├── vercel.json          # Vercel deployment and SPA routing configuration
└── vite.config.ts       # Vite bundler and dev server configuration
```

## Directory Purposes

**`src/api/`:**
- Purpose: Encapsulates all network communication with Supabase for data queries and mutations.
- Contains: Pure TypeScript async functions.
- Key files: `src/api/investigations.ts`, `src/api/connections.ts`, `src/api/whiteboard.ts`, `src/api/templates.ts`.

**`src/components/board/`:**
- Purpose: Powers the main investigation board interface, card drag/drop, and whiteboard canvas.
- Contains: React components, styled CSS files.
- Key files: `src/components/board/InvestigationBoard.tsx`, `src/components/board/ConspiracyBoard.tsx`, `src/components/board/EvidenceCard.tsx`.

**`src/components/modals/`:**
- Purpose: Modal dialogs for clue authoring, clue inspection, profile settings, and mini-games.
- Contains: Large modal components and modular tab subdirectories (`createclueTabs/`, `investigationTabs/`).
- Key files: `src/components/modals/CreateClueModal.tsx`, `src/components/modals/InspectionModal.tsx`, `src/components/modals/CreatorHub.tsx`.

**`src/components/tools/`:**
- Purpose: Interactive forensic investigation tools (UV light filters, audio spectrograms, cipher machines).
- Contains: Specialized UI widgets, canvas renderers, and worker hooks.
- Key files: `src/components/tools/UVEditor.tsx`, `src/components/tools/AdvancedAudioLab.tsx`, `src/components/tools/EnigmaMachine.tsx`, `src/components/tools/GlitchPuzzleCard.tsx`.

**`src/components/war-room/`:**
- Purpose: Multi-agent real-time collaboration layer.
- Contains: Realtime cursor overlay, active operative HUD, and presence status indicators.
- Key files: `src/components/war-room/CursorOverlay.tsx`, `src/components/war-room/ActiveAgentsHud.tsx`.

**`src/hooks/`:**
- Purpose: Reusable stateful React hooks.
- Contains: Throttling, mobile viewport detection, real-time war room listeners, and file upload state.
- Key files: `src/hooks/useWarRoom.ts`, `src/hooks/useIsMobile.ts`, `src/hooks/useThrottledMouse.ts`, `src/hooks/useBlobUrl.ts`.

**`src/styles/`:**
- Purpose: Centralized design system (Nexus), CSS variables, animations, and performance overrides.
- Contains: Vanilla CSS files and SCSS stylesheets.
- Key files: `src/styles/nexus.css`, `src/styles/animations.css`, `src/styles/performance.css`.

**`src/utils/`:**
- Purpose: Shared utility functions, audio engine, cipher math, performance helpers, and singletons.
- Contains: TypeScript utility modules.
- Key files: `src/utils/AudioManager.ts`, `src/utils/EventManager.ts`, `src/utils/ModalManager.ts`, `src/utils/storage.ts`, `src/utils/ciphers.ts`.

**`src/workers/`:**
- Purpose: Background Web Workers for non-blocking intensive calculations.
- Contains: Web worker scripts.
- Key files: `src/workers/spectrogram.worker.ts`, `src/workers/forensicWorker.ts`, `src/workers/benchmarkWorker.ts`.

## Key File Locations

**Entry Points:**
- `src/main.tsx`: Application bootstrap, polyfills, IndexedDB initialization, and React DOM render
- `src/App.tsx`: Top-level router, auth context provider, and mobile viewport listener

**Configuration:**
- `vite.config.ts`: Vite build and dev server config
- `tsconfig.json`: TypeScript compiler options
- `jest.config.js`: Unit test setup and module mapping
- `cypress.config.ts`: E2E test runner configuration

**Core Logic:**
- `src/api/investigations.ts`: Investigation and card persistence
- `src/reducers/clueFormReducer.ts`: Clue creation form state transitions
- `src/utils/EventManager.ts`: Global decoupled event distribution
- `src/utils/AudioManager.ts`: Web Audio SFX and ambient sound synthesis

**Testing:**
- `src/hooks/useIsMobile.test.ts`: Hook unit test
- `src/utils/__tests__/performance.test.ts`: Utility unit test
- `cypress/e2e/mobile-responsiveness.cy.js`: Viewport responsiveness suite

## Naming Conventions

**Files:**
- React Components: PascalCase (`InvestigationBoard.tsx`, `EvidenceCard.tsx`)
- Component Styles: PascalCase matching component (`EvidenceCard.css`) or SCSS module (`Home.module.scss`)
- Custom Hooks: camelCase with `use` prefix (`useWarRoom.ts`, `useIsMobile.ts`)
- Utility / API Files: camelCase (`investigations.ts`, `storage.ts`) or PascalCase for Class Singletons (`AudioManager.ts`, `EventManager.ts`)
- Schemas: camelCase (`clueValidation.ts`)
- SQL Migrations: kebab-case with date prefix (`2026-01-02-war-room-realtime.sql`)

**Directories:**
- Feature / Domain Folders: kebab-case or lowercase (`war-room`, `modals`, `tools`, `board`, `api`, `hooks`)

## Where to Add New Code

**New Forensic Investigation Tool:**
- UI Component: `src/components/tools/NewToolName.tsx`
- Dedicated Styles: `src/components/tools/NewToolName.css`
- Worker (if CPU-heavy): `src/workers/newToolWorker.ts`
- Register Tool: Add to `src/components/tools/index.tsx` and integrate in `InspectionModal.tsx` / `CreateClueModal.tsx`

**New API Endpoint / Model:**
- Database Migration: `sql/YYYY-MM-DD-description.sql`
- API Client Method: `src/api/newDomain.ts` or add to `src/api/investigations.ts`
- Zod Schema: `src/schemas/newDomainValidation.ts`

**New Reusable UI Component:**
- Implementation: `src/components/ui/NewComponent.tsx`
- Styles: `src/components/ui/NewComponent.css` or `NewComponent.module.scss`

**New Utility / Helper:**
- Implementation: `src/utils/newHelper.ts`
- Unit Test: `src/utils/__tests__/newHelper.test.ts`

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow planning documents, roadmap, state tracking, and codebase documentation
- Generated: Managed by GSD workflows
- Committed: Yes

**`sql/`:**
- Purpose: Supabase SQL migration files and security policy scripts
- Generated: Written manually / migration scripts
- Committed: Yes

**`docs/`:**
- Purpose: Architectural guides, feature manuals, and design references
- Generated: Documentation records
- Committed: Yes

---

*Structure analysis: 2026-08-15*
