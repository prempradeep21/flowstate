import { afterEach, describe, expect, it } from "vitest";
import { flushCardSizes, queueCardSize } from "@/lib/cardMeasureBatch";
import { useCanvasStore, type Card, type CardSize } from "@/lib/store";

/**
 * setCardSizes must land exactly what the same setCardSize calls would, in
 * order (follow-up children shift with their parent's growth), as one write.
 */

function card(id: string, x: number, y: number, h: number): Card {
  return {
    id,
    threadId: "t-main",
    cardKind: "conversation",
    question: id,
    answer: "answer",
    status: "done",
    position: { x, y },
    size: { w: 420, h },
    parentCardId: null,
    parentConversationId: null,
  } as Card;
}

function seed() {
  useCanvasStore.setState({
    cards: {
      root: card("root", 0, 0, 200),
      child: card("child", 0, 260, 180),
      grandchild: card("grandchild", 0, 500, 160),
      lone: card("lone", 900, 0, 150),
    },
    cardOrder: ["root", "child", "grandchild", "lone"],
    connections: [
      { id: "k1", from: "root", to: "child", fromSide: "bottom", toSide: "top" },
      { id: "k2", from: "child", to: "grandchild", fromSide: "bottom", toSide: "top" },
    ],
    threads: { "t-main": { id: "t-main", accentColour: "#000" } },
    threadOrder: ["t-main"],
    groups: {},
  });
}

const SIZES: Array<[string, CardSize]> = [
  ["root", { w: 420, h: 260 }],
  ["child", { w: 420, h: 150 }],
  ["lone", { w: 420, h: 150 }], // unchanged
  ["missing", { w: 420, h: 99 }],
];

function placements() {
  const { cards } = useCanvasStore.getState();
  return Object.fromEntries(
    Object.values(cards).map((c) => [c.id, { ...c.position, h: c.size?.h }]),
  );
}

describe("batched card sizes", () => {
  afterEach(() => {
    useCanvasStore.setState({ cards: {}, cardOrder: [], connections: [] });
  });

  it("matches one setCardSize per entry, in order", () => {
    seed();
    for (const [id, size] of SIZES) useCanvasStore.getState().setCardSize(id, size);
    const sequential = placements();

    seed();
    useCanvasStore.getState().setCardSizes(SIZES);
    expect(placements()).toEqual(sequential);
    expect(sequential.grandchild.y).not.toBe(500);
  });

  it("makes a single write and skips no-op batches", () => {
    seed();
    let writes = 0;
    const unsub = useCanvasStore.subscribe(() => writes++);
    useCanvasStore.getState().setCardSizes(SIZES);
    expect(writes).toBe(1);
    useCanvasStore.getState().setCardSizes([["lone", { w: 420, h: 150 }]]);
    expect(writes).toBe(1);
    unsub();
  });

  it("queues sizes and lands them together, last size per card", async () => {
    seed();
    let writes = 0;
    const unsub = useCanvasStore.subscribe(() => writes++);
    queueCardSize("root", { w: 420, h: 230 });
    queueCardSize("child", { w: 420, h: 150 });
    queueCardSize("root", { w: 420, h: 240 });
    expect(writes).toBe(0);
    await Promise.resolve();
    expect(writes).toBe(1);
    expect(useCanvasStore.getState().cards.root.size?.h).toBe(240);
    flushCardSizes();
    expect(writes).toBe(1);
    unsub();
  });
});
