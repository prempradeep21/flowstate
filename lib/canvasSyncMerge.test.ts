import { describe, expect, it } from "vitest";
import {
  buildEmptyCanvasSnapshot,
  mergeCanvasSnapshots,
  mergeRecordThreeWay,
  type CanvasSnapshot,
} from "@/lib/canvasSnapshot";
import { isOlderTimestamp } from "@/lib/canvasSyncBase";
import {
  areCanvasContentSlicesEqual,
  pickCanvasPersistSliceFromSnapshot,
} from "@/lib/canvasPersistDirty";
import type { CanvasArtifactNode } from "@/lib/store";

const at = (x: number, y = 0) =>
  ({ id: "n", position: { x, y } }) as unknown as CanvasArtifactNode;

function snap(
  nodes: Record<string, CanvasArtifactNode>,
  viewport = { x: 0, y: 0, scale: 1 },
): CanvasSnapshot {
  return {
    ...buildEmptyCanvasSnapshot(),
    viewport,
    canvasArtifactNodes: nodes,
    canvasArtifactOrder: Object.keys(nodes),
  };
}

describe("mergeRecordThreeWay", () => {
  it("keeps the server's version of an item this client never touched", () => {
    const base = { a: at(0) };
    expect(mergeRecordThreeWay({ a: at(500) }, { a: at(0) }, base)).toEqual({ a: at(500) });
  });

  it("keeps this client's version of an item it changed", () => {
    const base = { a: at(0) };
    expect(mergeRecordThreeWay({ a: at(500) }, { a: at(90) }, base)).toEqual({ a: at(90) });
  });

  it("honours deletes from either side", () => {
    const base = { a: at(0), b: at(1) };
    // Server deleted a; we left it alone. We deleted b; server left it alone.
    expect(mergeRecordThreeWay({ b: at(1) }, { a: at(0) }, base)).toEqual({});
  });

  it("keeps additions from both sides", () => {
    expect(mergeRecordThreeWay({ r: at(1) }, { l: at(2) }, {})).toEqual({ r: at(1), l: at(2) });
  });

  it("treats key order as no change", () => {
    const base = { a: { position: { x: 0, y: 0 }, id: "n" } as unknown as CanvasArtifactNode };
    expect(mergeRecordThreeWay({ a: at(500) }, { a: at(0) }, base)).toEqual({ a: at(500) });
  });
});

describe("mergeCanvasSnapshots with a base", () => {
  it("lets a collaborator's move stand when our copy was only stale", () => {
    const base = snap({ a: at(0), b: at(0) });
    const remote = snap({ a: at(800), b: at(0) });
    const local = snap({ a: at(0), b: at(40) });
    const merged = mergeCanvasSnapshots(remote, local, base);
    expect(merged.canvasArtifactNodes!.a!.position.x).toBe(800);
    expect(merged.canvasArtifactNodes!.b!.position.x).toBe(40);
  });

  it("drops order entries for items a merge deleted", () => {
    const base = snap({ a: at(0), b: at(0) });
    const merged = mergeCanvasSnapshots(snap({ b: at(0) }), snap({ a: at(0), b: at(0) }), base);
    expect(merged.canvasArtifactOrder).toEqual(["b"]);
  });

  it("without a base keeps the old local-wins union", () => {
    const merged = mergeCanvasSnapshots(snap({ a: at(800) }), snap({ a: at(0) }));
    expect(merged.canvasArtifactNodes!.a!.position.x).toBe(0);
  });
});

describe("isOlderTimestamp", () => {
  it("orders server timestamps and ignores missing ones", () => {
    expect(isOlderTimestamp("2026-11-17T10:00:00.000Z", "2026-11-17T10:00:01.000Z")).toBe(true);
    expect(isOlderTimestamp("2026-11-17T10:00:02.000Z", "2026-11-17T10:00:01.000Z")).toBe(false);
    expect(isOlderTimestamp(null, "2026-11-17T10:00:01.000Z")).toBe(false);
    expect(isOlderTimestamp("2026-11-17T10:00:01.000Z", undefined)).toBe(false);
  });
});

describe("areCanvasContentSlicesEqual", () => {
  it("ignores the viewport, which differs per client", () => {
    const a = pickCanvasPersistSliceFromSnapshot(snap({ a: at(0) }, { x: 0, y: 0, scale: 1 }));
    const b = pickCanvasPersistSliceFromSnapshot(snap({ a: at(0) }, { x: 900, y: -40, scale: 0.13 }));
    expect(areCanvasContentSlicesEqual(a, b)).toBe(true);
    const c = pickCanvasPersistSliceFromSnapshot(snap({ a: at(5) }));
    expect(areCanvasContentSlicesEqual(a, c)).toBe(false);
  });
});
