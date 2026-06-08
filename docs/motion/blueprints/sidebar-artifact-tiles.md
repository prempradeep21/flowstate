# Blueprint: Sidebar artifact tiles

## Trigger

| Action | Condition |
|--------|-----------|
| **Entrance stagger** | `rightPanelCollapsed` transitions `true → false` |
| **Exit fade** | Artifact removed from `sessionArtifacts` |

## Entrance timeline

```
t=0ms      panel shell width (380ms, easeHeavy — existing CSS)
t=60ms     panel inner content fade/slide (MotionPanelContent)
t=60ms+    tiles: opacity 0→1, y 12px→0, 320ms easeMedium
           stagger: index × 50ms, capped at 900ms
```

## Exit

```
opacity 1→0, scale 1→0.96, 200ms easeLight
```

## Explicitly not animated

- New artifact while panel already expanded
- Version updates (content swaps in place)
- First load with panel already open (no collapse→expand transition)

## Reduced motion

Entrance: instant opacity. Exit: instant removal.

## Tokens

- `distances.shiftSm` (12px rise)
- `staggers.staggerItem` (50ms)
- `staggers.staggerCap` (900ms)
- `durations.standard` (320ms entrance)
- `durations.fast` (200ms exit)

## Hooks

- `components/AppRightPanel.tsx` — `tileStaggerActive` on expand
- `components/sidebar/ArtifactsSection.tsx` — grid + `AnimatePresence`
- `components/sidebar/MotionSidebarTile.tsx` — Framer wrapper
- `lib/motion/variants.ts` — `sidebarTileEnterVariants`, `sidebarTileExitTransition`
