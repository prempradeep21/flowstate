# Design system audit (pre-migration)

Historical record of findings that drove the March 2026 unification. **Status: resolved** in `lib/design/tokens.ts` migration.

## Summary

| Area | Before | After |
|------|--------|-------|
| Typography | 180× `text-[Npx]`, 14 sizes | 8 `text-canvas-*` tokens |
| Accent | `#6B4EFF` vs `#7C9EFF` | Unified to `#6B4EFF` |
| Connector | `#B8B5AE` duplicated ×2 | `CANVAS_CONNECTOR` |
| Danger | `red-600` / `red-50` | `canvas-danger*` |
| Radius | `rounded-lg` in map | `rounded-canvas-sm` |

## Hotspot files (were highest drift)

| File | Issue |
|------|-------|
| `ShareModal.tsx` | 19 arbitrary text sizes |
| `CanvasesSection.tsx` | Sidebar typography |
| `TodoArtifactContent.tsx` | Mixed sizes + amber tags |
| `MapArtifactContent.tsx` | Inline HTML hex + `rounded-lg` |

See [design-language.md](./design-language.md) for current rules.
