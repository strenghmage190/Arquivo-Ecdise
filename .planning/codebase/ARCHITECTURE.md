# ARCHITECTURE

**Date:** 2026-08-14

## Pattern
Single Page Application (SPA) built with React.

## Data Flow & State Management
- **Backend Communication:** Client communicates with Supabase (configured in `src/supabaseClient.ts`) for data persistence and authentication.
- **State Management:** Presence of `src/reducers` indicates the use of `useReducer` (or a similar Redux-like pattern) for managing complex local or global state. Custom hooks in `src/hooks` likely encapsulate state logic.

## Abstractions & Layers
- **API Layer:** `src/api` encapsulates backend communication.
- **UI Components:** `src/components` contains reusable presentation and logic components.
- **Routing:** Handled by React Router DOM, mapping URLs to components in `src/pages`.
- **Validation:** Data models and form inputs are validated using Zod (`src/schemas`).
- **Web Workers:** Background processing in `src/workers`.

## Entry Points
- Application entry point: `index.html` loading `src/main.tsx`, which renders `src/App.tsx`.
