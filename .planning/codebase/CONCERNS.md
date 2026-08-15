# Codebase Concerns

**Analysis Date:** 2026-08-15

## Tech Debt

**Monolithic Mega-Components:**
- Issue: Several critical components exceed 2,000 to 4,500 lines of code, combining complex form state, canvas manipulation, audio synthesis, and inline styles into monolithic single files.
- Files:
  - `src/components/modals/CreateClueModal.tsx` (~4,500+ lines)
  - `src/components/board/InvestigationBoard.tsx` (~3,000+ lines)
  - `src/components/tools/UVEditor.tsx` (~3,000+ lines)
  - `src/components/modals/InspectionModal.tsx` (~2,500+ lines)
- Impact: High risk of regression when editing, steep cognitive load, and elevated token consumption for AI tooling.
- Fix approach: Continue modular decomposition into tabbed subcomponents (e.g. `src/components/modals/createclueTabs/`) with extracted custom hooks and dedicated reducers.

**Divergent Refactoring Artifacts:**
- Issue: Partial refactoring files exist alongside legacy implementations without complete migration or deprecation.
- Files:
  - `src/components/modals/CreateClueModal_Refactored.tsx` vs `src/components/modals/CreateClueModal.tsx`
  - `src/components/modals/InvestigationCardModal_Refactored.tsx` vs `src/components/modals/InspectionModal.tsx`
  - `src/hooks/useCreateClueState_v3.ts` vs `src/hooks/useCreateClueState.ts`
- Impact: Confusion regarding canonical implementations and potential divergence in feature sets.
- Fix approach: Finalize migration of callers to refactored modular components and archive/remove legacy files.

**Permissive TypeScript Configuration & Any-Casts:**
- Issue: `strict: false` is configured in `tsconfig.json`, and explicit `(supabase as any)` / `(card as any)` casts are prevalent across the API and component layers.
- Files:
  - `tsconfig.json`
  - `src/api/investigations.ts`
  - `src/api/connections.ts`
  - `src/components/board/InvestigationBoard.tsx`
- Impact: Type safety is compromised; runtime undefined/null errors can bypass compile-time detection.
- Fix approach: Enable strict typing incrementally, utilize strong typing from `src/schemas/clueValidation.ts`, and replace `any` casts with discriminated union types.

**Inline Styles vs CSS Classes:**
- Issue: Inline `style={{ ... }}` objects are scattered across older modals and board cards instead of utilizing utility classes from `nexus.css` and dedicated component CSS files.
- Files:
  - `src/components/modals/CreateClueModal.tsx`
  - `src/components/board/InvestigationBoard.tsx`
  - `src/components/tools/AdvancedAudioLab.tsx`
- Impact: Violates separation of concerns, complicates theme consistency, and degrades rendering performance.
- Fix approach: Migrate inline styles to CSS utility classes defined in `src/styles/nexus.css` and component-level stylesheets.

## Fragile Areas

**Polyfill and Runtime Shim Bootstrapping:**
- Files: `src/polyfills/process-shim.ts`, `src/utils/validatePolyfills.ts`, `src/main.tsx`
- Why fragile: Required to bridge compatibility between Excalidraw, Node-targeted packages, and browser environments. Order of execution in `src/main.tsx` is critical.
- Safe modification: Validate polyfills using `validatePolyfills()` before running application logic and run build checks (`npm run build`).

**Board Coordinate Transformations & Multi-Touch Gestures:**
- Files: `src/components/board/InvestigationBoard.tsx`, `src/hooks/useThrottledMouse.ts`
- Why fragile: Board pan, zoom scaling, drag-and-drop card positioning, and mobile touch gestures require complex matrix/coordinate math.
- Safe modification: Test across mobile viewports (`npm run test:mobile`) and verify touch interactions before committing changes.

**Real-Time War Room Socket Lifecycle:**
- Files: `src/hooks/useWarRoom.ts`, `src/components/war-room/CursorOverlay.tsx`
- Why fragile: Socket channel subscriptions and mouse movement broadcasts must be reliably unsubscribed on unmount to prevent ghost cursors and memory leaks.
- Safe modification: Always clean up Supabase Realtime channel subscriptions in `useEffect` return functions.

## Security Considerations

**Database Row Level Security (RLS):**
- Risk: Clue data, secret forensic layers, or GM solutions leaking to unauthorized players.
- Files: `sql/rls_conspiracy.sql`, `sql/2025-12-26-fix-investigations-policies.sql`
- Current mitigation: RLS policies enforce checks on `investigations.owner_id` and invited member clearance.
- Recommendations: Perform regular audits on newly added columns (e.g. `image_filter_layer`, `discovery_code`) to ensure hidden fields are not exposed to non-owner queries.

**Secrets Scanning:**
- Risk: Leaking `VITE_SUPABASE_ANON_KEY` or service role keys in source repositories.
- Current mitigation: `.env` is listed in `.gitignore`.
- Recommendations: Ensure only public anon keys are used in client bundles; never include service role keys in client code.

## Performance Bottlenecks

**Heavy Forensic Image & Spectrum Filtering:**
- Problem: Real-time rendering of UV/thermal shaders and FFT audio analysis on large assets can cause frame drops.
- Files: `src/components/tools/UVEditor.tsx`, `src/components/tools/AdvancedAudioLab.tsx`
- Cause: Synchronous canvas pixel operations on the main UI thread.
- Improvement path: Offload image transformation routines to `src/workers/forensicWorker.ts` and `src/workers/spectrogram.worker.ts`.

**High-Frequency Cursor Broadcasting:**
- Problem: Unthrottled mouse tracking during fast movements saturates WebSocket bandwidth.
- Files: `src/hooks/useThrottledMouse.ts`, `src/hooks/useWarRoom.ts`
- Cause: Emitting pointer move events on every animation frame.
- Improvement path: Maintain strict throttling (50-100ms interval) via `lodash.throttle`.

## Test Coverage Gaps

**Untested Core Business Logic & Schemas:**
- What's not tested: `src/schemas/clueValidation.ts`, `src/reducers/clueFormReducer.ts`, `src/utils/ciphers.ts`, `src/utils/storage.ts`, `src/api/investigations.ts`.
- Files: `src/schemas/`, `src/reducers/`, `src/utils/`, `src/api/`
- Risk: Breaking clue validation, state transitions, or cipher decoding during refactoring without automated alerts.
- Priority: High

**Untested Complex Tool Components:**
- What's not tested: `src/components/tools/EnigmaMachine.tsx`, `src/components/tools/UVEditor.tsx`, `src/components/tools/ShredderPuzzle.tsx`.
- Risk: Regressions in puzzle mechanics going unnoticed until manual playthroughs.
- Priority: Medium

---

*Concerns audit: 2026-08-15*
