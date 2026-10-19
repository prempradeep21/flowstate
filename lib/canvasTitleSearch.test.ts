import { describe, expect, it } from "vitest";
import { canvasTitleMatches } from "@/lib/canvasTitleSearch";

describe("canvasTitleMatches", () => {
  it("matches everything for an empty or blank query", () => {
    expect(canvasTitleMatches("Walt Disney", "")).toBe(true);
    expect(canvasTitleMatches("Walt Disney", "   ")).toBe(true);
  });

  it("ignores case", () => {
    expect(canvasTitleMatches("Walt Disney", "DISNEY")).toBe(true);
  });

  it("requires every word, in any order", () => {
    expect(canvasTitleMatches("Walt Disney", "disney walt")).toBe(true);
    expect(canvasTitleMatches("Walt Disney", "walt pixar")).toBe(false);
  });

  it("matches partial words", () => {
    expect(
      canvasTitleMatches("Jagadamba Theatre — Rooted Stories", "jag theat"),
    ).toBe(true);
  });
});
