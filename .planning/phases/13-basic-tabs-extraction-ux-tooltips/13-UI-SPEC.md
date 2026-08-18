# Phase 13: UI Design Contract

## 1. Domain & Scope
Basic Tabs Extraction (General, Visual, Audio) & UX Tooltips implementation for the `CreateClueModal_Refactored`.

## 2. Layout & Composition
- **Tab Content Wrapper:** Existing `.cc-tab-content-wrapper` will be used to house each tab's form elements, maintaining consistent padding (2rem) and scrolling behavior.
- **Form Groups:** Standardized flex columns with `gap: 16px` for labels and inputs.
- **Tooltip Icons:** The `(i)` info icons will be placed inline next to labels (e.g., `Fake Phone (i)`), vertically centered using flexbox.

## 3. Typography & Copywriting
- **Tooltip Tone:** Mixed (Diegetic Titles, Functional Explanations).
  - Example Title: `[ PROTOCOLO FAKE PHONE ]`
  - Example Body: `Oculta a barra de status e o fundo da janela, exibindo o conteúdo da imagem como se fosse um aplicativo de celular nativo do dispositivo do jogador.`
- **Labels:** `font-weight: 500; font-size: 13px; color: var(--cc-text-muted);`
- **Inputs:** `font-size: 14px; font-family: 'Inter', sans-serif;`

## 4. Colors & Theming
- **Tooltips:** 
  - Background: `rgba(10, 10, 15, 0.95)`
  - Border: `1px solid var(--cc-neon)`
  - Text: `var(--cc-text)`
  - Title: `var(--cc-neon)`
- **AudioLab Bridge:**
  - Success text for loaded audio: `#00ff00` (Nexus green)
  - Pending text for empty audio: `var(--cc-text-muted)`

## 5. Interaction & Animation
- **Tooltips (react-tooltip):**
  - Will appear on `hover` over the info icons.
  - Fade-in animation (default from react-tooltip, but fast).
- **AudioLab Auto-close:** 
  - When AudioLab saves the file to the shared context, it unmounts automatically, and the Audio Tab immediately reflects the state change with a subtle fade-in of the new file details.

## 6. Component APIs
- **Tooltips:** `<Tooltip id="fake-phone-tip" className="cyber-tooltip" />`
- **Info Icon:** `<InfoIcon data-tooltip-id="fake-phone-tip" />`

## 7. Open Questions / Constraints
- No open questions. Required dependencies (`react-tooltip`) must be added to package.json if not present.
