import {
  payloadToArtifactKind,
  type ArtifactKind,
} from "@/lib/artifactTypes";
import { findGeneratingPreviewNode } from "@/lib/canvasArtifacts";
import { resolveArtifactPreviewStatus } from "@/lib/materializeCardArtifact";
import {
  hasQaResponseError,
  isQaTurnInProgress,
} from "@/lib/qaStreamDisplay";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { useArtifactUpdateStore } from "@/lib/artifactUpdateStore";
import { useCanvasStore } from "@/lib/store";

const MANUAL_SOURCE_PREFIXES = ["__manual", "manual-"] as const;

export function isCardSourcedArtifactBuild(
  sourceCardId: string,
  cards: Record<string, { id: string }>,
): boolean {
  if (!sourceCardId) return false;
  if (MANUAL_SOURCE_PREFIXES.some((prefix) => sourceCardId.startsWith(prefix))) {
    return false;
  }
  return Boolean(cards[sourceCardId]);
}

/** Card-generated artifacts (not manual canvas drops or catalog samples). */
export function isOutputSessionArtifact(
  artifact: SessionArtifact,
  cards: Record<string, { outputArtifactId?: string }>,
): boolean {
  for (const card of Object.values(cards)) {
    if (card.outputArtifactId === artifact.id) return true;
  }
  const first = artifact.versions[0];
  if (!first) return false;
  return isCardSourcedArtifactBuild(first.sourceCardId, cards);
}

export function pushArtifactReadyUpdate(artifactId: string, nodeId?: string): void {
  const state = useCanvasStore.getState();
  const art = state.sessionArtifacts[artifactId];
  if (!art) return;

  const node =
    (nodeId && state.canvasArtifactNodes[nodeId]) ||
    Object.values(state.canvasArtifactNodes).find((n) => n.artifactId === artifactId);
  const ver =
    (node?.versionId && getVersionById(art, node.versionId)) ||
    getLatestVersion(art);
  if (!ver) return;

  const sourceCardId = ver.sourceCardId;
  if (!isCardSourcedArtifactBuild(sourceCardId, state.cards)) return;

  useArtifactUpdateStore.getState().pushUpdate({
    dedupeKey: `ready:${artifactId}`,
    status: "ready",
    kind: art.kind,
    title: artifactDisplayTitle(art, ver),
    detail: "Ready to view",
    artifactId,
    nodeId: node?.id,
  });
}

const ARTIFACT_KINDS = new Set<ArtifactKind>([
  "table",
  "todo",
  "calendar",
  "timeline",
  "map",
  "streetview",
  "chart",
  "code",
  "custom",
  "images",
  "embed",
  "website",
  "repo",
  "google-doc",
  "audio",
  "3d",
  "stickynote",
]);

function coerceArtifactKind(kind?: string): ArtifactKind | undefined {
  if (!kind || !ARTIFACT_KINDS.has(kind as ArtifactKind)) return undefined;
  return kind as ArtifactKind;
}

export function pushArtifactErrorUpdate(opts: {
  title: string;
  detail?: string;
  cardId: string;
  kind?: string;
  artifactId?: string;
  nodeId?: string;
}): void {
  const state = useCanvasStore.getState();
  const previewNode =
    (opts.nodeId && state.canvasArtifactNodes[opts.nodeId]) ||
    findGeneratingPreviewNode(state.canvasArtifactNodes, opts.cardId);

  useArtifactUpdateStore.getState().pushUpdate({
    dedupeKey: `error:${opts.cardId}:${opts.kind ?? "artifact"}:${opts.title}`,
    status: "error",
    kind: coerceArtifactKind(opts.kind),
    title: opts.title,
    detail: opts.detail ?? "Couldn't complete",
    artifactId: opts.artifactId,
    nodeId: previewNode?.id,
    cardId: opts.cardId,
  });
}

function cardHadArtifactBuildWork(
  cardId: string,
  card: ReturnType<typeof useCanvasStore.getState>["cards"][string],
  nodes: ReturnType<typeof useCanvasStore.getState>["canvasArtifactNodes"],
): boolean {
  if (!card) return false;
  if (card.artifactPayload || (card.pendingEmittedArtifacts?.length ?? 0) > 0) {
    return true;
  }
  return Object.values(nodes).some(
    (node) =>
      node.sourceCardId === cardId &&
      (node.generatingPreview || node.permissionPreview),
  );
}

export function notifyArtifactFailureForCard(cardId: string): void {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card || card.status !== "done") return;

  const previewStatus = resolveArtifactPreviewStatus(card);
  if (previewStatus === "failed") {
    const payload = card.artifactPayload;
    if (payload) {
      pushArtifactErrorUpdate({
        cardId,
        kind: payloadToArtifactKind(payload),
        title: payload.title,
        detail: "Couldn't generate",
      });
      return;
    }

    if (
      card.images &&
      card.images.length > 0 &&
      (card.responseType === "image" || card.responseType === "images")
    ) {
      pushArtifactErrorUpdate({
        cardId,
        kind: "images",
        title: card.question.slice(0, 48) || "Images",
        detail: "Couldn't generate",
      });
    }
    return;
  }

  if (
    hasQaResponseError(card) &&
    !isQaTurnInProgress(card, state.canvasArtifactNodes) &&
    cardHadArtifactBuildWork(cardId, card, state.canvasArtifactNodes)
  ) {
    const previewNode = findGeneratingPreviewNode(
      state.canvasArtifactNodes,
      cardId,
    );
    const title =
      previewNode?.generatingPreview?.title ||
      card.artifactPayload?.title ||
      card.question.slice(0, 48) ||
      "Artifact";
    pushArtifactErrorUpdate({
      cardId,
      kind: previewNode?.generatingPreview?.kind ?? card.responseType,
      title,
      detail: "Couldn't complete",
    });
  }
}
