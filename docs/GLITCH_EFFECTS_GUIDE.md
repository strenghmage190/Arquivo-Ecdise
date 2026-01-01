# Guide: Glitch Effects for Player View

## Overview
The `EvidenceCardContent` component now provides authentic cyberpunk glitch effects that visually restrict player access to locked/encrypted content.

## Component Hierarchy

```
EvidenceCard (parent)
└── EvidenceCardContent (NEW - handles GM/Player views)
    ├── GM View: Normal content display
    ├── Locked View: "ACESSO NEGADO" with encryption grid
    └── Glitch View: Heavy data corruption effects
```

## Three Rendering Paths

### 1️⃣ GM VIEW (Game Master - Can See Everything)
- **Condition**: `isGameMaster || !playerView`
- **Display**: Normal image with optional UV layer
- **Effects**: Standard overlay-scan effect
- **CSS Classes**: `.gm-view`, `.overlay-scan`

```tsx
<div className="card-content-container gm-view">
  <MysteryImage ... />
</div>
```

### 2️⃣ LOCKED VIEW (Player - Access Denied)
- **Condition**: `playerView && locked && !isGameMaster`
- **Display**: "ACESSO NEGADO" with 🔐 icon
- **Effects**:
  - Encryption grid background (pulsing)
  - Lock icon pulse animation (2s infinite)
  - Encryption code (random RND-XXXX)
  - Red (#ff003c) color scheme with glow
- **CSS Classes**: `.locked-view`, `.encryption-grid`, `.lock-overlay`, `.access-denied`

```tsx
<div className="encryption-grid" /> {/* Pulsing grid overlay */}
<div className="lock-icon">🔐</div> {/* Animated lock */}
<div className="access-denied">ACESSO NEGADO</div> {/* Blinking text */}
<div className="encryption-code">{encryptionCode}</div> {/* Random code */}
```

**Animations**:
- `grid-pulse`: 3s oscillation between 0.5 and 1 opacity
- `lock-pulse`: 2s scale between 1 and 1.08
- `access-blink`: 1s opacity blink at 50% mark

### 3️⃣ GLITCH VIEW (Player - Data Corrupted)
- **Condition**: `playerView && (cardType === 'glitch' || cardType === 'encrypted') && !isGameMaster`
- **Display**: Heavy visual corruption with layered glitch effects
- **Effects**:
  - **3 Glitch Layers**: Red, Cyan, Yellow color shifts with horizontal displacement
  - **Data Corruption Pattern**: SVG grid with symbols and circles
  - **Glitch Text**: 3-layer text with different animations
  - **Scanlines**: CRT-style horizontal lines drifting downward
  - **Background Hue Rotation**: Subtle color shift animation

**CSS Classes**:
- `.glitch-view`: Base container with animated background
- `.glitch-corruption`: 3-layer container
  - `.glitch-layer-1`: Red layer (0.3s animation)
  - `.glitch-layer-2`: Cyan layer (0.25s reverse animation)
  - `.glitch-layer-3`: Yellow layer (0.35s animation)
- `.data-corruption-overlay`: SVG pattern container
- `.glitch-text-overlay`: Text layers
  - `.glitch-1`: Red/Cyan text shift (0.4s)
  - `.glitch-2`: Yellow text with skew (0.35s reverse)
  - `.glitch-3`: Cyan/Red text shift (0.45s)
- `.scanlines`: Horizontal line overlay with drift

## Color Palette

| Element | Color | Usage |
|---------|-------|-------|
| Red | `#ff003c` | Glitch layer 1, locked icon, access denied |
| Cyan | `#00f3ff` | Glitch layer 2, text shadow |
| Yellow | `#ffff00` | Glitch layer 3, encryption code |
| Magenta | `#ff00ff` | SVG pattern text |
| Orange | `#ff6600` | Encryption code text |

## Animation Timings

| Animation | Duration | Loop | Effect |
|-----------|----------|------|--------|
| `glitch-shift` | 0.3s | infinite | Horizontal displacement ±2px |
| `glitch-shift-reverse` | 0.25s | infinite | Reverse horizontal ±2px |
| `grid-pulse` | 3s | infinite | Opacity fade 0.5→1 |
| `lock-pulse` | 2s | infinite | Scale 1→1.08 |
| `access-blink` | 1s | infinite | Opacity 1→0.6 |
| `corruption-float` | 2s | infinite | Small translate + opacity |
| `scanline-drift` | 8s | infinite | Y-axis drift |
| `glitch-char` | 0.4s | infinite | Scale + translate displacement |
| `glitch-char-reverse` | 0.35s | infinite | Skew + translate displacement |
| `glitch-bg` | 4s | infinite | Hue rotate ±5° |

## Usage in EvidenceCard

```tsx
<EvidenceCardContent
  id={id}
  image={image}
  isUV={isUV}
  locked={locked}
  cardType={cardType} // 'glitch' | 'mega-clue' | 'encrypted' | 'normal'
  isGameMaster={isGameMaster}
  playerView={playerView}
  hasUV={hasUV}
  hiddenSrc={hiddenSrc}
/>
```

## Integration Steps

1. **Pass Props to EvidenceCard**:
   - `playerView`: boolean (true when player is viewing)
   - `isGameMaster`: boolean (true for GM only)
   - `locked`: boolean (for access-restricted content)
   - `cardType`: 'glitch' | 'encrypted' | 'mega-clue' | 'normal'

2. **EvidenceCard passes to EvidenceCardContent**:
```tsx
<EvidenceCardContent
  {...cardContentProps}
  isGameMaster={!!userProfile?.codename} // or check permission level
  playerView={!isEditMode}
/>
```

3. **Check user role/clearance**:
```tsx
const isGameMaster = userProfile?.clearance_level === 'ÔMEGA';
const playerView = !isEditMode && !isDevelopment;
```

## Visual Hierarchy

```
┌─────────────────────────────────┐
│  .card-content-container        │
├─────────────────────────────────┤
│                                 │
│  GM View (Normal):              │ z-index: 1
│  ├── Image or MysteryImage      │
│  └── overlay-scan               │
│                                 │
│  Locked View:                   │
│  ├── .encryption-grid (z: 100)  │
│  └── .lock-overlay (z: 100)     │
│      ├── .lock-icon             │
│      ├── .access-denied         │
│      └── .encryption-code       │
│                                 │
│  Glitch View:                   │
│  ├── .glitch-corruption (z: 50) │
│  │   ├── .glitch-layer-1        │
│  │   ├── .glitch-layer-2        │
│  │   └── .glitch-layer-3        │
│  ├── .data-corruption (z: 60)   │
│  │   └── SVG pattern            │
│  ├── .glitch-text (z: 70)       │
│  │   ├── .glitch-1              │
│  │   ├── .glitch-2              │
│  │   └── .glitch-3              │
│  └── .scanlines (z: 80)         │
│                                 │
└─────────────────────────────────┘
```

## Performance Considerations

- **Multiple Animations**: The glitch view uses multiple simultaneous animations (3 glitch layers + scanlines + text)
- **SVG Pattern**: Background pattern is SVG with repeating elements - consider optimize for many cards
- **CSS-only**: All effects are CSS animations (no JavaScript) for better performance
- **Hardware Acceleration**: Transform animations (translateX) are GPU-accelerated

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Requires CSS Animations, CSS Gradients, backdrop-filter
- SVG pattern support required

## Customization

### Change Glitch Colors
Edit in `EvidenceCardContent.css`:
```css
.glitch-layer-1 { background: repeating-linear-gradient(...rgba(YOUR_COLOR,0.2)...); }
```

### Adjust Animation Speeds
```css
@keyframes glitch-shift {
  /* Change 0.3s to desired duration */
  0%, 100% { transform: translateX(0); }
  50% { transform: translateX(-2px); }
}
```

### Modify Grid Pattern
In TSX component, update SVG pattern:
```tsx
<pattern id="corrupt" x="0" y="0" width="50" height="50" ...>
  {/* Change width/height for different grid size */}
</pattern>
```

## Accessibility Notes

- High contrast colors for visibility
- Pulsing animations may affect photosensitive users
- Consider adding `prefers-reduced-motion` media query support:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}
```

## Files Modified

- `src/components/board/EvidenceCardContent.tsx` - Component logic
- `src/components/board/EvidenceCardContent.css` - Styling and animations
- `src/components/modals/CreateClueModal.tsx` - Fixed JSX structure
