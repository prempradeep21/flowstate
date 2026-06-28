# Flowstate Design System (exported)

Consumable outputs for external services. Regenerate with:

```bash
npm run export:design-tokens    # bundle only
npm run export:design-system    # bundle + static site
```

## `bundle/`

| File | Use |
|------|-----|
| `tokens.json` | Colors, typography, radii, spacing, CSS variable maps |
| `tokens.css` | Standalone `:root` + dark theme variables |
| `tokens.tailwind.json` | Tailwind `canvas-*` utility map |
| `manifest.json` | Component/specimen index (artifacts, cards, connectors) |
| `docs/` | Copy of `docs/design-system/` markdown |

## `site/`

Static HTML export of the design system hub (`/dev/design-system`). Serve locally:

```bash
npx serve dist/design-system/site
```

Source of truth remains in-repo: `lib/design/tokens.ts`, `app/dev/design-system/`, `lib/designSystemRegistry.ts`.
