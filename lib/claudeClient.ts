"use client";

import { buildAncestorHistory } from "@/lib/buildAncestorHistory";
import { ClaudeModel, CardImage, useCanvasStore } from "./store";
import { AskCallbacks, AskHandle } from "./dummyLLM";
import { getStoredApiKey } from "./useApiKey";

async function registerConversation(
  conversationId: string,
  parentConversationId: string | null,
  apiKey: string,
): Promise<void> {
  await fetch("/api/conversations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
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
  const apiKey = getStoredApiKey() ?? "";
  let cancelled = false;
  const controller = new AbortController();

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

      await registerConversation(cardId, parentConversationId, apiKey);

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
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
        cb.onDone({ artifactId: null });
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
              cb.onImages?.(parsed.images as CardImage[]);
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
      if (!cancelled) cb.onDone({ artifactId: null });
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
