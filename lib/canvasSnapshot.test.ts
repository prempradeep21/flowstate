import { describe, expect, it } from "vitest";
import {
  buildEmptyCanvasSnapshot,
  normalizeCanvasSnapshot,
  parseCanvasSnapshot,
} from "@/lib/canvasSnapshot";

describe("normalizeCanvasSnapshot", () => {
  it("fills defaults for trigger-created { version: 1 } snapshots", () => {
    const snapshot = normalizeCanvasSnapshot({ version: 1 });
    const empty = buildEmptyCanvasSnapshot();

    expect(snapshot.cardOrder).toEqual([]);
    expect(snapshot.threadOrder).toEqual([]);
    expect(snapshot.sessionArtifacts).toEqual({});
    expect(snapshot.viewport).toEqual(empty.viewport);
  });

  it("parses minimal persisted snapshots", () => {
    const parsed = parseCanvasSnapshot({ version: 1 });
    expect(parsed).not.toBeNull();
    expect(parsed?.cardOrder).toEqual([]);
  });

  it("drops session artifacts missing versions", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      sessionArtifacts: {
        broken: {
          id: "art_1",
          title: "Broken",
          kind: "custom",
          latestVersionId: "missing",
        },
      },
    });

    expect(snapshot.sessionArtifacts).toEqual({});
  });
});
