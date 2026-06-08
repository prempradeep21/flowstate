# Blueprint: Overlays

## Surfaces

| Surface | Enter | Exit | Tokens |
|---------|-------|------|--------|
| ArtifactPanel | slide from right | reverse | slow, heavy |
| ShareModal | scale 0.96 + fade | reverse | standard, medium |
| Menus | CSS transition | instant | fast, light |

## Implementation

- `MotionOverlaySlide` — ArtifactPanel
- `MotionOverlayModal` — ShareModal
- `MotionBackdrop` — shared backdrop
- `AnimatePresence` at overlay root only

## Reduced motion

Slide becomes fade-only.

## Hooks

- `components/motion/MotionOverlay.tsx`
- `components/ArtifactPanel.tsx`
- `components/ShareModal.tsx`
