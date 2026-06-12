import { buildCanvasSnapshot } from "@/lib/canvasSnapshot";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import type { Card, Connection, Thread } from "@/lib/store";

const THREAD_MAIN = "landing-main";
const THREAD_PORTO = "landing-porto";

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

/** Small branching session for the landing-page canvas demo. */
export function buildLandingBranchingSnapshot() {
  const root = card(
    "ld-root",
    THREAD_MAIN,
    "Where should you spend your long weekend?",
    "Lisbon keeps coming up — great food, walkable neighborhoods, and easy day trips by train.",
    180,
    280,
    null,
  );
  const alfama = card(
    "ld-alfama",
    THREAD_MAIN,
    "Compare Alfama vs Chiado",
    "Alfama is quieter and hillier; Chiado is central with more cafés and shops.",
    660,
    140,
    "ld-root",
  );
  const porto = card(
    "ld-porto",
    THREAD_PORTO,
    "What about Porto instead?",
    "Porto is compact, cheaper, and strong on wine culture — fewer crowds in shoulder season.",
    660,
    420,
    "ld-root",
  );
  const dayTrips = card(
    "ld-daytrips",
    THREAD_MAIN,
    "Day trips from Lisbon",
    "Sintra and Cascais are under an hour by train — easy wins for a long weekend.",
    1140,
    100,
    "ld-alfama",
  );

  const connections: Connection[] = [
    {
      id: "ld-c1",
      from: "ld-root",
      to: "ld-alfama",
      fromSide: "right",
      toSide: "left",
    },
    {
      id: "ld-c2",
      from: "ld-root",
      to: "ld-porto",
      fromSide: "right",
      toSide: "left",
    },
    {
      id: "ld-c3",
      from: "ld-alfama",
      to: "ld-daytrips",
      fromSide: "right",
      toSide: "left",
    },
  ];

  const threads: Record<string, Thread> = {
    [THREAD_MAIN]: {
      id: THREAD_MAIN,
      accentColour: THREAD_ACCENT_PALETTE[0]!,
    },
    [THREAD_PORTO]: {
      id: THREAD_PORTO,
      accentColour: THREAD_ACCENT_PALETTE[1]!,
    },
  };

  return buildCanvasSnapshot({
    viewport: { x: 0, y: 0, scale: 1 },
    cards: {
      "ld-root": root,
      "ld-alfama": alfama,
      "ld-porto": porto,
      "ld-daytrips": dayTrips,
    },
    cardOrder: ["ld-root", "ld-alfama", "ld-porto", "ld-daytrips"],
    connections,
    threads,
    threadOrder: [THREAD_MAIN, THREAD_PORTO],
    groups: {},
    connectorStyle: "curvy",
    canvasBackgroundStyle: "grid",
    canvasTheme: "light",
    selectedModel: "claude-sonnet-4-6",
    viewMode: "canvas",
    sessionArtifacts: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
    canvasAssetNodes: {},
    canvasAssetOrder: [],
    canvasTextLabels: {},
    canvasTextLabelOrder: [],
    uploadedAttachments: [],
    collaborationHasEdits: false,
  });
}
