# Testing Patterns

**Analysis Date:** 2026-08-15

## Test Framework

**Runner:**
- Jest 30.2.0 with `ts-jest` 29.4.6
- Environment: `jest-environment-jsdom` (DOM simulation)
- Config: `jest.config.js`
- Setup file: `src/setupTests.ts`

**Assertion Library:**
- Jest built-in `expect` + `@testing-library/jest-dom` matchers (e.g. `.toBeInTheDocument()`, `.toHaveClass()`)
- Chai 6.2.2 (available for Cypress assertions)

**E2E & Integration:**
- Cypress 15.0.0 with accessibility auditing (`cypress-axe`, `axe-core`) and native browser events (`cypress-real-events`)

**Run Commands:**
```bash
npm test                  # Run all Jest unit tests
npm run test:mobile       # Run Cypress mobile viewport suite (375x667)
npm run test:e2e          # Open interactive Cypress runner
npm run test:e2e:run      # Run Cypress headless
npm run typecheck         # Verify TypeScript static types (tsc --noEmit)
```

## Test File Organization

**Location:**
- Unit & Hook Tests: Co-located with implementation (e.g. `src/hooks/useIsMobile.test.ts`) or in dedicated `__tests__/` subdirectories (e.g. `src/utils/__tests__/performance.test.ts`).
- End-to-End Tests: Centralized in `cypress/e2e/`.

**Naming:**
- Unit Tests: `*.test.ts` or `*.test.tsx`
- E2E Tests: `*.cy.js` or `*.cy.ts`

**Structure:**
```
src/
├── hooks/
│   ├── useIsMobile.ts
│   └── useIsMobile.test.ts
└── utils/
    ├── performance.ts
    └── __tests__/
        └── performance.test.ts
cypress/
└── e2e/
    ├── mobile-responsiveness.cy.js
    └── investigation-board.cy.js
```

## Test Structure

**React Hook Test Pattern:**
```typescript
/// <reference types="jest" />
import { renderHook, act } from '@testing-library/react';
import { useIsMobile, useIsTouchDevice } from './useIsMobile';

describe('useIsMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    window.innerWidth = 1024;
  });

  it('should return false for desktop width', () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should update on resize', async () => {
    window.innerWidth = 1024;
    const { result } = renderHook(() => useIsMobile());

    act(() => {
      window.innerWidth = 600;
      window.dispatchEvent(new Event('resize'));
    });

    await new Promise((resolve) => setTimeout(resolve, 200));
    expect(result.current).toBe(true);
  });
});
```

**Utility Unit Test Pattern:**
```typescript
import { getOptimizedInterval } from '../performance';

describe('performance utilities', () => {
  test('getOptimizedInterval increases when factor > 1', () => {
    expect(getOptimizedInterval(100, 2)).toBe(200);
    expect(getOptimizedInterval(50, 3)).toBe(150);
  });
});
```

## Mocking

**Framework:** Jest built-in `jest.fn()`, `jest.spyOn()`, and `identity-obj-proxy` for stylesheet imports.

**Stylesheets:**
- Configured in `jest.config.js`:
```javascript
moduleNameMapper: {
  '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
}
```

**Browser APIs:**
- Touch events and window dimensions mocked directly in `beforeEach` blocks:
```typescript
beforeEach(() => {
  (navigator as any).maxTouchPoints = 0;
  delete (window as any).ontouchstart;
  window.innerWidth = 1024;
});
```

**What to Mock:**
- Network requests to Supabase REST and Realtime endpoints
- Web Audio API `AudioContext` and oscillator nodes in unit tests
- Web Worker initializations (`new Worker()`)

**What NOT to Mock:**
- Zod schema validation logic
- DOM manipulation and React Hook lifecycle in component integration tests

## Test Types

**Unit Tests:**
- Test isolated mathematical, cipher, and formatting helper functions in `src/utils/`
- Target: Fast execution, 100% deterministic logic

**Hook / Integration Tests:**
- Test stateful React hooks using `@testing-library/react`'s `renderHook`
- Validate debounce/throttle timers and window resize handlers

**E2E Tests:**
- Test full browser flows with Cypress:
  - Mobile responsiveness & hamburger drawer gestures
  - Investigation board pan/zoom and card drag-and-drop
  - Accessibility compliance (`cypress-axe`)

## Common Patterns

**Async Testing:**
```typescript
it('handles asynchronous operations with act and wait', async () => {
  const { result } = renderHook(() => useDebouncedValue('initial', 100));
  act(() => {
    result.current.setValue('updated');
  });
  await new Promise((resolve) => setTimeout(resolve, 150));
  expect(result.current.value).toBe('updated');
});
```

---

*Testing analysis: 2026-08-15*
