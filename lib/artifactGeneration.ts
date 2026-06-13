import type { EmittedArtifact, ResponseType } from "@/lib/artifactTypes";
import { applyEmittedArtifact } from "@/lib/dummyLLM";
import {
  appendPendingEmittedArtifact,
  processArtifactSpawnQueue,
} from "@/lib/processArtifactSpawnQueue";
export { shouldEarlySpawnArtifact } from "@/lib/processArtifactSpawnQueue";
import { isCardAskInFlight } from "@/lib/cardAskRegistry";
import { isQaTurnInProgress } from "@/lib/qaStreamDisplay";
import {
  getLatestVersion,
  getVersionById,
  resolveEditingArtifactId,
  canAppendArtifactVersion,
} from "@/lib/sessionArtifacts";
import { resolveCardAttachedArtifactRefs } from "@/lib/attachedArtifactRefs";
import { useCanvasStore } from "@/lib/store";

function resolveDoneThinkingLabel(
  cardId: string,
  card: NonNullable<ReturnType<typeof useCanvasStore.getState>["cards"][string]>,
): string | undefined {
  const nodes = useCanvasStore.getState().canvasArtifactNodes;
  const doneCard = { ...card, status: "done" as const };
  if (isQaTurnInProgress(doneCard, nodes)) {
    if (card.thinkingLabel?.trim()) return card.thinkingLabel;
    const payload = card.artifactPayload;
    if (payload) return `Building ${payload.type}…`;
    const pending = card.pendingEmittedArtifacts?.[0];
    if (pending) return `Building ${pending.type}…`;
    return "Building artifact…";
  }
  return undefined;
}

/** Hold streamed payload on the card until the turn succeeds and materializes. */
function updateStreamingArtifactPayload(
  cardId: string,
  payload: NonNullable<ReturnType<typeof applyEmittedArtifact>["artifactPayload"]>,
  responseType: ResponseType,
) {
  useCanvasStore.getState().updateCard(cardId, {
    responseType,
    artifactPayload: payload,
    thinkingLabel: `Building ${payload.type}…`,
  });
}

export function handleStreamArtifact(cardId: string, emitted: EmittedArtifact) {
  const applied = applyEmittedArtifact(emitted);
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  const payload = applied.artifactPayload;

  const plugContext = {
    artifactPlugConnections: state.artifactPlugConnections,
    canvasArtifactNodes: state.canvasArtifactNodes,
    plugComposerAttachments: state.plugComposerAttachments,
    sessionArtifacts: state.sessionArtifacts,
  };

  const targetArtifactId = card
    ? (resolveEditingArtifactId(
        card,
        state.cards,
        state.connections,
        state.cardOrder,
        plugContext,
      ) ?? card.outputArtifactId)
    : null;

  if (payload && targetArtifactId) {
    const art = state.sessionArtifacts[targetArtifactId];
    if (art && canAppendArtifactVersion(art, payload)) {
      updateStreamingArtifactPayload(cardId, payload, applied.responseType);
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

  if (isCardAskInFlight(cardId)) return null;

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
    useCanvasStore.getState().removeGeneratingArtifactPreview(cardId);
    return null;
  }

  const artifactId = processArtifactSpawnQueue(cardId);
  useCanvasStore.getState().removeGeneratingArtifactPreview(cardId);

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

  const plugContext = {
    artifactPlugConnections: state.artifactPlugConnections,
    canvasArtifactNodes: state.canvasArtifactNodes,
    plugComposerAttachments: state.plugComposerAttachments,
    sessionArtifacts: state.sessionArtifacts,
  };

  const artifactId = resolveEditingArtifactId(
    card,
    state.cards,
    state.connections,
    state.cardOrder,
    plugContext,
  );
  if (!artifactId) return null;

  const art = state.sessionArtifacts[artifactId];
  if (!art) return null;

  const attachedRefs = resolveCardAttachedArtifactRefs(card.id, {
    cards: state.cards,
    ...plugContext,
  });
  const attachVid = attachedRefs[0]?.versionId;
  const ver = attachVid
    ? getVersionById(art, attachVid)
    : getLatestVersion(art);
  const latest = ver ?? getLatestVersion(art);

  if (!latest) return null;

  return { artifactId, payload: latest.payload };
}
