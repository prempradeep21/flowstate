# Frost artifacts — the Style D design system

The rules every Frost (Style D) artifact is drawn by. This is the artifact
design system, kept apart from the product's chrome tokens
([design-language.md](./design-language.md)): the canvas UI and the cards on
it are two different things and are allowed two different languages.

Source of truth for the look: `components/artifactStyles/styleD/`
(`tokens.tsx` holds the palette, geometry, type and the shared pieces; the
bodies live in `cards.tsx`, `charts.tsx`, `lists.tsx`, `media.tsx`). The canvas
pack `components/frost` draws through those same bodies, so a rule changed in
the studio is a rule changed on the canvas.

Judge it in the Artifact Studio: `/dev/artifact-studio?view=one&style=style-d`
(port 3055), one of each kind, then the focus view at 100%. `scratch/d-audit.mjs`
captures every artifact for a before/after sweep.

## 1. Two fonts, never a third

| Slot | What it sets | Default |
|------|--------------|---------|
| **Primary** | Titles and headwords, the quote itself, a timeline's subject, the episode title | Inter Tight (reviewed with Denton) |
| **Secondary** | Every other word: body, labels, ticks, chips, table cells, code, *and every figure* | DM Sans |

- A **figure** (the stat's number, a gauge's value, a chart's headline, the
  pie's share, a todo's progress, chapter numbers) is the secondary font set
  large — `Figure` in `tokens.tsx`. The dot-matrix numerals are gone; there is
  no display face for numbers and no third font. Size does the talking.
- Weight is medium (500) everywhere. `**bold**` in an answer may go to 600;
  nothing else does.
- No grey type. Every word is the surface's strongest ink; hierarchy comes
  from size and position, never from fading.
- The font pair is swapped live from the studio toolbar and saved per browser;
  bodies write `PRIMARY` / `SECONDARY` and never a font of their own.

## 2. Surfaces: white, lit from the top-left

- Every artifact is the **white frost card**: a pale vertical gradient with a
  sheen pooled in the top-left corner, a bright 1px rim on its top edge, and a
  three-layer shadow falling down and away. The frost gradient is the only
  gradient in the family.
- **No coloured cards.** The stat, gauge, area chart and audio player used to
  be flat lime, ink and sage cards; they are white now. The one exception is
  the **sticky note**, which is flat lime because colour is a note's nature.
- Anything nested in a card sits **raised** above it (a whiter pill with its
  own small shadow), never sunk into it. Over pictures, controls are glass.
- Corner radius 44. Anything nested keeps its corners concentric with the
  card's: inset D ⇒ radius 44 − D (`NEST_INSET` 14 → 30; `MEDIA_INSET` 24 → 20).

## 3. Colour: one lime element per card

Lime (`--sd-lime`, swappable from the accent picker) is the only accent. It is
never a wash and never type on white. It is **one solid element** per card,
and that element is always the thing the title is about — what is *now*,
*next*, *biggest* or *done*:

| Kind | The lime element |
|------|------------------|
| Stat | the unit pill under the figure (and the "now" dot on the was→now track) |
| Gauge | the marker tick on the ruler, ringed in ink so it reads on white |
| Area chart | the area under the first series, under an ink line |
| Line chart | the dot at the peak / low |
| Bar chart | the peak column of dots |
| Pie | the second slice (ink → lime → sage → stone) |
| Table | the band behind the column headers |
| Todo | the done checks and the "now" dot on the track |
| Calendar | the month tag and the first highlighted day |
| Timeline | the latest moment's dot |
| Mechanism | the last step's disc — where the chain lands |
| Conversation card | the heading panel |
| Claim | the claim's own small card (the pushback stays white) |
| Definition | the "e.g." chip |
| Audio | the play disc |
| Sticky note | the whole note |
| Q&A card | nothing while done; the thinking dots while it thinks |

Marks that are not the one element are ink; series run ink → lime → sage →
sage-deep → stone → olive. Rose is reserved for failure states on the canvas.
Exaggerate the figure, not the colour: a card is allowed one huge number and
one lime thing, and the two are never the same thing.

## 4. Geometry and spacing

| Token | Value | Where |
|-------|-------|-------|
| `CARD_RADIUS` | 44 | every card |
| `PAD` | 40 | the inset of text from the card's edge on data and text cards |
| `NEST_INSET` / `NEST_RADIUS` | 14 / 30 | the conversation heading panel, the code pane, the episode thumb |
| `MEDIA_INSET` / `MEDIA_RADIUS` | 24 / 20 | media cards: kicker, title **and** picture well all start on this line |
| Corner ⋯ circle | 40, inset `CARD_RADIUS − 20` | its centre is the corner arc's centre; text that would run under it is padded away |

- Media cards have **one inset**. The title is not set deeper than the
  picture; the picture is not set deeper than the title. The ⋯ circle is the
  only control in the corner — the arrow button that used to sit beside the
  title is gone, so nothing overlaps it on hover.
- Stat: the title is centred and set at twice the size of a chart title
  (46 / 40 / 34 by length); the figure is the biggest thing on the card
  (120px for up to four characters, stepping down by length — `figureSize`);
  30px above the figure, 26px below it; the unit is a lime pill **under** the
  figure, never beside it. Everything on a stat stacks.
- Definition: headword, then "per {speaker}" on its own line, then the gloss,
  then the example pill. Nothing sits beside the headword.
- Claim: two columns the same height; side labels 20px medium.

## 5. Hug, never truncate

- **No text is ever clamped, cut or ellipsised.** Every Frost card hugs what
  it holds (`hug` in `styleD/index.tsx`): the card is exactly as tall as its
  content, or — for kinds whose picture has no height of its own (charts,
  media, live embeds, an episode with a thumbnail) — at least its canvas
  height and taller when the words need it.
- The studio stage grows the card; the frame takes `flex-1` so it fills the
  least height. A list is simply all of its rows; a timeline lays its labels
  out in flow (a grid: labels above, the track, labels below) so its height
  follows its longest label.
- The clamps still exist (`clampStyle`, `useClamps`, `useListBox`) but only
  act where a card has been given a fixed box — a corner-resized card in the
  focus view, or a node on the canvas. There they end on whole lines and whole
  rows, with a fade, never a cut through the middle of a line.
- Words wrap with `overflow-wrap: break-word`, never `anywhere`: a table's
  columns must keep their min-content width or "Series" becomes "Serie / s".
- Width is still the card's designed width. A table with many columns grows
  down, not sideways; growing in breadth is the one thing the stage cannot
  yet do.

## 6. Per-kind notes

- **Charts** keep their title top-left in the primary font with the title's
  own second idea under it; the headline figure sits top-right in the
  secondary font at 40px; axis labels 17px; legends 18px.
- **Bar** columns are still dots (the one dotted thing left in the family —
  see open questions).
- **Table** headers sit in one lime band with 14px corners; rows are 19px
  ink parted by hairlines; a "Total" row gets a stronger rule.
- **Timeline** labels are set 172% of a column wide and centred on their dot,
  alternating above and below so neighbours in a row are two columns apart.
- **Audio** bars have a fixed height (a hugging card has no height to give a
  percentage).
- **Q&A** stays flat — title, hairline, answer — so the answer is the only
  thing on it; the conversation card carries the lime panel instead.

## 7. Audit — 21 Oct 2026

What the sweep of every kind in Style D found, and what changed.

| Finding | Change |
|---------|--------|
| Stat: unit pill beside the number, number in dots, lime card | Vertical stack, figure in the secondary font at 120px, title 2×, white card with a lime pill |
| Gauge: lime card, dot numerals | White card, figure 112px, lime marker tick ringed in ink |
| Area chart: ink card, dot numerals | White card, lime area under an ink line |
| Audio: sage card | White card, lime play disc |
| Quote, claim, definition, conversation, sticky, table, todo, calendar, pie labels, bar labels, timeline labels, link labels: text or rows truncated | Every card hugs; nothing clamps |
| Definition: "per Garry Tan" beside the headword | Its own line beneath |
| Claim: side labels 17px regular-looking, staggered columns, text cut | 20px medium, equal columns, full text |
| Media and live cards (website, video, map, street view, 3D, embed): title inset 36, picture inset 14, arrow button overlapping the ⋯ circle | One 24px inset for both; arrow removed |
| Stat title off-centre | The `-webkit-box` clamp was fighting `text-align: center`; clamps only apply in fixed boxes now |
| Table: no header emphasis | Lime header band |
| Dot-matrix numerals (stat, gauge, area, bar and line headlines, pie, todo progress, chapter numbers) | Secondary font at size |

Open questions (not changed):

- Bar charts are still columns of dots. With the numerals gone they are the
  last dotted thing in the family; solid rounded columns (ink, peak lime) may
  read better beside the new type-set figures.
- The corner ⋯ clearance pads whole title blocks, so a short subtitle can wrap
  under it (audio "Slow Air · uilleann, sparse"). Padding only the first line
  would fix it.
- Cards grow only in height. A wide table on a narrow card still has narrow
  columns.
