# CONCERNS

**Date:** 2026-08-14

## Technical Debt & Tooling
- **Dependency Conflicts:** The `package.json` specifies `"install": "npm install --legacy-peer-deps"`. This suggests existing conflicts in peer dependencies among the installed libraries that should eventually be resolved to avoid installation friction.
- **Package Overrides:** The project explicitly overrides the `qs` package to `^6.14.1` for `cypress` and `request`, likely an intervention for a known vulnerability or bug.

## Maintenance Areas
- **Mobile CSS:** The `mobile-cleanup.css` implies potential CSS overrides or technical debt related to responsive design that hasn't been merged into a unified component-level styling architecture.
- **Workers:** The presence of `src/workers` indicates background processing logic that might add complexity to debugging and testing.
