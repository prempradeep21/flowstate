# Blueprint: Viewport pan

## Trigger

- `focusCanvasCard`
- `focusCanvasArtifact`

## Mechanism

1. Add `.viewport-focusing` on `[data-canvas-viewport]`
2. `setViewport({ x, y })` — single update
3. CSS `transition: transform 480ms easeHeavy`
4. Remove class after 480ms

## Interrupt

`cancelViewportTween()` on user pan (`useCanvasPan`) or wheel zoom (`useCanvasWheelZoom`).

## Reduced motion

Instant `setViewport` — no transition class.

## Hooks

- `lib/motion/animateViewport.ts`
- `components/CanvasViewport.tsx` (`data-canvas-viewport`)
