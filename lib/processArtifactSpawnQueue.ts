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
  type SessionArtifact,
} from "@/lib/sessionArtifacts";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

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
): ArtifactPayload[] {
  if (!card.outputArtifactId) return payloads;
  const art = sessionArtifacts[card.outputArtifactId];
  if (!art) return payloads;
  return payloads.filter((p) => payloadToArtifactKind(p) !== art.kind);
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

  const payloads = filterAlreadySpawnedPayloads(
    card,
    rawPayloads,
    state.sessionArtifacts,
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
          pendingFiles: undefined,
          pendingEmittedArtifacts: undefined,
          responseType,
        },
      },
    }));
    return card.outputArtifactId ?? null;
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
        },
      );

      if (!materialized) return current;

      artifactId = materialized.artifactId;
      versionId = materialized.versionId;

      return {
        sessionArtifacts: materialized.sessionArtifacts,
        cards: {
          ...current.cards,
          [cardId]: {
            ...materialized.card,
            status: "done",
            thinkingLabel: undefined,
            pendingFiles: undefined,
            pendingEmittedArtifacts: undefined,
            responseType,
          },
        },
      };
    });

    if (artifactId && versionId) {
      const store = useCanvasStore.getState();
      const side: ArtifactSpawnSide =
        existingSpawnCount > 0
          ? pickAlternateSpawnSide(
              cardId,
              store.canvasArtifactNodes,
              store.cards,
            )
          : "right";

      store.spawnCanvasArtifact(artifactId, versionId, {
        focus: true,
        payload: autoPayload,
        side,
      });
    }
  } else {
    useCanvasStore.setState((current) => ({
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
      state.sessionArtifacts,
      state.cards,
      state.connections,
      state.cardOrder,
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
