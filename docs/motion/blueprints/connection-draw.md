# Blueprint: Connection draw

## Trigger

New connection from `createFollowUp`, `createBranch`, `createBranchAt` → `recentConnectionId` set.

## Timeline

```
t=80ms   stroke-dashoffset: pathLength → 0 (200ms linear)
```

## Implementation

CSS class `.connection-draw-in` on new path only; removed on `animationend`.

## Tokens

`fast` (200ms), `easeLinear`

## Reduced motion

Path appears fully drawn; no animation.

## Hooks

- `components/ConnectorPathGroup.tsx`
- `components/Connections.tsx` (`recentConnectionId`)
- `lib/store.ts` → `clearRecentConnection`
