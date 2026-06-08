import type { EmittedArtifact, ResponseType } from "@/lib/artifactTypes";
import { materializeCardArtifact } from "@/lib/materializeCardArtifact";
import { findCanvasNodeByArtifactId } from "@/lib/canvasArtifacts";
import { applyEmittedArtifact } from "@/lib/dummyLLM";
import {
  getLatestVersion,
  getVersionById,
  resolveEditingArtifactId,
} from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

function appendStreamedArtifactVersion(
  cardId: string,
  outputArtifactId: string,
  payload: NonNullable<ReturnType<typeof applyEmittedArtifact>["artifactPayload"]>,
  responseType: ResponseType,
) {
  const state = useCanvasStore.getState();
  const { versionId } = state.createArtifactVersion(
    outputArtifactId,
    payload,
    cardId,
  );
  const node = findCanvasNodeByArtifactId(
    state.canvasArtifactNodes,
    outputArtifactId,
  );
  if (node) {
    state.setCanvasArtifactVersion(node.id, versionId);
  }
  state.updateCard(cardId, {
    responseType,
    artifactPayload: payload,
    outputArtifactVersionId: versionId,
    thinkingLabel: `Building ${payload.type}…`,
  });
}

export function handleStreamArtifact(cardId: string, emitted: EmittedArtifact) {
  const applied = applyEmittedArtifact(emitted);
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  const payload = applied.artifactPayload;

  if (payload && card?.outputArtifactId) {
    const art = state.sessionArtifacts[card.outputArtifactId];
    if (
      (payload.type === "table" && art?.kind === "table") ||
      (payload.type === "custom" && art?.kind === "custom")
    ) {
      appendStreamedArtifactVersion(
        cardId,
        card.outputArtifactId,
        payload,
        applied.responseType,
      );
      return;
    }
  }

  state.updateCard(cardId, {
    responseType: applied.responseType,
    artifactPayload: payload,
    thinkingLabel: payload ? `Building ${payload.type}…` : undefined,
  });
}

export function handleArtifactOnDone(cardId: string): string | null {
  const result = finalizeCardResponse(cardId, {});
  return result;
}

/** Commit artifacts and mark the card done in one store update. */
export function finalizeCardResponse(
  cardId: string,
  opts: { responseType?: ResponseType },
): string | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  const materialized = materializeCardArtifact(card, state.sessionArtifacts, {
    cards: state.cards,
    connections: state.connections,
    cardOrder: state.cardOrder,
  });

  let artifactId: string | null = null;
  let versionId: string | null = null;

  useCanvasStore.setState((current) => {
    const baseCard = materialized
      ? materialized.card
      : current.cards[cardId];
    if (!baseCard) return current;

    artifactId = materialized?.artifactId ?? null;
    versionId = materialized?.versionId ?? null;

    return {
      ...(materialized
        ? { sessionArtifacts: materialized.sessionArtifacts }
        : {}),
      cards: {
        ...current.cards,
        [cardId]: {
          ...baseCard,
          status: "done",
          thinkingLabel: undefined,
          pendingFiles: undefined,
          responseType:
            opts.responseType ?? baseCard.responseType ?? "text",
        },
      },
    };
  });

  if (artifactId && versionId) {
    useCanvasStore
      .getState()
      .spawnCanvasArtifact(artifactId, versionId, { focus: true });
    return artifactId;
  }
  return null;
}

export function resolveEditingPayloadForApi(cardId: string): {
  artifactId: string;
  payload: unknown;
} | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  const artifactId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
  );
  if (!artifactId) return null;

  const art = state.sessionArtifacts[artifactId];
  if (!art) return null;

  const attachVid = card.attachedArtifacts?.[0]?.versionId;
  const ver = attachVid
    ? getVersionById(art, attachVid)
    : getLatestVersion(art);
  const latest = ver ?? getLatestVersion(art);

  if (!latest) return null;

  return { artifactId, payload: latest.payload };
}
