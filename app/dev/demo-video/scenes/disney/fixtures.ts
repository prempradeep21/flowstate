import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { CanvasAsset, CanvasTextLabel, Thread } from "@/lib/store";
import {
  createSessionArtifactFromPayload,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";

/**
 * Fixtures for the "deep-research Walt Disney" demo scene (~36.5s).
 * Every artifact payload is lifted verbatim from the user's real
 * "Walt Disney" canvas (Supabase 0b158040-710a-4a76-bd5a-934f367a7e7e):
 * the Steamboat Willie / EPCOT film videos, the Disneyland Wikipedia card,
 * the top-grossing-films bar chart (whose question/answer pair is the
 * canvas's own), the 10-milestones timeline, the Walt Disney World map and
 * the era text labels. Media is localized to /demo-assets. Rendered in the
 * Liquid Glass style pack over the ambient-gradient background.
 */

/* ------------------------------- threads ------------------------------- */

export const THREAD_CHART = "disney_thread_chart";
export const THREAD_TL = "disney_thread_tl";
export const THREAD_MAP = "disney_thread_map";

export const DISNEY_THREADS: Record<string, Thread> = {
  [THREAD_CHART]: { id: THREAD_CHART, accentColour: "#6B4EFF" },
  // Real thread accent from the source canvas.
  [THREAD_TL]: { id: THREAD_TL, accentColour: "#6FCF97" },
  [THREAD_MAP]: { id: THREAD_MAP, accentColour: "#F2C94C" },
};

/* ------------------------------ cursor cast ---------------------------- */

export const CURSOR_MAYA = { name: "Maya", color: "#64B5F6" };
export const CURSOR_DEV = { name: "Dev", color: "#F06292" };

/* ------------------------------- cards --------------------------------- */

export const CARD_CHART_Q = "disney_q_chart";
export const CARD_TL_Q = "disney_q_tl";
export const CARD_MAP_Q = "disney_q_map";

/** Verbatim question from the source canvas (its real chart Q&A). */
export const Q_CHART =
  "Give me the top ten grossing films of Walt Disney during his lifetime and their respective box office collections in a graph.";
export const Q_TL =
  "Lay out Walt's biggest milestones, from Mickey Mouse to EPCOT, on a timeline";
export const Q_MAP = "Where is Walt's Florida project located?";

/** First sentence of the canvas's real answer. */
export const A_CHART =
  "Here is a bar chart showing the top ten grossing films of Walt Disney during his lifetime, along with their box office collections.";
export const A_TL =
  "Ten milestones from Oswald in 1927 to EPCOT in 1966 — Steamboat Willie, Snow White, Disneyland and the Florida land purchase highlighted.";
export const A_MAP =
  "It's in Orlando, Florida — Walt quietly assembled 27,000 acres southwest of the city for the Florida Project, now Walt Disney World® Resort.";

/* ------------------------------- world layout -------------------------- */
/* Four era clusters left → right in beat order:
 * Mickey 1928 · the films (doc + chart + timeline) · Disneyland 1955 ·
 * EPCOT/Florida 1966. Camera pans across, then zooms out to the wall. */

export const POS = {
  srcSteam: { x: 40, y: 0 },

  srcDoc: { x: 1290, y: -30 },
  qChart: { x: 1250, y: 480 },
  artChart: { x: 1790, y: 460 },
  qTl: { x: 1250, y: 1120 },
  artTl: { x: 1790, y: 1100 },
  /** Where the timeline first lands, before Maya tidies it into place. */
  artTlDrop: { x: 1930, y: 1215 },

  srcWiki: { x: 2700, y: 0 },

  srcEpcot: { x: 3860, y: -20 },
  qMap: { x: 3820, y: 480 },
  artMap: { x: 4360, y: 460 },
} as const;

/** Pinned node sizes (product defaults). The timeline keeps its real
 *  1920×480 default — at zoom 1 that window shows ~1937–1956, covering the
 *  Snow White and Disneyland highlights. */
export const SIZES = {
  video: { w: 520, h: 400 },
  wiki: { w: 520, h: 400 },
  doc: { w: 480, h: 360 },
  chart: { w: 520, h: 392 },
  tl: { w: 1920, h: 480 },
  map: { w: 520, h: 380 },
} as const;

/* ----------------------------- text labels ----------------------------- */
/* Era labels — text verbatim from the source canvas's canvasTextLabels.  */

export interface DemoLabel extends CanvasTextLabel {
  /** Timeline key: which arrange step reveals it (0 = visible from open). */
  revealStep: number;
}

export const DISNEY_LABELS: DemoLabel[] = [
  // Cold open — visible from the start, establishes the label vocabulary.
  { id: "disney_lbl_mickey", text: "Mickey Mouse", fontSize: 40, position: { x: 44, y: -118 }, revealStep: 0 },
  { id: "disney_lbl_1928", text: "1928", fontSize: 26, position: { x: 48, y: -62 }, revealStep: 0 },
  // Arrange beat reveals the rest, cluster by cluster.
  { id: "disney_lbl_films", text: "Disneys top films when Walt was alive", fontSize: 32, position: { x: 1254, y: -142 }, revealStep: 1 },
  { id: "disney_lbl_3767", text: "1937-1967", fontSize: 24, position: { x: 1258, y: -94 }, revealStep: 1 },
  { id: "disney_lbl_dl", text: "Disneyland", fontSize: 40, position: { x: 2708, y: -118 }, revealStep: 2 },
  { id: "disney_lbl_1955", text: "1955", fontSize: 26, position: { x: 2712, y: -62 }, revealStep: 2 },
  { id: "disney_lbl_epcot", text: "EPCOT", fontSize: 40, position: { x: 3868, y: -140 }, revealStep: 3 },
  { id: "disney_lbl_1966", text: "1966", fontSize: 26, position: { x: 3872, y: -84 }, revealStep: 3 },
];

/* ------------------------------- assets -------------------------------- */

export const ASSET_DOC = "disney_asset_doc";
export const NODE_DOC = "disney_node_doc";

export const DISNEY_CANVAS_ASSETS: Record<string, CanvasAsset> = {
  [ASSET_DOC]: {
    id: ASSET_DOC,
    canvasId: "disney",
    ownerId: "disney",
    name: "acquired-the-walt-disney-company.md",
    mimeType: "text/markdown",
    sizeBytes: 4096,
    storagePath: "/demo-assets/acquired-walt-disney.md",
    publicUrl: "/demo-assets/acquired-walt-disney.md",
    kind: "document",
    createdAt: 1700000000000,
  },
};

/* ------------------------------ artifacts ------------------------------ */

export const ART_STEAM = "disney_art_steam";
export const ART_WIKI = "disney_art_wiki";
export const ART_EPCOT = "disney_art_epcot";
export const ART_CHART = "disney_art_chart";
export const ART_TL = "disney_art_tl";
export const ART_MAP = "disney_art_map";

export const ANODE_STEAM = "disney_anode_steam";
export const ANODE_WIKI = "disney_anode_wiki";
export const ANODE_EPCOT = "disney_anode_epcot";
export const ANODE_CHART = "disney_anode_chart";
export const ANODE_TL = "disney_anode_tl";
export const ANODE_MAP = "disney_anode_map";

/** Verbatim from the canvas ("Steamboat Willie (1928 Film) - 4K Film
 *  Remaster", youtu.be/I5pG1wbRKOg); thumb localized. */
const STEAM_TITLE = "Steamboat Willie (1928 Film) - 4K Film Remaster";
const steamPayload = {
  type: "images",
  title: STEAM_TITLE,
  data: {
    items: [
      {
        kind: "youtube",
        url: "https://youtu.be/I5pG1wbRKOg",
        thumb: "/demo-assets/disney-steamboat-willie.jpg",
        title: STEAM_TITLE,
      },
    ],
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas (youtu.be/z3pTvwPzlTg); thumb localized. */
const EPCOT_TITLE = "Walt Disney's E.P.C.O.T film (1966) - Remastered 2021";
const epcotPayload = {
  type: "images",
  title: EPCOT_TITLE,
  data: {
    items: [
      {
        kind: "youtube",
        url: "https://youtu.be/z3pTvwPzlTg",
        thumb: "/demo-assets/disney-epcot-film.jpg",
        title: EPCOT_TITLE,
      },
    ],
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas; images localized, embeddable forced off so the
 *  card renders the deterministic static preview instead of a live iframe. */
const wikiPayload = {
  type: "website",
  title: "Disneyland - Wikipedia",
  data: {
    url: "https://en.wikipedia.org/wiki/Disneyland",
    title: "Disneyland - Wikipedia",
    domainLabel: "Wikipedia",
    faviconUrl: "/demo-assets/wikipedia-favicon.png",
    previewImageUrl: "/demo-assets/disney-castle-preview.png",
    embeddable: false,
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas ("Top Grossing Disney Films during Walt's
 *  Lifetime") — the canvas's own Q&A produced this chart. */
const chartPayload = {
  type: "chart",
  title: "Top Grossing Disney Films during Walt's Lifetime",
  description: "Box office collections in USD",
  data: {
    chartType: "bar",
    unit: "USD",
    smooth: true,
    stacked: false,
    categories: [
      "Fantasia",
      "Cinderella",
      "Sleeping Beauty",
      "Snow White",
      "Song of the South",
      "Pinocchio",
      "Peter Pan",
      "Lady and the Tramp",
      "Bambi",
      "The Jungle Book",
    ],
    series: [
      {
        name: "Box Office Collection (USD)",
        data: [
          83000000, 85000000, 51000000, 418000000, 65000000, 164000000,
          87000000, 187000000, 267000000, 378000000,
        ],
      },
    ],
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas ("Walt Disney: 10 Most Iconic Projects &
 *  Milestones"). */
const timelinePayload = {
  type: "timeline",
  title: "Walt Disney: 10 Most Iconic Projects & Milestones",
  description: "From Oswald the Lucky Rabbit to the Florida City dream",
  data: {
    scale: "year",
    rangeStart: "1926-01-01T00:00:00.000Z",
    rangeEnd: "1967-12-31T23:59:59.999Z",
    events: [
      { id: "1", at: "1927-01-01T00:00:00.000Z", side: "above", label: "Oswald the Lucky Rabbit — Disney's first hit character" },
      { id: "2", at: "1928-11-18T00:00:00.000Z", side: "below", label: "Mickey Mouse debuts in Steamboat Willie", highlight: true },
      { id: "3", at: "1937-12-21T00:00:00.000Z", side: "above", label: "Snow White — world's first feature-length animated film", highlight: true },
      { id: "4", at: "1940-01-01T00:00:00.000Z", side: "below", label: "Fantasia & Pinocchio — artistic animation pinnacle" },
      { id: "5", at: "1950-02-15T00:00:00.000Z", side: "above", label: "Cinderella revives the studio after WWII struggles" },
      { id: "6", at: "1953-02-05T00:00:00.000Z", side: "below", label: "Peter Pan & Sleeping Beauty — golden age classics" },
      { id: "7", at: "1955-07-17T00:00:00.000Z", side: "above", label: "Disneyland opens in Anaheim, California", highlight: true },
      { id: "8", at: "1964-08-27T00:00:00.000Z", side: "below", label: "Mary Poppins — live-action & animation masterpiece" },
      { id: "9", at: "1965-10-01T00:00:00.000Z", side: "above", label: "Walt Disney World land secretly purchased in Florida", highlight: true },
      { id: "10", at: "1966-10-27T00:00:00.000Z", side: "below", label: "EPCOT — Walt's visionary city of tomorrow concept", highlight: true },
    ],
  },
} satisfies ArtifactPayload;

/** Verbatim from the canvas ("Walt Disney World® Resort"), one saved place.
 *  Variant 0 has no pin yet; the pin drops on its own beat. */
function mapPayload(pinCount: number): ArtifactPayload {
  return {
    type: "map",
    title: "Walt Disney World® Resort",
    description: "Orlando, Florida, USA",
    data: {
      zoom: 10,
      place: {
        lat: 28.3557259,
        lng: -81.5348416,
        // The canvas's geocoded label was the nearest hotel — trimmed to the
        // resort itself so the on-map chip reads cleanly.
        name: "Walt Disney World Resort, Orlando, Florida, USA",
        label: "Walt Disney World® Resort, Orlando, Florida",
      },
      savedPlaces: [
        {
          id: "pin_mrkj8ruy_zyb3w",
          lat: 28.3557259,
          lng: -81.5348416,
          type: "landmark",
          label: "Walt Disney World® Resort",
        },
      ].slice(0, pinCount),
    },
  } satisfies ArtifactPayload;
}

/** Frozen payload variants — the reference changes only at the pin beat. */
export const MAP_PAYLOADS: ArtifactPayload[] = [0, 1].map(mapPayload);

/** Deterministic SessionArtifact (stable ids for capture). */
function stableArtifact(
  id: string,
  payload: ArtifactPayload,
  sourceCardId: string,
): SessionArtifact {
  const art = createSessionArtifactFromPayload(payload, sourceCardId);
  const versionId = `${id}_v1`;
  return {
    ...art,
    id,
    versions: art.versions.map((v) => ({ ...v, id: versionId })),
    latestVersionId: versionId,
  };
}

export function buildSessionArtifacts(
  mapPinCount: number,
  /** Artifacts still in their generating window: versions stay empty so the
   *  in-card pill reads "Version 1 · Generating…". */
  generatingIds?: ReadonlySet<string>,
): Record<string, SessionArtifact> {
  const artifacts = [
    stableArtifact(ART_STEAM, steamPayload, ""),
    stableArtifact(ART_WIKI, wikiPayload, ""),
    stableArtifact(ART_EPCOT, epcotPayload, ""),
    stableArtifact(ART_CHART, chartPayload, CARD_CHART_Q),
    stableArtifact(ART_TL, timelinePayload, CARD_TL_Q),
    stableArtifact(ART_MAP, MAP_PAYLOADS[mapPinCount], CARD_MAP_Q),
  ];
  return Object.fromEntries(
    artifacts.map((a) => [
      a.id,
      generatingIds?.has(a.id) ? { ...a, versions: [] } : a,
    ]),
  );
}

export const ARTIFACT_VERSION_ID = (artifactId: string) => `${artifactId}_v1`;

/** Payload each emerging artifact streams onto its card while generating. */
export const GENERATING_PAYLOADS: Record<string, ArtifactPayload> = {
  [ART_CHART]: chartPayload,
  [ART_TL]: timelinePayload,
  [ART_MAP]: MAP_PAYLOADS[0],
};

/* ------------------------------ brand copy ------------------------------ */

export const TITLE_LEAD = "deep-dive anything on ";

export interface Chip {
  text: string;
  t0: number;
  t1: number;
}

export const CHIPS: Chip[] = [
  { text: "drop videos", t0: 1500, t1: 2200 },
  { text: "drop documents", t0: 2600, t1: 3300 },
  { text: "drop websites", t0: 3600, t1: 4300 },
  { text: "drop anything", t0: 4500, t1: 5300 },
  { text: "Ask questions", t0: 6000, t1: 9200 },
  { text: "Get real artifacts", t0: 10150, t1: 11900 },
  { text: "Arrange your research", t0: 23000, t1: 25800 },
  { text: "Share it with anyone to view", t0: 27200, t1: 31600 },
];
