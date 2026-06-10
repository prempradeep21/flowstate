# Blueprint: Pie menu (hold Z)

## Trigger

Hold **Z** on the canvas (bare key only — Ctrl/Cmd/Alt chords pass through).
Menu lives while Z is held; keyup fires the armed sector and always closes.

## Variant

### Center ring

```
initial: opacity 0, scale 0.8
animate: opacity 1, scale 1
duration: ring 100ms, easeLight
```

### Pills (clockwise stagger from top: N → E → S → W)

```
initial: opacity 0, scale 0.92, offset 12px toward center (shiftSm)
animate: opacity 1, scale 0.92 → 1.02 → 1, offset 0
delay: index x 40ms (pieDelays.stagger)
duration: 240ms (pieDelays.pillDuration), easeSettle (the bounce)
opacity: fast (200ms), easeLight
```

Last pill starts at 120 ms and settles by ~360 ms — under the 1 s budget.

### Exit

```
all elements together: opacity 0, scale 0.96
duration: 100ms (pieDelays.exitDuration), no stagger
```

## Nuance

- **Active sector highlight:** inner div CSS transition (100 ms) — scale 1.04 +
  `bg-canvas-bg`; never fights the Framer entrance transform (outer `m.div`).
- **Ring notch:** rotates toward the armed sector via CSS `transform: rotate()`.
- **No animation gating:** a fast flick + release fires before pills finish
  landing — interaction state is independent of animation state.
- Whole overlay is `pointer-events-none`; selection is angle + keyup driven.

## Reduced motion

No stagger, no bounce — instant opacity in and out (`reduced` /
`reducedExit` variants).

## Hooks

- `lib/motion/tokens.ts` → `pieDelays`
- `lib/motion/variants.ts` → `pieRingVariants`, `piePillVariants`
- `lib/canvasPieMenu.ts` → geometry (sectors, dead zone, clamping)
- `components/CanvasPieMenu.tsx`
- `hooks/useCanvasPieMenu.ts`
