# Blueprint: Node pop-in

## Trigger

| Action | Store method |
|--------|--------------|
| Follow-up | `createFollowUp` |
| Branch | `createBranch`, `createBranchAt` |
| Artifact | `spawnCanvasArtifact` (new node) |

## Variant

```
initial: opacity 0, y +24px, scale 0.92
animate: opacity 1, y 0, scale 1
duration: standard (320ms), easeMedium
```

## Nuance

- **Follow-up:** vertical only (X pre-positioned)
- **Branch:** optional 20ms perceived delay after plug feedback
- **Artifact:** parallel viewport pan when `focus: true`

## Reduced motion

Instant opacity 1.

## Hooks

- `lib/motion/variants.ts` → `popUpVariants`
- `components/motion/MotionCanvasNode.tsx`
