# Flowstate Motion — Performance Contract

## Allowed properties

| Cheap (compositor) | Avoid (layout/paint) |
|--------------------|----------------------|
| `transform` (x, y, scale, rotate) | `width`, `height`, `top`, `left` |
| `opacity` | animated `box-shadow`, `border-radius` |
| `stroke-dashoffset` (one new path) | path `d` morphing, many SVG animators |

## Bundle

- `LazyMotion` + `m` + `domAnimation` at app root
- `strict` mode — accidental `motion` import throws in dev
- Framer imports only from `lib/motion/*` and `components/motion/*`

## Concurrent animation budget

| Context | Max |
|---------|-----|
| Landing | 1 stagger group, ≤10 CSS animations |
| Canvas spawn | 1 node per user action |
| Sidebar | 1 panel toggle |
| Viewport pan | 1 CSS transition |
| Connection draw | 1 new edge |
| Thinking pulse | 1 active card |
| Overlay | 1 `AnimatePresence` root |

## Shortcuts

- **Off-viewport spawns:** opacity-only or instant
- **Landing:** `sessionStorage` `flowstate-landing-animated` — once per session
- **Spawn meta TTL:** 400ms auto-clear

## Sidebar width exception

Only two elements animate `width` (left/right panel shells) via CSS transition — never Framer `animate={{ width }}`.

## Viewport pan

CSS `transition: transform` on `[data-canvas-viewport].viewport-focusing` during programmatic focus only. User pan/zoom calls `cancelViewportTween()`.

## will-change

Set on animating element only; remove in `onAnimationComplete` / `animationend`.

## Verification

- Chrome Performance: no sustained >16ms blocks during landing or single drop
- Rapid follow-up creation: no timer/listener leaks
- `npm test` — `lib/motion/tokens.test.ts` smoke checks

## Anti-patterns

- Framer spring on lists
- Per-word streaming opacity
- `will-change` on every card
- Re-drawing all connections on relayout
