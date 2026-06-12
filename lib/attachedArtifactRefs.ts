import type { AttachedArtifactRef, SessionArtifact } from "@/lib/sessionArtifacts";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import type {
  ArtifactPlugConnection,
  CanvasArtifactNode,
  Card,
} from "@/lib/store";

export interface AttachedArtifactResolveContext {
  cards: Record<string, Card>;
  artifactPlugConnections: ArtifactPlugConnection[];
  canvasArtifactNodes: Record<string, CanvasArtifactNode>;
  plugComposerAttachments: Record<string, AttachedArtifactRef>;
  sessionArtifacts?: Record<string, SessionArtifact>;
}

/** Resolve artefact refs plugged into a card (persisted, composer, or visual plug). */
export function resolveCardAttachedArtifactRefs(
  cardId: string,
  context: AttachedArtifactResolveContext,
): AttachedArtifactRef[] {
  const card = context.cards[cardId];
  if (card?.attachedArtifacts?.length) {
    return card.attachedArtifacts;
  }

  const composerRef = context.plugComposerAttachments[cardId];
  if (composerRef) {
    return [composerRef];
  }

  for (const conn of context.artifactPlugConnections) {
    if (conn.cardId !== cardId) continue;
    const node = context.canvasArtifactNodes[conn.artifactNodeId];
    if (!node?.artifactId) continue;
    if (node.versionId) {
      return [{ artifactId: node.artifactId, versionId: node.versionId }];
    }
    const art = context.sessionArtifacts?.[node.artifactId];
    const latest = art ? getLatestVersion(art) : undefined;
    if (latest) {
      return [{ artifactId: node.artifactId, versionId: latest.id }];
    }
  }

  return [];
}

export function primaryAttachedArtifactId(
  cardId: string,
  context: AttachedArtifactResolveContext,
): string | null {
  return resolveCardAttachedArtifactRefs(cardId, context)[0]?.artifactId ?? null;
}
