import type { ArtifactKind, ArtifactPayload } from "@/lib/artifactTypes";
import {
  isVideoArtifactPayload,
  payloadToArtifactKind,
} from "@/lib/artifactTypes";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import { TRANSCRIPT_IMPORT_CANVASES } from "@/lib/buildTranscriptImportPlaygroundSnapshot";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import { DEFAULT_CANVAS_TUNING } from "@/lib/canvasTuning";
import { CONVERSATION_CARD_LAYOUT_H, isConversationCard } from "@/lib/conversationCard";
import { artifactCategoryOf } from "@/lib/design/theme/artifactCategories";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";
import { SAMPLE_CANVAS_REGISTRY } from "@/lib/sampleCanvases/registry";
import { getLatestVersion, type SessionArtifact } from "@/lib/sessionArtifacts";
import type { Card } from "@/lib/store";
import {
  MASTHEAD_ARTIFACT_KINDS,
  MASTHEAD_ARTIFACT_SCALE,
} from "@/lib/transcriptArtifacts";

/**
 * Artifact Studio pool — every real artifact the app ships as sample content
 * (code-defined sample canvases, transcript-import canvases, the catalog),
 * harvested into one flat list so the studio can lay out any mix of them.
 *
 * Only artifacts with substantial data survive {@link richnessOf}: the studio
 * is for judging design, and a three-row table or an empty sticky tells you
 * nothing about how a style holds up.
 *
 * The canvas's two card nodes — Q&A cards (a question and its answer) and
 * conversation cards (an imported transcript beat) — come along too. They are
 * not artifacts, so they carry a {@link CardStudioPayload} and the `Card`
 * itself instead of a session artifact; narrow on `item.card`.
 */

/** Kind plus the sub-shape that renders differently (chart type, video vs gallery). */
export type ArtifactVariant =
  | Exclude<ArtifactKind, "chart">
  | `chart:${"bar" | "area" | "line" | "pie" | "gauge"}`
  | "video"
  | StudioCardKind;

/** The canvas's card nodes, drawn in the studio beside the artifacts. */
export type StudioCardKind = "qa" | "conversation";

/** A card's text in the shape bodies read: the heading (question) over the body (answer). */
export interface CardStudioPayload {
  type: StudioCardKind;
  title: string;
  data: { heading: string; body: string };
}

/** What a card stands in for an artifact with — the title and ids the studio chrome reads. */
export interface StudioCardRecord {
  id: string;
  title: string;
  latestVersionId: string;
}

interface StudioItemBase {
  /** Stable across reloads — `<source slug>/<artifact id>`. */
  uid: string;
  variant: ArtifactVariant;
  category: ArtifactCategoryId;
  /** Designed (unzoomed) size the artifact was authored at on its canvas. */
  natural: { w: number; h: number };
  /** Human label of the canvas it came from. */
  source: string;
  /** Higher = more data. 0 means rejected as too thin to judge. */
  richness: number;
}

export type StudioArtifactItem = StudioItemBase & {
  card?: undefined;
  artifact: SessionArtifact;
  payload: ArtifactPayload;
  kind: ArtifactKind;
};

export type StudioCardItem = StudioItemBase & {
  card: Card;
  artifact: StudioCardRecord;
  payload: CardStudioPayload;
  kind: StudioCardKind;
};

export type StudioArtifact = StudioArtifactItem | StudioCardItem;

export type StudioPayload = StudioArtifact["payload"];

export const VARIANT_LABELS: Record<ArtifactVariant, string> = {
  qa: "Q&A card",
  conversation: "Conversation card",
  table: "Table",
  "chart:bar": "Bar chart",
  "chart:area": "Area chart",
  "chart:line": "Line chart",
  "chart:pie": "Pie chart",
  "chart:gauge": "Gauge",
  timeline: "Timeline",
  calendar: "Calendar",
  todo: "Todo list",
  map: "Map",
  streetview: "Street view",
  images: "Image gallery",
  video: "Video",
  audio: "Audio",
  "3d": "3D model",
  website: "Website",
  embed: "Embed",
  "google-doc": "Google doc",
  stickynote: "Sticky note",
  linkgroup: "Link group",
  code: "Code",
  repo: "Repository",
  custom: "Custom widget",
  quote: "Quote",
  stat: "Stat",
  definition: "Definition",
  claim: "Claim",
  mechanism: "Mechanism",
  episode: "Episode",
};

/** Display order for the "one of each" view — grouped by visual family. */
export const VARIANT_ORDER: ArtifactVariant[] = [
  "qa",
  "conversation",
  "table",
  "chart:bar",
  "chart:line",
  "chart:area",
  "chart:pie",
  "chart:gauge",
  "stat",
  "mechanism",
  "timeline",
  "calendar",
  "todo",
  "map",
  "streetview",
  "images",
  "video",
  "audio",
  "3d",
  "episode",
  "website",
  "embed",
  "linkgroup",
  "stickynote",
  "quote",
  "claim",
  "definition",
  "code",
  "custom",
];

function variantOf(payload: ArtifactPayload): ArtifactVariant {
  if (payload.type === "chart") return `chart:${payload.data.chartType}`;
  if (payload.type === "video" || isVideoArtifactPayload(payload)) return "video";
  return payloadToArtifactKind(payload) as ArtifactVariant;
}

const len = (s: string | undefined | null) => (s ?? "").trim().length;

/** How much real content an artifact carries; 0 rejects it from the studio. */
export function richnessOf(payload: ArtifactPayload): number {
  switch (payload.type) {
    case "table": {
      const { columns = [], rows = [] } = payload.data;
      if (columns.length < 3 || rows.length < 5) return 0;
      return columns.length * rows.length;
    }
    case "chart": {
      const d = payload.data;
      if (d.chartType === "gauge") return d.gaugeValue != null ? 12 : 0;
      if (d.chartType === "pie") {
        const n = d.slices?.length ?? d.categories?.length ?? 0;
        return n >= 4 ? n * 3 : 0;
      }
      const cats = d.categories?.length ?? 0;
      const series = d.series?.length ?? 0;
      if (cats < 5 || series < 1) return 0;
      return cats * series;
    }
    case "timeline":
      return payload.data.events.length >= 6 ? payload.data.events.length * 2 : 0;
    case "calendar":
      return payload.data.events.length >= 3 ? payload.data.events.length * 2 : 0;
    case "todo":
      return payload.data.items.length >= 5 ? payload.data.items.length * 2 : 0;
    case "quote":
      return len(payload.data.text) >= 70 && len(payload.data.speaker) > 0
        ? Math.round(len(payload.data.text) / 10)
        : 0;
    case "stat":
      return len(payload.data.value) > 0 && len(payload.data.label) >= 12
        ? 8 + (payload.data.delta ? 6 : 0) + (payload.data.source ? 3 : 0)
        : 0;
    case "definition":
      return len(payload.data.gloss) >= 50
        ? Math.round((len(payload.data.gloss) + len(payload.data.example)) / 12)
        : 0;
    case "claim":
      return len(payload.data.proposition?.text) >= 30 && len(payload.data.counter?.text) >= 30
        ? Math.round((len(payload.data.proposition.text) + len(payload.data.counter.text)) / 15)
        : 0;
    case "mechanism":
      return payload.data.steps.length >= 4 ? payload.data.steps.length * 4 : 0;
    case "episode":
      return payload.data.chapters.length >= 4 ? payload.data.chapters.length * 2 : 0;
    case "linkgroup": {
      const links = payload.data.sections.reduce((n, s) => n + s.links.length, 0);
      return links >= 4 ? links * 2 : 0;
    }
    case "images":
    case "video": {
      const items = payload.data.items.filter((i) => len(i.url) > 0);
      return items.length > 0 ? 6 + items.length * 3 : 0;
    }
    case "website":
      return len(payload.data.previewImageUrl) > 0 ? 10 + Math.min(10, len(payload.data.title) / 6) : 0;
    case "stickynote":
      return len(payload.data.text) >= 60 ? Math.round(len(payload.data.text) / 12) : 0;
    case "map":
      return payload.data.place?.lat != null || (payload.data.savedPlaces?.length ?? 0) > 0
        ? 8 + (payload.data.savedPlaces?.length ?? 0) * 2
        : 0;
    case "streetview":
      return 10;
    case "audio":
      return len(payload.data.publicUrl) > 0 && payload.data.peaks.length > 0 ? 12 : 0;
    case "3d":
      return len(payload.data.modelUrl) > 0 ? 10 : 0;
    case "embed":
      return payload.data.status === "ready" ? 10 : 0;
    case "code": {
      const chars = payload.data.files.reduce((n, f) => n + len(f.content), 0);
      return chars >= 300 ? Math.round(chars / 80) : 0;
    }
    case "custom": {
      const chars = len(payload.data.html) + len(payload.data.css);
      return chars >= 300 ? Math.round(chars / 120) : 0;
    }
    // Need live auth / network sessions to show anything — not judgeable offline.
    case "repo":
    case "google-doc":
      return 0;
    default:
      return 0;
  }
}

function designSizeOf(
  snapshot: CanvasSnapshot,
  artifact: SessionArtifact,
): { w: number; h: number } {
  const node = Object.values(snapshot.canvasArtifactNodes ?? {}).find(
    (n) => n.artifactId === artifact.id,
  );
  const bounds = getArtifactBounds(node ?? { size: undefined }, artifact);
  // Masthead kinds (and zoomed tiles) are authored blown up; the studio wants
  // the size their layout was designed at.
  const zoom =
    MASTHEAD_ARTIFACT_KINDS.has(artifact.kind) || node?.mastheadScale
      ? MASTHEAD_ARTIFACT_SCALE
      : node?.contentZoom && node.contentZoom !== 1
        ? node.contentZoom
        : 1;
  return { w: Math.round(bounds.w / zoom), h: Math.round(bounds.h / zoom) };
}

function toStudioArtifact(
  sourceSlug: string,
  source: string,
  artifact: SessionArtifact,
  natural: { w: number; h: number },
): StudioArtifact | null {
  const payload = getLatestVersion(artifact)?.payload;
  if (!payload) return null;
  const richness = richnessOf(payload);
  if (richness <= 0) return null;
  const variant = variantOf(payload);
  return {
    uid: `${sourceSlug}/${artifact.id}`,
    artifact,
    payload,
    kind: artifact.kind,
    variant,
    category: artifactCategoryOf(variant === "video" ? "video" : artifact.kind),
    natural,
    source,
    richness,
  };
}

/** Lines a run of prose wraps to at `charsPerLine`, paragraph by paragraph. */
function wrappedLines(text: string, charsPerLine: number): number {
  return text
    .split(/\n{2,}/)
    .reduce((n, para) => n + Math.max(1, Math.ceil(para.trim().length / charsPerLine)), 0);
}

/**
 * A Q&A card's height is measured on the canvas, so samples carry none. This
 * estimates it from the text at the card's width (the studio hugs the real
 * height wherever it can; tiles use this).
 */
function qaCardHeight(card: Card, w: number): number {
  const question = Math.min(4, Math.ceil(card.question.length / Math.round(w / 10.5)));
  const answer = wrappedLines(card.answer.replace(/\*\*/g, ""), Math.round(w / 7.4));
  return Math.round(64 + question * 26 + 1 + 40 + answer * 21 + (card.answer.includes("\n\n") ? 12 : 0));
}

/** A card's text is its content: a heading alone, or a short body, is not enough to judge. */
function cardRichness(kind: StudioCardKind, card: Card): number {
  const body = len(card.answer);
  if (len(card.question) === 0) return 0;
  if (kind === "conversation") return body >= 100 ? Math.round(body / 12) : 0;
  return body >= 150 ? Math.round(body / 12) : 0;
}

function toStudioCard(sourceSlug: string, source: string, card: Card): StudioArtifact | null {
  if (card.status !== "done") return null;
  const kind: StudioCardKind = isConversationCard(card) ? "conversation" : "qa";
  const richness = cardRichness(kind, card);
  if (richness <= 0) return null;
  const w = card.size?.w ?? DEFAULT_CANVAS_TUNING.cardWidth;
  const natural =
    kind === "conversation"
      ? { w, h: CONVERSATION_CARD_LAYOUT_H }
      : { w, h: card.size?.h ?? Math.max(getCardBounds(card).h, qaCardHeight(card, w)) };
  return {
    uid: `${sourceSlug}/${card.id}`,
    card,
    artifact: { id: card.id, title: card.question, latestVersionId: card.id },
    payload: { type: kind, title: card.question, data: { heading: card.question, body: card.answer } },
    kind,
    variant: kind,
    // Card.tsx tags every card with the discourse family.
    category: "discourse",
    natural,
    source,
    richness,
  };
}

function harvestSnapshot(
  slug: string,
  label: string,
  snapshot: CanvasSnapshot,
  into: StudioArtifact[],
) {
  for (const artifact of Object.values(snapshot.sessionArtifacts)) {
    const entry = toStudioArtifact(slug, label, artifact, designSizeOf(snapshot, artifact));
    if (entry) into.push(entry);
  }
  for (const card of Object.values(snapshot.cards ?? {})) {
    const entry = toStudioCard(slug, label, card);
    if (entry) into.push(entry);
  }
}

function catalogArtifact(id: string, payload: ArtifactPayload): SessionArtifact {
  const versionId = `studio_v_${id}`;
  return {
    id: `studio_${id}`,
    title: payload.title,
    kind: payloadToArtifactKind(payload),
    latestVersionId: versionId,
    versions: [
      {
        id: versionId,
        number: 1,
        payload,
        createdAt: 0,
        sourceCardId: "",
      },
    ],
  };
}

let cachedPool: StudioArtifact[] | null = null;

/** Every judgeable artifact, built once per page load (builders are pure). */
export function getStudioPool(): StudioArtifact[] {
  if (cachedPool) return cachedPool;
  const pool: StudioArtifact[] = [];

  for (const def of SAMPLE_CANVAS_REGISTRY) {
    harvestSnapshot(def.slug, def.title, def.buildSnapshot(), pool);
  }
  for (const def of TRANSCRIPT_IMPORT_CANVASES) {
    harvestSnapshot(def.id, def.title, def.buildSnapshot(), pool);
  }
  for (const entry of ARTIFACT_CATALOG_ENTRIES) {
    if (!entry.payload) continue;
    const artifact = catalogArtifact(entry.id, entry.payload);
    const latest = getLatestVersion(artifact)!;
    const natural = getArtifactBounds({ size: undefined }, artifact);
    const studio = toStudioArtifact("catalog", "Artifact catalog", artifact, natural);
    if (studio && latest) pool.push(studio);
  }

  // The same research artifact is sometimes placed twice (overview + era).
  const seen = new Set<string>();
  cachedPool = pool.filter((a) => {
    const key = `${a.variant}|${a.artifact.title}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return cachedPool;
}
