# Flowstate Motion Design Language

Motion in Flowstate is **functional first**: it orients attention, confirms placement, and reinforces spatial structure on the canvas. It must never block interaction or degrade performance.

## Principles

1. **Weighted** — Heavy surfaces (panels, viewport pan) decelerate longer; light chrome snaps.
2. **Magnetic** — Canvas placements settle with a subtle compress-and-release.
3. **Sequential clarity** — Stagger reveals hierarchy; landing completes in under one second.
4. **Spatial honesty** — Follow-ups rise from below; panels dock from their anchored edge.
5. **Efficient** — Compositor-only properties; CSS where cheaper; one concurrent spawn animation.

## Token reference

All motion values live in [`lib/motion/tokens.ts`](../lib/motion/tokens.ts) and CSS custom properties in [`app/globals.css`](../app/globals.css).

| Family | Tokens |
|--------|--------|
| Duration | `instant` 100ms, `fast` 200ms, `standard` 320ms, `panel` 380ms, `slow` 480ms, `deliberate` 600ms |
| Easing | `easeLight`, `easeMedium`, `easeHeavy`, `easeSettle`, `easeLinear` |
| Distance | `shiftXs` 6px, `shiftSm` 12px, `shiftMd` 24px, `shiftLg` 40px, `dropLift` 16px |
| Stagger | `staggerItem` 50ms, `staggerGroup` 80ms, `staggerSection` 140ms, cap 900ms |
| Scale | `scaleCompress` 0.96, `scaleOvershoot` 1.02, `scalePopStart` 0.92 |

## Spawn kinds

| Kind | Trigger | Variant |
|------|---------|---------|
| `drop` | Q-placement, attachment drop | Magnetic settle |
| `popUp` | Follow-up, branch, artifact | Slide up + fade |
| `landing` | Empty canvas overlay | CSS stagger |
| `panelExpand` | Sidebar toggle | CSS width + Framer content |
| `overlay` | Artifact panel, share modal | Slide / scale |
| `connection` | New edge | Stroke draw |

## Implementation stack

- **Framer Motion** via `LazyMotion` + `m` + `domAnimation` only ([`lib/motion/MotionProvider.tsx`](../lib/motion/MotionProvider.tsx))
- **CSS** for landing stagger, connection draw, thinking pulse, viewport transform transition
- **Forbidden via Framer:** `width`, `height`, `left`, `top` on canvas nodes

## Reduced motion

`prefers-reduced-motion: reduce` disables stagger, bounce, pan tween, and connection draw. Framer uses `MotionConfig reducedMotion="user"`.

| Pattern | Full | Reduced |
|---------|------|---------|
| Sidebar | width + content slide | width only |
| Drop | bounce | opacity |
| Pop-in | slide + fade | instant opacity |
| Landing | stagger | immediate |
| Viewport pan | CSS transition | instant |
| Connections | draw | static |
| Overlays | slide | fade |

## Do / Don't

**Do**

- Express all timing through tokens
- Animate `transform` and `opacity` on canvas spawns
- Clear `spawnMeta` after 400ms TTL
- Cancel viewport tween on user pan/zoom

**Don't**

- Import `motion` (use `m` inside `LazyMotion`)
- Animate layout properties on cards
- Run springs on lists or loops
- Set `will-change` on all cards preemptively

## Blueprints

See [`docs/motion/blueprints/`](motion/blueprints/) for per-interaction transition charts.

## Phase 2 (documented, not implemented)

- Landing dismiss exit
- Sidebar list reorder
- Plug drag / ghost card motion
- Collaborator cursor transitions
- Canvas-switch overlay alignment
