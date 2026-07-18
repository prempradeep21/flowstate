import { describe, expect, it } from "vitest";
import {
  buildCanvasMemoryNote,
  buildUserMemoryNote,
} from "@/lib/memory/injection";

describe("buildCanvasMemoryNote", () => {
  it("returns null for missing or empty input", () => {
    expect(buildCanvasMemoryNote(undefined)).toBeNull();
    expect(buildCanvasMemoryNote([])).toBeNull();
    expect(buildCanvasMemoryNote([{ title: "x" }])).toBeNull();
  });

  it("renders sanitized bullet lines with titles", () => {
    const note = buildCanvasMemoryNote([
      { title: "Kyoto trip", gist: "Comparing neighborhoods for November." },
      { gist: "Untitled branch gist." },
    ]);
    expect(note).toContain("• Kyoto trip: Comparing neighborhoods for November.");
    expect(note).toContain("• Untitled branch gist.");
    expect(note).toContain("Ambient context only");
  });

  it("ignores malformed entries and caps entry count", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      title: `t${i}`,
      gist: `gist ${i}`,
    }));
    const note = buildCanvasMemoryNote([null, 42, ...entries]);
    expect(note).toContain("gist 0");
    // 6-entry cap: later entries are dropped (the two malformed ones count
    // toward the slice window, so entries 4+ are out)
    expect(note).not.toContain("gist 9");
  });

  it("enforces the character cap", () => {
    const big = "x".repeat(500);
    const note = buildCanvasMemoryNote([
      { title: "a", gist: big },
      { title: "b", gist: big },
      { title: "c", gist: big },
      { title: "d", gist: big },
      { title: "e", gist: big },
    ]);
    expect(note!.length).toBeLessThan(2200);
  });
});

describe("buildUserMemoryNote", () => {
  const doc = [
    "## Core",
    "- [2026-07-01] Works as a product manager at a fintech",
    "- [2026-07-02] Vegetarian",
    "## Interests",
    "- [2026-07-03] Learning espresso brewing at home",
    "## Places",
    "- [2026-07-04] Visited Kyoto last spring",
  ].join("\n");

  it("returns null for an empty document", () => {
    expect(buildUserMemoryNote("", "anything")).toBeNull();
    expect(buildUserMemoryNote("   ", "anything")).toBeNull();
  });

  it("always includes Core facts", () => {
    const note = buildUserMemoryNote(doc, "completely unrelated question about rust compilers");
    expect(note).toContain("product manager");
    expect(note).toContain("Vegetarian");
  });

  it("includes non-Core facts only when they overlap the question", () => {
    const note = buildUserMemoryNote(doc, "which espresso grinder should I buy?");
    expect(note).toContain("espresso brewing");
    expect(note).not.toContain("Kyoto");

    const noteTravel = buildUserMemoryNote(doc, "planning another Kyoto visit");
    expect(noteTravel).toContain("Kyoto");
    expect(noteTravel).not.toContain("espresso brewing");
  });
});
