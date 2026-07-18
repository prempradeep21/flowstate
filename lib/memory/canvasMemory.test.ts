import { beforeEach, describe, expect, it } from "vitest";
import { collectSiblingGists } from "@/lib/memory/canvasMemory";
import { useCanvasStore, type Card, type Connection, type Thread, type ThreadGist } from "@/lib/store";

function makeCard(
  id: string,
  threadId: string,
  overrides: Partial<Card> = {},
): Card {
  return {
    id,
    threadId,
    question: `question for ${id}`,
    answer: `answer for ${id}`,
    status: "done",
    position: { x: 0, y: 0 },
    parentCardId: null,
    parentConversationId: null,
    ...overrides,
  } as Card;
}

const thread = (id: string): Thread => ({ id, accentColour: "#fff" });
const gist = (text: string, updatedAt = 1): ThreadGist => ({
  gist: text,
  updatedAt,
  turnCount: 1,
});

describe("collectSiblingGists", () => {
  beforeEach(() => {
    // t1: root card c1. t2: branch of c1 (lateral connection). t3: independent.
    const cards: Record<string, Card> = {
      c1: makeCard("c1", "t1"),
      c2: makeCard("c2", "t2", { parentConversationId: "c1" }),
      c3: makeCard("c3", "t3"),
    };
    const connections: Connection[] = [
      { id: "conn1", from: "c1", to: "c2", fromSide: "right", toSide: "left" },
    ];
    useCanvasStore.setState({
      cards,
      cardOrder: ["c1", "c2", "c3"],
      connections,
      threads: { t1: thread("t1"), t2: thread("t2"), t3: thread("t3") },
      threadOrder: ["t1", "t2", "t3"],
      threadGists: {
        t1: gist("Sourdough starter feeding schedule discussion."),
        t2: gist("Espresso machine shopping under $300."),
        t3: gist("Kyoto travel neighborhood comparison."),
      },
    });
  });

  it("excludes the card's own thread and includes true siblings", () => {
    const result = collectSiblingGists("c1", "any question");
    const titles = result.map((r) => r.gist);
    expect(titles).toHaveLength(2);
    expect(titles.join(" ")).toContain("Espresso");
    expect(titles.join(" ")).toContain("Kyoto");
    expect(titles.join(" ")).not.toContain("Sourdough");
  });

  it("excludes ancestor threads for a lateral branch", () => {
    // c2's ancestors: c1 (t1) — so only t3 remains a sibling.
    const result = collectSiblingGists("c2", "any question");
    expect(result).toHaveLength(1);
    expect(result[0]!.gist).toContain("Kyoto");
  });

  it("ranks relevant gists first", () => {
    const result = collectSiblingGists("c1", "which espresso grinder fits my machine?");
    expect(result[0]!.gist).toContain("Espresso");
  });

  it("returns empty for an unknown card", () => {
    expect(collectSiblingGists("nope", "q")).toEqual([]);
  });
});
