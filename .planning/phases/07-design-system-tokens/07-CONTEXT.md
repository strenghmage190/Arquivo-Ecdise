# Phase 7 Context: Design System Tokens

## Domain
Establish the monochrome design token system, font imports, and global CSS reset that every subsequent phase depends on.

## Locked Requirements
- **DSYS-01 a DSYS-06**: Paleta monocromática, vermelho institucional, cores dos Elementos/Evoluções, border-radius global 0, proibição de neon/glass.
- **TYPO-01 a TYPO-05**: Cinzel (Títulos), Share Tech Mono (Dados), Special Elite (Docs), Teko (Ameaça).

## Implementation Decisions

### 1. Typography Stack
- **Google Fonts Import**: The specific Google Fonts URL will load `Cinzel:wght@600;800`, `Share Tech Mono`, `Special Elite`, and `Teko:wght@600` with `display=swap`.
- **Utility Classes**: Fonts will be exposed via `.font-oculto`, `.font-terminal`, `.font-documento`, `.font-ameaca` directly in CSS, and also mapped in `tailwind.config.js`.

### 2. Element & Evolution Tokens
- **Structural Elements**: Hex codes mapped directly to CSS variables (`--el-sangue: #8B1414`, etc.).
- **Evolutions**: Represented as `linear-gradient` CSS variables to allow seamless application to borders and backgrounds (`--ev-metamorfose: linear-gradient(...)`).

### 3. Global Overrides
- **Border Radius**: A strict `* { border-radius: 0; }` is applied globally. Exceptions (like the toolbar) will need specific override classes like `.rounded-full`.
- **Neon Cleanup**: All existing `box-shadow` styles from the old "Nexus" theme were removed from `.loading-spinner` and global classes.

## Canonical References
- `REQUIREMENTS.md` (DSYS and TYPO rules)
- `ROADMAP.md` (Phase 7 scope)

## Code Context
- Modifies `src/index.css` directly as the source of truth for variables.
- Modifies `tailwind.config.js` to extend `colors` and `fontFamily` using the CSS variables.
