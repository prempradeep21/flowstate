import { describe, expect, it } from "vitest";
import {
  capByChars,
  overlapScore,
  rankByRelevance,
  tokenize,
} from "@/lib/memory/relevance";

describe("tokenize", () => {
  it("lowercases, drops stop words and short tokens", () => {
    const tokens = tokenize("The Espresso machine is for MY kitchen");
    expect(tokens.has("espresso")).toBe(true);
    expect(tokens.has("machine")).toBe(true);
    expect(tokens.has("kitchen")).toBe(true);
    expect(tokens.has("the")).toBe(false);
    expect(tokens.has("is")).toBe(false);
    expect(tokens.has("my")).toBe(false);
  });
});

describe("overlapScore", () => {
  it("counts item tokens present in the query", () => {
    const query = tokenize("compact espresso machine grinder");
    expect(overlapScore(query, "espresso grinder comparison")).toBe(2);
    expect(overlapScore(query, "sourdough starter feeding")).toBe(0);
  });
});

describe("rankByRelevance", () => {
  it("puts overlapping items first and keeps original order on ties", () => {
    const items = ["sourdough starter schedule", "espresso machine budget", "kyoto travel plans"];
    const ranked = rankByRelevance(items, (t) => t, "which espresso machine should I buy");
    expect(ranked[0]).toBe("espresso machine budget");
    // zero-score items keep their relative order
    expect(ranked.slice(1)).toEqual([
      "sourdough starter schedule",
      "kyoto travel plans",
    ]);
  });
});

describe("capByChars", () => {
  it("stops before exceeding the cap", () => {
    const items = ["aaaa", "bbbb", "cccc"];
    expect(capByChars(items, (t) => t.length, 9)).toEqual(["aaaa", "bbbb"]);
    expect(capByChars(items, (t) => t.length, 3)).toEqual([]);
  });
});
