import type { ArtifactPayload } from "@/lib/artifactTypes";
import { getLatestVersion, getVersionById } from "@/lib/sessionArtifacts";
import type { Card, Connection } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";

export interface HistoryMessage {
  question: string;
  answer: string;
}

interface HistoryGraph {
  cards: Record<string, Card>;
  connections: Connection[];
}

function artifactContextNote(payload: ArtifactPayload): string {
  switch (payload.type) {
    case "table": {
      const rows = payload.data.rows?.length ?? 0;
      const cols = payload.data.columns?.length ?? 0;
      return `[Card showed a table: "${payload.title}" with ${rows} rows and ${cols} columns]`;
    }
    case "code": {
      const n = payload.data.files?.length ?? 0;
      return `[Card showed code: "${payload.title}" with ${n} file(s)]`;
    }
    case "video": {
      const n = payload.data.items?.length ?? 0;
      return `[Card showed videos: "${payload.title}" with ${n} item(s)]`;
    }
    case "custom":
      return `[Card showed custom UI: "${payload.title}"]`;
    case "3d":
      return `[Card showed 3D model: "${payload.title}"]`;
    case "images": {
      const n = payload.data.items?.length ?? 0;
      return `[Card showed images: "${payload.title}" with ${n} item(s)]`;
    }
    case "map": {
      const place = payload.data.place?.label ?? payload.data.place?.name ?? "unknown";
      const saved = payload.data.savedPlaces?.length ?? 0;
      const savedNote = saved > 0 ? ` with ${saved} saved place(s)` : "";
      return `[Card showed map: "${payload.title}" centered on ${place}${savedNote}]`;
    }
    case "todo": {
      const n = payload.data.items?.length ?? 0;
      return `[Card showed to-do list: "${payload.title}" with ${n} item(s)]`;
    }
  }
}

function payloadForCard(
  card: Card,
  sessionArtifacts: Record<string, SessionArtifact>,
): ArtifactPayload | null {
  if (card.outputArtifactId) {
    const art = sessionArtifacts[card.outputArtifactId];
    if (!art) return card.artifactPayload ?? null;
    const ver =
      (card.outputArtifactVersionId &&
        getVersionById(art, card.outputArtifactVersionId)) ||
      getLatestVersion(art);
    return ver?.payload ?? card.artifactPayload ?? null;
  }
  return card.artifactPayload ?? null;
}

function artifactPayloadContext(payload: ArtifactPayload): string {
  return `[Structured artifact JSON for editing]\n${JSON.stringify(payload, null, 2)}`;
}

/** Text sent to the model, including notes for images and structured artifacts. */
export function formatAnswerForContext(
  card: Card,
  sessionArtifacts: Record<string, SessionArtifact> = {},
): string {
  const parts: string[] = [];

  if (card.answer.trim()) {
    parts.push(card.answer.trim());
  }

  const payload = payloadForCard(card, sessionArtifacts);
  if (payload) {
    parts.push(artifactContextNote(payload));
    parts.push(artifactPayloadContext(payload));
  } else if (card.responseType === "image" && card.images?.length) {
    const alts = card.images.map((i) => i.alt).filter(Boolean);
    const imgNote =
      alts.length > 0
        ? `[Shown ${card.images.length} image(s): ${alts.join("; ")}]`
        : `[Shown ${card.images.length} image(s) for this answer]`;
    parts.push(imgNote);
  } else if (card.images?.length) {
    const alts = card.images.map((i) => i.alt).filter(Boolean);
    parts.push(
      alts.length > 0
        ? `[Shown ${card.images.length} image(s): ${alts.join("; ")}]`
        : `[Shown ${card.images.length} image(s)]`,
    );
  }

  return parts.join("\n\n");
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
  graph: HistoryGraph & { sessionArtifacts?: Record<string, SessionArtifact> },
  cardId: string,
): HistoryMessage[] {
  const sessionArtifacts = graph.sessionArtifacts ?? {};
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

    const answer = formatAnswerForContext(parent, sessionArtifacts);
    const hasContent =
      answer ||
      (parent.images && parent.images.length > 0) ||
      parent.artifactPayload ||
      parent.outputArtifactId;

    if (parent.question.trim() && hasContent) {
      history.unshift({ question: parent.question.trim(), answer });
    }

    const nextViaCard =
      parent.parentConversationId ?? parent.parentCardId ?? null;
    parentId = nextViaCard ?? lateralSourceId(graph, parentId);
  }

  return history;
}
