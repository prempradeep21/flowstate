import { describe, expect, it } from "vitest";
import {
  isMacTrackpadWheel,
  resolveCanvasWheelAction,
  wheelDeltaXY,
  wheelTrackpadPanDelta,
} from "@/lib/canvasWheel";

const PIXEL = 0;
const LINE = 1;

const modOff = {
  ctrlKey: false,
  metaKey: false,
  altKey: false,
} as const;

describe("isMacTrackpadWheel", () => {
  it("detects macOS pixel-mode scroll without zoom modifiers", () => {
    expect(
      isMacTrackpadWheel({ ...modOff, deltaMode: PIXEL }, true),
    ).toBe(true);
  });

  it("excludes pinch zoom (ctrlKey)", () => {
    expect(
      isMacTrackpadWheel(
        { ctrlKey: true, metaKey: false, altKey: false, deltaMode: PIXEL },
        true,
      ),
    ).toBe(false);
  });

  it("excludes Cmd+scroll (metaKey)", () => {
    expect(
      isMacTrackpadWheel(
        { ctrlKey: false, metaKey: true, altKey: false, deltaMode: PIXEL },
        true,
      ),
    ).toBe(false);
  });

  it("excludes Alt+scroll (altKey)", () => {
    expect(
      isMacTrackpadWheel(
        { ctrlKey: false, metaKey: false, altKey: true, deltaMode: PIXEL },
        true,
      ),
    ).toBe(false);
  });

  it("excludes macOS mouse wheel (line mode)", () => {
    expect(
      isMacTrackpadWheel({ ...modOff, deltaMode: LINE }, true),
    ).toBe(false);
  });

  it("excludes non-macOS pixel-mode wheel", () => {
    expect(
      isMacTrackpadWheel({ ...modOff, deltaMode: PIXEL }, false),
    ).toBe(false);
  });
});

describe("resolveCanvasWheelAction", () => {
  it("routes macOS trackpad scroll to pan", () => {
    expect(
      resolveCanvasWheelAction({ ...modOff, deltaMode: PIXEL }, true),
    ).toBe("pan");
  });

  it("routes macOS pinch to zoom", () => {
    expect(
      resolveCanvasWheelAction(
        { ctrlKey: true, metaKey: false, altKey: false, deltaMode: PIXEL },
        true,
      ),
    ).toBe("zoom");
  });

  it("routes macOS Cmd+scroll to zoom", () => {
    expect(
      resolveCanvasWheelAction(
        { ctrlKey: false, metaKey: true, altKey: false, deltaMode: PIXEL },
        true,
      ),
    ).toBe("zoom");
  });

  it("routes macOS Alt+scroll to zoom", () => {
    expect(
      resolveCanvasWheelAction(
        { ctrlKey: false, metaKey: false, altKey: true, deltaMode: PIXEL },
        true,
      ),
    ).toBe("zoom");
  });

  it("routes macOS mouse wheel to zoom", () => {
    expect(
      resolveCanvasWheelAction({ ...modOff, deltaMode: LINE }, true),
    ).toBe("zoom");
  });

  it("routes Windows wheel to zoom", () => {
    expect(
      resolveCanvasWheelAction({ ...modOff, deltaMode: LINE }, false),
    ).toBe("zoom");
    expect(
      resolveCanvasWheelAction({ ...modOff, deltaMode: PIXEL }, false),
    ).toBe("zoom");
  });
});

describe("wheelDeltaXY", () => {
  it("normalizes line-mode deltas to pixels", () => {
    expect(
      wheelDeltaXY({ deltaX: 0, deltaY: 2, deltaMode: LINE }),
    ).toEqual({ dx: 0, dy: 32 });
  });

  it("passes through pixel-mode deltas", () => {
    expect(
      wheelDeltaXY({ deltaX: 12, deltaY: -8, deltaMode: PIXEL }),
    ).toEqual({ dx: 12, dy: -8 });
  });
});

describe("wheelTrackpadPanDelta", () => {
  it("inverts horizontal scroll so content follows finger left", () => {
    const { dx, dy } = wheelTrackpadPanDelta({
      deltaX: -12,
      deltaY: 0,
      deltaMode: PIXEL,
    });
    expect(dx).toBe(12);
    expect(dy).toBe(0);
  });

  it("inverts vertical scroll so content follows finger down", () => {
    const { dx, dy } = wheelTrackpadPanDelta({
      deltaX: 0,
      deltaY: 8,
      deltaMode: PIXEL,
    });
    expect(dx).toBe(0);
    expect(dy).toBe(-8);
  });
});
