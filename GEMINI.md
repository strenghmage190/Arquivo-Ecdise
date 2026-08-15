<!-- GSD:project-start source:PROJECT.md -->
## Project

**UVEditor UI/UX Refactor & Layers Modernization**

A comprehensive UI/UX overhaul, functional reorganization, and modular refactoring of the `UVEditor` (`src/components/tools/UVEditor.tsx`), `LayersPanel` (`src/components/LayersPanel.tsx`), `LayerItem` (`src/components/LayerItem.tsx`), and associated stylesheets. The project replaces all emojis with crisp Lucide React icons, fixes missing/broken mouse cursor feedback in the canvas and code/cipher zones, streamlines layer management (image placement, deletion, batch operations, drag-and-drop), and breaks down the 3,100+ line monolithic component into modular subcomponents and custom hooks.

**Core Value:** A responsive, high-performance forensic image editor with professional Cyberpunk/Nexus aesthetics, seamless layer manipulations, clear cursor feedback, and maintainable modular architecture.

### Constraints

- **Scope**: UI/UX refactoring, layer management reorganization, cursor fixes, and modular decomposition.
- **Styling**: Must use vanilla CSS / CSS modules and Nexus tokens; replace all emojis with `lucide-react`.
- **Design**: Strict preservation and enhancement of Cyberpunk neon / dark theme.
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript (v5.9.3)
- CSS (Sass v1.97.2)
## Runtime & Build
- Node.js
- Vite (v7.3.0) for fast development and build
## Frameworks & Core Libraries
- React (v18.2.0)
- React DOM (v18.2.0)
- React Router DOM (v7.11.0) for routing
## UI & Interactions
- `@excalidraw/excalidraw` for canvas/diagrams
- `react-beautiful-dnd` for drag and drop
- `wavesurfer.js` / `@wavesurfer/react` for audio visualization
- `react-tooltip` for tooltips
- `react-swipeable` for swipe gestures
- `react-hot-toast` for notifications
## Data & Validation
- Zod (v4.3.6) for schema validation
- Supabase JS for backend interactions
## Code Quality & Tooling
- TypeScript
- Prettier
- Stylelint
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Code Style & Formatting
- **Language:** TypeScript is strictly used for static typing.
- **Formatting:** Prettier is configured as the main code formatter.
- **Styling:** Stylelint ensures CSS/Sass consistency (`stylelint-config-standard`, `stylelint-order`, `stylelint-config-prettier`).
## Data Validation
- **Schemas:** Zod is heavily utilized (`src/schemas`) to parse and validate data structures, API responses, and forms.
## UI Patterns
- **Responsiveness:** There is a dedicated `src/mobile-cleanup.css` suggesting specific handling of mobile layouts.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## Pattern
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
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
