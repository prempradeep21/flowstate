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
| `accent` | `#2066EB` | `text-canvas-accent`, `bg-canvas-accent` — themable primary (brand blue; dark `#2066EB`) |
| `accentSoft` | `#E0E9FA` | `bg-canvas-accentSoft` — soft selected-state fill (dark `#1F2D47`) |
| `onAccent` | `#FFFFFF` | `text-canvas-onAccent` — text/icons on solid accent fills (dark `#FFFFFF`) |
| `secondary` | `#5B7FD6` | `text-canvas-secondary` — themable secondary |
| `tertiary` | `#D97706` | `text-canvas-tertiary` — themable accent |
| `artifactIconBg` | `#E0E9FA` | `bg-canvas-artifactIconBg` |
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

## Artifact style packs

Style packs are defined in [`lib/design/style/stylePacks.ts`](../../lib/design/style/stylePacks.ts) and resolved into scoped CSS variables by [`lib/design/style/resolveArtifactStyle.ts`](../../lib/design/style/resolveArtifactStyle.ts) (injected by `<ArtifactStyleScope>`). Consumed by the `[data-artifact-style="<pack>"]` rules in [`app/styles/artifact-styles.css`](../../app/styles/artifact-styles.css). See the [design language](design-language.md#artifact-style-packs) for the concept.

### Stroke variables

| Variable | Source field | Use |
|----------|--------------|-----|
| `--canvas-artifact-stroke-w` | `strokeWidth` | Frame stroke on `.artifact-casing` and `.chat-casing` |
| `--canvas-artifact-stroke` | `stroke` (RGB channels) | Ink stroke color |
| `--canvas-artifact-control-stroke-w` | `controlStrokeWidth` | In-card controls (pills, calendar chips) |
| `--canvas-artifact-checkbox-stroke-w` | `checkboxStrokeWidth` | Todo checkboxes |

### Neo values

| Field | Value |
|-------|-------|
| `strokeWidth` | `1.6px` |
| `controlStrokeWidth` | `1.3px` |
| `checkboxStrokeWidth` | `1.4px` |
| `stroke` (light) | `#232323` |
| `stroke` (dark) | `#ECEAE3` |

In Neo the `1.6px` ink frame stroke (`--canvas-artifact-stroke-w`) is applied uniformly across all input + output artifacts and chat surfaces (`.chat-casing`).

### Glass variables (optional — emitted only when a pack opts in)

| Variable | Source field | Use |
|----------|--------------|-----|
| `--canvas-artifact-backdrop-filter` | `backdropFilter` (preset-level, mode-independent) | Backdrop blur/saturation on `.artifact-casing` / `.chat-casing`; flattened to `none` during zoom gestures |
| `--canvas-artifact-card-alpha` | `cardFillAlpha` (per mode) | Fill translucency, composed as `rgb(var(--canvas-artifact-card-fill) / alpha)`; CSS falls back to `1` |
| `--canvas-artifact-inner-highlight` | `innerHighlight` (per mode) | Specular inset edge, composed into shadow lists; falls back to `0 0 #0000` |

### Liquid Glass values

| Field | Value |
|-------|-------|
| `backdropFilter` | `blur(20px) saturate(1.7)` |
| `radius` | `24px` |
| `cardFill` / `cardFillAlpha` (light) | `#F7FAFF` / `0.55` |
| `cardFill` / `cardFillAlpha` (dark) | `#232A36` / `0.5` |
| `stroke` (light / dark) | `#FFFFFF` / `#8A93A6` — consumed at 55% alpha as a luminous rim |
| `canvasBg` (light / dark) | `#DDE5EF` / `#101319` — tinted backdrop so the blur has content to refract |
