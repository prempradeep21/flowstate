import { describe, expect, it } from "vitest";
import {
  clampStickyNoteArtifactSize,
  defaultStickyNoteColorId,
  normalizeStickyNoteArtifactData,
  normalizeStickyNotePayload,
  stickyNoteThemeColors,
  STICKY_NOTE_MAX_HEIGHT,
  STICKY_NOTE_MAX_WIDTH,
  STICKY_NOTE_MIN_HEIGHT,
  STICKY_NOTE_MIN_WIDTH,
} from "@/lib/stickyNoteArtifact";

describe("stickyNoteArtifact", () => {
  it("normalizes empty data with default turbo", () => {
    expect(normalizeStickyNoteArtifactData({})).toEqual({
      text: "",
      colorId: "turbo",
    });
  });

  it("preserves text and valid color", () => {
    expect(
      normalizeStickyNoteArtifactData({ text: "Hello", colorId: "haiti" }),
    ).toEqual({
      text: "Hello",
      colorId: "haiti",
    });
  });

  it("falls back to turbo for unknown colors", () => {
    expect(
      normalizeStickyNoteArtifactData({ colorId: "purple" }).colorId,
    ).toBe(defaultStickyNoteColorId());
  });

  it("migrates legacy and retired color ids to yellow or dark gray", () => {
    expect(normalizeStickyNoteArtifactData({ colorId: "yellow" }).colorId).toBe(
      "turbo",
    );
    expect(normalizeStickyNoteArtifactData({ colorId: "pink" }).colorId).toBe(
      "haiti",
    );
    expect(normalizeStickyNoteArtifactData({ colorId: "blue" }).colorId).toBe(
      "haiti",
    );
    expect(normalizeStickyNoteArtifactData({ colorId: "green" }).colorId).toBe(
      "turbo",
    );
    expect(normalizeStickyNoteArtifactData({ colorId: "violet" }).colorId).toBe(
      "haiti",
    );
    expect(normalizeStickyNoteArtifactData({ colorId: "chalk" }).colorId).toBe(
      "turbo",
    );
  });

  it("normalizes payload title", () => {
    const payload = normalizeStickyNotePayload({
      type: "stickynote",
      title: "",
      data: { text: "Note", colorId: "haiti" },
    });
    expect(payload.title).toBe("Sticky note");
    expect(payload.data.text).toBe("Note");
  });

  it("returns the same colors regardless of canvas theme", () => {
    const colors = stickyNoteThemeColors("turbo");
    expect(colors).toEqual({ bg: "#F0E100", ink: "#18102B" });
    expect(stickyNoteThemeColors("haiti")).toEqual({
      bg: "#18102B",
      ink: "#F5F3FF",
    });
  });

  it("clamps sticky note canvas size to compact bounds", () => {
    expect(clampStickyNoteArtifactSize(100, 100)).toEqual({
      w: STICKY_NOTE_MIN_WIDTH,
      h: STICKY_NOTE_MIN_HEIGHT,
    });
    expect(clampStickyNoteArtifactSize(999, 999)).toEqual({
      w: STICKY_NOTE_MAX_WIDTH,
      h: STICKY_NOTE_MAX_HEIGHT,
    });
    expect(clampStickyNoteArtifactSize(240, 248)).toEqual({ w: 240, h: 248 });
  });
});
