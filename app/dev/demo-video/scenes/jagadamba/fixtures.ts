import { getTranscriptImportCanvas } from "@/lib/buildTranscriptImportPlaygroundSnapshot";
import { THREAD_ACCENT_PALETTE } from "@/lib/design/tokens";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type {
  BranchGroup,
  CanvasArtifactNode,
  CanvasAsset,
  Card,
  Connection,
  Thread,
} from "@/lib/store";

/**
 * The "Jagadamba Theatre — Rooted Stories" canvas, exactly as the product
 * builds it: the scene mounts the transcript-import snapshot untouched and
 * only ever ADDS one branch card in the empty space right of Chapter 6.
 */

/** Chapter heads' first lower branch re-snaps to parent.y + 300 + 40 when the
 *  product hydrates the snapshot (repairVerticalChainsOnly) — mirror it so the
 *  scene matches the saved canvas pixel for pixel. */
const HYDRATE_SNAPPED_CARD_Y: Record<string, number> = {
  "tip-c-jag-build-1": 340,
  "tip-c-jag-bombay-1": 340,
  "tip-c-jag-console-1": 340,
  "tip-c-jag-whatran-1": 340,
  "tip-c-jag-together-1": 340,
  "tip-c-jag-sound-1": 340,
};

export interface JagBase {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  threads: Record<string, Thread>;
  threadOrder: string[];
  groups: Record<string, BranchGroup>;
  groupList: BranchGroup[];
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  canvasArtifactOrder: string[];
  canvasAssets: Record<string, CanvasAsset>;
  /** The artifact the closing branch is pulled from. */
  sourceRef: { artifactId: string; versionId: string };
}

/* ---- The closing beat: a branch pulled from the "Upgrading the speakers"
 *      quote, dropped in the open canvas right of Chapter 6. ---------------- */

export const SOURCE_NODE_ID = "tip-art-jag-quote-speakers";
/** Quote tile bounds (world). Layout-owned — read, never written. */
export const SOURCE_RECT = { x: 12808, y: 1068, w: 520, h: 528 };
export const SOURCE_PLUG = {
  x: SOURCE_RECT.x + SOURCE_RECT.w,
  y: SOURCE_RECT.y + SOURCE_RECT.h / 2,
};

export const BRANCH_CARD_ID = "jag-demo-branch";
export const BRANCH_THREAD_ID = "jag-demo-branch-thread";
/** Where the drag is released. The product centres the new card on the drop
 *  point and lifts it 30px (usePlugDragSession → createRootCardWithAttachment). */
export const DROP_POINT = { x: 13770, y: 1318 };
export const BRANCH_POS = { x: DROP_POINT.x - 210, y: DROP_POINT.y - 30 };

// Vetted against resolvePrimaryArtifactKind → null (no artifact expected).
export const BRANCH_QUESTION = "What does he keep changing, and why?";
// Every claim is on the canvas already (cards sound-1, sound-2, console-2).
export const BRANCH_ANSWER =
  "The speakers behind the screen. Whenever a generation with a better frequency response appears, he swaps the old ones out — he even put line arrays back there after hearing them at a Janet Jackson show.\n\nHalf a century in, he still does the room's Dolby equalization himself. What he is chasing is dynamic range, not volume.";

let base: JagBase | null = null;

export function getJagBase(): JagBase {
  if (base) return base;
  const snap = getTranscriptImportCanvas("jagadamba-theatre").buildSnapshot();

  const cards: Record<string, Card> = {};
  for (const [id, card] of Object.entries(snap.cards)) {
    const y = HYDRATE_SNAPPED_CARD_Y[id];
    cards[id] =
      y == null ? card : { ...card, position: { x: card.position.x, y } };
  }

  // createRootCardWithAttachment: PALETTE[threadOrder.length % PALETTE.length].
  const branchThread: Thread = {
    id: BRANCH_THREAD_ID,
    accentColour:
      THREAD_ACCENT_PALETTE[
        snap.threadOrder.length % THREAD_ACCENT_PALETTE.length
      ],
  };

  const canvasArtifactNodes = snap.canvasArtifactNodes ?? {};
  const source = canvasArtifactNodes[SOURCE_NODE_ID];
  if (!source) throw new Error(`Missing artifact node ${SOURCE_NODE_ID}`);

  base = {
    cards,
    cardOrder: snap.cardOrder,
    connections: snap.connections,
    threads: { ...snap.threads, [BRANCH_THREAD_ID]: branchThread },
    threadOrder: [...snap.threadOrder, BRANCH_THREAD_ID],
    groups: snap.groups,
    groupList: Object.values(snap.groups),
    sessionArtifacts: snap.sessionArtifacts,
    canvasArtifactNodes,
    canvasArtifactOrder: snap.canvasArtifactOrder ?? [],
    canvasAssets: snap.canvasAssets ?? {},
    sourceRef: { artifactId: source.artifactId, versionId: source.versionId },
  };
  return base;
}
