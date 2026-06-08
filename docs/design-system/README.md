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
