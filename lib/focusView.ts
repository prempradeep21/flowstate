import { getThreadCardChain } from "@/lib/chatThreads";
import {
  computeCanvasContentBounds,
  type CanvasContentBoundsInput,
} from "@/lib/canvasContentBounds";
import type {
  ArtifactPlugConnection,
  CanvasArtifactNode,
  Card,
  Connection,
  SessionArtifact,
} from "@/lib/store";

/** Horizontal gap between existing content bounds and a focus-created root card. */
const FOCUS_ROOT_GAP_X = 160;
/** Vertical inset from the top of the content bounds for focus-created roots. */
const FOCUS_ROOT_INSET_Y = 48;

export interface FocusViewLookupState {
  cards: Record<string, Card>;
  cardOrder: string[];
  connections: Connection[];
  sessionArtifacts: Record<string, SessionArtifact>;
  artifactPlugConnections: ArtifactPlugConnection[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
}

function artifactIdsReferencedByCard(card: Card): string[] {
  const ids: string[] = [];
  if (card.outputArtifactId) ids.push(card.outputArtifactId);
  for (const ref of card.attachedArtifacts ?? []) ids.push(ref.artifactId);
  if (card.inheritedArtifactId) ids.push(card.inheritedArtifactId);
  return ids;
}

/**
 * Most recent artifact a thread produced or worked with — the artifact the
 * focus view should show when this thread loads. Walks the follow-up chain
 * tail→head; per card, output beats attachment beats inheritance.
 */
export function getLatestArtifactIdForThread(
  state: FocusViewLookupState,
  threadId: string,
): string | null {
  const chain = getThreadCardChain(
    { ...state, threads: {}, threadOrder: [] },
    threadId,
  );
  for (let i = chain.length - 1; i >= 0; i--) {
    const card = state.cards[chain[i]];
    if (!card) continue;
    for (const id of artifactIdsReferencedByCard(card)) {
      if (state.sessionArtifacts[id]) return id;
    }
  }
  return null;
}

/**
 * Most recent thread that produced or worked with an artifact — the chat the
 * focus view should load when this artifact is selected. Card creation order
 * (cardOrder) is used as recency.
 */
export function getLatestThreadIdForArtifact(
  state: FocusViewLookupState,
  artifactId: string,
): string | null {
  const pluggedCardIds = new Set<string>();
  for (const conn of state.artifactPlugConnections) {
    const node = state.canvasArtifactNodes[conn.artifactNodeId];
    if (node?.artifactId === artifactId) pluggedCardIds.add(conn.cardId);
  }

  for (let i = state.cardOrder.length - 1; i >= 0; i--) {
    const card = state.cards[state.cardOrder[i]];
    if (!card) continue;
    if (
      pluggedCardIds.has(card.id) ||
      artifactIdsReferencedByCard(card).includes(artifactId)
    ) {
      return card.threadId;
    }
  }
  return null;
}

/**
 * World position for a root card created from the focus view: in empty space
 * to the right of all existing content. Each new root extends the bounds, so
 * successive roots march rightward without overlapping.
 */
export function computeFocusRootCardPosition(
  state: CanvasContentBoundsInput,
): { x: number; y: number } {
  const bounds = computeCanvasContentBounds(state);
  return {
    x: bounds.x + bounds.w + FOCUS_ROOT_GAP_X,
    y: bounds.y + FOCUS_ROOT_INSET_Y,
  };
}
