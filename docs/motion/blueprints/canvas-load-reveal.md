# Blueprint: Canvas load reveal

## Trigger

Canvas hydrate after login, page reload, or canvas switch (`hydrateFromSnapshot` with `canvasReveal: true`).

Not triggered on collaboration realtime updates or new empty canvases (landing stagger handles those).

## Reveal units

| Unit | Scope | Anchor X |
|------|-------|----------|
| Thread family | All cards in family (`getFamilyCardIds`) | Min card `position.x` in family |
| Standalone artifact | One per `canvasArtifactOrder` entry | `node.position.x` |

Units sorted left → right. All cards in a family share the same delay so the tree moves as one.

## Timing

| Property | Value | Token |
|----------|-------|-------|
| Stagger step | 50ms between units | `staggers.staggerItem` |
| Stagger cap | 900ms max delay | `staggers.staggerCap` |
| Duration | 320ms | `durations.standard` |
| Shift | 12px from left | `distances.shiftSm` |
| Easing | Medium | `easeMedium` |

Total window: `maxDelay + duration + 50ms buffer`.

## Implementation

CSS `@keyframes canvas-load-slide-in` + inline `animationDelay` on `MotionCanvasNode` inner wrapper — no Framer bulk instances.

Connections hidden (`opacity: 0`) until reveal completes, then shown instantly.

## Gating

`Canvas.tsx` starts reveal when:

- `canvasLoadReveal.phase === 'pending'`
- `persistenceReady`
- `!isSwitchingCanvas`

## Reduced motion

`.motion-canvas-load-fade` — opacity only, no horizontal shift.

## Hooks

- `lib/motion/canvasLoadReveal.ts` → `buildCanvasLoadRevealPlan`
- `components/motion/MotionCanvasNode.tsx`
- `components/Canvas.tsx` → gate + auto-clear
- `app/globals.css` → `.motion-canvas-load-in`
