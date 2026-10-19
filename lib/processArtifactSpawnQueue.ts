import {
  emittedToPayload,
  payloadToArtifactKind,
  type ArtifactPayload,
  type EmittedArtifact,
  type ResponseType,
} from "@/lib/artifactTypes";
import { detectUserRequestedArtifactKind } from "@/lib/artifactIntent";
import { isEditingKind } from "@/lib/artifactDrafts";
import type { ArtifactKind } from "@/lib/artifactTypes";
import {
  findGeneratingPreviewNode,
  findPermissionPreviewNode,
  getNodesForCard,
  pickAlternateSpawnSide,
  type ArtifactSpawnSide,
} from "@/lib/canvasArtifacts";
import { materializeCardArtifact } from "@/lib/materializeCardArtifact";
import { sortArtifactsByPriority } from "@/lib/artifactSpawnPriority";
import {
  resolveArtifactTargetId,
  resolveEditingArtifactId,
  canAppendArtifactVersion,
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import { isQaTurnInProgress } from "@/lib/qaStreamDisplay";
import {
  notifyArtifactFailureForCard,
  pushArtifactErrorUpdate,
} from "@/lib/artifactUpdateNotify";
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

/**
 * Pick the payload that becomes the card's primary output. Every other payload
 * in the turn is still created — this only decides which one leads.
 */
export function pickAutoSpawnPayload(
  payloads: ArtifactPayload[],
  userRequestedKind: ReturnType<typeof detectUserRequestedArtifactKind>,
  existingSpawnCount: number,
): ArtifactPayload | null {
  if (payloads.length === 0) return null;
  if (existingSpawnCount > 0) return null;

  if (userRequestedKind) {
    const requested = payloads.find(
      (p) => payloadToArtifactKind(p) === userRequestedKind,
    );
    if (requested) return requested;
  }

  return payloads[0];
}

/** Create an additional artifact from this turn and place it on the canvas. */
function spawnAdditionalPayload(cardId: string, payload: ArtifactPayload): void {
  const store = useCanvasStore.getState();
  const { artifactId, versionId } = store.createArtifactVersion(
    null,
    payload,
    cardId,
  );
  const side = pickAlternateSpawnSide(
    cardId,
    store.canvasArtifactNodes,
    store.cards,
  );
  store.spawnCanvasArtifact(artifactId, versionId, {
    payload,
    side,
    focus: false,
  });
  if (!useCanvasStore.getState().cards[cardId]?.outputArtifactId) {
    store.updateCard(cardId, {
      outputArtifactId: artifactId,
      outputArtifactVersionId: versionId,
      responseType: payload.type === "video" ? "images" : payload.type,
    });
  }
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
        pushArtifactErrorUpdate({
          cardId,
          kind: payloadToArtifactKind(autoPayload),
          title: autoPayload.title,
          detail: "Couldn't generate",
        });
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

    spawnAdditionalPayload(cardId, payload);
  }

  notifyArtifactFailureForCard(cardId);

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

  const kind = payloadToArtifactKind(applied);
  ensureEarlyCanvasPlaceholder(cardId, kind, applied.title);
}

/**
 * Whether an early placeholder spawn is allowed for this artifact kind. Each
 * kind gets its own skeleton, so a turn that produces a table and a map shows
 * both loading side by side.
 */
export function shouldEarlySpawnArtifact(
  cardId: string,
  kind: ArtifactKind,
): boolean {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return false;

  if (findGeneratingPreviewNode(state.canvasArtifactNodes, cardId, kind)) {
    return false;
  }

  // This card already produced an artifact of this kind (a re-run).
  const hasSameKind = getNodesForCard(state.canvasArtifactNodes, cardId).some(
    (n) =>
      !!n.artifactId && state.sessionArtifacts[n.artifactId]?.kind === kind,
  );
  if (hasSameKind) return false;

  return true;
}

/** Place a loading artifact node beside the card as soon as the turn starts. */
export function ensureEarlyCanvasPlaceholder(
  cardId: string,
  kind: ArtifactKind,
  title?: string,
): void {
  if (!shouldEarlySpawnArtifact(cardId, kind)) return;

  const store = useCanvasStore.getState();
  // Table and custom edits surface the existing node below; other kinds just
  // update in place, so a skeleton beside them would be a stray.
  if (kind !== "table" && kind !== "custom" && isEditingKind(cardId, kind)) {
    return;
  }
  if (kind === "table") {
    store.ensurePendingTableArtifact(cardId);
    return;
  }
  if (kind === "custom") {
    store.ensurePendingCustomArtifact(cardId);
    return;
  }

  const card = store.cards[cardId];
  const resolvedTitle =
    title?.trim() ||
    card?.artifactPayload?.title ||
    card?.question.slice(0, 48) ||
    kind;
  store.spawnGeneratingArtifactPreview(cardId, kind, resolvedTitle);
}
