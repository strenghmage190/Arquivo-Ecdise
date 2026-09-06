---
phase: 12
name: Core State Orchestration & Skeleton
wave: 1
status: Pending
requirements:
  - MOD-08
  - UX-04
  - UX-06
autonomous: true
files_modified:
  - src/components/modals/CreateClueModal_Refactored.tsx
  - src/components/modals/CreateClueModal_Refactored.css
  - src/components/modals/createclueTabs/createclueTabs.css
  - src/components/modals/createclueTabs/TabGeneral.tsx
  - src/components/modals/createclueTabs/TabSecurity.tsx
---

# Phase 12: Core State Orchestration & Skeleton (Redesign)

**Goal:** Refatorar o modal atual para um layout imersivo em Full-Screen, substituir animações por 3D Cyberpunk Card Flips, corrigir o problema de Scroll nas views, e separar melhor as Tabs criando uma nova Aba de "Segurança & Fone" (`TabSecurity`), aplicando os estilos CSS mais recentes (separadores e checkboxes).

## must_haves

- O componente raiz de `CreateClueModal_Refactored.tsx` deve usar um overlay Full-Screen (`position: fixed`) com blur, sem o `DiegeticWindow`.
- A navegação das abas deve usar transições 3D Flips (`rotateY`) usando `framer-motion`.
- O problema do "não consigo descer" (Scroll travado) precisa ser resolvido consertando as classes de overflow e garantindo pading inferior.
- Os checkboxes soltos nas abas iniciais (`TabGeneral`) devem adotar a estrutura moderna `.cc-checkbox` e usar estilos do Cyberpunk.
- Campos relacionados a Telefone, Senha e Bloqueio devem ser extraídos de onde estiverem e aglomerados numa nova aba **`TabSecurity.tsx`**.
- Onde a interface for muito compacta, adicionar `div className="cc-divider"` (ou um hr estendido) para separar as subseções visuais.
- `npx tsc --noEmit` executa sem erros.

---

## Wave 1 — Full-Screen Layout & 3D Flips

### Task 1.1: CSS Updates for Full-Screen, 3D Perspective and Scroll Fixes

<read_first>
- src/components/modals/CreateClueModal_Refactored.css
</read_first>

<action>
Modify `CreateClueModal_Refactored.css`:

1. Replace `.create-clue-refactored-modal` with `.cc-fullscreen-overlay`:
```css
.cc-fullscreen-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
}
```

2. Update `.cc-refactored-layout` to full viewport:
```css
.cc-refactored-layout {
  display: flex;
  height: 100vh;
  width: 100vw;
  background: var(--nexus-bg);
  color: var(--nexus-text, #e0e0e0);
  overflow: hidden;
  font-family: 'Inter', sans-serif;
}
```

3. Update `.cc-tab-content-wrapper` to have perspective for 3D flips and ensure Scroll works:
```css
.cc-tab-content-wrapper {
  flex: 1;
  position: relative;
  overflow-y: auto; /* Allow scroll inside the tab area */
  overflow-x: hidden;
  padding: 3rem 4rem 8rem 4rem; /* Extra bottom padding so users can scroll down easily */
  perspective: 1200px; /* Crucial for 3D flip effect */
}
```

4. Style the new absolute close button `.cc-fullscreen-close`:
```css
.cc-fullscreen-close {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
  background: transparent;
  border: 1px solid var(--nexus-border);
  color: var(--nexus-text, #fff);
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 50;
  transition: all 0.2s ease;
}

.cc-fullscreen-close:hover {
  border-color: var(--nexus-neon);
  color: var(--nexus-neon);
  background: rgba(0, 255, 255, 0.1);
}
```

5. Define `.cc-divider` for use in the tabs:
```css
.cc-divider {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent, var(--nexus-border), transparent);
  margin: 2rem 0;
  border: none;
}
```
</action>

<acceptance_criteria>
- CSS contains `.cc-fullscreen-overlay`, `cc-fullscreen-close` and `.cc-divider`
- Scroll works due to `overflow-y: auto` with ample bottom padding in `.cc-tab-content-wrapper`
- 3D perspective is configured
</acceptance_criteria>

### Task 1.2: Refactor CreateClueModal_Refactored.tsx (Layout & Flips)

<read_first>
- src/components/modals/CreateClueModal_Refactored.tsx
</read_first>

<action>
Modify `CreateClueModal_Refactored.tsx`:

1. Remove `DiegeticWindow` usage. Replace root with `<div className="cc-fullscreen-overlay">`.
2. Insert `<button className="cc-fullscreen-close">` in the root layout.
3. Update `variants` for 3D Card Flips:
```ts
  const variants = {
    enter: (direction: number) => ({
      rotateY: direction > 0 ? 90 : -90,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      rotateY: 0,
      opacity: 1,
      transition: { type: 'spring' as const, stiffness: 200, damping: 20, mass: 0.8 }
    },
    exit: (direction: number) => ({
      zIndex: 0,
      rotateY: direction < 0 ? 90 : -90,
      opacity: 0,
      transition: { duration: 0.2 }
    })
  };
```
4. Add `TabSecurity` to the `TABS` array (ID `seguranca`, Label "Segurança", Icon: `ShieldAlert` or `Lock` - reassign icons logically if `Cifra` also uses `Lock`).
```ts
{ id: 'seguranca', label: 'Segurança', icon: ShieldAlert },
```
5. Import `TabSecurity` from `./createclueTabs/TabSecurity`.
6. Include `{activeTab === 'seguranca' && <TabSecurity />}` in the `<AnimatePresence>` block.
</action>

<acceptance_criteria>
- Modal root is `<div className="cc-fullscreen-overlay">`
- Tab animations use `rotateY` (-90 to 0 to 90)
- `TabSecurity` added to tab navigation
</acceptance_criteria>

---

## Wave 2 — Tab Internal Polish & Structuring

### Task 2.1: Create TabSecurity.tsx and refactor TabGeneral.tsx

<read_first>
- src/components/modals/createclueTabs/TabGeneral.tsx
- src/contexts/ClueModalContext.tsx
</read_first>

<action>
1. **Create** `src/components/modals/createclueTabs/TabSecurity.tsx`:
Move any fields related to `securityState` (like `isLocked`, `lockPass`) into this file. Also add the fields for "Telefone/Chat Fake" que estão misturados com as propriedades antigas ou ausentes. Se existirem no estado (`coreState.fakePhone`?), coloque-os aqui. Use as classes `.cc-field`, `.cc-label`, `.cc-input`, `.cc-checkbox`. Use `<hr className="cc-divider" />` para separar as seções (Ex: "Segurança de Acesso" vs "Telefone / Fake OS").

2. **Refactor** `TabGeneral.tsx`:
Change old `<div className="field-block">` inputs to use `.cc-field`, `.cc-label`, `.cc-input` to match the cyberpunk aesthetics.
Change the old `<input type="checkbox">` for `Pista Oculta` to use the `.cc-checkbox` pattern:
```tsx
<label className="cc-checkbox">
  <input type="checkbox" checked={...} onChange={...} />
  <span className="cc-checkbox-label">Pista Oculta (Não aparece na lousa até ser descoberta)</span>
</label>
```
Use `<hr className="cc-divider" />` if the form gets too crowded visually.
</action>

<acceptance_criteria>
- `TabSecurity.tsx` created, isolating phone and password configs.
- `TabGeneral.tsx` refactored to use standard `.cc-field`, `.cc-label`, `.cc-input`, `.cc-checkbox`.
- Checkboxes in `TabGeneral` correctly styled.
- Dividers added for logical separation.
- `npx tsc --noEmit` exits 0.
</acceptance_criteria>

---

## Verification

### Automated
```bash
npx tsc --noEmit
```

### Manual Checklist
1. Open the modal. It should fill the entire screen.
2. Ensure you can scroll up and down if the content of a tab is very long.
3. Observe the `Segurança` tab and confirm Phone/Passwords are separated and properly styled.
4. Check `TabGeneral` checkboxes — they should now have the neon green/cyberpunk CSS layout.
5. Notice the horizontal dividers `<hr>` visually grouping information.
6. Verify 3D card flips animate smoothly when clicking between tabs.
