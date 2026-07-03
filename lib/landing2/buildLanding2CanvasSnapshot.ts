import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import { getDefaultArtifactSize } from "@/lib/canvasNodeBounds";
import { ARTIFACT_CATALOG_ENTRIES } from "@/lib/artifactCatalogSamples";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import {
  createSessionArtifactFromPayload,
  getLatestVersion,
} from "@/lib/sessionArtifacts";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type { CanvasArtifactNode, Card, Connection, Thread } from "@/lib/store";

const THREAD_MAIN = "l2-main";
const THREAD_PORTO = "l2-porto";
const SOURCE_CARD = "l2-root";

function card(
  id: string,
  threadId: string,
  question: string,
  answer: string,
  x: number,
  y: number,
  parentCardId: string | null,
): Card {
  return {
    id,
    threadId,
    question,
    answer,
    status: "done",
    position: { x, y },
    parentCardId,
    parentConversationId: null,
    responseType: "text",
  };
}

function catalogPayload(id: string) {
  const entry = ARTIFACT_CATALOG_ENTRIES.find((e) => e.id === id);
  if (!entry?.payload) throw new Error(`Missing catalog payload: ${id}`);
  return entry.payload;
}

/** Branching Lisbon session with map, table, and timeline artifacts for landing2. */
export function buildLanding2CanvasSnapshot() {
  const root = card(
    SOURCE_CARD,
    THREAD_MAIN,
    "Where should you spend your long weekend?",
    "Lisbon keeps coming up — great food, walkable neighborhoods, and easy day trips by train.",
    160,
    300,
    null,
  );
  const alfama = card(
    "l2-alfama",
    THREAD_MAIN,
    "Compare Alfama vs Chiado",
    "Alfama is quieter and hillier; Chiado is central with more cafés and shops.",
    640,
    160,
    SOURCE_CARD,
  );
  const porto = card(
    "l2-porto",
    THREAD_PORTO,
    "What about Porto instead?",
    "Porto is compact, cheaper, and strong on wine culture — fewer crowds in shoulder season.",
    640,
    440,
    SOURCE_CARD,
  );
  const dayTrips = card(
    "l2-daytrips",
    THREAD_MAIN,
    "Day trips from Lisbon",
    "Sintra and Cascais are under an hour by train — easy wins for a long weekend.",
    1120,
    120,
    "l2-alfama",
  );

  const connections: Connection[] = [
    { id: "l2-c1", from: SOURCE_CARD, to: "l2-alfama", fromSide: "right", toSide: "left" },
    { id: "l2-c2", from: SOURCE_CARD, to: "l2-porto", fromSide: "right", toSide: "left" },
    { id: "l2-c3", from: "l2-alfama", to: "l2-daytrips", fromSide: "right", toSide: "left" },
  ];

  const threads: Record<string, Thread> = {
    [THREAD_MAIN]: { id: THREAD_MAIN, accentColour: THREAD_ACCENT_PALETTE[0]! },
    [THREAD_PORTO]: { id: THREAD_PORTO, accentColour: THREAD_ACCENT_PALETTE[1]! },
  };

  const sessionArtifacts: Record<string, SessionArtifact> = {};
  const canvasArtifactNodes: Record<string, CanvasArtifactNode> = {};
  const canvasArtifactOrder: string[] = [];

  const artifactPlacements = [
    { catalogId: "map", x: 1120, y: 420, nodeId: "l2-art-map" },
    { catalogId: "table", x: 160, y: 560, nodeId: "l2-art-table" },
    { catalogId: "timeline", x: 640, y: 680, nodeId: "l2-art-timeline" },
  ] as const;

  for (const placement of artifactPlacements) {
    const payload = catalogPayload(placement.catalogId);
    const artifact = createSessionArtifactFromPayload(payload, SOURCE_CARD);
    const stableId = `l2-artifact-${placement.catalogId}`;
    const stableArtifact = { ...artifact, id: stableId };
    sessionArtifacts[stableId] = stableArtifact;

    const ver = getLatestVersion(stableArtifact);
    const size = getDefaultArtifactSize(stableArtifact.kind, ver?.payload);

    canvasArtifactNodes[placement.nodeId] = {
      id: placement.nodeId,
      artifactId: stableId,
      versionId: stableArtifact.latestVersionId,
      sourceCardId: SOURCE_CARD,
      position: { x: placement.x, y: placement.y },
      size,
    };
    canvasArtifactOrder.push(placement.nodeId);
  }

  return buildCanvasSnapshot({
    viewport: { x: 0, y: 0, scale: 1 },
    cards: {
      [SOURCE_CARD]: root,
      "l2-alfama": alfama,
      "l2-porto": porto,
      "l2-daytrips": dayTrips,
    },
    cardOrder: [SOURCE_CARD, "l2-alfama", "l2-porto", "l2-daytrips"],
    connections,
    threads,
    threadOrder: [THREAD_MAIN, THREAD_PORTO],
    groups: {},
    connectorStyle: "curvy",
    canvasBackgroundStyle: "grid",
    canvasTheme: "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder,
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}
