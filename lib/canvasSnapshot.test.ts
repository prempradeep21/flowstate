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

  it("preserves static-image style and image id", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "static-image",
      canvasBackgroundImageId: "grok-7e162978",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("static-image");
    expect(snapshot.canvasBackgroundImageId).toBe("grok-7e162978");
  });

  it("falls back to default image id for invalid canvasBackgroundImageId", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "static-image",
      canvasBackgroundImageId: "missing-image",
    });
    expect(snapshot.canvasBackgroundImageId).toBe("grok-5f2e9dd9");
  });

  it("preserves chat and focus view modes and coerces unknown values", () => {
    expect(
      normalizeCanvasSnapshot({ version: 1, viewMode: "chat" }).viewMode,
    ).toBe("chat");
    expect(
      normalizeCanvasSnapshot({ version: 1, viewMode: "focus" }).viewMode,
    ).toBe("focus");
    expect(
      normalizeCanvasSnapshot({ version: 1, viewMode: "bogus" }).viewMode,
    ).toBe("canvas");
    expect(normalizeCanvasSnapshot({ version: 1 }).viewMode).toBe("canvas");
  });

  it("falls back to grid for removed canvasBackgroundStyle values", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "blueprint",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("grid");
  });

  it("falls back to grid for legacy removed backgrounds like sky", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasBackgroundStyle: "sky",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("grid");
  });

  it("falls back to grid for legacy removed backgrounds like rising-sun", () => {
    const snapshot = normalizeCanvasSnapshot({
      version: 1,
      canvasTheme: "dark",
      canvasBackgroundStyle: "rising-sun",
    });
    expect(snapshot.canvasBackgroundStyle).toBe("grid");
  });

  it("defaults canvasTheme to dark for new snapshots", () => {
    const snapshot = normalizeCanvasSnapshot({ version: 1 });
    expect(snapshot.canvasTheme).toBe("dark");
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
