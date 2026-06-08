import { materializeCardArtifact } from "@/lib/materializeCardArtifact";
import { imagesPayloadFromCardImages } from "@/lib/artifactTypes";
import {
  canAppendArtifactVersion,
  resolveEditingArtifactId,
} from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

/** Commit streaming payload or images to session registry after a turn completes. */
export function commitCardArtifact(cardId: string): {
  artifactId: string;
  versionId: string;
} | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  const result = materializeCardArtifact(card, state.sessionArtifacts, {
    cards: state.cards,
    connections: state.connections,
    cardOrder: state.cardOrder,
  });
  if (!result) return null;

  useCanvasStore.setState((current) => ({
    sessionArtifacts: result.sessionArtifacts,
    cards: {
      ...current.cards,
      [cardId]: result.card,
    },
  }));

  return { artifactId: result.artifactId, versionId: result.versionId };
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

  const resolvedId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
  );
  const existingId =
    resolvedId &&
    canAppendArtifactVersion(state.sessionArtifacts[resolvedId], payload)
      ? resolvedId
      : null;

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
