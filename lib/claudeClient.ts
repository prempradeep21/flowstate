"use client";

import { ClaudeModel, CardImage, useCanvasStore } from "./store";
import { AskCallbacks, AskHandle } from "./dummyLLM";

function getAncestorHistory(
  cardId: string,
): Array<{ question: string; answer: string }> {
  const state = useCanvasStore.getState();
  const history: Array<{ question: string; answer: string }> = [];
  let current = state.cards[cardId];
  while (current?.parentCardId) {
    const parent = state.cards[current.parentCardId];
    if (parent?.answer) {
      history.unshift({ question: parent.question, answer: parent.answer });
    }
    current = parent!;
  }
  return history;
}

export function askClaude(
  cardId: string,
  question: string,
  model: ClaudeModel,
  cb: AskCallbacks,
): AskHandle {
  const history = getAncestorHistory(cardId);
  let cancelled = false;
  const controller = new AbortController();

  const run = async () => {
    cb.onThinking("Thinking");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, model, history }),
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
