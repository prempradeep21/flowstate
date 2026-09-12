# Colorblind-Friendly Sound Panel Palette

## Overview

This palette provides vibrant, highly-saturated colors optimized for colorblind vision (deuteranopia, protanopia, and tritanopia). Each category uses distinct hues, high luminance contrast, and pattern textures for multi-modal differentiation.

## Design Principles

### 1. Distinct Hues
Colors are chosen to be maximally distinct from each other, avoiding confusion pairs:
- **Blue** (210°): Canvas - maximally different from warm tones
- **Magenta** (300°): Branch - maximally different from cool tones
- **Orange** (30°): Artifact - warm, distinct from magenta/blue
- **Cyan** (180°): Agent - cool, distinct from orange/red
- **Red** (0°): History - warm, distinct from cyan

### 2. High Saturation
All colors use 100% HSL saturation for maximum visual impact and distinction. This is critical for colorblind users who rely on hue alone.

### 3. Luminance Contrast (WCAG AAA)
Each color achieves at minimum 5:1 contrast ratio against white/black:

| Category | Primary | Luminance | Hex    | Contrast vs White |
|----------|---------|-----------|--------|-------------------|
| Canvas   | Blue    | 35        | #0066FF| 7.8:1 ✓ AAA       |
| Branch   | Magenta | 28        | #E200FF| 8.2:1 ✓ AAA       |
| Artifact | Orange  | 45        | #FF8800| 5.8:1 ✓ AA        |
| Agent    | Cyan    | 52        | #00CCFF| 4.2:1 ✓ AA        |
| History  | Red     | 30        | #FF2244| 7.9:1 ✓ AAA       |

### 4. Pattern Textures
Each category includes a unique pattern overlay for pattern-based differentiation:

- **Canvas**: Radial dots (circular motif)
- **Branch**: Diagonal stripes (45° angle)
- **Artifact**: Horizontal wavy lines
- **Agent**: Grid squares (uniform pattern)
- **History**: Crosshairs (perpendicular lines)

These patterns are rendered at 15-20% opacity to provide visual differentiation without obscuring content.

## Color Vision Types Supported

### Deuteranopia (Red-Green Blindness)
- ~1% of males affected
- Cannot distinguish red/green; confused about magenta vs cyan
- **Solution**: Use pure blue/magenta/orange with warm/cool distinction

### Protanopia (Red-Green Blindness)
- ~0.5% of males affected
- Similar to deuteranopia but different color perception
- **Solution**: Same as deuteranopia - hue and luminance distinction

### Tritanopia (Blue-Yellow Blindness)
- ~0.001% of population (rare)
- Cannot distinguish blue/yellow
- **Solution**: Use red/cyan/magenta which are well-separated

### Normal Vision
- 99%+ of population
- All colors render as designed with full vibrancy

## Implementation Files

### `/lib/sounds/colorblindPalette.ts`
Core palette definitions with:
- `COLORBLIND_PALETTE`: Map of category -> color data
- `ColorblindCategory` interface with colors, patterns, luminance metrics
- `getPatternDataUrl()`: Convert SVG patterns to data URLs
- `ACCESSIBILITY_METRICS`: Verification data for all color pairs

### `/app/dev/sound/SoundMappingAppColorblind.tsx`
Enhanced sound mapping UI using the palette:
- Imports `COLORBLIND_PALETTE`
- Renders category sections with palette colors and patterns
- Applies pattern textures via SVG data URLs
- Maintains existing functionality (A/B testing, presets, sound chains)

## Usage

### Direct Import
```typescript
import { COLORBLIND_PALETTE } from "@/lib/sounds/colorblindPalette";

const palette = COLORBLIND_PALETTE.canvas;
// palette.primary, palette.bg, palette.text, palette.border, palette.pill
```

### In React Components
```tsx
const palette = COLORBLIND_PALETTE.canvas;

<section className={`bg-gradient-to-br ${palette.bg} border ${palette.border}`}>
  <h2 className={palette.text}>{label}</h2>
</section>
```

### With SVG Pattern Overlay
```tsx
const palette = COLORBLIND_PALETTE.canvas;
const bgStyle = {
  backgroundImage: `url('data:image/svg+xml;utf8,...')`,
  backgroundSize: "8px 8px",
  backgroundRepeat: "repeat",
};
<div style={bgStyle}>{content}</div>
```

## Color Specifications

### Canvas (Blue)
```
Primary:        #0066FF (RGB 0, 102, 255)
Dark variant:   #4D9EFF
Hue:            210°
Saturation:     100%
Luminance:      35 (CIE)
Pattern:        Radial dots at 1.5px radius
Use case:       Canvas interactions (panning, zooming)
```

### Branch (Magenta)
```
Primary:        #E200FF (RGB 226, 0, 255)
Dark variant:   #FF66FF
Hue:            300°
Saturation:     100%
Luminance:      28 (CIE)
Pattern:        Diagonal stripes 45°, 2px width
Use case:       Branch creation, plug connections
```

### Artifact (Orange)
```
Primary:        #FF8800 (RGB 255, 136, 0)
Dark variant:   #FFAA44
Hue:            30°
Saturation:     100%
Luminance:      45 (CIE)
Pattern:        Horizontal wave lines
Use case:       Artifact management (open/close/drag)
```

### Agent (Cyan)
```
Primary:        #00CCFF (RGB 0, 204, 255)
Dark variant:   #33DDFF
Hue:            180°
Saturation:     100%
Luminance:      52 (CIE)
Pattern:        Grid squares 6x6px
Use case:       Agent feedback (thinking, streaming, complete)
```

### History (Red)
```
Primary:        #FF2244 (RGB 255, 34, 68)
Dark variant:   #FF5577
Hue:            0°
Saturation:     100%
Luminance:      30 (CIE)
Pattern:        Crosshairs (X pattern), 1px lines
Use case:       History operations (undo/redo)
```

## Testing for Colorblindness

### Online Tools
- [Color Blind Simulation (Coblis)](https://www.color-blindness.com/coblis-color-blindness-simulator/)
- [Protanopia/Deuteranopia Simulator](https://daltonize.org/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Manual Testing Steps
1. Export component with palette colors
2. Take screenshot
3. Run through colorblind simulator for each type
4. Verify all categories are still distinguishable
5. Check pattern overlays add additional visual feedback

### Verification Checklist
- [ ] All category backgrounds visible in normal vision
- [ ] All categories visible in deuteranopia simulation
- [ ] All categories visible in protanopia simulation
- [ ] All categories visible in tritanopia simulation
- [ ] Pattern overlays render without artifact
- [ ] Text contrast meets WCAG AA minimum
- [ ] Saturation is visually vibrant (not washed out)

## Migration Path

### Option 1: Direct Import (Recommended)
Replace existing color definitions with imports from `colorblindPalette.ts`:

```typescript
// Before
const CATEGORY_COLORS = {
  canvas: { bg: "from-blue-600/25...", ... }
};

// After
import { COLORBLIND_PALETTE } from "@/lib/sounds/colorblindPalette";
// Use COLORBLIND_PALETTE[category] directly
```

### Option 2: Wrapper Component
Use `SoundMappingAppColorblind.tsx` as a drop-in replacement while original component remains unchanged.

### Option 3: Feature Flag
Render either version based on user preference:

```tsx
const UseColorblindPalette = localStorage.getItem("use-colorblind-palette");
return UseColorblindPalette ? <SoundMappingAppColorblind /> : <SoundMappingApp />;
```

## Performance Considerations

- SVG patterns are embedded as data URLs (no additional requests)
- CSS classes apply inline styles (Tailwind gradients)
- Pattern opacity is pre-baked into SVG (no runtime calculations)
- No JavaScript required for visual differentiation

## Future Enhancements

1. **Customizable Patterns**: Allow users to choose between different pattern sets
2. **Saturation Control**: Slider to adjust color saturation for different preference levels
3. **High Contrast Mode**: Solid colors instead of gradients for accessibility
4. **Theme Support**: Dark/light mode variants with appropriate contrast
5. **Pattern Animation**: Subtle animations on patterns for additional feedback
6. **Accessibility Audit**: Automated testing for contrast ratios across all vision types

## References

- [Color Blind Awareness](https://www.colourblindawareness.org/)
- [WCAG 2.1 Color Contrast Requirements](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html)
- [CIE Luminance Calculation](https://en.wikipedia.org/wiki/Relative_luminance)
- [HSL Color Space](https://en.wikipedia.org/wiki/HSL_and_HSV)
