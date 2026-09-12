# Sound Panel - Dark Mode First Color Design

## Overview
The sound panel has been optimized for dark mode with vibrant, saturated neon-adjacent accent colors that create stunning visual depth through glowing effects and phosphorescent layering.

## Color Palette - Dark Mode First Design

### 1. **Canvas (Interactions)** - Electric Cyan
- **Primary Accent**: Cyan-300 (#06EEF0)
- **Glow Color**: Cyan-500 rgba(6, 182, 212, 0.4)
- **Background**: from-cyan-500/30 via-blue-500/20 to-slate-900/40
- **Border**: Cyan-400/70 with shadow-cyan-500/40 glow
- **Pill**: Cyan-500/35 background with cyan-300/60 border
- **Best For**: Ocean-like, energetic interface interactions

### 2. **Branch (Operations)** - Magenta/Fuchsia
- **Primary Accent**: Fuchsia-300 (#F0A3FF)
- **Glow Color**: Fuchsia-500 rgba(217, 70, 239, 0.4)
- **Background**: from-fuchsia-500/30 via-magenta-500/20 to-slate-900/40
- **Border**: Fuchsia-400/70 with shadow-fuchsia-500/40 glow
- **Pill**: Fuchsia-500/35 background with fuchsia-300/60 border
- **Best For**: Hot pink, energetic phosphorescent glow

### 3. **Artifact (Content)** - Neon Lime
- **Primary Accent**: Lime-300 (#BEF264)
- **Glow Color**: Lime-500 rgba(132, 204, 22, 0.4)
- **Background**: from-lime-500/30 via-green-500/20 to-slate-900/40
- **Border**: Lime-400/70 with shadow-lime-500/40 glow
- **Pill**: Lime-500/35 background with lime-300/60 border
- **Best For**: Vibrant electric green, ultra-bright accents

### 4. **Agent (Feedback)** - Emerald/Aqua
- **Primary Accent**: Emerald-300 (#A7F3D0)
- **Glow Color**: Emerald-500 rgba(16, 185, 129, 0.4)
- **Background**: from-emerald-500/30 via-cyan-500/20 to-slate-900/40
- **Border**: Emerald-400/70 with shadow-emerald-500/40 glow
- **Pill**: Emerald-500/35 background with emerald-300/60 border
- **Best For**: Fresh, bright green phosphorescence

### 5. **History (Undo/Redo)** - Neon Orange
- **Primary Accent**: Orange-300 (#FEDBA9)
- **Glow Color**: Orange-500 rgba(249, 115, 22, 0.4)
- **Background**: from-orange-500/30 via-red-500/20 to-slate-900/40
- **Border**: Orange-400/70 with shadow-orange-500/40 glow
- **Pill**: Orange-500/35 background with orange-300/60 border
- **Best For**: Hot orange glow, warm vibrant accents

## Technical Implementation Details

### Glow Effects
All category sections and pill badges implement **dual-layer glow** for phosphorescent depth:
- **Primary Layer**: `dark:shadow-lg dark:shadow-[color]-500/40+`
- **Secondary Layer**: Border with `/70` opacity and lighter accent text

### Waveform Visualizer (Canvas)
Two-layer rendering for dark mode depth:

```typescript
// Primary bright cyan layer - 34, 211, 238
ctx.strokeStyle = "rgba(34, 211, 238, 0.95)";
ctx.lineWidth = 2.5;

// Secondary phosphorescent glow layer
ctx.strokeStyle = "rgba(6, 182, 212, 0.35)";
ctx.lineWidth = 5.5;
```

### Status Message Enhancement
- **Background**: `dark:bg-emerald-500/28` (increased saturation from original)
- **Border**: `dark:border-emerald-300/70` (more vibrant)
- **Text**: `dark:text-emerald-100` (bright, readable)
- **Glow**: `dark:shadow-lg dark:shadow-emerald-500/45`

## Light Mode Fallbacks
All dark-mode colors include light-mode fallbacks using desaturated palette:
- Light backgrounds: slate-100, slate-50
- Light text: color-700, color-800
- No shadows in light mode to maintain clarity

## Design Principles

1. **Dark-Mode-First**: Primary design optimized for dark (#181715 bg, #211F1C cards)
2. **Vibrant Saturation**: 100% saturation colors that pop against dark backgrounds
3. **Glowing Effects**: Multi-layer shadows create phosphorescent depth
4. **High Contrast**: Text colors (cyan-100, fuchsia-100, etc.) achieve AA+ contrast
5. **Neon Adjacent**: Colors inspired by retro neon/arcade aesthetics (minus harshness)
6. **Visual Feedback**: Saturated colors communicate interactive state clearly

## Usage Examples

### Section Background with Glow
```tsx
<section className={`rounded-canvas border border-canvas-border bg-gradient-to-br ${CATEGORY_COLORS[category]?.bg || ""} p-6`}>
  {/* Content with glow inherited from category colors */}
</section>
```

### Pill Badge with Neon Glow
```tsx
<span className={`${CATEGORY_COLORS[category]?.pill || ""}`}>
  {/* Includes glow: dark:bg-[color]-500/35 dark:text-[color]-100 dark:shadow-lg dark:shadow-[color]-500/50 */}
</span>
```

### Text with Category Color
```tsx
<span className={`${CATEGORY_COLORS[category]?.text || "text-canvas-ink"}`}>
  {/* Inherits dark:text-[color]-300 */}
</span>
```

## Testing Checklist

- [ ] All category sections display with correct gradient backgrounds in dark mode
- [ ] Glow effects visible on borders and text in dark mode
- [ ] Waveform visualizer renders with cyan glow in both layers
- [ ] Status messages appear with emerald glow (no white cutoff)
- [ ] Pill badges render with vibrant colors and shadows
- [ ] Light mode fallbacks maintain readability
- [ ] No color conflicts with existing canvas tokens
- [ ] Glowing effects don't cause performance issues on slower systems

## Future Enhancements

1. **Theme Customization**: Allow users to cycle through neon color palettes
2. **Intensity Controls**: Adjust glow opacity via settings
3. **Animation Effects**: Pulsing glows on active sound events
4. **Color Blindness Mode**: Alternative neon-safe palettes (protanopia, deuteranopia, tritanopia)
