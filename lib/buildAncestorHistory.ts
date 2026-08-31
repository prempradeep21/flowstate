import type { ArtifactPayload } from "@/lib/artifactTypes";
import { getLatestVersion, getVersionById } from "@/lib/sessionArtifacts";
import type { Card, Connection } from "@/lib/store";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";

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
    case "streetview": {
      const place =
        payload.data.place?.label ?? payload.data.place?.name ?? "unknown";
      return `[Card showed Street View: "${payload.title}" at ${place}]`;
    }
    case "todo": {
      const n = payload.data.items?.length ?? 0;
      return `[Card showed to-do list: "${payload.title}" with ${n} item(s)]`;
    }
    case "calendar": {
      const n = payload.data.events?.length ?? 0;
      return `[Card showed calendar: "${payload.title}" with ${n} event(s)]`;
    }
    case "timeline": {
      const n = payload.data.events?.length ?? 0;
      return `[Card showed timeline: "${payload.title}" with ${n} event(s)]`;
    }
    case "chart": {
      const kind = payload.data.chartType;
      return `[Card showed chart: "${payload.title}" (${kind})]`;
    }
    case "website":
      return `[Card showed website: "${payload.title}" (${payload.data.url})]`;
    case "google-doc": {
      const chars = payload.data.extractedTextLength ?? payload.data.extractedText?.length ?? 0;
      const imported =
        payload.data.status === "ready" && chars > 0
          ? ` with ${chars} characters imported`
          : "";
      return `[Card showed ${payload.data.fileKind}: "${payload.data.title}" (${payload.data.url})${imported}]`;
    }
    case "repo":
      return `[Card showed repository: "${payload.data.displayTitle}" (${payload.data.repoUrl})]`;
    case "embed":
      return `[Card showed ${payload.data.provider} embed: "${payload.title}" (${payload.data.url})]`;
    case "audio":
      return `[Card showed audio: "${payload.title}"]`;
    case "stickynote":
      return `[Card showed sticky note: "${payload.title}"]`;
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
export function formatQuestionForContext(
  card: Card,
): string {
  const question = card.question.trim();
  if (!question) return question;

  const notes: string[] = [];
  const attachedImages = getQuestionAttachedImages(card);
  if (attachedImages.length > 0) {
    const alts = attachedImages.map((img) => img.alt).filter(Boolean);
    notes.push(
      alts.length > 0
        ? `[User attached ${attachedImages.length} image(s): ${alts.join("; ")}]`
        : `[User attached ${attachedImages.length} image(s) to this question]`,
    );
  }
  if (card.attachedArtifacts?.length) {
    notes.push(
      `[User attached ${card.attachedArtifacts.length} artifact reference(s)]`,
    );
  }
  if (card.attachedAssets?.length) {
    notes.push(
      `[User attached ${card.attachedAssets.length} file asset(s)]`,
    );
  }
  if (card.attachedSkills?.length) {
    notes.push(`[User attached ${card.attachedSkills.length} skill(s)]`);
  }
  if (card.attachedGroups?.length) {
    notes.push(
      `[User attached ${card.attachedGroups.length} canvas group(s) as joint context]`,
    );
  }
  if (card.pendingFiles?.length) {
    notes.push(`[User attached ${card.pendingFiles.length} uploaded file(s)]`);
  }

  return notes.length > 0 ? `${question}\n\n${notes.join("\n")}` : question;
}

/** Text sent to the model, including notes for images and structured artifacts. */
export function formatAnswerForContext(
  card: Card,
  sessionArtifacts: Record<string, SessionArtifact> = {},
  opts?: { omitBulkyPayload?: boolean },
): string {
  const parts: string[] = [];

  if (card.answer.trim()) {
    parts.push(card.answer.trim());
  }

  const payload = payloadForCard(card, sessionArtifacts);
  if (payload) {
    parts.push(artifactContextNote(payload));
    const bulky = payload.type === "custom" || payload.type === "code";
    if (!(opts?.omitBulkyPayload && bulky)) {
      parts.push(artifactPayloadContext(payload));
    }
  } else if (card.responseType === "image" && card.images?.length) {
    const alts = card.images.map((i) => i.alt).filter(Boolean);
    const imgNote =
      alts.length > 0
        ? `[Shown ${card.images.length} image(s): ${alts.join("; ")}]`
        : `[Shown ${card.images.length} image(s) for this answer]`;
    parts.push(imgNote);
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
 * Root-to-leaf ancestor card ids for a card (excluding the card itself).
 */
export function collectAncestorCardIds(
  graph: HistoryGraph,
  cardId: string,
): string[] {
  const ids: string[] = [];
  const visited = new Set<string>();

  let parentId: string | null =
    graph.cards[cardId]?.parentConversationId ??
    graph.cards[cardId]?.parentCardId ??
    null;

  if (!parentId) {
    parentId = lateralSourceId(graph, cardId);
  }

  const chain: string[] = [];
  while (parentId && !visited.has(parentId)) {
    visited.add(parentId);
    chain.push(parentId);
    const parent = graph.cards[parentId];
    if (!parent) break;

    const nextViaCard =
      parent.parentConversationId ?? parent.parentCardId ?? null;
    parentId = nextViaCard ?? lateralSourceId(graph, parentId);
  }

  chain.reverse();
  ids.push(...chain);
  return ids;
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

    const answer = formatAnswerForContext(parent, sessionArtifacts, {
      omitBulkyPayload: true,
    });
    const hasContent =
      answer ||
      getQuestionAttachedImages(parent).length > 0 ||
      (parent.images && parent.images.length > 0) ||
      parent.artifactPayload ||
      parent.outputArtifactId;

    if (parent.question.trim() && hasContent) {
      history.unshift({
        question: formatQuestionForContext(parent),
        answer,
      });
    }

    const nextViaCard =
      parent.parentConversationId ?? parent.parentCardId ?? null;
    parentId = nextViaCard ?? lateralSourceId(graph, parentId);
  }

  return history;
}
