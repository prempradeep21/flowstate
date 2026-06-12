import { describe, expect, it } from "vitest";
import {
  defaultStickyNoteColorId,
  normalizeStickyNoteArtifactData,
  normalizeStickyNotePayload,
  stickyNoteThemeColors,
} from "@/lib/stickyNoteArtifact";

describe("stickyNoteArtifact", () => {
  it("normalizes empty data with default yellow", () => {
    expect(normalizeStickyNoteArtifactData({})).toEqual({
      text: "",
      colorId: "yellow",
    });
  });

  it("preserves text and valid color", () => {
    expect(
      normalizeStickyNoteArtifactData({ text: "Hello", colorId: "pink" }),
    ).toEqual({
      text: "Hello",
      colorId: "pink",
    });
  });

  it("falls back to yellow for unknown colors", () => {
    expect(
      normalizeStickyNoteArtifactData({ colorId: "purple" }).colorId,
    ).toBe(defaultStickyNoteColorId());
  });

  it("normalizes payload title", () => {
    const payload = normalizeStickyNotePayload({
      type: "stickynote",
      title: "",
      data: { text: "Note", colorId: "blue" },
    });
    expect(payload.title).toBe("Sticky note");
    expect(payload.data.text).toBe("Note");
  });

  it("returns different theme colors for light and dark", () => {
    const light = stickyNoteThemeColors("yellow", false);
    const dark = stickyNoteThemeColors("yellow", true);
    expect(light.bg).not.toBe(dark.bg);
    expect(light.ink).not.toBe(dark.ink);
  });
});
