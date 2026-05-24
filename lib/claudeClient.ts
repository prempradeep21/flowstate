"use client";

import {
  applyEmittedArtifact,
  AskCallbacks,
  AskHandle,
} from "@/lib/dummyLLM";
import type { EmittedArtifact, ResponseType } from "@/lib/artifactTypes";
import { buildAncestorHistory } from "@/lib/buildAncestorHistory";
import { ClaudeModel, CardImage, useCanvasStore } from "./store";

async function registerConversation(
  conversationId: string,
  parentConversationId: string | null,
): Promise<void> {
  await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ conversationId, parentConversationId }),
  });
}

export function askClaude(
  cardId: string,
  parentConversationId: string | null,
  question: string,
  model: ClaudeModel,
  cb: AskCallbacks,
): AskHandle {
  let cancelled = false;
  const controller = new AbortController();
  let responseType: ResponseType = "text";

  const run = async () => {
    cb.onThinking("Thinking");
    try {
      const state = useCanvasStore.getState();
      const history = buildAncestorHistory(
        {
          cards: state.cards,
          connections: state.connections,
        },
        cardId,
      );

      await registerConversation(cardId, parentConversationId);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          conversationId: cardId,
          parentConversationId,
          question,
          model,
          history,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        cb.onToken(`Error: HTTP ${res.status}`);
        cb.onDone({ artifactId: null, responseType: "text" });
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done || cancelled) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split("\n\n");
        buf = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6);
          if (raw === "[DONE]") continue;
          try {
            const parsed = JSON.parse(raw);
            if (parsed.images) {
              responseType = "image";
              cb.onResponseType?.("image");
              cb.onImages?.(parsed.images as CardImage[]);
            } else if (parsed.artifact) {
              const raw = parsed.artifact as {
                type?: string;
                title?: string;
                description?: string;
                data?: Record<string, unknown>;
              };
              const validTypes = [
                "table",
                "code",
                "video",
                "custom",
                "3d",
              ] as const;
              if (
                !raw.type ||
                !validTypes.includes(raw.type as (typeof validTypes)[number])
              ) {
                continue;
              }
              const artifact: EmittedArtifact = {
                type: raw.type as EmittedArtifact["type"],
                title: raw.title ?? "Artifact",
                description: raw.description,
                data: raw.data ?? {},
              };
              responseType = artifact.type;
              cb.onResponseType?.(artifact.type);
              cb.onArtifact?.(artifact);
            } else if (parsed.responseType === "image") {
              responseType = "image";
              cb.onResponseType?.("image");
            } else if (parsed.thinking) {
              cb.onThinking(parsed.thinking);
            } else if (parsed.usage) {
              useCanvasStore
                .getState()
                .addUsage(parsed.usage.inputTokens, parsed.usage.outputTokens);
            } else if (parsed.error) {
              acc = acc ? `${acc}\n\n⚠️ ${parsed.error}` : `⚠️ ${parsed.error}`;
              cb.onToken(acc);
            } else if (parsed.text) {
              acc += parsed.text;
              cb.onToken(acc);
            }
          } catch {
            // malformed chunk — skip
          }
        }
      }
    } catch (err) {
      if (!cancelled) {
        const msg = err instanceof Error ? err.message : String(err);
        cb.onToken(`⚠️ ${msg}`);
      }
    } finally {
      if (!cancelled) {
        cb.onDone({ artifactId: null, responseType });
      }
    }
  };

  run();

  return {
    cancel: () => {
      cancelled = true;
      controller.abort();
    },
  };
}

export { applyEmittedArtifact };
