# Canvas Pet — Stickman

A tiny companion that lives **on** the canvas, not beside it. The stickman treats
your artifacts, charts, images, timelines, and chat bubbles as solid ground —
standing on them, running along their tops, and leaping from one element to the
next. It has free will: left or right, dance or nap, it decides.

## Why this is groundbreaking

Canvases are spatial, but nothing *inhabits* them. A pet that uses your actual
work as its terrain makes the canvas feel like a place. It also quietly
communicates spatial structure: watching the stickman leap a wide gap tells you
two clusters are far apart.

## The character

Deliberately the simplest possible body: one head, one torso, four limbs — pure
SVG strokes. Simple is not a compromise; it is the performance budget. Every
richer character later (blob, cat, robot) can reuse the exact same skeleton
contract: a foot point, a facing, and a `data-pose` attribute.

### States

| State | Trigger | Motion source |
| --- | --- | --- |
| **Stand** | default | CSS breathing keyframe |
| **Run** | moving along a foothold | rAF drives x; CSS swings limbs |
| **Jump** | crossing to a neighbour | rAF samples a parabolic arc; static tuck pose |
| **Dance** | random whim / button | CSS keyframes only |
| **Rest** | random whim / button | CSS sit pose + floating "z" |

### Free will

A weighted-random brain picks the next action (jump left/right, wander, dance,
rest, idle) after a human-feeling pause. It is bounded — it never proposes
walking off the end elements — and it damps repeats so it doesn't loop one
habit. Auto mode is **off by default** in the playground; manual buttons drive
every action until you flip it on.

## Spatial awareness

Every canvas element becomes a `Foothold { left, right, surfaceY }`. The pet
knows each element's width and edges, runs to an inset take-off point, and
lands at an inset landing point on the neighbour — arcs clear upward height
gaps automatically. In the playground, footholds are measured once per layout
change (a single `ResizeObserver`), never during animation.

## Performance contract (the actual feature)

- **Zero React renders during motion.** Position writes go straight to
  `style.transform` (`translate3d`, compositor-only); pose is one `data-pose`
  attribute swap.
- **The JS loop only exists while moving.** Stand/dance/rest cancel the rAF
  loop entirely — limbs run as GPU-composited CSS keyframes. An idle pet costs
  ~0% scripting.
- **One `setTimeout`** schedules the next free-will decision. No polling.
- **No Framer Motion for the pet** — its declarative re-render model is the
  wrong tool for a per-frame wanderer.
- Respects `prefers-reduced-motion`.

## Playground

Two phases at `/admin/ideas/canvas-pet-stickman/playground`:

1. **Design** — stroke color + size with a live idle preview.
2. **Sample canvas** — five mock elements (artifact, chart, image asset,
   timeline, chat bubble) at varied heights, with Run ◀▶ / Jump ◀▶ / Dance /
   Rest buttons, a speed slider, an Auto (free will) toggle, and a foothold
   debug overlay.

## Roadmap to the real canvas

1. Adapter that maps live store nodes (`cards`, `canvasArtifactNodes`) to
   footholds using stored positions + `lib/canvasNodeBounds.ts` sizes.
2. Ride the existing viewport transform for free pan/zoom correctness (the pet
   lives in world coordinates inside the viewport layer).
3. React to canvas life: hop onto a card while it streams, dodge when an
   element is dragged out from underfoot.
4. Character skins on the same skeleton contract.
