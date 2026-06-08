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
t=140ms+  left panel line items slide in (x −12px → 0), staggered by section
t=380ms   shell rests
```

### Left panel line stagger (on expand only)

| Section | Index | Content |
|---------|-------|---------|
| 0 | 0 | Header (brand + collapse) |
| 1 | 0–1 | Canvases title, Create button |
| 2 | 0–n | Invitations heading + rows |
| 3 | 0–n | My canvas rows |
| 4 | 0–n | Shared heading + rows |
| 5 | 0–1 | Save status, auth |

Delay: `section × staggerSection (140ms) + item × staggerItem (50ms)`, capped at `staggerCap`.

Collapse: opacity fade only on exit (no translate).

## Tokens

- Shell: `duration.panel`, `easeHeavy` (CSS)
- Content shell: `standard`, `easeMedium`, `shiftXs`
- Line items: `standard`, `easeMedium`, `shiftSm`, `staggerSection`, `staggerItem`

## Reduced motion

Width transition only; content and line items appear instantly.

## Hooks

- `components/motion/MotionPanel.tsx`
- `components/motion/MotionPanelLine.tsx`
- `lib/motion/variants.ts` — `panelLineEnterVariants`, `LEFT_PANEL_SECTIONS`
- `.floating-panel` in `app/globals.css`
