import { describe, expect, it } from "vitest";
import { extractAssistantText } from "@/lib/cursorSdk/extractAssistantText";

function assistant(text: string) {
  return {
    type: "assistant" as const,
    message: {
      content: [{ type: "text" as const, text }],
    },
  };
}

describe("extractAssistantText", () => {
  it("returns trimmed text from a single assistant event", () => {
    expect(extractAssistantText([assistant("  Hello world.  ")])).toBe(
      "Hello world.",
    );
  });

  it("uses the final cumulative snapshot when events grow", () => {
    expect(
      extractAssistantText([
        assistant("Building a minimal"),
        assistant("Building a minimal pixel art generator."),
      ]),
    ).toBe("Building a minimal pixel art generator.");
  });

  it("concatenates incremental deltas without paragraph breaks", () => {
    expect(
      extractAssistantText([
        assistant("Building"),
        assistant(" a"),
        assistant(" minimal"),
        assistant(" tool."),
      ]),
    ).toBe("Building a minimal tool.");
  });

  it("does not turn stream fragments into one-word markdown paragraphs", () => {
    const answer = extractAssistantText([
      assistant("**Pixel Art**"),
      assistant("**Pixel Art**\n\nPaint"),
      assistant("**Pixel Art**\n\nPaint on a grid."),
    ]);
    expect(answer).toBe("**Pixel Art**\n\nPaint on a grid.");
    expect(answer.split("\n\n")).toHaveLength(2);
  });
});
