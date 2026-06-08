# Blueprint: Loading & streaming

## Thinking state

1px accent bar at top of active thinking card — CSS `thinking-pulse` opacity loop (1.2s).

Only one card in `thinking` status shows the bar.

## Streaming answer

One-time `answer-reveal-in` opacity fade when first token arrives on answer container.

**No** per-word or per-chunk animation.

## Artifact generating

Static skeleton; optional slow opacity breathe (not implemented in v1 — static preferred).

## Reduced motion

No pulse loop; answer visible immediately.

## Hooks

- `components/Card.tsx` → `.thinking-accent-bar`
- `components/cards/TextCardBody.tsx` → `.answer-reveal-in`
- `app/globals.css`
