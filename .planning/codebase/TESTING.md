# TESTING

**Date:** 2026-08-14

## Frameworks
- **Unit/Integration:** Jest (`jest-environment-jsdom`) with React Testing Library (`@testing-library/react`, `@testing-library/user-event`).
- **End-to-End (E2E):** Cypress (`cypress`, `cypress-axe`, `cypress-real-events`).

## Structure & Configuration
- **Jest:** Configured in `jest.config.js` and initialized through `src/setupTests.ts`.
- **Cypress:** Configurations and tests reside in `/cypress` and `cypress.config.ts`.
- **Scripts:**
  - `test`: Runs Jest
  - `test:e2e`, `test:e2e:run`, `test:e2e:full`: Run Cypress locally or via CI with `start-server-and-test`.
  - `test:mobile`: Explicit viewport testing for mobile (375x667).

## Testing Practices
- **Accessibility:** `cypress-axe` is integrated to verify a11y compliance.
- **Mobile Focus:** Explicit scripts and specs (`cypress/e2e/mobile-responsiveness.cy.js`) for verifying mobile behaviors.
