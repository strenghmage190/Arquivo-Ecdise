# CONVENTIONS

**Date:** 2026-08-14

## Code Style & Formatting
- **Language:** TypeScript is strictly used for static typing.
- **Formatting:** Prettier is configured as the main code formatter.
- **Styling:** Stylelint ensures CSS/Sass consistency (`stylelint-config-standard`, `stylelint-order`, `stylelint-config-prettier`).

## Data Validation
- **Schemas:** Zod is heavily utilized (`src/schemas`) to parse and validate data structures, API responses, and forms.

## UI Patterns
- **Responsiveness:** There is a dedicated `src/mobile-cleanup.css` suggesting specific handling of mobile layouts.
