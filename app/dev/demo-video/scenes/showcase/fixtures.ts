import { getStudioPool, type StudioArtifact, type StudioCardItem } from "@/lib/artifactStudio/pool";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { FontPair } from "@/components/artifactStyles/fonts";

/**
 * Showcase scene — a 16:9 wall of real Artifact Studio artifacts in Style D
 * (Frost), one of (nearly) every kind, set in Denton + Figtree. The cast is
 * pulled from the studio pool, stacked into bento columns whose heights are
 * measured in the browser (every Frost card hugs its content), and some of
 * the cards start as the Frost generating skeleton and fill in as the camera
 * reaches them.
 */

export const SHOWCASE_SCENE_ID = "showcase-d" as const;

/** Frame size the scene is composed for (16:9). */
export const FRAME = { w: 1920, h: 1080 } as const;

export const FONTS: FontPair = { primary: "denton", secondary: "figtree" };
export const FAMILY_ID = "style-d" as const;
/** Solid colour standing in for the Frost backdrop in overlays. */
export const FIELD_COLOR = "#E6E6E4";

/** Bento columns (world px) and the gutter between every card. */
export const COL_W = [300, 520, 520, 640, 520, 300, 520] as const;
export const GAP = 28;

/** The Q&A turn lives at the foot of this column. */
export const QA_COL = 6;
export const QA_W = COL_W[QA_COL];
export const COMPOSER_H = 64;
export const POP_GAP = 28;

/** How a card's content arrives once its skeleton gives way. */
export type FillMode =
  | "rows" // table rows, one by one
  | "series" // chart values grow from the baseline
  | "slices" // pie slices, one by one
  | "items" // todo items
  | "events" // timeline events
  | "calendar" // calendar events + highlighted days
  | "steps" // mechanism steps (edges follow)
  | "code" // code lines
  | "text" // quote / definition / conversation prose, streamed
  | "gauge"; // the gauge value sweeps up

export interface CastEntry {
  /** `slug/id`, or `slug|title` for transcript-import artifacts (ids are minted per build). */
  key: string;
  /** Disambiguates `slug|title` keys that several kinds share. */
  variant?: string;
  col: number;
  /** Columns spanned. A spanning card is a foot card. */
  span?: number;
  /** Foot cards form the wall's last row: they all start on one line, under every column. */
  foot?: boolean;
  fill?: FillMode;
}

export const CAST: CastEntry[] = [
  // Column 1 — the narrow margin: notes, a clip, a definition.
  { key: "huberman-neuroplasticity|Core rule", variant: "stickynote", col: 0 },
  { key: "guinness-campaign/guinness-art-terr-c-track", col: 0 },
  { key: "huberman-neuroplasticity|Neuroplasticity", variant: "definition", col: 0, fill: "text" },
  { key: "phil-knight/pknight-art-sticky-crazy-ask", col: 0 },
  { key: "lightcone-emergent|The number to hold onto", variant: "stickynote", col: 0 },
  // Column 2 — the numbers.
  { key: "lightcone-emergent|What the software used to cost", variant: "stat", col: 1 },
  { key: "airbnb/abnb-art-chart-revenue", col: 1, fill: "series" },
  { key: "guinness-campaign/guinness-art-flight-plan", col: 1, fill: "calendar" },
  // Column 3 — the shapes.
  { key: "guinness-campaign/guinness-art-channel-split", col: 2, fill: "slices" },
  { key: "airbnb/abnb-art-chart-nights", col: 2, fill: "series" },
  { key: "yc-interview|Great things start small", variant: "quote", col: 2, fill: "text" },
  { key: "emergent/emg-art-gauge-deploy", col: 2, fill: "gauge" },
  // Column 4 — the wide ledger.
  { key: "airbnb/abnb-art-table-funding-ladder", col: 3, fill: "rows" },
  { key: "rana-daggubati-infocus|Will AI take over creativity?", variant: "claim", col: 3 },
  { key: "henry-ford/hford-art-gallery-model-t", col: 3 },
  // Column 5 — a website, a set prop's code, a list.
  { key: "jagadamba-theatre|Enter the Dragon", variant: "website", col: 4 },
  { key: "the-long-noon/longnoon-art-colony-ui", col: 4, fill: "code" },
  { key: "huberman-neuroplasticity|Protocol for opening a plasticity window", variant: "todo", col: 4, fill: "items" },
  // Column 6 — another narrow margin.
  { key: "the-long-noon/longnoon-art-faction-ferry", col: 5 },
  { key: "design-tools|Photoshop — first mass pro tool", variant: "conversation", col: 5, fill: "text" },
  { key: "meenakshi-anantram-rooted|Everything happens at thirteen", variant: "stickynote", col: 5 },
  { key: "the-vienna-exchange/vienna-art-logline", col: 5 },
  { key: "guinness-campaign/guinness-art-insight-summer", col: 5 },
  // Column 7 — the episode, then the Q&A turn (laid out separately).
  { key: "design-tools|The recording", variant: "episode", col: 6 },
  // The foot row: a timeline, a mechanism, one more figure.
  { key: "emergent/emg-art-timeline-emergent", col: 0, span: 3, fill: "events" },
  { key: "allari-naresh-raw-talks|How a laugh gets into a scene", variant: "mechanism", col: 3, span: 3, fill: "steps" },
  { key: "lightcone-emergent|Apps built since launch", variant: "stat", col: 6, foot: true },
];

export const QA_KEY = "airbnb/abnb-card-root";
export const QUESTION = "Where does Airbnb's revenue actually come from?";
export const ANSWER =
  "Mostly North America and EMEA — **$5.2B** and **$4.7B** of the $12.2B in FY2025 — with Latin America and Asia Pacific under $1.2B each. Here's the split.";
export const POP_KEY = "airbnb/abnb-art-chart-revenue-region";

export interface WorldRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface CastTile extends CastEntry {
  item: StudioArtifact;
  w: number;
}

export interface SceneTile extends CastTile, WorldRect {}

export interface ShowcaseLayout {
  tiles: SceneTile[];
  /** The composer's slot — the Q&A card grows down from its top edge. */
  composer: WorldRect;
  /** Wall bounds (world), the Q&A column's foot included. */
  bounds: WorldRect;
  qa: StudioCardItem;
  pop: StudioArtifact;
  popSize: { w: number; h: number };
}

const poolByUid = (() => {
  let cache: Map<string, StudioArtifact> | null = null;
  return () => {
    if (!cache) cache = new Map(getStudioPool().map((a) => [a.uid, a]));
    return cache;
  };
})();

function pick(key: string, variant?: string): StudioArtifact {
  const byUid = poolByUid().get(key);
  if (byUid) return byUid;
  const bar = key.indexOf("|");
  if (bar > 0) {
    const slug = key.slice(0, bar);
    const title = key.slice(bar + 1);
    const hit = getStudioPool().find(
      (a) => a.uid.startsWith(`${slug}/`) && a.artifact.title === title && (!variant || a.variant === variant),
    );
    if (hit) return hit;
  }
  throw new Error(`showcase scene: "${key}" is not in the studio pool`);
}

export const colX = (col: number) => COL_W.slice(0, col).reduce<number>((x, w) => x + w + GAP, 0);
export const spanW = (col: number, span: number) => COL_W.slice(col, col + span).reduce<number>((w, c) => w + c, 0) + GAP * (span - 1);

let castCache: CastTile[] | null = null;

/** The cast with its artifacts and widths — no heights yet (those are measured). */
export function getShowcaseCast(): CastTile[] {
  if (castCache) return castCache;
  castCache = CAST.map((entry) => ({
    ...entry,
    item: pick(entry.key, entry.variant),
    w: spanW(entry.col, entry.span ?? 1),
  }));
  return castCache;
}

export function getQaBase(): StudioCardItem {
  const base = pick(QA_KEY);
  if (!base.card) throw new Error(`showcase scene: "${QA_KEY}" is not a Q&A card`);
  return {
    ...base,
    artifact: { ...base.artifact, title: QUESTION },
    payload: { type: "qa", title: QUESTION, data: { heading: QUESTION, body: ANSWER } },
    card: { ...base.card, question: QUESTION, answer: ANSWER },
    natural: { w: QA_W, h: base.natural.h },
  };
}

/**
 * Stack the measured cast into columns: column cards stack in cast order; the
 * foot cards (every spanning card, and any marked `foot`) then form one last
 * row that starts under the tallest column. The Q&A composer sits at the foot
 * of its own column, with the wall below it left clear for the card to grow
 * and its answer to pop out.
 */
export function layoutShowcase(heights: Record<string, number>, qaDoneH: number, popH: number): ShowcaseLayout {
  const cast = getShowcaseCast();
  const bottoms = COL_W.map(() => 0);
  const tiles: SceneTile[] = [];
  const heightOf = (key: string) => {
    const h = heights[key];
    if (!h) throw new Error(`showcase scene: no measured height for "${key}"`);
    return h;
  };
  const isFoot = (tile: CastTile) => !!tile.foot || (tile.span ?? 1) > 1;
  for (const tile of cast) {
    if (isFoot(tile)) continue;
    const h = heightOf(tile.key);
    const y = bottoms[tile.col]!;
    tiles.push({ ...tile, x: colX(tile.col), y, h });
    bottoms[tile.col] = y + h + GAP;
  }
  // The Q&A column keeps its foot clear for the turn.
  const composer = { x: colX(QA_COL), y: bottoms[QA_COL]!, w: QA_W, h: COMPOSER_H };
  const rowY = Math.max(...bottoms.filter((_, c) => c !== QA_COL), composer.y + qaDoneH + POP_GAP + popH + GAP);
  for (const tile of cast) {
    if (!isFoot(tile)) continue;
    const h = heightOf(tile.key);
    tiles.push({ ...tile, x: colX(tile.col), y: rowY, h });
    for (let c = tile.col; c < tile.col + (tile.span ?? 1); c++) bottoms[c] = rowY + h + GAP;
  }
  const wallBottom = Math.max(...bottoms) - GAP;
  const qaBottom = composer.y + qaDoneH + POP_GAP + popH;
  const bounds = { x: 0, y: 0, w: colX(COL_W.length) - GAP, h: Math.max(wallBottom, qaBottom) };
  const pop = pick(POP_KEY);
  return { tiles, composer, bounds, qa: getQaBase(), pop, popSize: { w: QA_W, h: popH } };
}

export function popHeightFor(): number {
  const pop = pick(POP_KEY);
  return Math.round((QA_W * pop.natural.h) / pop.natural.w);
}

/** Cut streamed prose on a word, closing any `**bold**` run it opened. */
function cutText(text: string, p: number): string {
  if (p >= 1) return text;
  let cut = text.slice(0, Math.round(text.length * p));
  const space = cut.lastIndexOf(" ");
  if (space > 12) cut = cut.slice(0, space);
  cut = cut.replace(/[\s,;:—-]+$/, "").replace(/\*{1,2}$/, "");
  return (cut.match(/\*\*/g)?.length ?? 0) % 2 ? `${cut}**` : cut;
}

const countOf = (n: number, p: number) => Math.min(n, Math.max(1, Math.ceil(n * p)));

/**
 * The payload as it stands part-way through arriving (`p` in 0..1). Titles are
 * known from the first frame — only the body of the artifact fills in.
 */
export function filledPayload(payload: ArtifactPayload, mode: FillMode, p: number): ArtifactPayload {
  if (p >= 1) return payload;
  switch (mode) {
    case "rows":
      if (payload.type === "table") {
        return { ...payload, data: { ...payload.data, rows: payload.data.rows.slice(0, countOf(payload.data.rows.length, p)) } };
      }
      break;
    case "series":
      if (payload.type === "chart" && payload.data.series) {
        return { ...payload, data: { ...payload.data, series: payload.data.series.map((s) => ({ ...s, data: s.data.map((v) => v * p) })) } };
      }
      break;
    case "slices":
      if (payload.type === "chart" && payload.data.slices) {
        // Never a lone 100% slice: the pie opens with two.
        const n = Math.min(payload.data.slices.length, Math.max(2, countOf(payload.data.slices.length, p)));
        return { ...payload, data: { ...payload.data, slices: payload.data.slices.slice(0, n) } };
      }
      break;
    case "gauge":
      if (payload.type === "chart" && typeof payload.data.gaugeValue === "number") {
        return { ...payload, data: { ...payload.data, gaugeValue: Math.round(payload.data.gaugeValue * p * 10) / 10 } };
      }
      break;
    case "items":
      if (payload.type === "todo") {
        return { ...payload, data: { ...payload.data, items: payload.data.items.slice(0, countOf(payload.data.items.length, p)) } };
      }
      break;
    case "events":
      if (payload.type === "timeline") {
        return { ...payload, data: { ...payload.data, events: payload.data.events.slice(0, countOf(payload.data.events.length, p)) } };
      }
      break;
    case "calendar":
      if (payload.type === "calendar") {
        const { events, highlightedDates } = payload.data;
        return {
          ...payload,
          data: {
            ...payload.data,
            events: events.slice(0, countOf(events.length, p)),
            highlightedDates: highlightedDates.slice(0, countOf(highlightedDates.length, p)),
          },
        };
      }
      break;
    case "steps":
      if (payload.type === "mechanism") {
        const steps = payload.data.steps.slice(0, countOf(payload.data.steps.length, p));
        const ids = new Set(steps.map((s) => s.id));
        return { ...payload, data: { steps, edges: payload.data.edges.filter((e) => ids.has(e.from) && ids.has(e.to)) } };
      }
      break;
    case "code":
      if (payload.type === "code") {
        const files = payload.data.files.map((f, i) => {
          if (i > 0) return f;
          const lines = f.content.split("\n");
          return { ...f, content: lines.slice(0, countOf(lines.length, p)).join("\n") };
        });
        return { ...payload, data: { ...payload.data, files } };
      }
      break;
    case "text":
      if (payload.type === "quote") return { ...payload, data: { ...payload.data, text: cutText(payload.data.text, p) } };
      if (payload.type === "definition") return { ...payload, data: { ...payload.data, gloss: cutText(payload.data.gloss, p), example: p < 0.85 ? undefined : payload.data.example } };
      break;
  }
  return payload;
}

/** The pool item with its body part-way through arriving. */
export function filledItem(item: StudioArtifact, mode: FillMode, p: number): StudioArtifact {
  if (p >= 1) return item;
  if (item.card && item.payload.type === "conversation") {
    const body = cutText(item.payload.data.body, p);
    return { ...item, payload: { ...item.payload, data: { ...item.payload.data, body } }, card: { ...item.card, answer: body } };
  }
  if (item.card) return item;
  return { ...item, payload: filledPayload(item.payload, mode, p) };
}
