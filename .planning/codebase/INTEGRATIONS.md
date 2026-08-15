# External Integrations

**Analysis Date:** 2026-08-15

## APIs & External Services

**Backend-as-a-Service (BaaS):**
- Supabase - Complete backend infrastructure providing relational persistence, authentication, file storage, and real-time multiplayer updates.
  - SDK/Client: `@supabase/supabase-js` (`src/supabaseClient.ts`)
  - Auth: `VITE_SUPABASE_ANON_KEY` & `VITE_SUPABASE_URL`
  - Client Pattern: Singleton pattern enforced via `getSupabaseClient()` in `src/supabaseClient.ts`

## Data Storage

**Databases:**
- PostgreSQL (Managed by Supabase)
  - Connection: REST API / PostgREST via Supabase JS client
  - Key Tables:
    - `investigations` - Case metadata, ownership, doomsday timers, conspiracy board state (`src/api/investigations.ts`, `src/api/whiteboard.ts`)
    - `investigation_cards` - Clue nodes, coordinates, media links, locks, ciphers, insight trees (`src/api/investigations.ts`)
    - `investigation_connections` - Graph edges connecting clues with styling and metadata (`src/api/connections.ts`)
    - `investigation_invites` - Case sharing and invitation tokens (`src/api/investigations.ts`)
    - `clue_templates` - Reusable card and puzzle configurations (`src/api/templates.ts`)
    - `agent_profiles` - Player character profiles, clearances, and GM permissions (`sql/2026-01-01-add-agent-profiles.sql`)
  - Security Model: Row Level Security (RLS) policies configured per table (`sql/`)

**File Storage:**
- Supabase Storage Buckets
  - Upload helper: `src/utils/storage.ts`
  - Handles image uploads (`uploadInvestigationImage`), audio clips (`uploadInvestigationAudio`), and forensic overlay layers
  - URL sanitization and MIME-type detection in `src/utils/storage.ts` and `src/utils/fileValidators.ts`

**Local & Browser Caching:**
- IndexedDB & LocalStorage:
  - `initDisplayConfigCache` in `src/config/displayConfig.ts` - Local persistent caching of UI panel states and field preferences
  - `src/utils/codeTracking.ts` - Local storage tracking for collected cipher/discovery codes during player sessions

## Authentication & Identity

**Auth Provider:**
- Supabase Auth (Email / Password authentication)
  - Implementation: `AuthProvider` context in `src/components/auth/AuthProvider.tsx`
  - Route Guard: `ProtectedRoute` in `src/components/auth/ProtectedRoute.tsx`
  - Pages: `Login` (`src/pages/Login.tsx`), `ResetPassword` (`src/pages/ResetPassword.tsx`), `Invite` (`src/pages/Invite.tsx`)
  - Session handling: Persistent JWT tokens managed by Supabase client

## Real-time & Multiplayer

**WebSockets & Channels:**
- Supabase Realtime Channels (`src/hooks/useWarRoom.ts`, `sql/2026-01-02-war-room-realtime.sql`):
  - Realtime cursor broadcasting across investigators (`src/components/war-room/CursorOverlay.tsx`)
  - Live agent status HUD (`src/components/war-room/ActiveAgentsHud.tsx`)
  - Broadcast updates for board changes, card unlocks, and GM interventions

## Web Workers & Hardware Acceleration

**Background Processing:**
- `src/workers/forensicWorker.ts` - Offloads heavy pixel processing for forensic image lens filtering
- `src/workers/spectrogram.worker.ts` & `src/components/tools/spectrogramWorker.ts` - Fast Fourier Transform (FFT) computations for audio spectrum analysis
- `src/workers/benchmarkWorker.ts` - Hardware benchmark testing for low-spec device performance mode
- `src/components/tools/textSynthWorker.ts` - Background audio text-to-speech / morse synthesis

## Monitoring & Observability

**Error Tracking:**
- React Error Boundaries: `src/components/ui/ErrorBoundary.tsx`
- Polyfill and runtime validation loggers: `src/utils/validatePolyfills.ts`

**Logs:**
- Console debugging wrappers with debug grouping in `src/utils/ModalManager.ts`, `src/utils/EventManager.ts`, `src/utils/AudioManager.ts`

## CI/CD & Deployment

**Hosting:**
- Vercel (Configured via `vercel.json` with SPA routing rewrites)

**CI Pipeline:**
- Cypress E2E test runs with recording scripts (`package.json` scripts `test:e2e:ci`, `test:e2e:full`)
- GitHub Actions in `.github/`

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL` - Supabase project endpoint
- `VITE_SUPABASE_ANON_KEY` - Supabase public anonymous API key

**Secrets location:**
- Local environment: `.env` (excluded from git via `.gitignore`)
- Production environment: Vercel environment variables dashboard

## Webhooks & Callbacks

**Incoming:**
- None detected (direct client-to-Supabase architecture).

**Outgoing:**
- None detected.

---

*Integration audit: 2026-08-15*
