import { describe, expect, it } from "vitest";
import {
  cardHasBottomChild,
  cardIsConnectionTarget,
  lateralConnectionsFrom,
  selectCardArtifactNodes,
} from "@/lib/canvasDerivedIndex";
import type { CanvasArtifactNode, Connection } from "@/lib/store";

const node = (id: string, sourceCardId: string) =>
  ({ id, sourceCardId }) as unknown as CanvasArtifactNode;

describe("selectCardArtifactNodes", () => {
  const nodes = {
    a: node("a", "c1"),
    b: node("b", "c2"),
    c: node("c", "c1"),
  };

  it("returns only the card's own nodes", () => {
    expect(Object.keys(selectCardArtifactNodes(nodes, "c1"))).toEqual(["a", "c"]);
    expect(Object.keys(selectCardArtifactNodes(nodes, "c2"))).toEqual(["b"]);
  });

  it("returns one stable empty record for a card with no nodes", () => {
    const first = selectCardArtifactNodes(nodes, "none");
    expect(first).toEqual({});
    expect(selectCardArtifactNodes({ ...nodes }, "none")).toBe(first);
  });

  it("reuses the index for the same map and keeps entry identity", () => {
    const r1 = selectCardArtifactNodes(nodes, "c1");
    expect(selectCardArtifactNodes(nodes, "c1")).toBe(r1);
    const next = { ...nodes, d: node("d", "c3") };
    const r2 = selectCardArtifactNodes(next, "c1");
    expect(r2).not.toBe(r1);
    expect(r2.a).toBe(r1.a);
  });
});

describe("connection flags", () => {
  const connections: Connection[] = [
    { id: "1", from: "p", to: "child", fromSide: "bottom", toSide: "top" },
    { id: "2", from: "p", to: "side", fromSide: "right", toSide: "left" },
    { id: "3", from: "q", to: "x", fromSide: null as never, toSide: "top" },
  ];

  it("flags bottom or unspecified-side parents only", () => {
    expect(cardHasBottomChild(connections, "p")).toBe(true);
    expect(cardHasBottomChild(connections, "q")).toBe(true);
    expect(cardHasBottomChild(connections, "child")).toBe(false);
  });

  it("lists lateral (left/right) connections per source card", () => {
    expect(lateralConnectionsFrom(connections, "p").map((c) => c.id)).toEqual(["2"]);
    expect(lateralConnectionsFrom(connections, "q")).toEqual([]);
  });

  it("flags connection targets", () => {
    expect(cardIsConnectionTarget(connections, "side")).toBe(true);
    expect(cardIsConnectionTarget(connections, "p")).toBe(false);
  });
});
