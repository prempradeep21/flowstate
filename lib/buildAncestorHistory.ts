import type { Card, Connection } from "@/lib/store";

export interface HistoryMessage {
  question: string;
  answer: string;
}

interface HistoryGraph {
  cards: Record<string, Card>;
  connections: Connection[];
}

/** Text sent to the model, including a note when images were shown on the card. */
export function formatAnswerForContext(card: Card): string {
  const text = card.answer.trim();
  if (card.images?.length) {
    const alts = card.images.map((i) => i.alt).filter(Boolean);
    const imgNote =
      alts.length > 0
        ? `[Shown ${card.images.length} image(s): ${alts.join("; ")}]`
        : `[Shown ${card.images.length} image(s) for this answer]`;
    return text ? `${text}\n\n${imgNote}` : imgNote;
  }
  return text;
}

function lateralSourceId(
  graph: HistoryGraph,
  cardId: string,
): string | null {
  const conn = graph.connections.find(
    (c) =>
      c.to === cardId &&
      (c.fromSide === "left" || c.fromSide === "right"),
  );
  return conn?.from ?? null;
}

/**
 * All ancestor Q&A for a card: vertical chain (parentCardId) plus lateral
 * branch source (parentConversationId / side connection).
 */
export function buildAncestorHistory(
  graph: HistoryGraph,
  cardId: string,
): HistoryMessage[] {
  const history: HistoryMessage[] = [];
  const visited = new Set<string>();

  let parentId: string | null =
    graph.cards[cardId]?.parentConversationId ??
    graph.cards[cardId]?.parentCardId ??
    null;

  if (!parentId) {
    parentId = lateralSourceId(graph, cardId);
  }

  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    const parent = graph.cards[parentId];
    if (!parent) break;

    const answer = formatAnswerForContext(parent);
    if (
      parent.question.trim() &&
      (answer || (parent.images && parent.images.length > 0))
    ) {
      history.unshift({ question: parent.question.trim(), answer });
    }

    const nextViaCard =
      parent.parentConversationId ?? parent.parentCardId ?? null;
    parentId = nextViaCard ?? lateralSourceId(graph, parentId);
  }

  return history;
}
