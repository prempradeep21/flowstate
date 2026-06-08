import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  appendArtifactVersion,
  buildImagesArtifactFromCard,
  canAppendArtifactVersion,
  createSessionArtifactFromPayload,
  getLatestVersion,
  resolveEditingArtifactId,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type { Card, Connection } from "@/lib/store";

export type ArtifactPreviewStatus = "generating" | "ready" | "failed";

export interface MaterializeContext {
  cards: Record<string, Card>;
  connections: Connection[];
  cardOrder: string[];
}

export function resolveArtifactPreviewStatus(card: Card): ArtifactPreviewStatus {
  if (card.status === "streaming" || card.status === "thinking") {
    return "generating";
  }
  if (card.artifactPayload && !card.outputArtifactId) {
    return "failed";
  }
  if (
    card.images &&
    card.images.length > 0 &&
    (card.responseType === "image" || card.responseType === "images") &&
    !card.outputArtifactId
  ) {
    return "failed";
  }
  return "ready";
}

function payloadForCard(card: Card): ArtifactPayload | null {
  if (card.artifactPayload) return card.artifactPayload;
  if (
    (card.responseType === "image" || card.images?.length) &&
    card.images &&
    card.images.length > 0
  ) {
    return buildImagesArtifactFromCard(
      card.images,
      card.question.slice(0, 48) || "Images",
    );
  }
  return null;
}

/** Commit a card's pending artifact payload into the session registry (pure). */
export function materializeCardArtifact(
  card: Card,
  sessionArtifacts: Record<string, SessionArtifact>,
  context: MaterializeContext,
): {
  card: Card;
  sessionArtifacts: Record<string, SessionArtifact>;
  artifactId: string;
  versionId: string;
} | null {
  const payload = payloadForCard(card);

  if (
    payload?.type === "table" &&
    card.outputArtifactId &&
    sessionArtifacts[card.outputArtifactId]
  ) {
    const art = sessionArtifacts[card.outputArtifactId];
    const latest = getLatestVersion(art);
    if (
      latest?.payload.type === "table" &&
      latest.payload.data.rows.length > 0
    ) {
      return {
        card: {
          ...card,
          outputArtifactId: art.id,
          outputArtifactVersionId: art.latestVersionId,
          responseType: "table",
          artifactPayload: undefined,
        },
        sessionArtifacts,
        artifactId: art.id,
        versionId: art.latestVersionId,
      };
    }
  }

  if (!payload) {
    if (card.outputArtifactId && !card.outputArtifactVersionId) {
      const art = sessionArtifacts[card.outputArtifactId];
      const latest = art ? getLatestVersion(art) : undefined;
      if (!latest) return null;
      return {
        card: { ...card, outputArtifactVersionId: latest.id },
        sessionArtifacts,
        artifactId: card.outputArtifactId,
        versionId: latest.id,
      };
    }
    return null;
  }

  const placeholderId =
    card.outputArtifactId &&
    canAppendArtifactVersion(sessionArtifacts[card.outputArtifactId], payload)
      ? card.outputArtifactId
      : null;
  const resolvedId = resolveEditingArtifactId(
    card,
    context.cards,
    context.connections,
    context.cardOrder,
  );
  const existingId =
    placeholderId ??
    (resolvedId &&
    canAppendArtifactVersion(sessionArtifacts[resolvedId], payload)
      ? resolvedId
      : null);

  let artifactId: string;
  let versionId: string;
  const nextArtifacts = { ...sessionArtifacts };

  if (existingId && sessionArtifacts[existingId]) {
    const { artifact, versionId: vid } = appendArtifactVersion(
      sessionArtifacts[existingId],
      payload,
      card.id,
    );
    artifactId = artifact.id;
    versionId = vid;
    nextArtifacts[artifactId] = artifact;
  } else {
    const created = createSessionArtifactFromPayload(payload, card.id);
    artifactId = created.id;
    versionId = created.latestVersionId;
    nextArtifacts[artifactId] = created;
  }

  return {
    card: {
      ...card,
      outputArtifactId: artifactId,
      outputArtifactVersionId: versionId,
      responseType: payload.type === "images" ? "images" : card.responseType,
      artifactPayload: undefined,
    },
    sessionArtifacts: nextArtifacts,
    artifactId,
    versionId,
  };
}

export function repairLoadedArtifactState(
  cards: Record<string, Card>,
  sessionArtifacts: Record<string, SessionArtifact>,
  connections: Connection[],
  cardOrder: string[],
): {
  cards: Record<string, Card>;
  sessionArtifacts: Record<string, SessionArtifact>;
} {
  const context: MaterializeContext = { cards, connections, cardOrder };
  let nextArtifacts = { ...sessionArtifacts };
  let nextCards = { ...cards };

  for (const id of cardOrder) {
    const card = nextCards[id];
    if (!card) continue;
    const result = materializeCardArtifact(card, nextArtifacts, context);
    if (!result) continue;
    nextCards[id] = result.card;
    nextArtifacts = result.sessionArtifacts;
  }

  return { cards: nextCards, sessionArtifacts: nextArtifacts };
}
