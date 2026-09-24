# Phase 14: Virtualização do DOM — Research

## Objective
"What do I need to know to PLAN this phase well?"

## 1. Context & Constraints
- **Goal:** Implementar scroll virtual em listas gigantes para eliminar travamentos (DOM-01, DOM-02). Foco na otimização de renderização.
- **Decisions (from CONTEXT.md):**
  - **Scope:** Cobertura Total (Modais, Painéis, Quadro Principal).
  - **Overscan:** Alto (ex: 500px).

## 2. Library Analysis: `react-virtuoso`
- **Installation:** `react-virtuoso` is not currently installed. (DOM-01).
- **Capability Mapping:**
  - **1D Lists (TerminalSearch, CreatorHub):** `<Virtuoso>` is perfectly suited. It replaces the container and handles `map` mapping automatically.
  - **2D Infinite Canvas (InvestigationBoard):** `react-virtuoso` **CANNOT** handle 2D panning/zooming absolute coordinates in a free-form infinite board. Attempting to use `<VirtuosoGrid>` would force elements into a grid layout, breaking the corkboard nature.

## 3. Implementation Strategy

### A. 1D Virtualization (`TerminalSearch`, `CreatorHub`)
- Replace the current `<div className="overflow-y-auto">... {items.map(...)} </div>` with:
  ```tsx
  import { Virtuoso } from 'react-virtuoso';
  <Virtuoso
    style={{ height: '400px' }} // Or absolute fill via tailwind flex
    data={items}
    overscan={500}
    itemContent={(index, item) => <MyComponent data={item} />}
  />
  ```

### B. Custom 2D Viewport Culling (`InvestigationBoard.tsx`)
- Since `react-virtuoso` cannot do this, we must implement our own spatial check inside `InvestigationBoard.tsx`.
- **Viewport Bounds Logic:**
  - Given the `origin` (current pan x/y) and `zoom` scale.
  - Screen dimensions: `window.innerWidth`, `window.innerHeight`.
  - The visible world coordinates (top-left) are `-origin.x`, `-origin.y`.
  - The visible width/height in world coordinates is `window.innerWidth / zoom`, `window.innerHeight / zoom`.
  - With **Overscan Alto (500px)**, we expand the bounds by `500 / zoom` in all directions.
- **Card Filtering:**
  - `EvidenceCard` has a fixed base width/height (approx `350px` width, `200px` height). Let's assume a generous max size of `400x400` to be safe if content expands.
  - Before rendering `cards.map(...)`, we filter:
    ```tsx
    const visibleCards = cards.filter(c => {
      const cardX = c.position.x;
      const cardY = c.position.y;
      
      const overscanW = 500 / zoom;
      const minX = -origin.x - overscanW;
      const maxX = -origin.x + (window.innerWidth / zoom) + overscanW;
      
      const minY = -origin.y - overscanW;
      const maxY = -origin.y + (window.innerHeight / zoom) + overscanW;
      
      return cardX + 400 > minX && cardX < maxX && cardY + 400 > minY && cardY < maxY;
    });
    ```
- **Re-rendering Trigger:**
  - The pan/zoom logic in `useBoardState.ts` must update `origin` and `zoom`, triggering a re-render of `InvestigationBoard`, which will recompute `visibleCards`. This is currently how it works, but we were trying to reduce re-renders in Phase 13.
  - Wait, Phase 13 optimized the *cards* so they don't re-render unless their props change. The board itself MUST re-render on pan to update positions anyway (the `<div style={{ transform: translate... }}>`). So recalculating the filter is cheap and perfectly aligned.

## 4. Risks & Considerations
- `TerminalSearch` uses `history` which is usually small, but if it gets large, Virtuoso works.
- `CreatorHub` renders `cards` (from DB). It can be large.
- **Risk:** Culling in `InvestigationBoard` means the DOM nodes are actually unmounted when they go off-screen. If they have internal state (like an open dropdown), it will be lost. We must ensure cards are stateless visually, or that we accept this. They already seem mostly controlled by global state (selected cards, etc).

## Validation Architecture
- **Nyquist checks needed:**
  1. Verify `react-virtuoso` package exists.
  2. Verify `Virtuoso` component is imported in `TerminalSearch` and `CreatorHub`.
  3. Verify a manual filter logic based on `origin`, `zoom`, and `window` dimensions exists in `InvestigationBoard`.
