# Technology Stack

**Analysis Date:** 2026-08-15

## Languages

**Primary:**
- TypeScript 5.9.3 - Core application logic, components, hooks, utilities, schemas, and Cypress test suites (`src/`, `cypress/`)
- TSX / React 18.2.0 - UI components and layout rendering (`src/components/`, `src/pages/`, `src/App.tsx`)

**Secondary:**
- CSS / SCSS (Sass 1.97.2) - Cyberpunk/diegetic styling, CSS custom properties, responsive design (`src/styles/`, `src/index.css`, `src/mobile-cleanup.css`, component-scoped `.css` and `.module.scss` files)
- SQL - Supabase PostgreSQL schemas, RLS policies, functions, and migration scripts (`sql/`)
- JavaScript - Configuration files and Cypress test specs (`jest.config.js`, `cypress/e2e/`)

## Runtime

**Environment:**
- Node.js (v20+ recommended)
- Browser environment (modern evergreen browsers with Web Audio API, Web Workers, Canvas, IndexedDB)

**Package Manager:**
- npm (v10+)
- Lockfile: `package-lock.json` present
- Dependency Resolution: npm with overrides for `cypress` and `request` targeting `qs: ^6.14.1`

## Frameworks

**Core:**
- React 18.2.0 (`react`, `react-dom`) - Client-side component hierarchy and state lifecycle
- React Router DOM 7.11.0 (`react-router-dom`) - Client-side declarative routing and navigation (`src/App.tsx`)

**Testing:**
- Jest 30.2.0 (`jest`, `ts-jest`, `jest-environment-jsdom`) - Unit testing runner and environment
- React Testing Library 16.3.1 (`@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) - Component and hook integration tests
- Cypress 15.0.0 (`cypress`, `cypress-axe`, `cypress-real-events`, `start-server-and-test`) - End-to-end and mobile viewport testing

**Build/Dev:**
- Vite 7.3.0 (`vite`, `@vitejs/plugin-react`) - Development server with HMR and production bundle builder (`vite.config.ts`)
- Prettier 3.8.1 - Code formatting
- Stylelint 17.0.0 (`stylelint`, `stylelint-config-standard`, `stylelint-order`, `stylelint-config-prettier`) - CSS linting and property ordering

## Key Dependencies

**Critical:**
- `@supabase/supabase-js` 2.89.0 - Backend client for authentication, PostgreSQL queries, Realtime subscriptions, and Storage (`src/supabaseClient.ts`, `src/api/`)
- `@excalidraw/excalidraw` 0.17.6 - Whiteboard and conspiracy board diagramming canvas (`src/components/board/ConspiracyBoard.tsx`, `src/api/whiteboard.ts`)
- `wavesurfer.js` 7.12.1 & `@wavesurfer/react` 1.0.12 - Waveform and audio analysis visualization (`src/components/tools/AdvancedAudioLab.tsx`, `src/components/tools/ProfessionalSpectrogram.tsx`)
- `zod` 4.3.6 - Runtime schema validation and data parsing (`src/schemas/clueValidation.ts`, `src/utils/validationSchemas.ts`)
- `react-beautiful-dnd` 13.1.1 - Drag-and-drop mechanics for clue cards and board elements (`src/components/board/InvestigationBoard.tsx`)

**Infrastructure & UI:**
- `lucide-react` 1.31.0 - Iconography suite
- `react-hot-toast` 2.6.0 - Notification and toast system (`src/App.tsx`, `src/components/ui/Toast.tsx`)
- `react-tooltip` 5.30.0 - Interactive tooltips
- `react-swipeable` 7.0.2 - Mobile gesture handlers
- `nanoid` 5.1.6 - Unique ID generation for entity models and invite tokens
- `lodash.throttle` 4.1.1 - Event throttling for mouse/drag coordinates
- `eventemitter3` 5.0.1 - Lightweight cross-component event bus (`src/utils/EventManager.ts`, `src/main.tsx`)
- `axe-core` 4.11.1 - Accessibility scanning in Cypress tests

## Configuration

**Environment:**
- Configured via `.env` file (and Vite's `import.meta.env`)
- Required variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`
- Polyfill / process environment defined in `vite.config.ts` (`process.env.NODE_ENV`, `process.env.IS_PREACT`) and `src/polyfills/process-shim.ts`

**Build:**
- `vite.config.ts` - Configures React plugin, single-instance React module aliases, Excalidraw pre-bundling and SSR bypass.
- `tsconfig.json` - Target ES2020, module ESNext, react-jsx, strict: false, baseUrl: ".".
- `jest.config.js` - Preset ts-jest, jsdom environment, moduleNameMapper with `identity-obj-proxy` for styles.
- `cypress.config.ts` - Viewport and screenshot failure hooks.
- `.stylelintrc.json` - CSS ordering and standard rules.
- `vercel.json` - SPA rewrite rules for client routing.

## Platform Requirements

**Development:**
- Node.js 18+ (v20 recommended)
- npm 9+
- Modern desktop browser (Chrome/Edge/Firefox) with Web Audio API support

**Production:**
- Vercel (or static hosting CDN with SPA fallback rewrite to `/index.html`) connected to Supabase backend.

---

*Stack analysis: 2026-08-15*
