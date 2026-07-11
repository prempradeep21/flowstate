import type { ArtifactPayload } from "@/lib/artifactTypes";
import {
  appendArtifactVersion,
  buildImagesArtifactFromCard,
  createSessionArtifactFromPayload,
  getLatestVersion,
  getVersionById,
  resolveArtifactTargetId,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type { Card, Connection } from "@/lib/store";
import type { AttachedArtifactResolveContext } from "@/lib/attachedArtifactRefs";

export type ArtifactPreviewStatus = "generating" | "ready" | "failed" | "pending";

export interface MaterializeContext {
  cards: Record<string, Card>;
  connections: Connection[];
  cardOrder: string[];
  artifactPlugConnections?: AttachedArtifactResolveContext["artifactPlugConnections"];
  canvasArtifactNodes?: AttachedArtifactResolveContext["canvasArtifactNodes"];
  plugComposerAttachments?: AttachedArtifactResolveContext["plugComposerAttachments"];
}

function plugContextFromMaterialize(context: MaterializeContext) {
  return {
    artifactPlugConnections: context.artifactPlugConnections ?? [],
    canvasArtifactNodes: context.canvasArtifactNodes ?? {},
    plugComposerAttachments: context.plugComposerAttachments ?? {},
  };
}

export function resolveArtifactPreviewStatus(card: Card): ArtifactPreviewStatus {
  if (card.status === "streaming" || card.status === "thinking") {
    return "generating";
  }
  if (card.artifactPayload && !card.outputArtifactId) {
    return card.status === "done" ? "failed" : "generating";
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
    (card.responseType === "image" || card.responseType === "images") &&
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

  const existingId = resolveArtifactTargetId(
    card,
    payload,
    sessionArtifacts,
    context.cards,
    context.connections,
    context.cardOrder,
    plugContextFromMaterialize(context),
  );

  let artifactId: string;
  let versionId: string;
  const nextArtifacts = { ...sessionArtifacts };

  const createdByUserId = card.contributorIds?.[0];

  if (existingId && sessionArtifacts[existingId]) {
    const { artifact, versionId: vid } = appendArtifactVersion(
      sessionArtifacts[existingId],
      payload,
      card.id,
      createdByUserId,
    );
    artifactId = artifact.id;
    versionId = vid;
    nextArtifacts[artifactId] = artifact;
  } else {
    const created = createSessionArtifactFromPayload(
      payload,
      card.id,
      createdByUserId,
    );
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
