import { imagesPayloadFromCardImages } from "@/lib/artifactTypes";
import { buildImagesArtifactFromCard } from "@/lib/sessionArtifacts";
import { resolveEditingArtifactId } from "@/lib/sessionArtifacts";
import type { ArtifactPayload } from "@/lib/artifactTypes";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

/** Commit streaming payload or images to session registry after a turn completes. */
export function commitCardArtifact(cardId: string): {
  artifactId: string;
  versionId: string;
} | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  let payload: ArtifactPayload | null = null;

  if (card.artifactPayload) {
    payload = card.artifactPayload;
  } else if (
    (card.responseType === "image" || card.images?.length) &&
    card.images &&
    card.images.length > 0
  ) {
    payload = buildImagesArtifactFromCard(
      card.images,
      card.question.slice(0, 48) || "Images",
    );
  }

  if (!payload) return null;

  const existingId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
  );

  const { artifactId, versionId } = state.createArtifactVersion(
    existingId,
    payload,
    cardId,
  );

  useCanvasStore.getState().updateCard(cardId, {
    outputArtifactId: artifactId,
    outputArtifactVersionId: versionId,
    responseType: payload.type === "images" ? "images" : card.responseType,
    artifactPayload: undefined,
  });

  return { artifactId, versionId };
}

export function commitImagesArtifact(
  cardId: string,
  title?: string,
): { artifactId: string; versionId: string } | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card?.images?.length) return null;

  const payload = imagesPayloadFromCardImages(
    card.images,
    title ?? (card.question.slice(0, 48) || "Images"),
  );

  const existingId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
  );

  const { artifactId, versionId } = state.createArtifactVersion(
    existingId,
    payload,
    cardId,
  );

  state.updateCard(cardId, {
    outputArtifactId: artifactId,
    outputArtifactVersionId: versionId,
    responseType: "images",
  });

  return { artifactId, versionId };
}
