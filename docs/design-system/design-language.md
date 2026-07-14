# Flowstate Visual Design Language

Visual design in Flowstate follows the same discipline as [motion](../motion-design-language.md): **tokens first**, semantic naming, single source of truth.

## Principles

1. **Token-first** — Every color, type size, and radius flows from `lib/design/tokens.ts`.
2. **Semantic over primitive** — Use `text-canvas-body-sm` not `text-[13px]`; use `text-canvas-danger` not `text-red-600`.
3. **One accent** — UI chrome and thread palette[0] share `canvas.accent` (`#2066EB`, the brand cobalt).
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

## Artifact style packs

Artifacts can be re-skinned as a whole via **style packs** — a visual language applied to a subtree that opts in with `<ArtifactStyleScope>`. Packs are add-only: each is one entry in [`lib/design/style/stylePacks.ts`](../../lib/design/style/stylePacks.ts) plus a scoped rule block in [`app/styles/artifact-styles.css`](../../app/styles/artifact-styles.css) (`[data-artifact-style="<pack>"]`). No component changes per pack.

| Pack | id | Language |
|------|-----|----------|
| Vanilla | `vanilla` | The factory look — quiet chrome revealed on hover. Structural no-op (never resolved into CSS). |
| Neo | `neo` | Landing-page language — ink wire strokes, solid no-blur chin, cream card, cobalt accent. |
| Brut | `neobrutalism` | Neobrutalism — thick ink borders, hard offset shadows, flat loud color, tilted cards. |
| Liquid Glass | `liquid-glass` | Apple-style liquid glass — translucent blurred material, specular edge highlights, 24px continuous corners, tinted canvas backdrop. No pack accent (adapts to the theme). |

**Consistent stroke (Neo).** In Neo, **every** surface carries the same ink wire so the canvas reads as one system:

- **All artifacts** — input/media *and* output/document. "Naked" kinds (images/video, website, embed, street view, 3d, sticky note) keep the shared `.artifact-casing` stroke + chin and only stay transparent behind it so their own media shows through (they are excluded from the opaque card-fill only).
- **Chat surfaces** — on-canvas Q&A cards and the chat-panel thread opt in with the `chat-casing` class, which the Neo block strokes with the same `--canvas-artifact-stroke-w` / `--canvas-artifact-stroke`.

The stroke width/color come from the pack's `--canvas-artifact-stroke*` variables (see [token reference](token-reference.md#artifact-style-packs)).

**Glass material (Liquid Glass).** Liquid Glass extends the pack contract with three optional tokens: `backdropFilter` (mode-independent, e.g. `blur(20px) saturate(1.7)`), `cardFillAlpha` (per-mode fill translucency — fill hexes stay alpha-free; opacity composes at consumption), and `innerHighlight` (per-mode specular inset shadow). The blur is applied on exactly **one** element per node (`.artifact-casing` / `.chat-casing`) — never nested — and is flattened during zoom gestures via the raster-hygiene rule in `globals.css`. Beyond `.chat-casing`, the glass reaches the composer (`chat-composer-casing`), the Q&A answer body (`.canvas-translucent-fill`), the follow-up footer, and the chat threads sidebar (`chat-thread-panel`).

## Do / Don't

**Do**

- Import `CANVAS_ACCENT`, `CANVAS_CONNECTOR`, etc. for runtime SVG/TS fallbacks
- Use `canvas-tag-*` semantic classes for table tag tones via `TABLE_TAG_TONE_CLASSES`
- Mirror new tokens in `app/globals.css` when needed for non-Tailwind CSS

**Don't**

- Add `canvas.question` — use `canvas-accent`
- Hardcode `#FAFAF8`, `#8B8A86`, `#B8B5AE` in components
- Mix Tailwind default `text-sm` / `text-red-600` in product UI
