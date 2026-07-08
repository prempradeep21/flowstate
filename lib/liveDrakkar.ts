import { collectCardArtifactPreviewItems } from "@/lib/cardArtifactPreviewItems";
import { isChatAnswerInProgress } from "@/lib/qaStreamDisplay";
import type { Card, CanvasArtifactNode, Connection } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

export interface LiveDrakkarCounts {
  chatsInProgress: number;
  artifactsInProgress: number;
}

export interface LiveDrakkarState {
  cards: Record<string, Card>;
  cardOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  connections: Connection[];
}

/** Live counts for the top-right drakkar — chats awaiting an answer vs artifacts still building. */
export function computeLiveDrakkarCounts(
  state: LiveDrakkarState,
): LiveDrakkarCounts {
  let chatsInProgress = 0;
  let artifactsInProgress = 0;

  for (const cardId of state.cardOrder) {
    const card = state.cards[cardId];
    if (!card || card.status === "empty") continue;

    if (isChatAnswerInProgress(card)) {
      chatsInProgress += 1;
    }

    const items = collectCardArtifactPreviewItems(
      card,
      state.sessionArtifacts,
      state.canvasArtifactNodes,
      state.cards,
      state.connections,
      state.cardOrder,
    );
    artifactsInProgress += items.filter((item) => item.status === "generating").length;
  }

  return { chatsInProgress, artifactsInProgress };
}
