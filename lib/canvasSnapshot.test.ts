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

  it("defaults canvasBackgroundStyle to grid for legacy snapshots", () => {
    const snapshot = normalizeCanvasSnapshot({ version: 1 });
    expect(snapshot.canvasBackgroundStyle).toBe("grid");
  });

  it("preserves valid canvasBackgroundStyle values", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "ambient-gradient",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("ambient-gradient");
  });

  it("preserves sky canvasBackgroundStyle", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "sky",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("sky");
  });

  it("preserves network canvasBackgroundStyle", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "network",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("network");
  });

  it("preserves rising-sun canvasBackgroundStyle", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "rising-sun",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("rising-sun");
  });

  it("falls back to grid for removed canvasBackgroundStyle values", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "blueprint",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("grid");
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
