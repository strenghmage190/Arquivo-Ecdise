# Research Summary: v2.0 Terminal Ordo Realitas

## Stack Additions

- **JetBrains Mono** (Google Fonts) — mono for system/data text
- **Rajdhani** (Google Fonts) — condensed display for case titles, SemiBold/Bold weight
- No new libraries needed — Tailwind + lucide-react sufficient
- CSS custom properties at `:root` for the full color token system

## Feature Table Stakes

| Feature | Category | Notes |
|---------|----------|-------|
| Monochrome chrome | Design System | Standard for terminal UIs — avoid pure #000, use deep charcoals |
| Semantic color tokens | Design System | CSS vars at :root, not hardcoded hex |
| Floating capsule toolbar | Component | `rounded-full` container, icon groups with 1px dividers |
| Card with image preview + metadata | Component | Proven pattern — hover reveals, opacity transitions |
| Badge/tag system | Component | Small colored badges for element classification |
| Form restyling | Component | Custom checkboxes/selects matching system palette |
| Ticker/marquee footer | Component | CSS animation, monospaced, horizontal scroll |

## Architecture Notes

- Home.tsx is thin (164 lines) — good target for redesign
- BottomNavigationBar.tsx still uses emoji icons — needs lucide-react migration
- Desktop.tsx is a window manager shell — keep separate
- Home.module.scss + Home.css both exist — consolidate into module
- No existing design token system — needs creation from scratch

## Watch Out For

1. **Emoji regression** — BottomNavigationBar.tsx has 9 emojis, must replace with Lucide
2. **Dual CSS files** — Home.css and Home.module.scss coexist, risk of specificity conflicts
3. **Tailwind + SCSS** — codebase mixes both; new components should pick one approach consistently
4. **Color leakage** — existing code likely has hardcoded colors scattered across components
5. **Font loading** — JetBrains Mono + Rajdhani from Google Fonts adds ~2 font requests; use `font-display: swap`
