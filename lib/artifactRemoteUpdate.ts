import { isCardAskInFlight } from "@/lib/cardAskRegistry";
import { isQaTurnInProgress } from "@/lib/qaStreamDisplay";
import {
  resolveEditingArtifactId,
  type AttachedArtifactRef,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type {
  ArtifactPlugConnection,
  Card,
  CanvasArtifactNode,
  Connection,
} from "@/lib/store";

const ARTIFACT_WORK_LABEL =
  /building|updating|preparing|plotting|laying|drawing|checking|cueing|rendering|importing|applying theme/i;

const STRUCTURED_RESPONSE_TYPES = new Set([
  "table",
  "code",
  "video",
  "custom",
  "3d",
  "images",
  "image",
  "map",
  "todo",
  "chart",
  "calendar",
  "timeline",
  "streetview",
]);

export interface ArtifactRemoteUpdateContext {
  cards: Record<string, Card>;
  cardOrder: string[];
  sessionArtifacts: Record<string, SessionArtifact>;
  connections: Connection[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  artifactPlugConnections?: ArtifactPlugConnection[];
  plugComposerAttachments?: Record<string, AttachedArtifactRef[]>;
}

function plugContextFromState(ctx: ArtifactRemoteUpdateContext) {
  return {
    artifactPlugConnections: ctx.artifactPlugConnections ?? [],
    canvasArtifactNodes: ctx.canvasArtifactNodes,
    plugComposerAttachments: ctx.plugComposerAttachments ?? {},
    sessionArtifacts: ctx.sessionArtifacts,
  };
}

/** True when any chat card lists this id as its committed output artefact. */
export function isSessionOutputArtifact(
  artifactId: string,
  cards: Record<string, Card>,
): boolean {
  for (const card of Object.values(cards)) {
    if (card.outputArtifactId === artifactId) return true;
  }
  return false;
}

function resolveCardArtifactUpdateTarget(
  card: Card,
  ctx: ArtifactRemoteUpdateContext,
): string | null {
  return (
    resolveEditingArtifactId(
      card,
      ctx.cards,
      ctx.connections,
      ctx.cardOrder,
      plugContextFromState(ctx),
    ) ?? card.outputArtifactId ?? null
  );
}

/** Whether a card turn is actively building the next version of an existing artefact. */
export function isCardBuildingArtifactVersion(
  card: Card,
  artifactId: string,
  ctx: ArtifactRemoteUpdateContext,
): boolean {
  if (!isQaTurnInProgress(card, ctx.canvasArtifactNodes)) return false;

  const art = ctx.sessionArtifacts[artifactId];
  if (!art || art.versions.length === 0) return false;

  if (resolveCardArtifactUpdateTarget(card, ctx) !== artifactId) return false;

  if (card.artifactPayload) return true;
  if ((card.pendingEmittedArtifacts?.length ?? 0) > 0) return true;

  if (card.thinkingLabel && ARTIFACT_WORK_LABEL.test(card.thinkingLabel)) {
    return true;
  }

  const responseType = card.responseType ?? "text";
  if (responseType !== "text" && STRUCTURED_RESPONSE_TYPES.has(responseType)) {
    return true;
  }

  if (isCardAskInFlight(card.id) && responseType !== "text") {
    return true;
  }

  return false;
}

/** Card id of another chat currently building the next version, if any. */
export function findRemoteArtifactUpdatingCardId(
  artifactId: string,
  sourceCardId: string,
  ctx: ArtifactRemoteUpdateContext,
): string | null {
  if (!isSessionOutputArtifact(artifactId, ctx.cards)) return null;

  for (const cardId of ctx.cardOrder) {
    if (cardId === sourceCardId) continue;
    const card = ctx.cards[cardId];
    if (!card || card.status === "empty") continue;
    if (isCardBuildingArtifactVersion(card, artifactId, ctx)) return cardId;
  }
  return null;
}

/** Output artefact on canvas being versioned from a different chat turn. */
export function isOutputArtifactRemoteVersionInProgress(
  artifactId: string,
  sourceCardId: string,
  ctx: ArtifactRemoteUpdateContext,
): boolean {
  return findRemoteArtifactUpdatingCardId(artifactId, sourceCardId, ctx) != null;
}
