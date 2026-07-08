import { afterEach, describe, expect, it, vi } from "vitest";
import { cancelCardAsk } from "@/lib/cardAskRegistry";
import {
  clearQaTurnTimeout,
  expireQaTurn,
  qaTurnTimeoutMessage,
  startQaTurnTimeout,
} from "@/lib/qaTurnTimeout";
import {
  CUSTOM_UI_TURN_TIMEOUT_MS,
  QA_TURN_TIMEOUT_MS,
} from "@/lib/qaTurnLimits";
import { useCanvasStore } from "@/lib/store";

function resetStore() {
  useCanvasStore.setState({
    cards: {},
    canvasArtifactNodes: {},
    canvasArtifactOrder: [],
  });
}

describe("qaTurnTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
    clearQaTurnTimeout("c1");
    cancelCardAsk("c1");
    resetStore();
  });

  it("expires an in-flight turn with Try-again error copy", () => {
    useCanvasStore.setState({
      cards: {
        c1: {
          id: "c1",
          threadId: "t1",
          question: "Explain recursion",
          answer: "",
          status: "thinking",
          parentCardId: null,
          parentConversationId: null,
          position: { x: 0, y: 0 },
        },
      },
    });

    expireQaTurn("c1");

    const card = useCanvasStore.getState().cards.c1;
    expect(card.status).toBe("done");
    expect(card.answer).toMatch(/timed out after 3 minutes/i);
    expect(card.answer.startsWith("⚠️")).toBe(true);
    expect(card.thinkingLabel).toBeUndefined();
    expect(card.artifactPayload).toBeUndefined();
  });

  it("preserves unchanged copy for custom UI edits", () => {
    useCanvasStore.setState({
      cards: {
        c1: {
          id: "c1",
          threadId: "t1",
          question: "Change the custom UI theme to dark mode",
          answer: "",
          status: "streaming",
          outputArtifactId: "art-1",
          parentCardId: null,
          parentConversationId: null,
          position: { x: 0, y: 0 },
        },
      },
      sessionArtifacts: {
        "art-1": {
          id: "art-1",
          kind: "custom",
          title: "App",
          versions: [
            {
              id: "v1",
              createdAt: 0,
              payload: { type: "custom", title: "App", data: { html: "<div/>" } },
            },
          ],
        },
      },
    });

    expect(qaTurnTimeoutMessage("c1")).toMatch(/unchanged/i);
  });

  it("fires the watchdog after the hard limit", () => {
    vi.useFakeTimers();
    useCanvasStore.setState({
      cards: {
        c1: {
          id: "c1",
          threadId: "t1",
          question: "Slow task",
          answer: "",
          status: "thinking",
          parentCardId: null,
          parentConversationId: null,
          position: { x: 0, y: 0 },
        },
      },
    });

    startQaTurnTimeout("c1");
    vi.advanceTimersByTime(QA_TURN_TIMEOUT_MS - 1);
    expect(useCanvasStore.getState().cards.c1.status).toBe("thinking");

    vi.advanceTimersByTime(1);
    expect(useCanvasStore.getState().cards.c1.status).toBe("done");
    expect(useCanvasStore.getState().cards.c1.answer).toMatch(/timed out/i);
  });

  it("uses a longer watchdog for custom UI builds", () => {
    vi.useFakeTimers();
    useCanvasStore.setState({
      cards: {
        c1: {
          id: "c1",
          threadId: "t1",
          question: "Build a custom UI dashboard",
          answer: "",
          status: "thinking",
          parentCardId: null,
          parentConversationId: null,
          position: { x: 0, y: 0 },
        },
      },
    });

    startQaTurnTimeout("c1");
    vi.advanceTimersByTime(QA_TURN_TIMEOUT_MS);
    expect(useCanvasStore.getState().cards.c1.status).toBe("thinking");

    vi.advanceTimersByTime(CUSTOM_UI_TURN_TIMEOUT_MS - QA_TURN_TIMEOUT_MS);
    expect(useCanvasStore.getState().cards.c1.status).toBe("done");
    expect(useCanvasStore.getState().cards.c1.answer).toMatch(/timed out after 5 minutes/i);
  });

  it("no-ops when the turn already finished", () => {
    useCanvasStore.setState({
      cards: {
        c1: {
          id: "c1",
          threadId: "t1",
          question: "Done",
          answer: "All good",
          status: "done",
          parentCardId: null,
          parentConversationId: null,
          position: { x: 0, y: 0 },
        },
      },
    });

    expireQaTurn("c1");
    expect(useCanvasStore.getState().cards.c1.answer).toBe("All good");
  });
});
