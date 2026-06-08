# Blueprint: Landing stagger

## Trigger

`CanvasLanding` mount on empty canvas.

## Section delays

| Element | Delay | Duration | End |
|---------|-------|----------|-----|
| Title | 0ms | 280ms | 280ms |
| Pills ×5 | 280–440ms (40ms stagger) | 280ms | 720ms |
| Composer | 500ms | 280ms | 780ms |
| Tips ×3 | 640–710ms | 280ms | **990ms** |

Perceptual complete under 1000ms.

## Implementation

CSS `@keyframes landing-rise` + inline `animationDelay` — no Framer instances.

## Session guard

`sessionStorage.flowstate-landing-animated` — skip on remount.

## Reduced motion

`.motion-landing-skip` — all elements visible immediately.

## Hooks

- `components/CanvasLanding.tsx`
- `app/globals.css` → `.motion-landing-rise`
