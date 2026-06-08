---
name: design-system-agent
description: Audits and documents Flowstate color, typography, and radius usage. Use when auditing design consistency, unifying tokens, documenting the visual design system, or before UI styling work.
disable-model-invocation: true
---

# Design System Agent

## Scope

Main product: `app/`, `components/`, `lib/`. Exclude `spec-viewer/`, playground cache.

## Source of truth

- [`lib/design/tokens.ts`](../../lib/design/tokens.ts)
- [`docs/design-system/`](../../docs/design-system/)
- [`tailwind.config.ts`](../../tailwind.config.ts)

## Workflows

### Audit

1. Grep for `text-[`, `bg-[#`, hardcoded hex outside `tokens.ts`
2. Compare against [`token-reference.md`](../../docs/design-system/token-reference.md)
3. Report: `tokenized` | `duplicate` | `drift` | `bypass` | `exempt`

### Before styling changes

- Use `text-canvas-*`, `bg-canvas-*`, `rounded-canvas*`
- Floating canvas UI: `.floating-chrome-padding` + `.floating-chrome-chip` (see design-language.md)
- New colors → add to `tokens.ts` + `tailwind.config.ts` + docs

### Migration script

```bash
node scripts/migrate-design-tokens.mjs
```

## Rules

- Phase 1 unification only unless user requests visual improvements
- No arbitrary `text-[Npx]` in product UI
- Thread palette: `THREAD_ACCENT_PALETTE` from tokens
