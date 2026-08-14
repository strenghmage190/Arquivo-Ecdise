# STRUCTURE

**Date:** 2026-08-14

## Directory Layout

### `/` (Root)
Configuration files for build tools and linters (Vite, TypeScript, Jest, Cypress, Stylelint, Vercel).

### `/cypress`
End-to-End (E2E) testing configurations, fixtures, and specs (especially mobile responsiveness).

### `/src`
Main application source code.
- `/src/api`: Functions and clients for API interaction (Supabase, etc.).
- `/src/components`: Reusable UI components.
- `/src/config`: Application configuration parameters.
- `/src/hooks`: Custom React hooks.
- `/src/pages`: Top-level route components.
- `/src/polyfills`: Browser polyfills.
- `/src/reducers`: State management reducers.
- `/src/rules`: Likely business logic rules or constants.
- `/src/schemas`: Zod schemas for data validation.
- `/src/styles`: Global CSS/Sass styles.
- `/src/types`: TypeScript interfaces and type definitions.
- `/src/utils`: Helper and utility functions.
- `/src/workers`: Web worker scripts.

## Key Locations
- **Entry point:** `src/main.tsx`
- **Supabase configuration:** `src/supabaseClient.ts`
- **Global Styles:** `src/index.css`, `src/mobile-cleanup.css`
