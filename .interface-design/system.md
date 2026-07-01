# Flowstate Admin — Design System

Last updated: 2026-06-30

## Intent

- **Human:** Flowstate builders stepping out of the canvas for internal tooling
- **Task:** Inspect artifacts, explore lab ideas, read shipping history, triage feedback, scan usage
- **Feel:** Calm workshop — canvas tokens, whisper-quiet borders, purposeful iconography

## Signature

Icon-led navigation with `canvas-artifactIconBg` icon wells and a 2px left accent rail on active nav items.

## Depth

Borders-only. No heavy shadows. Surface elevation via `bg-canvas-card` on interactive/active states.

## Tokens

Reuse canvas Tailwind tokens (`canvas-bg`, `canvas-card`, `canvas-border`, `canvas-ink`, `canvas-muted`, `canvas-accent`). No custom hex in components.

## Typography

- Brand micro: `text-canvas-micro uppercase tracking-wider`
- Page title: `font-display text-xl font-medium`
- Section label: `text-canvas-body-sm font-semibold uppercase tracking-wider text-canvas-muted`
- Body: `text-canvas-body-sm`

## Spacing

Base unit 4px. Nav item padding `px-2.5 py-2`. Card padding `p-4`. Section gaps `space-y-8`.

## Nav groups

Home · Build · Lab · Operate

## Components

- `AdminNavLink` — icon + label, active rail
- `AdminCardIcon` — 36px well, rounded-canvas, artifactIconBg
- `AdminActionIcon` — inline with buttons
- `AdminBreadcrumb` — Lab sub-pages

## States

All interactive elements: default, hover, focus-visible ring, disabled. Cards: border accent on hover.
