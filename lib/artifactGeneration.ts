import type { EmittedArtifact, ResponseType } from "@/lib/artifactTypes";
import { findCanvasNodeByArtifactId } from "@/lib/canvasArtifacts";
import { applyEmittedArtifact } from "@/lib/dummyLLM";
import {
  appendPendingEmittedArtifact,
  processArtifactSpawnQueue,
} from "@/lib/processArtifactSpawnQueue";
export { shouldEarlySpawnArtifact } from "@/lib/processArtifactSpawnQueue";
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

  const targetArtifactId = card
    ? (resolveEditingArtifactId(
        card,
        state.cards,
        state.connections,
        state.cardOrder,
      ) ?? card.outputArtifactId)
    : null;

  if (payload && targetArtifactId) {
    const art = state.sessionArtifacts[targetArtifactId];
    if (
      art &&
      ((payload.type === "table" && art.kind === "table") ||
        (payload.type === "custom" && art.kind === "custom") ||
        (payload.type === "timeline" && art.kind === "timeline") ||
        (payload.type === "calendar" && art.kind === "calendar") ||
        (payload.type === "todo" && art.kind === "todo"))
    ) {
      appendStreamedArtifactVersion(
        cardId,
        targetArtifactId,
        payload,
        applied.responseType,
      );
      return;
    }
  }

  appendPendingEmittedArtifact(cardId, emitted);
}

export function handleArtifactOnDone(cardId: string): string | null {
  return finalizeCardResponse(cardId, {});
}

/** Commit artifacts and mark the card done in one store update. */
export function finalizeCardResponse(
  cardId: string,
  opts: { responseType?: ResponseType },
): string | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  const hasQueue =
    (card.pendingEmittedArtifacts?.length ?? 0) > 0 || !!card.artifactPayload;

  if (!hasQueue) {
    useCanvasStore.setState((current) => {
      const base = current.cards[cardId];
      if (!base) return current;
      return {
        cards: {
          ...current.cards,
          [cardId]: {
            ...base,
            status: "done",
            thinkingLabel: undefined,
            pendingFiles: undefined,
            responseType: opts.responseType ?? base.responseType ?? "text",
          },
        },
      };
    });
    return null;
  }

  const artifactId = processArtifactSpawnQueue(cardId);

  if (opts.responseType) {
    useCanvasStore.getState().updateCard(cardId, {
      responseType: opts.responseType,
    });
  }

  return artifactId;
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
