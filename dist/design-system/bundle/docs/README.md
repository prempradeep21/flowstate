# Flowstate Visual Design System

Obsessive documentation for colors, typography, and corner radii across the main product (`app/`, `components/`, `lib/`).

Motion tokens live separately in [`docs/motion-design-language.md`](../motion-design-language.md).

## Quick links

| Doc | Purpose |
|-----|---------|
| [design-language.md](./design-language.md) | Principles, do/don't, architecture |
| [token-reference.md](./token-reference.md) | Every token with Tailwind class names |
| [audit-report.md](./audit-report.md) | Pre-migration findings (historical) |

## Source of truth

| Layer | File |
|-------|------|
| **Primitives** | [`lib/design/tokens.ts`](../../lib/design/tokens.ts) |
| **Tailwind utilities** | [`tailwind.config.ts`](../../tailwind.config.ts) |
| **CSS variables** | [`app/globals.css`](../../app/globals.css) `:root` |

## Usage rules

1. **Never** use arbitrary `text-[Npx]` or `bg-[#hex]` in product UI — use `text-canvas-*` and `bg-canvas-*`.
2. **Never** duplicate hex constants in components — import from `lib/design/tokens.ts`.
3. **Thread/table/collaborator** palettes are dynamic; they reference `THREAD_ACCENT_PALETTE` or dedicated lib files.
4. **Exempt:** Google brand colors in `AuthButton`, ambient gradient blob pastels (decorative only).

## Re-audit

```bash
node scripts/migrate-design-tokens.mjs   # idempotent class migration
```

Invoke the design-system agent skill (`.cursor/skills/design-system-agent/`) for usage maps and regression checks.

## Export

Browse live UI specimens (artifacts, cards, connectors, tokens) and embedded docs:

```bash
npm run dev:design-system
# → http://localhost:3080/dev/design-system
```

Export token/doc bundle and static site:

```bash
npm run export:design-tokens    # dist/design-system/bundle/
npm run export:design-system    # bundle + dist/design-system/site/
```

Bundle contents:

| Output | Description |
|--------|-------------|
| `dist/design-system/bundle/tokens.json` | Colors, typography, radii, CSS variable maps |
| `dist/design-system/bundle/tokens.css` | Standalone `:root` + dark theme CSS variables |
| `dist/design-system/bundle/tokens.tailwind.json` | Tailwind `canvas-*` utility map |
| `dist/design-system/bundle/manifest.json` | Component/specimen index |
| `dist/design-system/bundle/docs/` | Copy of this documentation folder |
| `dist/design-system/site/` | Static HTML export of the design system hub |
