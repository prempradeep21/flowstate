# Token reference

All values defined in [`lib/design/tokens.ts`](../../lib/design/tokens.ts). Tailwind prefix: `canvas-`.

## Colors — surface & text

| Token | Hex | Tailwind examples |
|-------|-----|-------------------|
| `bg` | `#FAFAF8` | `bg-canvas-bg` |
| `card` | `#FFFFFF` | `bg-canvas-card` |
| `border` | `#E6E4DF` | `border-canvas-border` |
| `ink` | `#2C2A26` | `text-canvas-ink` |
| `muted` | `#6F6B63` | `text-canvas-muted` (AA on bg + card) |
| `dot` | `#8B8A86` | `--canvas-dot` in CSS |
| ccent | #6B4EFF | 	ext-canvas-accent, g-canvas-accent — themable primary |
| secondary | #5B7FD6 | 	ext-canvas-secondary — themable secondary |
| 	ertiary | #D97706 | 	ext-canvas-tertiary — themable accent |
| `artifactIconBg` | `#EDE9FE` | `bg-canvas-artifactIconBg` |
| `artifactStage` | `#F3F2EF` | `bg-canvas-artifactStage` |
| `connector` | `#B8B5AE` | stroke fallback (`CANVAS_CONNECTOR`) |
| `plugFill` | `#F7F6F3` | plug SVG fill |
| `stageDark` | `#1a1a1a` | `bg-canvas-stageDark` (3D/code) |
| `codeBg` | `#f4f4f5` | `bg-canvas-codeBg` |

## Colors — semantic status

| Token | Tailwind | Use |
|-------|----------|-----|
| `danger` | `text-canvas-danger` | Errors, destructive actions |
| `dangerSoft` | `bg-canvas-dangerSoft` | Error backgrounds |
| `dangerBorder` | `border-canvas-dangerBorder` | Destructive button borders |
| `success` / `successText` / `successSoft` / `successRing` | `bg-canvas-successSoft text-canvas-successText` | Live indicators, table tags |
| `warning` / `warningText` / `warningSoft` / `warningRing` | Todo priority, map mode chip |
| `info` / `infoText` / `infoSoft` / `infoRing` | Table info tags |
| `tagDanger` / `tagDangerSoft` / `tagDangerRing` | Table danger tags |

## Colors — syntax & map

| Token | Use |
|-------|-----|
| `syntaxComment` | Code comment green |
| `syntaxString` | Code string orange |
| `syntaxKeyword` | Code keyword blue |
| `mapPrimary` | Map search result pin |
| `mapSaved` | Map saved place pin |

## Typography

| Class | Size / leading |
|-------|----------------|
| `text-canvas-micro` | 10px / 1.4 |
| `text-canvas-caption` | 11px / 1.45 |
| `text-canvas-compact` | 12px / 1.5 |
| `text-canvas-body-sm` | 13px / 1.5 |
| `text-canvas-body` | 14px / 1.55 |
| `text-canvas-body-lg` | 15px / 1.5 |
| `text-canvas-heading` | 18px / 1.35 |
| `text-canvas-brand` | 22.5px / 1.2 |
| `text-canvas-display` | 52px / 1.05, −0.02em tracking |

## Radius

| Class | Value |
|-------|-------|
| `rounded-canvas-xs` | 2px |
| `rounded-canvas-sm` | 8px |
| `rounded-canvas` | 12px |

## Feature palettes

| File | Constant | Notes |
|------|----------|-------|
| `lib/design/tokens.ts` | `THREAD_ACCENT_PALETTE` | 8 thread colors; [0] = accent |
| `lib/tableAccentColor.ts` | `TABLE_ACCENT_COLORS` | Per-table row accent |
| `lib/collaboratorColors.ts` | `COLLABORATOR_COLORS` | Live cursor colors |

## Floating chrome

| Class / token | Value | Use |
|---------------|-------|-----|
| `.floating-chrome-padding` | `p-3` (12px) | Collapsed panels, bottom toolbar shell |
| `.floating-chrome-chip` | `text-canvas-body-sm` | Save status, auth name, sign out |
| `canvasFloatingChrome.brandIcon` | 28px | Collapsed Flowstate logo |

Defined in [`lib/design/tokens.ts`](../../lib/design/tokens.ts) and [`app/globals.css`](../../app/globals.css).

## CSS variables (`app/globals.css`)

```css
--canvas-bg, --canvas-ink, --canvas-dot, --canvas-accent
```

Motion variables remain separate; see motion design language.
