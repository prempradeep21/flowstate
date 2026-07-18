"use client";

import { useCallback, useEffect, useRef } from "react";
import { askClaude } from "@/lib/claudeClient";
import { beginCardAsk, endCardAsk, registerCardAsk } from "@/lib/cardAskRegistry";
import {
  ensureEarlyCanvasPlaceholder,
  finalizeCardResponse,
  handleStreamArtifact,
  resolveEditingPayloadForApi,
  shouldEarlySpawnArtifact,
} from "@/lib/artifactGeneration";
import { resolvePrimaryArtifactKind } from "@/lib/artifactIntent";
import type { ArtifactKind } from "@/lib/artifactTypes";
import type { AskHandle } from "@/lib/dummyLLM";
import { turnMetricsOnSubmit } from "@/lib/qaTurnMetrics";
import { useCanvasStore } from "@/lib/store";

const CUSTOM_UI_THINKING =
  /building custom|updating custom|applying theme|importing html|planning ui|building interface|reviewing ui|saving custom|connecting to cursor|orchestrating ui|preparing ui|reasoning/i;

/** Starts and manages the Claude/custom-ui ask lifecycle for one card. */
export function useCardAsk(cardId: string, enabled: boolean) {
  const updateCard = useCanvasStore((s) => s.updateCard);
  const selectedModel = useCanvasStore((s) => s.selectedModel);
  const card = useCanvasStore((s) => s.cards[cardId]);
  const askHandleRef = useRef<AskHandle | null>(null);
  const askGenerationRef = useRef(0);
  const startedForRef = useRef<string | null>(null);

  const restartAsk = useCallback(() => {
    askHandleRef.current?.cancel();
    askHandleRef.current = null;
    askGenerationRef.current += 1;
    startedForRef.current = null;
  }, []);

  useEffect(() => {
    return registerCardAsk(cardId, { cancel: restartAsk });
  }, [cardId, restartAsk]);

  useEffect(() => {
    if (!enabled || !card || card.status !== "thinking") {
      // Only forget the started question once the turn has actually ended.
      // Mid-stream the status flips thinking → streaming → thinking (artifact
      // progress labels go through onThinking); resetting on "streaming" made
      // each flip back to "thinking" cancel the live stream and re-issue the
      // whole /api/chat request in a loop until the turn watchdog expired it.
      if (!card || card.status === "done" || card.status === "empty") {
        startedForRef.current = null;
      }
      return;
    }
    if (startedForRef.current === card.question) return;

    askHandleRef.current?.cancel();
    askHandleRef.current = null;
    startedForRef.current = card.question;
    const generation = askGenerationRef.current;

    if (!useCanvasStore.getState().cards[cardId]?.askStartedAt) {
      updateCard(cardId, {
        ...turnMetricsOnSubmit(),
        sdkBuildStages: undefined,
      });
    }

    const askToken = beginCardAsk(cardId);
    const editingPayload = resolveEditingPayloadForApi(cardId);
    const earlyKind = resolvePrimaryArtifactKind(
      card.question,
      editingPayload?.payload as { type?: string } | null,
    );
    if (earlyKind) {
      ensureEarlyCanvasPlaceholder(cardId, earlyKind);
    }

    askHandleRef.current = askClaude(
      cardId,
      card.parentConversationId ?? null,
      card.question,
      selectedModel,
      {
        onThinking: (label) => {
          if (generation !== askGenerationRef.current) return;
          updateCard(cardId, {
            status: "thinking",
            thinkingLabel: label,
          });
          if (/building table/i.test(label)) {
            if (shouldEarlySpawnArtifact(cardId, "table")) {
              useCanvasStore.getState().ensurePendingTableArtifact(cardId);
            }
          } else if (CUSTOM_UI_THINKING.test(label)) {
            if (shouldEarlySpawnArtifact(cardId, "custom")) {
              useCanvasStore.getState().ensurePendingCustomArtifact(cardId);
            }
          }
        },
        onSdkBuildStages: (stages) => {
          if (generation !== askGenerationRef.current) return;
          updateCard(cardId, { sdkBuildStages: stages });
          if (shouldEarlySpawnArtifact(cardId, "custom")) {
            useCanvasStore.getState().ensurePendingCustomArtifact(cardId);
          }
        },
        onToken: (next) => {
          if (generation !== askGenerationRef.current) return;
          const current = useCanvasStore.getState().cards[cardId];
          updateCard(cardId, {
            status: "streaming",
            answer: next,
            thinkingLabel: current?.thinkingLabel,
          });
        },
        onImages: (images) => {
          if (generation !== askGenerationRef.current) return;
          updateCard(cardId, {
            images,
            responseType: "image",
          });
        },
        onResponseType: (responseType) => {
          if (generation !== askGenerationRef.current) return;
          updateCard(cardId, { responseType });
          if (
            responseType !== "text" &&
            responseType !== "image" &&
            responseType !== "images"
          ) {
            ensureEarlyCanvasPlaceholder(cardId, responseType as ArtifactKind);
          }
        },
        onArtifact: (artifact) => {
          if (generation !== askGenerationRef.current) return;
          handleStreamArtifact(cardId, artifact);
        },
        onDone: ({ responseType }) => {
          endCardAsk(cardId, askToken);
          if (generation === askGenerationRef.current) {
            finalizeCardResponse(cardId, {
              responseType:
                responseType ??
                useCanvasStore.getState().cards[cardId]?.responseType ??
                "text",
            });
          }
          requestAnimationFrame(() => {
            const state = useCanvasStore.getState();
            const hasBottomChild = state.connections.some(
              (c) =>
                c.from === cardId &&
                (c.fromSide === "bottom" || c.fromSide == null),
            );
            if (hasBottomChild) {
              state.relayoutFollowUpChainFromParent(cardId);
            }
          });
        },
      },
    );
  }, [
    enabled,
    cardId,
    card?.question,
    card?.status,
    card?.parentConversationId,
    selectedModel,
    updateCard,
  ]);

  useEffect(() => {
    return () => {
      askHandleRef.current?.cancel();
      askHandleRef.current = null;
      // Reset so a remount restarts the ask — under StrictMode's simulated
      // unmount the cancel above would otherwise kill a thinking card's ask
      // for good (the re-run effect skips identical questions).
      askGenerationRef.current += 1;
      startedForRef.current = null;
    };
  }, [cardId]);

  return { restartAsk };
}
