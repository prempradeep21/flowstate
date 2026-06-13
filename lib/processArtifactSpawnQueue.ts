import {
  emittedToPayload,
  payloadToArtifactKind,
  type ArtifactPayload,
  type EmittedArtifact,
  type ResponseType,
} from "@/lib/artifactTypes";
import { detectUserRequestedArtifactKind } from "@/lib/artifactIntent";
import {
  computeArtifactSpawnPosition,
  findPermissionPreviewNode,
  getNodesForCard,
  pickAlternateSpawnSide,
  type ArtifactSpawnSide,
} from "@/lib/canvasArtifacts";
import { materializeCardArtifact } from "@/lib/materializeCardArtifact";
import {
  getPermissionCopy,
  sortArtifactsByPriority,
} from "@/lib/artifactSpawnPriority";
import {
  resolveArtifactTargetId,
  resolveEditingArtifactId,
  canAppendArtifactVersion,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { isQaTurnInProgress } from "@/lib/qaStreamDisplay";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

function resolveDoneThinkingLabel(cardId: string, card: Card): string | undefined {
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

function payloadsForTurn(card: Card): ArtifactPayload[] {
  const fromEmitted = (card.pendingEmittedArtifacts ?? []).map(emittedToPayload);
  if (fromEmitted.length > 0) {
    return sortArtifactsByPriority(fromEmitted);
  }
  if (card.artifactPayload) {
    return [card.artifactPayload];
  }
  return [];
}

function primaryResponseType(payloads: ArtifactPayload[]): ResponseType {
  if (payloads.length === 0) return "text";
  const first = payloads[0];
  if (first.type === "video") return "images";
  return first.type;
}

function countMaterializedSpawnsForCard(cardId: string): number {
  const state = useCanvasStore.getState();
  return getNodesForCard(state.canvasArtifactNodes, cardId).filter(
    (n) => !n.permissionPreview && n.artifactId,
  ).length;
}

function filterAlreadySpawnedPayloads(
  card: Card,
  payloads: ArtifactPayload[],
  sessionArtifacts: Record<string, SessionArtifact>,
  editingArtifactId: string | null,
): ArtifactPayload[] {
  if (!card.outputArtifactId) return payloads;
  const art = sessionArtifacts[card.outputArtifactId];
  if (!art) return payloads;
  // Same-kind payloads are updates when output targets the artefact being edited.
  if (editingArtifactId && editingArtifactId === card.outputArtifactId) {
    return payloads.filter((p) => canAppendArtifactVersion(art, p));
  }
  return payloads.filter((p) => payloadToArtifactKind(p) !== art.kind);
}

function plugContextFromState(state: ReturnType<typeof useCanvasStore.getState>) {
  return {
    artifactPlugConnections: state.artifactPlugConnections,
    canvasArtifactNodes: state.canvasArtifactNodes,
    plugComposerAttachments: state.plugComposerAttachments,
    sessionArtifacts: state.sessionArtifacts,
  };
}

/** Pick the one payload that may spawn without a permission prompt. */
export function pickAutoSpawnPayload(
  payloads: ArtifactPayload[],
  userRequestedKind: ReturnType<typeof detectUserRequestedArtifactKind>,
  existingSpawnCount: number,
): ArtifactPayload | null {
  if (payloads.length === 0) return null;
  if (existingSpawnCount > 0) return null;

  if (userRequestedKind) {
    return (
      payloads.find(
        (p) => payloadToArtifactKind(p) === userRequestedKind,
      ) ?? null
    );
  }

  return payloads[0];
}

function spawnPayloadWithPosition(
  cardId: string,
  payload: ArtifactPayload,
): void {
  const store = useCanvasStore.getState();
  if (findPermissionPreviewNode(store.canvasArtifactNodes, cardId, payload)) {
    return;
  }
  const position = computeArtifactSpawnPosition(
    cardId,
    store.canvasArtifactNodes,
    store.cards,
    { payload, sessionArtifacts: store.sessionArtifacts },
  );
  store.spawnPermissionPreview(cardId, payload, {
    copy: getPermissionCopy(
      payloadToArtifactKind(payload),
      payload.type === "map" || payload.type === "streetview"
        ? payload.data.place.label ?? payload.data.place.name
        : undefined,
    ),
    position,
  });
}

/** Materialize and spawn artifacts from a completed card turn. */
export function processArtifactSpawnQueue(cardId: string): string | null {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return null;

  const rawPayloads = payloadsForTurn(card);
  if (rawPayloads.length === 0) return null;

  const pendingQueue = card.pendingEmittedArtifacts?.length ?? 0;
  if (
    pendingQueue === 0 &&
    rawPayloads.every((payload) =>
      findPermissionPreviewNode(state.canvasArtifactNodes, cardId, payload),
    )
  ) {
    return card.outputArtifactId ?? null;
  }

  const plugCtx = plugContextFromState(state);
  const editingArtifactId =
    resolveEditingArtifactId(
      card,
      state.cards,
      state.connections,
      state.cardOrder,
      plugCtx,
    ) ?? card.outputArtifactId;

  const payloads = filterAlreadySpawnedPayloads(
    card,
    rawPayloads,
    state.sessionArtifacts,
    editingArtifactId ?? null,
  );
  const responseType = primaryResponseType(rawPayloads);

  if (payloads.length === 0) {
    useCanvasStore.setState((current) => ({
      cards: {
        ...current.cards,
        [cardId]: {
          ...current.cards[cardId],
          status: "done",
          thinkingLabel: undefined,
          artifactPayload: undefined,
          pendingFiles: undefined,
          pendingEmittedArtifacts: undefined,
          responseType,
        },
      },
    }));
    return editingArtifactId ?? null;
  }

  const userRequestedKind = detectUserRequestedArtifactKind(card.question);
  const existingSpawnCount = countMaterializedSpawnsForCard(cardId);
  const autoPayload = pickAutoSpawnPayload(
    payloads,
    userRequestedKind,
    existingSpawnCount,
  );

  let artifactId: string | null = card.outputArtifactId ?? null;
  let versionId: string | null = card.outputArtifactVersionId ?? null;

  if (autoPayload) {
    useCanvasStore.setState((current) => {
      const workingCard: Card = {
        ...current.cards[cardId],
        artifactPayload: autoPayload,
        pendingEmittedArtifacts: undefined,
      };

      const materialized = materializeCardArtifact(
        workingCard,
        current.sessionArtifacts,
        {
          cards: current.cards,
          connections: current.connections,
          cardOrder: current.cardOrder,
          artifactPlugConnections: current.artifactPlugConnections,
          canvasArtifactNodes: current.canvasArtifactNodes,
          plugComposerAttachments: current.plugComposerAttachments,
        },
      );

      if (!materialized) {
        return {
          cards: {
            ...current.cards,
            [cardId]: {
              ...current.cards[cardId],
              status: "done",
              thinkingLabel: undefined,
              pendingFiles: undefined,
              pendingEmittedArtifacts: undefined,
              responseType,
            },
          },
        };
      }

      artifactId = materialized.artifactId;
      versionId = materialized.versionId;

      return {
        sessionArtifacts: materialized.sessionArtifacts,
        cards: {
          ...current.cards,
          [cardId]: {
            ...materialized.card,
            status: "done",
            thinkingLabel: resolveDoneThinkingLabel(cardId, {
              ...materialized.card,
              status: "done",
            }),
            pendingFiles: undefined,
            pendingEmittedArtifacts: undefined,
            responseType,
          },
        },
      };
    });

    if (artifactId && versionId) {
      const store = useCanvasStore.getState();
      const alreadyOnCanvas = Boolean(
        Object.values(store.canvasArtifactNodes).some(
          (n) => n.artifactId === artifactId,
        ),
      );
      const side: ArtifactSpawnSide =
        !alreadyOnCanvas && existingSpawnCount > 0
          ? pickAlternateSpawnSide(
              cardId,
              store.canvasArtifactNodes,
              store.cards,
            )
          : "right";

      store.spawnCanvasArtifact(artifactId, versionId, {
        focus: true,
        payload: autoPayload,
        ...(alreadyOnCanvas ? {} : { side }),
      });
    }
  } else {
    useCanvasStore.setState((current) => ({
      cards: {
        ...current.cards,
        [cardId]: {
          ...current.cards[cardId],
          status: "done",
          thinkingLabel: resolveDoneThinkingLabel(
            cardId,
            current.cards[cardId]!,
          ),
          pendingFiles: undefined,
          pendingEmittedArtifacts: undefined,
          responseType,
        },
      },
    }));
  }

  for (const payload of payloads) {
    if (autoPayload && payload === autoPayload) continue;
    if (
      autoPayload &&
      payloadToArtifactKind(autoPayload) === payloadToArtifactKind(payload) &&
      payload.title === autoPayload.title
    ) {
      continue;
    }

    const targetId = resolveArtifactTargetId(
      card,
      payload,
      useCanvasStore.getState().sessionArtifacts,
      useCanvasStore.getState().cards,
      useCanvasStore.getState().connections,
      useCanvasStore.getState().cardOrder,
      plugContextFromState(useCanvasStore.getState()),
    );
    if (targetId) {
      const { versionId } = useCanvasStore
        .getState()
        .createArtifactVersion(targetId, payload, cardId);
      useCanvasStore.getState().spawnCanvasArtifact(targetId, versionId, {
        focus: false,
      });
      useCanvasStore.getState().updateCard(cardId, {
        outputArtifactId: targetId,
        outputArtifactVersionId: versionId,
        responseType: payload.type === "video" ? "images" : payload.type,
      });
      continue;
    }

    spawnPayloadWithPosition(cardId, payload);
  }

  useCanvasStore.getState().updateCard(cardId, {
    artifactPayload: undefined,
    pendingEmittedArtifacts: undefined,
  });

  return artifactId;
}

export function appendPendingEmittedArtifact(
  cardId: string,
  emitted: EmittedArtifact,
): void {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return;

  const next: EmittedArtifact[] = [
    ...(card.pendingEmittedArtifacts ?? []),
    emitted,
  ];

  const applied = emittedToPayload(emitted);
  state.updateCard(cardId, {
    pendingEmittedArtifacts: next,
    artifactPayload: applied,
    responseType: emitted.type === "video" ? "images" : emitted.type,
    thinkingLabel: `Building ${emitted.type}…`,
  });
}

/** Whether an early placeholder spawn is allowed for this artifact kind. */
export function shouldEarlySpawnArtifact(
  cardId: string,
  kind: "table" | "custom",
): boolean {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return false;

  const userRequested = detectUserRequestedArtifactKind(card.question);
  if (userRequested && userRequested !== kind) return false;

  if (countMaterializedSpawnsForCard(cardId) > 0) return false;

  return true;
}
