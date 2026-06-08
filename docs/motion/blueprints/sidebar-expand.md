# Blueprint: Sidebar expand

## Trigger

User toggles left/right floating panel (`toggleLeftPanel`, `toggleRightPanel`).

## Components

| Element | File |
|---------|------|
| Panel shell | `AppLeftPanel.tsx`, `AppRightPanel.tsx` |
| Inner content | `components/motion/MotionPanel.tsx` |

## Timeline

```
t=0ms     shell width CSS transition (heavy, 380ms)
t=60ms    inner opacity 0→1 + x ±6px (medium, 320ms)
t=380ms   shell rests
```

Collapse: opacity fade only on exit (no translate).

## Tokens

- Shell: `duration.panel`, `easeHeavy` (CSS)
- Content: `standard`, `easeMedium`, `shiftXs`

## Reduced motion

Width transition only; content appears instantly.

## Hooks

- `components/motion/MotionPanel.tsx`
- `.floating-panel` in `app/globals.css`
