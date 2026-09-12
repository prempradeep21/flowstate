import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { CanvasAsset, Thread } from "@/lib/store";
import {
  createSessionArtifactFromPayload,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";

/**
 * Fixtures for the "assets → ask → artifact" demo scene (~36s, London trip).
 * Artifact payloads are real content recovered from the user's own canvases
 * (museums/restaurants tables, London map, NHM street view, British Museum
 * Wikipedia card); the rest is authored in the product's payload shapes.
 */

/* ------------------------------- threads ------------------------------- */

export const THREAD_VIDEO = "demo2_thread_video";
export const THREAD_WIKI = "demo2_thread_wiki";
/** Same accent as WIKI — separate id so the street card's generating pill
 *  isn't version-numbered against the museums table (edit inference walks
 *  the thread for prior artifacts). */
export const THREAD_STREET = "demo2_thread_street";
export const THREAD_BUDGET = "demo2_thread_budget";
export const THREAD_FLIGHT = "demo2_thread_flight";

export const ASSETS_THREADS: Record<string, Thread> = {
  [THREAD_VIDEO]: { id: THREAD_VIDEO, accentColour: "#6B4EFF" },
  [THREAD_WIKI]: { id: THREAD_WIKI, accentColour: "#FF8FA3" },
  [THREAD_STREET]: { id: THREAD_STREET, accentColour: "#FF8FA3" },
  [THREAD_BUDGET]: { id: THREAD_BUDGET, accentColour: "#6FCF97" },
  [THREAD_FLIGHT]: { id: THREAD_FLIGHT, accentColour: "#F2C94C" },
};

/* ------------------------------ cursor cast ---------------------------- */

export const CURSOR_MAYA = { name: "Maya", color: "#64B5F6" };
export const CURSOR_DEV = { name: "Dev", color: "#F06292" };

/* ------------------------------- cards --------------------------------- */

export const CARD_MAP_Q = "demo2_q_map";
export const CARD_TABLE_Q = "demo2_q_table";
export const CARD_STREET_Q = "demo2_q_street";
export const CARD_PIE_Q = "demo2_q_pie";
export const CARD_CAL_Q = "demo2_q_cal";

export const Q_MAP = "Pin every spot this video mentions";
export const Q_TABLE = "Which museums deserve a full morning?";
export const Q_STREET = "Show me the entrance";
export const Q_PIE = "Split our £2,400 budget";
export const Q_CAL = "Lay the four days out around the flights";

export const A_MAP =
  "Pinned all five: Tower Bridge, Borough Market, Camden Market, Notting Hill and Greenwich — grouped so you can route between them.";
export const A_TABLE =
  "The British Museum and the Natural History Museum are the two that reward a full morning — both are free, so book timed entry and go at opening.";
export const A_STREET = "Here's the Cromwell Road entrance.";
export const A_PIE =
  "Stay takes the biggest share at £760, food next at £520 — museums stay cheap because most of your list is free entry.";
export const A_CAL =
  "You land Thursday 13:25 — museums Friday, market day Saturday, Greenwich Sunday, and a slow Monday before the 13:05 return.";

/* ------------------------------- world layout -------------------------- */
/* Single row of four clusters, camera pans left → right in beat order.
 * Cluster = source node (top) + question card (below) + artifact (right). */

export const POS = {
  srcVideo: { x: 40, y: 0 },
  qMap: { x: 0, y: 560 },
  artMap: { x: 500, y: 540 },

  srcWiki: { x: 1290, y: -20 },
  qTable: { x: 1250, y: 540 },
  artTable: { x: 1750, y: 500 },
  qStreet: { x: 1250, y: 1150 },
  artStreet: { x: 1750, y: 1130 },

  srcBudget: { x: 2620, y: 0 },
  qPie: { x: 2560, y: 540 },
  artPie: { x: 3060, y: 520 },

  srcFlight: { x: 3740, y: -10 },
  qCal: { x: 3680, y: 540 },
  artCal: { x: 4180, y: 500 },
} as const;

/* ------------------------------- assets -------------------------------- */

export const ASSET_BUDGET = "demo2_asset_budget";
export const ASSET_FLIGHT = "demo2_asset_flight";
export const NODE_BUDGET = "demo2_node_budget";
export const NODE_FLIGHT = "demo2_node_flight";

function demoAsset(
  id: string,
  name: string,
  mimeType: string,
  publicUrl: string,
): CanvasAsset {
  return {
    id,
    canvasId: "demo2",
    ownerId: "demo2",
    name,
    mimeType,
    sizeBytes: 4096,
    storagePath: publicUrl,
    publicUrl,
    kind: "document",
    createdAt: 1700000000000,
  };
}

export const ASSETS_CANVAS_ASSETS: Record<string, CanvasAsset> = {
  [ASSET_BUDGET]: demoAsset(
    ASSET_BUDGET,
    "London budget.csv",
    "text/csv",
    "/demo-assets/london-budget.csv",
  ),
  [ASSET_FLIGHT]: demoAsset(
    ASSET_FLIGHT,
    "BA118-flight-confirmation.md",
    "text/markdown",
    "/demo-assets/flight-confirmation.md",
  ),
};

/* ------------------------------ artifacts ------------------------------ */

export const ART_VIDEO = "demo2_art_video";
export const ART_WIKI = "demo2_art_wiki";
export const ART_MAP = "demo2_art_map";
export const ART_TABLE = "demo2_art_table";
export const ART_STREET = "demo2_art_street";
export const ART_PIE = "demo2_art_pie";
export const ART_CAL = "demo2_art_cal";

export const ANODE_VIDEO = "demo2_anode_video";
export const ANODE_WIKI = "demo2_anode_wiki";
export const ANODE_MAP = "demo2_anode_map";
export const ANODE_TABLE = "demo2_anode_table";
export const ANODE_STREET = "demo2_anode_street";
export const ANODE_PIE = "demo2_anode_pie";
export const ANODE_CAL = "demo2_anode_cal";

const YOUTUBE_TITLE =
  "4 Days in London Itinerary | Best Things To Do, Travel Guide & Tips!";

const videoPayload = {
  type: "images",
  title: YOUTUBE_TITLE,
  data: {
    items: [
      {
        kind: "youtube",
        url: "https://www.youtube.com/watch?v=mWkOIwhcgvA",
        thumb: "/demo-assets/youtube-london.jpg",
        title: YOUTUBE_TITLE,
      },
    ],
  },
} satisfies ArtifactPayload;

const wikiPayload = {
  type: "website",
  title: "British Museum - Wikipedia",
  data: {
    url: "https://en.wikipedia.org/wiki/British_Museum",
    title: "British Museum - Wikipedia",
    domainLabel: "Wikipedia",
    faviconUrl: "/demo-assets/wikipedia-favicon.png",
    previewImageUrl: "/demo-assets/british-museum-aerial.jpg",
    embeddable: false,
  },
} satisfies ArtifactPayload;

/** The five pins from the vlog — real coordinates. */
const LONDON_PINS = [
  { id: "pin_tower", label: "Tower Bridge", lat: 51.5055, lng: -0.0754 },
  { id: "pin_borough", label: "Borough Market", lat: 51.5055, lng: -0.091 },
  { id: "pin_camden", label: "Camden Market", lat: 51.539, lng: -0.1426 },
  { id: "pin_notting", label: "Notting Hill", lat: 51.516, lng: -0.21 },
  { id: "pin_greenwich", label: "Greenwich", lat: 51.4826, lng: 0.0077 },
].map((p) => ({ ...p, type: "sight", group: "vlog" }));

function mapPayload(pinCount: number): ArtifactPayload {
  return {
    type: "map",
    title: "London — spots from the vlog",
    description: "A curated selection from the itinerary video",
    data: {
      zoom: 11,
      place: {
        lat: 51.5074456,
        lng: -0.1277653,
        name: "London, United Kingdom",
        label: "Greater London, England, United Kingdom",
      },
      savedPlaces: LONDON_PINS.slice(0, pinCount),
    },
  } satisfies ArtifactPayload;
}

/** Frozen payload variants — reference changes only at pin beats. */
export const MAP_PAYLOADS: ArtifactPayload[] = [0, 1, 2, 3, 4, 5].map(
  mapPayload,
);

/** Real payload from the user's canvas ("Top 5 Museums to Visit in London"). */
const museumsPayload = {
  type: "table",
  title: "Top 5 Museums to Visit in London",
  data: {
    columns: [
      { key: "rank", label: "Rank" },
      { key: "name", label: "Museum" },
      { key: "area", label: "Area" },
      { key: "admission", label: "Admission" },
      { key: "highlight", label: "Highlights" },
    ],
    rows: [
      {
        rank: "1",
        name: "The British Museum",
        area: "Bloomsbury",
        admission: {
          value: "Free",
          tags: [{ tone: "success", label: "Free Entry" }],
        },
        highlight: "Rosetta Stone, Elgin Marbles, Egyptian Mummies",
      },
      {
        rank: "2",
        name: "Natural History Museum",
        area: "South Kensington",
        admission: {
          value: "Free",
          tags: [{ tone: "success", label: "Free Entry" }],
        },
        highlight: "Blue Whale skeleton, Dinosaur Gallery, Hope the Whale",
      },
      {
        rank: "3",
        name: "Victoria & Albert Museum",
        area: "South Kensington",
        admission: {
          value: "Free",
          tags: [{ tone: "success", label: "Free Entry" }],
        },
        highlight: "World's greatest collection of decorative arts & design",
      },
      {
        rank: "4",
        name: "Tate Modern",
        area: "Bankside, Southwark",
        admission: {
          value: "Free (special exhibits paid)",
          tags: [{ tone: "info", label: "Mostly Free" }],
        },
        highlight: "Picasso, Warhol, Dalí & rotating modern art exhibitions",
      },
      {
        rank: "5",
        name: "National Gallery",
        area: "Trafalgar Square",
        admission: {
          value: "Free",
          tags: [{ tone: "success", label: "Free Entry" }],
        },
        highlight: "Van Gogh's Sunflowers, Turner, da Vinci",
      },
    ],
  },
} satisfies ArtifactPayload;

/** Real payload from the user's canvas (NHM street view). */
const streetPayload = {
  type: "streetview",
  title: "Natural History Museum, London",
  description: "Cromwell Road, South Kensington",
  data: {
    place: {
      lat: 51.4965109,
      lng: -0.1760019,
      name: "Natural History Museum, London",
      label:
        "Natural History Museum, Cromwell Road, Brompton, Royal Borough of Kensington and Chelsea, Greater London, England, SW7 5BD, United Kingdom",
    },
    heading: 0,
    pitch: 5,
    fov: 90,
  },
} satisfies ArtifactPayload;

const piePayload = {
  type: "chart",
  title: "London budget — £2,400 split",
  data: {
    chartType: "pie",
    unit: "£",
    slices: [
      { name: "Stay", value: 760 },
      { name: "Food & pubs", value: 520 },
      { name: "Museums & shows", value: 280 },
      { name: "Transport", value: 240 },
      { name: "Shopping", value: 300 },
      { name: "Contingency", value: 300 },
    ],
  },
} satisfies ArtifactPayload;

const calPayload = {
  type: "calendar",
  title: "London — four days in November",
  description: "British Airways | PNR: ZK4Q1R",
  data: {
    viewYear: 2026,
    viewMonth: 11,
    highlightedDates: [
      "2026-11-12",
      "2026-11-13",
      "2026-11-14",
      "2026-11-15",
      "2026-11-16",
    ],
    events: [
      {
        id: "ba118",
        title: "✈️ BA 118 | BLR → LHR | 07:10–13:25 | Seats 22A · 22B",
        startDate: "2026-11-12",
        endDate: "2026-11-12",
      },
      {
        id: "museums",
        title: "🏛️ British Museum + Natural History Museum",
        startDate: "2026-11-13",
        endDate: "2026-11-13",
      },
      {
        id: "markets",
        title: "🛍️ Borough Market → Camden",
        startDate: "2026-11-14",
        endDate: "2026-11-14",
      },
      {
        id: "greenwich",
        title: "⛵ Greenwich + Thames walk",
        startDate: "2026-11-15",
        endDate: "2026-11-15",
      },
      {
        id: "ba119",
        title: "✈️ BA 119 | LHR → BLR | 13:05",
        startDate: "2026-11-16",
        endDate: "2026-11-16",
      },
    ],
  },
} satisfies ArtifactPayload;

/** Deterministic SessionArtifact (showcase stableArtifact pattern). */
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
   *  in-card pill reads "Version 1 · Generating…" (not "Version 2"). */
  generatingIds?: ReadonlySet<string>,
): Record<string, SessionArtifact> {
  const artifacts = [
    stableArtifact(ART_VIDEO, videoPayload, ""),
    stableArtifact(ART_WIKI, wikiPayload, ""),
    stableArtifact(ART_MAP, MAP_PAYLOADS[mapPinCount], CARD_MAP_Q),
    stableArtifact(ART_TABLE, museumsPayload, CARD_TABLE_Q),
    stableArtifact(ART_STREET, streetPayload, CARD_STREET_Q),
    stableArtifact(ART_PIE, piePayload, CARD_PIE_Q),
    stableArtifact(ART_CAL, calPayload, CARD_CAL_Q),
  ];
  return Object.fromEntries(
    artifacts.map((a) => [
      a.id,
      generatingIds?.has(a.id) ? { ...a, versions: [] } : a,
    ]),
  );
}

export const ARTIFACT_VERSION_ID = (artifactId: string) => `${artifactId}_v1`;

/** Payload each emerging artifact streams onto its card while generating —
 *  GeneratingArtifactContent renders a live preview from it (map with no
 *  pins yet, full table, etc.) instead of a bare placeholder. */
export const GENERATING_PAYLOADS: Record<string, ArtifactPayload> = {
  [ART_MAP]: MAP_PAYLOADS[0],
  [ART_TABLE]: museumsPayload,
  [ART_STREET]: streetPayload,
  [ART_PIE]: piePayload,
  [ART_CAL]: calPayload,
};
