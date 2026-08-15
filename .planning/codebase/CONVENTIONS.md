# Coding Conventions

**Analysis Date:** 2026-08-15

## Naming Patterns

**Files:**
- React Components: PascalCase (`UVEditor.tsx`, `EvidenceCard.tsx`, `CreateClueModal.tsx`)
- Component Stylesheets: PascalCase matching the component (`UVEditor.css`, `EvidenceCard.css`) or SCSS modules (`Home.module.scss`)
- Custom Hooks: camelCase with `use` prefix (`useWarRoom.ts`, `useIsMobile.ts`, `useBlobUrl.ts`)
- Utilities & Helpers: camelCase (`ciphers.ts`, `storage.ts`, `audioGenerator.ts`)
- Singleton Managers: PascalCase (`AudioManager.ts`, `EventManager.ts`, `ModalManager.ts`)
- Type Definition Files: kebab-case or camelCase (`global.d.ts`, `wavesurfer.d.ts`)
- Schemas: camelCase (`clueValidation.ts`, `validationSchemas.ts`)
- Database Migrations: kebab-case with date prefix (`2026-01-02-war-room-realtime.sql`)

**Functions:**
- camelCase for standard functions, handlers, and API methods (`fetchInvestigationById`, `validateClue`, `uploadInvestigationImage`, `handleCardDrop`)
- PascalCase for React Function Components (`EvidenceCard`, `InspectionModal`, `DoomsdayClock`)

**Variables & Constants:**
- camelCase for general variables and state values (`interactionMode`, `isLoading`, `cardData`)
- UPPER_SNAKE_CASE for compile-time constants and configuration defaults (`DEFAULT_AUDIO_FREQ`, `MAX_FILE_SIZE_BYTES`)

**Types & Interfaces:**
- PascalCase without `I` prefix (`InvestigationCard`, `ClueTemplate`, `InvestigationCardInsight`, `CreateTemplateInput`)
- Component Props types named with `Props` suffix (`EvidenceCardProps`, `InspectionModalProps`)

**CSS Classes:**
- kebab-case (`evidence-card`, `evidence-card-content`, `fab-toggle-mode`, `inspection-modal-backdrop`)
- Cyberpunk / Nexus design system classes prefixed with domain keywords (`nexus-btn`, `terminal-header`, `glitch-container`)

## Code Style

**Formatting:**
- Prettier 3.8.1 configured as primary code formatter
- Tab width: 2 spaces, single quotes for strings in TS/JS, semicolons enforced

**Linting:**
- Stylelint 17.0.0 with `stylelint-config-standard`, `stylelint-order`, and `stylelint-config-prettier`
- CSS property ordering enforced according to declaration groups

**TypeScript Configuration:**
- Target: `ES2020`
- Module: `ESNext`
- JSX: `react-jsx`
- Module resolution: `node` with baseUrl `.`

## Import Organization

**Order:**
1. Polyfills and environment bootstrap (e.g. `./polyfills/process-shim`)
2. React and third-party libraries (`react`, `react-router-dom`, `@supabase/supabase-js`, `lucide-react`, `nanoid`)
3. Internal hooks, reducers, and schemas (`./hooks/useIsMobile`, `./schemas/clueValidation`)
4. Internal components (`./components/board/EvidenceCard`, `./components/ui/Toast`)
5. Internal utils, API services, and singletons (`./api/investigations`, `./supabaseClient`, `./utils/AudioManager`)
6. Stylesheets and CSS files (`./index.css`, `./styles/nexus.css`, `./EvidenceCard.css`)

**Example:**
```typescript
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Shield, Eye, Lock } from 'lucide-react';
import { useWarRoom } from '../hooks/useWarRoom';
import { validateClue } from '../schemas/clueValidation';
import { EvidenceCard } from '../components/board/EvidenceCard';
import { fetchInvestigationById } from '../api/investigations';
import { audioManager } from '../utils/AudioManager';
import './InvestigationBoard.css';
```

## Error Handling

**Patterns:**
- **Defensive API Calls:** API operations wrapped in `try / catch` blocks with detailed error logging before re-throwing or returning graceful fallbacks (`src/api/investigations.ts`).
- **UI Error Boundaries:** High-risk components and interactive board tools wrapped with `<ErrorBoundary fallback={...} />` (`src/components/ui/ErrorBoundary.tsx`).
- **Form & Schema Validation:** Validation performed with Zod `safeParse()` to return structured error arrays (`field`, `message`, `severity`) without throwing runtime exceptions (`src/schemas/clueValidation.ts`).
- **User Notifications:** User-facing failures displayed via `react-hot-toast` notifications (`toast.error('Erro ao carregar investigação')`).

## Logging

**Framework:** Native `console` with semantic log levels and debug groups.

**Patterns:**
- Use `console.debug` for verbose lifecycle and payload traces (e.g. `console.debug('[Supabase] Returning existing instance')`).
- Use `console.warn` for missing non-fatal configs or deprecated fallback paths.
- Use `console.error` for caught network and rendering failures.
- Group related debugging traces in managers via `console.group` / `console.groupEnd` (`AudioManager.debug()`, `ModalManager.debug()`).

## Comments

**When to Comment:**
- Above non-obvious algorithms (e.g. UV color matrix shaders, audio frequency isolation, FFT spectrogram mapping).
- Explaining intentional polyfill or singleton patterns (`src/supabaseClient.ts`, `src/main.tsx`).
- Documenting database RLS assumptions.

**JSDoc / TSDoc:**
- Used for exported public API methods and utility functions:
```typescript
/**
 * Fetches all cards associated with a given investigation ID.
 * @param investigationId - Unique identifier of the investigation.
 * @returns Array of InvestigationCard records or empty array on failure.
 */
export async function fetchCardsForInvestigation(investigationId: string): Promise<InvestigationCard[]> {
  // ...
}
```

## Function Design

**Size:**
- Aim for focused utility functions under 50 lines.
- Complex board handlers decomposed into modular helpers in `src/utils/`.

**Parameters:**
- Functions with more than 3 arguments should accept a structured options object (e.g. `createInvestigationConnection(payload: { ... })`).

**Return Values:**
- Explicit return types preferred for API methods and utility helpers (`Promise<InvestigationCard>`, `boolean`).

## Module Design

**Exports:**
- Named exports preferred for utility libraries, API modules, and singleton instances (`export const supabase = ...; export function fetchCards(...)`).
- Default exports used for primary top-level components and page routes (`export default App;`, `export default Home;`).

**Barrel Files:**
- Used selectively in component directories (`src/components/board/index.tsx`, `src/components/modals/index.tsx`, `src/components/tools/index.tsx`) to simplify imports.

---

*Convention analysis: 2026-08-15*
