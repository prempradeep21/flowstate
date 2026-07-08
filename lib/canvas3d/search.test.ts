import { describe, expect, it } from "vitest";
import { searchCanvas3DCatalog } from "@/lib/canvas3d/search";

describe("searchCanvas3DCatalog", () => {
  it("returns all models when query is empty", () => {
    const { results, totalCount } = searchCanvas3DCatalog();
    expect(totalCount).toBeGreaterThan(5);
    expect(results.length).toBeGreaterThan(0);
  });

  it("filters by title and tags", () => {
    const fox = searchCanvas3DCatalog({ query: "fox" });
    expect(fox.results.some((r) => r.id === "fox")).toBe(true);

    const robot = searchCanvas3DCatalog({ query: "robot dance" });
    expect(robot.results.some((r) => r.id === "robot-expressive")).toBe(true);
  });

  it("paginates results", () => {
    const page = searchCanvas3DCatalog({ limit: 2, offset: 1 });
    expect(page.results).toHaveLength(2);
    expect(page.offset).toBe(1);
  });
});
