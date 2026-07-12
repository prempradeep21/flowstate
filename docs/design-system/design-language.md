# Flowstate Visual Design Language

Visual design in Flowstate follows the same discipline as [motion](../motion-design-language.md): **tokens first**, semantic naming, single source of truth.

## Principles

1. **Token-first** — Every color, type size, and radius flows from `lib/design/tokens.ts`.
2. **Semantic over primitive** — Use `text-canvas-body-sm` not `text-[13px]`; use `text-canvas-danger` not `text-red-600`.
3. **One accent** — UI chrome and thread palette[0] share `canvas.accent` (`#1754C6`, the brand cobalt).
4. **Clustered scale** — Nine ad-hoc px sizes collapsed to eight named typography steps.
5. **Composable radii** — `rounded-canvas` (12px) is default; `rounded-canvas-sm` (8px) for compact overlays; `rounded-canvas-xs` (2px) for handles.

## Token tiers

```
Primitive (lib/design/tokens.ts)
    └── Semantic (Tailwind canvas.* utilities)
            └── Component usage (className in TSX)
```

Feature palettes (threads, tables, collaborators) sit beside primitives and must not invent new hex values without adding to `tokens.ts` first.

## Typography scale

| Token | Size | Role |
|-------|------|------|
| `text-canvas-micro` | 10px | Avatars, mono coords, badges |
| `text-canvas-caption` | 11px | Labels, uppercase section headers |
| `text-canvas-compact` | 12px | Secondary actions, compact UI |
| `text-canvas-body-sm` | 13px | **Default UI body** (menus, sidebars) |
| `text-canvas-body` | 14px | Form copy, panel body |
| `text-canvas-body-lg` | 15px | Section headings, sidebar titles |
| `text-canvas-heading` | 18px | Panel titles, markdown h1–h2 |
| `text-canvas-brand` | 22.5px | Flowstate wordmark |
| `text-canvas-display` | 52px | Landing headline |

## Radius scale

| Token | Value | Use |
|-------|-------|-----|
| `rounded-canvas-xs` | 2px | Resize handles, minimap viewport |
| `rounded-canvas-sm` | 8px | Map overlay controls |
| `rounded-canvas` | 12px | Cards, panels, modals, buttons |
| `rounded-full` | pill | Avatars, tags (intentional, not tokenized) |

## Floating chrome (panels & toolbar)

All floating UI on the canvas shares one inset and chip typography.

| Rule | Value | CSS |
|------|-------|-----|
| Chrome padding | 12px | `.floating-chrome-padding` (`p-3`) |
| Chrome gap | 8px | `gap-2` |
| Footer chip text | 13px body-sm | `.floating-chrome-chip` |
| Collapsed left panel | Logo + chevron **horizontal** | `flex items-center gap-2` inside chrome padding |
| Compact brand icon | 28px | `h-7 w-7` on `FlowstateBrand compact` |

**Applies to:** `AppLeftPanel`, `AppRightPanel` (collapsed), `CanvasBottomToolbar` shell, panel footers (`p-3` sections).

**Do not** use `text-canvas-heading` for save/auth chips — use `floating-chrome-chip`.

## Selection & active states

Selection reads as **primary blue** everywhere. Two idioms, both themable (they follow the active preset's primary):

| Strength | Recipe | Use |
|----------|--------|-----|
| Solid pill | `bg-canvas-accent text-canvas-onAccent` | Segmented controls (view mode, panel tabs), file tabs, the collapsed Artifacts button |
| Soft fill | `bg-canvas-accentSoft text-canvas-accent` | Selected sidebar row, toolbar/menu toggles, active dropdown rows, active thread |
| Outline | `border-canvas-accent ring-2 ring-canvas-accent/25` | Selected canvas cards/artifact nodes; `ring-1` for picker swatches |

Never use `text-white` or `text-canvas-card` on an accent fill — `onAccent` flips to near-black in dark mode because the dark accent is lightened for contrast. The marquee (`.canvas-selection-marquee`) and focus rings also use `canvas-accent`.

## Do / Don't

**Do**

- Import `CANVAS_ACCENT`, `CANVAS_CONNECTOR`, etc. for runtime SVG/TS fallbacks
- Use `canvas-tag-*` semantic classes for table tag tones via `TABLE_TAG_TONE_CLASSES`
- Mirror new tokens in `app/globals.css` when needed for non-Tailwind CSS

**Don't**

- Add `canvas.question` — use `canvas-accent`
- Hardcode `#FAFAF8`, `#8B8A86`, `#B8B5AE` in components
- Mix Tailwind default `text-sm` / `text-red-600` in product UI
