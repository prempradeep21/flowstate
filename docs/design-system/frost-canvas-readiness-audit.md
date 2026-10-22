# Frost (Style D) — canvas-readiness audit

_2026-10-20 · branch `sharability`_

Style D ("Frost") was designed in Artifact Studio (`components/artifactStyles/styleD/`) as a set of **artifact bodies on a scrolling board**. A canvas theme has to cover much more: the space *between* artifacts (connectors, groups, selection), every state an artifact passes through (loading, streaming, error, empty, LOD), and the chrome that floats over the canvas.

This audit lists what is missing. Each item is marked:

- **Design**: needs a Frost spec (visual decision) before code.
- **Dev**: the spec is obvious from Style D's rules; it's implementation work.
- **Infra**: the theme system itself can't express it yet, so it's a prerequisite for *any* theme.

## What shipped today (phase 0)

Frost is now a style pack (`id: "frost"`) next to Vanilla, Brut, Liquid Glass and Bento. Light and dark themes are untouched, and Frost works in both.

| Piece | Where |
|---|---|
| Pack tokens: frost card, rim + 3-layer fall shadow, 36px radius, no strokes, frost field `#E4E4E2` / dark `#18181B`, ink/muted, chart and timeline palettes (ink, lime, sage, stone) | `lib/design/style/stylePacks.ts` (`FROST`) |
| Material: sheen + gradient fill, hover lift (−3px + deeper fall), ink selection outline, raised pills, lime "today" / checked todo, hairline tables, frost Q&A card + raised composer, dark smoked-glass vars | `app/styles/artifact-styles.css` (Frost block) |
| AA contrast guard (ink/muted on card, chart ink, lime ink on lime, card vs field) | `lib/design/style/stylePacks.contrast.test.ts` |
| Picker | Canvas settings → Styles, and `/dev/artifact-catalog` |

**What phase 0 is not:** it's the Frost *material* applied to Flowstate's existing artifact bodies. The Studio's Frost *bodies* (flat lime/ink/sage hero cards, DotNumber figures, Ruler gauges, Track sliders, titles set inside the graphic, no header) are not on the canvas yet. That's the biggest piece of work below (§1).

---

## Decisions (phase 1: the full theme)

Every open question below has an answer. These answers are the spec phase 1 is built to.

### The Frost vocabulary (used for every decision)

| Token | Light | Dark | Used for |
|---|---|---|---|
| **Field** | radial `#EEEEEC → #E4E4E2 → #D9D9D7` from 18% 0% | `#232326 → #18181B → #0F0F11` | the canvas ground, screen-fixed under the dot grid |
| **Frost** | sheen + `#F7F7F6 → #EDEDEB`, rim, 3-layer fall | `#2B2B2F → #202024`, rim at 13% | every card |
| **Raised** | `#FFFFFF → #FBFBFA`, top rim, small shadow | `#3D3D44 → #34343A` | anything that sits *on* a card or the field: pills, chips, plugs, handles, menus, toolbars |
| **Well** | `#E9E9E7`, inner shadow from the top-left | `#19191C` | the only thing that *sinks*: media frames, group areas, empty slots |
| **Ink** | `#1C1C1E` + tints `inkA(pct)` | `#F2F2F0` | all type, marks, lines. No grey type: hierarchy comes from size and position. |
| **Lime** | `#DDF23F` / ink on lime `#1C1C1E` | same | the one accent: *now, next, active, valid, done* |
| **Rose bloom** | wash `#FFC9CF → #FF9AA6`, mark `#F2457F` | same at 60% | the only other hue in Frost, reserved for *error* |
| **Geometry** | card radius 44, pad 40, nest inset 14 (radius 30), pill 999 | same | concentric everywhere |
| **Type** | Inter Tight (primary) + DM Sans (secondary), all weight 500 | same | every Frost surface |
| **Motion** | 220ms ease; hover rises 3px; nothing bounces | same | reduced motion turns off rises and sweeps |

### Answers

| Q | Decision |
|---|---|
| 1.1 Seam | A pack can name a **body family**. `FROST.bodyFamily = "frost"` routes every artifact node through Style D's `Frame` + bodies (`components/frost/FrostArtifactNode`). Other packs are unchanged. |
| 1.2 Editing | Frost bodies are the artifact at rest and when selected. Editable kinds (table, todo, calendar, timeline, sticky, code) enter **Edit** by double-click or ⋯ → Edit. That swaps the body for the live editor inside the *same* frost frame, and Frost CSS restyles it. Edit ends when the node is deselected, unless a todo has unsaved changes. Todo checkboxes work in place when the node is selected (each toggle saves a version, like a real checklist). |
| 1.3 Headerless chrome | No header. The whole card is the drag handle (as today). The title lives inside the graphic. The ⋯ corner circle is concentric with the corner and holds Rename, Edit, Version, Export and Remove. Plugs stay on the card's sides. |
| 1.4 Surfaces | *Revised 21 Oct, per [artifacts-frost.md](./artifacts-frost.md) §2–3:* every card is white frost except the sticky note (flat lime). Each card has one solid lime element (the stat's unit pill, the table's header band, the area fill…). |
| 1.5 Size model | *Revised 21–22 Oct, per artifacts-frost.md §5 and the user's rule:* **every Frost card shows all of its content, and its bounds follow** — whoever sized the node (user, layout or nobody). Height = the card's own; picture kinds (charts, media) keep the node's height as their floor. Width = the node's, never narrower than the kind's Frost minimum (stat 440). Frost's box is stored apart from the node's own size (`frostSize`, read by `getArtifactBounds` only while Frost is active), so switching styles never rewrites geometry. The stat's title and figure also scale down on cards narrower than its 380 design width. |
| 1.6 Kinds without a Frost body | map, street view, 3D, repo, Google doc, embed, custom and input assets: Frost frame, title in the head row, live content in a well. *Revised 21 Oct:* media cards use one inset for the title and the well, `MEDIA_INSET` 24 (radius 20), with no arrow button beside the title. Live content stays interactive when selected. |
| 1.7 Fonts | Frost sets its pair (Inter Tight + DM Sans) on its own surfaces. The canvas font picker still controls Q&A answer prose (reading text) but not artifacts: the pair is part of the language. |
| 1.8 Accent picker | No. Lime is Frost's identity; the Studio picker was exploration. The accent is a single `--frost-lime` var, so a picker can come back later without code changes. |
| 1.9 Hardcoded colours | All routed through the pack: timeline bands, the Q&A thread colour, custom bodies (Frost frame + well). |
| 2.1 Connector colour | Packs gain a JS `connector` token (`{ line, active, plug }` per mode). `connectorColour()` and canvas2d edges read it from the active pack; other packs keep today's thread colours. |
| 2.2 Edge | `inkA(22)` light / `rgba(242,242,240,0.22)` dark, 1.5 world-px, round caps. |
| 2.3 Edge states | Hovered / selected endpoint card → ink 56%. The edge into a card that is thinking or streaming → lime 2px. *Layering (22 Oct, all styles):* group wells and headings sit on their own world layer **under** the connector lines, so a group never covers an edge. The edges and plug links of the current selection (a selected card's family, a selected node, the active group) rise above every node, so nothing overlaps the selected card or its connectors. |
| 2.4 Endpoints | No arrowheads. Plug ends are raised discs. |
| 2.5 Plugs | Raised disc, ink glyph; lime fill on hover and while dragging. |
| 2.6 Plug links | Dashed `6 5` at `inkA(28)`, the same for every plug kind. |
| 2.7 New-connection preview | `inkA(40)` dashed while dragging; lime solid over a valid target. |
| 2.8 Collapse toggle | Raised pill. |
| 3.1 Group frame | A **Well**: sunk below the field (inner shadow from the top-left), radius 44 + padding, no outline. |
| 3.2 Active / selected group | Ink outline at offset 6 (same as cards). The badge is an ink pill with field-coloured type. |
| 3.3 Heading / label | Heading in the primary font, ink, at display size, inside the well's top-left. The label pill and rename input are raised. |
| 3.4 Chapters | Same as groups; the chapter number is set as a plain primary-font numeral. Dot-matrix stays a hero-card device. |
| 3.5 Nested groups | Each level sinks one more step: the well darkens 3% L per level, capped at 2. |
| 3.6 Edge-case groups | Empty: faint "Drop artifacts here" inside the well. Huge: unchanged (no sticky heading in v1). |
| 3.7 Group icon / pill | Raised. |
| 3.8 Dead CSS | Leave it (not Frost's job; noted). |
| 4.2 Multi-select | Bounds box: ink 1.5px dashed, radius 44 + 10. Members get no individual outline. |
| 4.3 Marquee | `inkA(5)` fill, `inkA(30)` 1px border, radius 14. |
| 4.4 Resize handles | Raised discs, 14px, on the corner arc (inset `44·(1−1/√2)` ≈ 13px). |
| 4.5 Selection toolbar / menus | Canvas-attached menus follow the pack (raised material, ink type, lime check): ⋯ menus, the pie menu, the context / floating menu, the selection toolbar. App chrome (top bar, bottom toolbar, panels) stays on brand. |
| 4.6 Drag / drop | Dragging card keeps the lifted shadow. Placement ghosts are a well-toned outline; a valid drop target gets a lime 2px ring. |
| 4.7 Focus ring | `0 0 0 3px lime, 0 0 0 4.5px ink`: distinct from the selection outline and AA on frost and on lime. |
| 4.8 Other node selection | Same ink outline, offset 6, for text labels, GIFs, 3D, skills and assets. |
| 5.1 Generating | Frost frame at its final size; the sheen sweeps top-left → bottom-right every 1.8s; title as two raised bars; a lime dot pulses in the corner where ⋯ will be. |
| 5.2 Skeleton bodies | One shared Frost skeleton (sweep + bars). Per-body skeletons are left for later. |
| 5.3 Streaming answer | Three lime dots in a raised pill; streaming text is plain ink. |
| 5.4 Media loading | Well tone + sheen sweep. |
| 5.5 Map tiles | Map stays its own style inside the well (no tile restyle in v1). |
| 5.6 LOD placeholder | Frost fill, radius 44, contact shadow only (cheap). Lime only for the sticky note. Title in primary font, wrapped, never clamped. |
| 5.7 Remote update | A lime rim breathing along the top edge. |
| 5.8 Canvas loading overlay | Frost field. |
| 5.9 Build progress | Lime Track. |
| 6.1 Artifact error | Frost card + rose bloom on the lower 48%, ink message, raised "Retry" pill. |
| 6.2 Q&A retry | Same pattern in the Q&A card. |
| 6.3–6.5 Embed / image / map failure | Well + faint-ink glyph + one-line reason + raised pill action. |
| 6.6 Save status | Floating chrome: unchanged (stays on brand). |
| 6.7 Partial data | Bodies already fall back (`parseFigure`, `dottable`, and `CurrentBody` for wrong payloads); a body with no data shows the empty state (7.3). |
| 6.8 Rejected connection | Covered by 2.7 (no lime snap). |
| 7.1 Landing | Composer is a raised frost slab on the field. |
| 7.3 Empty bodies | Faint-ink line ("No items yet") + a raised "Add" pill when editable. |
| 8.1 Field | Implemented as a screen-fixed radial layer under the dot grid. |
| 8.2 Background picker | Frost owns the field for the Grid / default styles. Ambient gradient and photo backgrounds are respected; the cards stay opaque frost on them. |
| 8.3 Minimap | Moves inside the scope and reads pack tokens: field, frost tiles and an ink viewport frame. |
| 8.4 Portals | The style scope mirrors its id onto `<html data-canvas-style>`, and the pack's vars are also emitted for `[data-canvas-portal]` roots, so portaled canvas menus follow the pack. |
| 8.5 Artifact menus | Raised material, radius 22, ink type, lime check, `inkA(6)` hover row. |
| 8.6 Cursors | Labels pick ink or white by contrast. |
| 8.7 Pen | Default ink. |
| 8.8 Picker chip | Mini frost card with its fall shadow on the field, plus one lime dot. |
| 9.2 Dark heroes | No hero cards remain (1.4). Lime stays lime in dark. |
| 9.3 Media in dark | Unchanged (the photo is the photo). |
| 9.4 Dark shadows | Deeper ambient (0.6) + 13% rim (done in phase 0); verify at 3 zooms. |
| 10 Perf | No blur anywhere in Frost (the only exception is GLASS chips over photos, inherited from Style D bodies). |

### Phase 1 status (2026-10-20, updated 2026-10-21)

**21 Oct — Style D cleanups carried to the canvas** ([artifacts-frost.md](./artifacts-frost.md)):
- Bodies changed in the Studio (white cards, figures in the secondary font, one lime element, media inset 24, no arrow button) apply on the canvas automatically, because both import the same `components/artifactStyles/styleD`.
- Canvas-side changes:
  - Frost nodes hug (1.5).
  - Grey type is removed inside Frost cards: `--canvas-muted` resolves to ink, and the empty-state line is ink.
  - The Q&A send button is ink: a finished Q&A card has no lime.
  - The quoted-selection lime wash is now a raised pill.
  - Build-progress done checks are ink: the Track dot is the card's one lime.
  - Input assets use the media inset (24 / 20).
  - Asset and placeholder titles wrap instead of truncating.

All decisions above are built, in light and dark, and gated on the Frost pack. The other packs and the Light/Dark themes render exactly as before; screenshots of each against Vanilla were checked.

| Area | Where |
|---|---|
| Artifact nodes: Style D frame + bodies, Edit mode, ⋯ (Rename / Edit / Version / Export / Hide), wells for live kinds, generating skeleton → streamed Frost body, LOD stand-in, empty + error bodies, input assets | `components/frost/*`, `components/CanvasArtifactNode.tsx`, `app/styles/frost/frost-artifacts.css` |
| Connectors, plugs, plug links, drag preview, groups, selection box, marquee, handles, ghosts, focus ring, other node outlines | `hooks/usePackConnector.ts`, edge / plug / group components, `app/styles/frost/frost-canvas-chrome.css` |
| Q&A / conversation cards, composer, streaming, retry, build progress, landing, field, minimap, loading overlay, cursors, settings chip, all canvas menus | `components/canvasPortal.ts`, card / menu components, `app/styles/frost/frost-cards-menus.css` |
| Shared vocabulary, portal + font mirroring | `app/styles/frost/frost-tokens.css`, `components/ArtifactStyleScope.tsx`, `components/frost/frostFonts.ts`, `lib/design/style/resolveArtifactStyle.ts` |
| Tests | `lib/design/style/frost.test.ts`, `stylePacks.contrast.test.ts` |
| Dev harnesses | `/dev/artifact-catalog` (Frost tab, `window.__canvasStore`), `/dev/frost-cards`, `scratch/frost-*.mjs`, `scratch/frost-chrome/shoot.mjs` |

**Known gaps:**
- **No-ops in today's data model:**
  - 3.5: groups can't nest.
  - 3.6: an empty group isn't rendered.
  - 4.6: the only drop target is the receive plug, which does turn lime.
- **`custom` artifacts:** their own HTML document keeps its own colours (the pomodoro stays white in dark).
- **⋯ overlap:** on small cards, the ⋯ circle can overlap a top-right hero figure while hovered or selected.
- **SVG edge fallback:** draws the resting colour only. Hover and active states exist only in the canvas2d renderer.
- **Coded but not visually verified:** the canvas-switch overlay (5.8), the settings chip (8.8), the remote-update rim (5.7), hover hints, quick-explain and the selection toolbar.
- **Build dependency (resolved 21 Oct):** the style families moved out of `app/dev` into `components/artifactStyles/` (with `textSpec.ts` and the hug context in `hug.ts`). The Studio, the demo-video scenes and `components/frost` all import from there.

---

## 1. Artifact bodies (the gap between Studio and canvas)

| # | Gap | Type | Notes |
|---|---|---|---|
| 1.1 | **Pack → body family seam.** Packs today are CSS-only (vars + scoped rules). Style D's bodies are React components. | Infra | Add an optional `bodies` family to a pack (e.g. `pack.family = "style-d"`), and have `CanvasArtifactNode` render the Studio body in place of the vanilla body when the pack has one. Fall back per variant to the vanilla body so nothing renders empty. |
| 1.2 | **Studio bodies run on Studio data.** They take `ArtifactRenderContext` (pool item + `variant`), not live canvas artifact state. | Dev | Write an adapter from `CanvasArtifactNode` props to the studio context, and decide which bodies are editable on canvas (todo checkbox, calendar nav, table cell edit, sticky typing). Studio bodies are read-only today. |
| 1.3 | **No header vs canvas chrome.** Style D has no header; the canvas uses the header for drag handle, title rename, kind icon, menu, plugs. | Design | Specify where the drag area, rename affordance and `CornerMenu` live on a headerless card. Studio's `CornerMenu` is a start. Phase 0 keeps the vanilla header (transparent, no rule), which is why it reads as a grey band over a white body in screenshots. |
| 1.4 | **Hero surfaces.** Frost paints gauge / stat / sticky lime, area chart ink, audio sage (`frostSurfaceOf`). | Dev | Needs 1.1. Can't be done in CSS: vanilla bodies paint their own white panels. |
| 1.5 | **Size model.** Studio bodies assume PAD 40 / radius 44 at canvas size and *hug* content (no truncation). Canvas nodes are user-resizable, with min sizes. | Design | Define behaviour at min size, very wide (timeline), very tall (todo with 60 items), and aspect-locked media. Phase 0 uses radius 36 because vanilla bodies have tighter padding. |
| 1.6 | **Kinds Studio never designed.** `map`, `streetview`, `3d`, `repo`, `google-doc`, `images` grid at canvas scale, `custom` (pomodoro etc.), input assets (PDF / office / code). | Design | Studio routes geo/media to `InsetBody`. Needs a Frost frame for each: a flush media well, a raised glass chip for controls, and the corner menu. |
| 1.7 | **Fonts.** Style D is Inter Tight (primary) + DM Sans (secondary), every weight 500. The canvas has its own font picker. | Design | Decide whether Frost forces its pair, or sets the pack default and lets the font picker override it. Phase 0 inherits the canvas font. |
| 1.8 | **Accent picker.** Studio lets the user swap lime (8 presets, `--sd-lime` / `--sd-lime-ink`). | Design + Dev | If kept, it's per-canvas state persisted in the snapshot, beside `canvasArtifactStyle`. Phase 0 hard-codes lime in `--frost-lime`. |
| 1.9 | **Hardcoded body colours that ignore the pack.** Timeline range bands (blue / yellow), the Q&A `#2066EB` thread colour, the pie's lime too close to the field, `custom` bodies (the pomodoro) staying white in dark. | Dev | Route through the chart / timeline palette or `--frost-*`. |

## 2. Connectors

None of this is styled by any pack today. Edges are a **global infra bug**: `connectorColour()` returns the hard-coded `UNIFIED_CONNECTOR_COLOUR` (`#2066EB`, `lib/design/tokens.ts:177`), so `--canvas-connector` is never read and Bento's override does nothing either.

| # | Gap | Type | Proposed Frost spec |
|---|---|---|---|
| 2.1 | Edge colour ignores the pack | Infra | `ConnectionsCanvas.tsx` (canvas2d) must read the pack's connector colour from JS (like `pack[mode].chart`), since canvas2d can't read CSS vars per frame. Add `connector` to the pack's JS tokens. |
| 2.2 | Edge stroke | Design | Ink at 22% (`inkA(22)`, the Ruler tint), 1.5px world-px, round caps. No glow. Fixed world-px per the no-zoom-responsive rule. |
| 2.3 | Active / hovered / selected edge | Design | No edge states exist today. Frost: hovered = ink 56%; selected = solid ink; the **active thread** (the one being answered) = lime 2px, the "now" mark. |
| 2.4 | Edge endpoints / arrowheads | Design | Frost dot: a raised white 8px pill with rim at both ends. No arrowheads; direction comes from layout. |
| 2.5 | Plug buttons (`Plug.tsx`, `ReceivePlugs.tsx`) | Dev | Raised pill (`RAISED`), ink glyph; the connected state is a lime fill. Currently `bg-canvas-card` + an inline accent border. |
| 2.6 | Plug links (dashed artifact / asset / skill / group plugs) | Design | Dashed `6 5` in ink 28%; groups fall back to `CANVAS_ACCENT`. Replace with pack tokens. |
| 2.7 | Drag-a-new-connection preview (`PlugConnectorLayer.tsx`, hardcoded `#7C9EFF`) | Dev | Ink 40% dashed while dragging; snaps to lime when over a valid target; ink 16% plus a "can't connect" cursor over an invalid one. |
| 2.8 | Branch collapse toggle (`Card.tsx:1166`) | Dev | Raised pill. |

## 3. Groups, sections, boundaries

| # | Gap | Type | Proposed Frost spec |
|---|---|---|---|
| 3.1 | Group frame (`GroupBounds.tsx:123`): card/0.3 fill + ink/0.16 outline | Design | A **recessed well**, the one surface in Frost that sinks rather than rises: field −3% L, inner shadow from the top-left light, radius = card radius + group padding (concentric rule). No outline. |
| 3.2 | Active / selected group | Design | Ink outline at offset 6, the same language as card selection. The selected badge (`bg-canvas-accent`) becomes an ink pill. |
| 3.3 | Group heading / label pill / rename input | Design | Heading set in the primary font at display size, inside the well's top-left (Style D's "title inside the graphic"). The label pill is a raised pill. |
| 3.4 | Chapter spines (transcript / sample canvases use group headings) | Design | Big ink numerals (DotNumber?) plus the chapter title. Decide whether the dot-matrix is used outside hero cards. |
| 3.5 | Nested groups | Design | Each nesting level sinks one more step. Cap it at 2 levels visually. |
| 3.6 | Group with one child / empty group / group larger than viewport | Design | Edge cases: an empty group shows a "Drop artifacts here" hint in faint ink; for a huge group, keep the heading sticky at the viewport top while inside. |
| 3.7 | Group summary icon / attachment pill | Dev | Raised pills. |
| 3.8 | Dead CSS `.canvas-group-bounds` (`globals.css:603`) | Dev | Remove. |

## 4. Selection, hover, focus, manipulation

| # | Gap | Type | Proposed Frost spec |
|---|---|---|---|
| 4.1 | Single artifact selected | Done (phase 0) | 2.5px ink outline, offset 6, deeper fall shadow. |
| 4.2 | Multi-select bounds box (`SelectionBoundsBox.tsx`, accent shadow) | Design | Ink 1px dashed bounds, with each member getting the single-select outline at 40%. |
| 4.3 | Marquee (`Canvas.tsx:2305`) | Dev | Ink 6% fill, ink 30% 1px border, radius 12. |
| 4.4 | Resize handles (`NodeCornerResizeHandles.tsx`) | Design | Raised white discs, 10px, at the concentric corner arc (not the bounding-box corner, because the radius is 36). |
| 4.5 | Selection toolbar (`SelectionToolbar.tsx`) | Design | Floating raised glass bar. Decide whether it follows the pack (it's floating UI; the current rule says chrome stays on brand). |
| 4.6 | Drag ghost / placement ghost (`Canvas.tsx:2354+`, `[data-canvas-dragging]`) | Dev | Card at 70% with the lifted shadow. The drop target is a lime 2px dashed outline. |
| 4.7 | Keyboard focus ring (`globals.css:430`) | Dev | Must stay distinct from selection: lime 3px ring plus an ink 1px inner ring (AA on frost and on lime). |
| 4.8 | Text node / sticky / GIF / 3D / skill node selection (accent ring) | Dev | Same ink outline as artifacts. The skill node has hardcoded `#111111`. |
| 4.9 | Reduced motion | Done (phase 0) | Hover lift disabled. |

## 5. Loading states

| # | State | Type | Proposed Frost spec |
|---|---|---|---|
| 5.1 | **Artifact generating** (`GeneratingArtifactContent.tsx`: shimmer, pulse, bounce) | Design | The frost card appears at its final size, with the sheen *sweeping* top-left → bottom-right (the light moving, not a grey shimmer). Title skeleton is two ink-8% raised bars. No bouncing dots. |
| 5.2 | Body skeletons (`ArtifactLoadingSkeleton`, `TableShaderSkeleton`, `.table-shimmer-bar`) | Design + Dev | One skeleton per body shape: chart = ruler ticks fading in; table = hairline rows; stat = DotNumber dots lighting up one by one; gauge = ruler sweep. |
| 5.3 | Q&A streaming answer (`PendingAnswerPlaceholder`) | Design | Lime caret / 3 lime dots in a raised pill. Streaming text in ink, no fade. |
| 5.4 | Media loading (`MediaLoadingCover`: images, GIF, embed) | Dev | The `well` tone with a soft sheen sweep. |
| 5.5 | Map tiles loading | Design | Frost-tinted tile placeholder plus a decision on map style (desaturated light / dark tiles). |
| 5.6 | **LOD placeholder at low zoom** (`CanvasArtifactNode.tsx:429`, `data-artifact-lod="placeholder"`) | Dev | **Not styled by any pack**, so cards flash vanilla white during pan/zoom. Must be the frost fill + radius + fall shadow (cheap: no blur exists). Hero cards use their flat surface colour. |
| 5.7 | Remote update glow (`ArtifactRemoteUpdateGlow`) | Design | A lime rim pulse along the top edge, once. |
| 5.8 | Canvas switch / initial load overlay (`components/canvas-loading/*`) | Design | Frost field with the grid fading in. |
| 5.9 | Custom UI build progress (`CustomUiBuildProgress`) | Design | A Track (lime-dot slider) as the progress bar. |

## 6. Error states

| # | State | Type | Proposed Frost spec |
|---|---|---|---|
| 6.1 | Artifact generation failed / render error boundary (`GeneratingArtifactContent.tsx:68`) | Design | Same frost card. A **rose bloom** along the lower edge (Style D's bloom, the only place a non-lime hue appears in Frost), an ink one-line reason and a raised "Retry" pill. Never red text on frost. |
| 6.2 | Q&A retry (`QaRetryPlaceholder`) | Design | Same pattern inside the Q&A card. |
| 6.3 | Embed / website blocked (`EmbedArtifactContent.tsx:341`) | Design | Favicon disc + domain + "Open in new tab" raised pill on the `well`. |
| 6.4 | Image / GIF failed to load | Design | `well` + broken-image glyph in faint ink + Retry. |
| 6.5 | Map failed / no API key | Design | Static coordinates list as fallback. |
| 6.6 | Save failed / offline / conflict (`SaveStatusBadge`, danger tokens) | Design | Floating chrome, not canvas, but the danger token on frost needs its own AA check. Define a Frost danger pair. |
| 6.7 | Partial data (chart with 1 point, table with 0 rows, gauge without max, NaN / negative values, a stat that isn't a number) | Design | Each body needs a spec. Style D's `parseFigure` / `dottable` already fall back (non-dottable → plain figure). Document the rest. |
| 6.8 | Plug / connection rejected (incompatible kinds) | Design | See 2.7, plus a toast. |

## 7. Empty states

| # | State | Type | Notes |
|---|---|---|---|
| 7.1 | Empty canvas / landing (`CanvasLanding`, `CanvasLandingOverlay`) | Design | The landing composer as a raised frost slab on the field. Glass styles this; Frost doesn't yet. |
| 7.2 | Empty Q&A card (composer only) | Done (phase 0) | Frost card + transparent composer. Verify visually. |
| 7.3 | Empty todo / calendar with no events / timeline with one event / table headers only | Design | Faint-ink hint plus a raised "Add" pill. |
| 7.4 | Empty group | See 3.6 | |

## 8. Canvas background and floating chrome

| # | Gap | Type | Notes |
|---|---|---|---|
| 8.1 | Field | Done (phase 0) | Flat `#E4E4E2` with dots. Style D's field is a **radial light** (`#EEEEEC → #D9D9D7` from 18% 0%). Needs a screen-fixed gradient layer under the grid. |
| 8.2 | Background style picker (grid / ambient gradient / static image) | Design | Ambient gradient has hardcoded hexes, and the static image ignores the pack. Decide whether Frost locks the background, or how frost cards sit on a photo (the frost needs translucency + blur there, which conflicts with "no blur halos"). |
| 8.3 | Minimap (outside the scope) | Infra | Either move it inside `ArtifactStyleScope` or pass pack tokens. Today it never changes. |
| 8.4 | Portaled menus (pie menu, floating / context menu, hover hint, model picker, answer selection, quick-explain) | Infra + Design | Portaled to `<body>`, so they get no pack vars. Decision: keep on brand (current rule) or follow the pack. If they follow it, portal them into the scope. |
| 8.5 | Artifact header menus (`ArtifactNestedMenu`, `ArtifactHeaderNestedMenu`, menu control rows) | Design | Raised glass menu, ink type, lime check. |
| 8.6 | Collaborator cursors / avatars | Design | Per-user colours: check them against frost (light) and smoked glass (dark). Labels use white text and fail AA on pale colours. |
| 8.7 | Pencil strokes (`CanvasDrawingLayer`) | Design | Default pen colour on Frost = ink. |
| 8.8 | Settings popover preview chip | Done (phase 0) | Uses `previewSwatches`. Could show a mini frost card with its shadow instead. |

## 9. Dark mode

| # | Gap | Type |
|---|---|---|
| 9.1 | Smoked-glass neutrals, rim / sheen at a fraction, lime unchanged | Done (phase 0) |
| 9.2 | Hero surfaces in dark (lime stays lime; ink hero becomes `#0E0E10`; sage) | Design (needs 1.1) |
| 9.3 | Map tiles, embeds, website screenshots in dark | Design |
| 9.4 | Shadow legibility: falling shadows nearly vanish on `#18181B`. The Studio uses a deeper ambient + rim. | Design. Verify at 25%, 100% and 200% zoom. |

## 10. Performance and verification

- **No blur.** Frost has no `backdrop-filter` and no blurred layers, unlike Aurora (Style E). Keep it that way. The 5-layer shadow on hundreds of cards is the main cost: profile a 200-node canvas pan (`scratch/paint-cost.mjs`). If needed, drop the ambient layer under LOD.
- **Hover transform** on `.artifact-casing` must not fight drag transforms. Verify that drag start doesn't jump 3px.
- **Concentric corners:** radius 36 means every nested panel needs `36 − inset`. Vanilla bodies use `--canvas-radius-inner`, so set it in the Frost scope.
- **Verification route:** `/dev/artifact-catalog` → Style: Frost, all three sections, light and dark, three zoom levels, plus a real canvas with groups and threads.

---

## Suggested order

1. **Infra (unblocks every theme):** connector colour from the pack (2.1), styling the LOD placeholder (5.6), minimap / portal decision (8.3, 8.4), pack → body family seam (1.1).
2. **Frost spec pass (design):** connectors (§2), groups (§3), the loading / error / empty set (§5–7), the headerless card chrome (1.3). Do these as Studio boards first, the same way the bodies were judged.
3. **Bodies on canvas:** 1.2–1.6 and 1.9, variant by variant behind the pack, with the vanilla fallback.
4. **Polish:** radial field (8.1), accent picker (1.8), fonts (1.7), dark hero surfaces (9.2), perf pass (§10).
