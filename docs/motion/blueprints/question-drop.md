# Blueprint: Question drop

## Trigger

- Q-placement click → `createRootCard`
- Sidebar attachment drop → `createRootCard`
- Plug drag to empty canvas → `createRootCardWithAttachment`

## Components

| Element | File |
|---------|------|
| Spawn meta | `lib/store.ts` |
| Inner wrapper | `components/motion/MotionCanvasNode.tsx` |
| Viewport focus | `lib/canvasFocus.ts` |

## Timeline

```
t=0ms     opacity 0→1, y -dropLift → 0
t=120ms   scale 1 → 0.96 (compress)
t=240ms   scale → 1.02 → 1 (easeSettle bezier)
parallel  viewport pan (slow, 480ms)
```

## Tokens

`dropLift`, `scaleCompress`, `scaleOvershoot`, `easeSettle`, `easeMedium`

## Reduced motion

Opacity fade only; instant viewport jump.

## Hooks

- `setSpawnMeta({ kind: 'drop', targetKind: 'card' })`
- `MotionCanvasNode` inner child of positioned card root
