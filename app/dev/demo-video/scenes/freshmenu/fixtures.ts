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
 * The "FreshMenu — Backstage with Millionaires" canvas, exactly as the product
 * builds it: the scene mounts the transcript-import snapshot untouched and
 * only ever ADDS one branch card in the empty space right of Chapter 7.
 */

/** Cards that hydrate would re-snap. None in this scene — the canvas is read
 *  straight from the builder and never round-trips through hydrate. */
const HYDRATE_SNAPPED_CARD_Y: Record<string, number> = {};

export interface FmBase {
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

/* ---- The closing beat: a branch pulled from the "Online and offline"
 *      table, dropped in the open canvas right of Chapter 7. --------------- */

export const SOURCE_NODE_ID = "tip-art-fm-table-channels";
/** Table tile bounds (world). Layout-owned — read, never written. */
export const SOURCE_RECT = { x: 13069, y: 720, w: 513, h: 236 };
export const SOURCE_PLUG = {
  x: SOURCE_RECT.x + SOURCE_RECT.w,
  y: SOURCE_RECT.y + SOURCE_RECT.h / 2,
};

export const BRANCH_CARD_ID = "fm-demo-branch";
export const BRANCH_THREAD_ID = "fm-demo-branch-thread";
/** Where the drag is released. The product centres the new card on the drop
 *  point and lifts it 30px (usePlugDragSession → createRootCardWithAttachment). */
export const DROP_POINT = { x: 14170, y: 900 };
export const BRANCH_POS = { x: DROP_POINT.x - 210, y: DROP_POINT.y - 30 };

// Vetted against resolvePrimaryArtifactKind → null (no artifact expected).
export const BRANCH_QUESTION = "So what should FreshMenu have done instead?";
// Every claim is on the canvas already (cards offline-1, offline-2,
// lesson-2, aov-3, funding-3).
export const BRANCH_ANSWER =
  "Gone offline, the episode argues. Rebel Foods and Curefoods are opening physical stores, and offline is the high-margin side — a successful Indian QSR chain runs at 15–20% EBITDA once it scales.\n\nFreshMenu stayed one brand, mostly sold through Swiggy. Online built the brand; it never built the business.";

let base: FmBase | null = null;

export function getFmBase(): FmBase {
  if (base) return base;
  const snap = getTranscriptImportCanvas("freshmenu-backstage").buildSnapshot();

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
