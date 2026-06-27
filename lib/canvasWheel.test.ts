import { describe, expect, it } from "vitest";
import {
  isMacTrackpadWheel,
  resolveCanvasWheelAction,
  wheelDeltaXY,
} from "@/lib/canvasWheel";

const PIXEL = 0;
const LINE = 1;

describe("isMacTrackpadWheel", () => {
  it("detects macOS pixel-mode scroll without ctrlKey", () => {
    expect(
      isMacTrackpadWheel({ ctrlKey: false, deltaMode: PIXEL }, true),
    ).toBe(true);
  });

  it("excludes pinch zoom (ctrlKey)", () => {
    expect(
      isMacTrackpadWheel({ ctrlKey: true, deltaMode: PIXEL }, true),
    ).toBe(false);
  });

  it("excludes macOS mouse wheel (line mode)", () => {
    expect(
      isMacTrackpadWheel({ ctrlKey: false, deltaMode: LINE }, true),
    ).toBe(false);
  });

  it("excludes non-macOS pixel-mode wheel", () => {
    expect(
      isMacTrackpadWheel({ ctrlKey: false, deltaMode: PIXEL }, false),
    ).toBe(false);
  });
});

describe("resolveCanvasWheelAction", () => {
  it("routes macOS trackpad scroll to pan", () => {
    expect(
      resolveCanvasWheelAction({ ctrlKey: false, deltaMode: PIXEL }, true),
    ).toBe("pan");
  });

  it("routes macOS pinch to zoom", () => {
    expect(
      resolveCanvasWheelAction({ ctrlKey: true, deltaMode: PIXEL }, true),
    ).toBe("zoom");
  });

  it("routes macOS mouse wheel to zoom", () => {
    expect(
      resolveCanvasWheelAction({ ctrlKey: false, deltaMode: LINE }, true),
    ).toBe("zoom");
  });

  it("routes Windows wheel to zoom", () => {
    expect(
      resolveCanvasWheelAction({ ctrlKey: false, deltaMode: LINE }, false),
    ).toBe("zoom");
    expect(
      resolveCanvasWheelAction({ ctrlKey: false, deltaMode: PIXEL }, false),
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
