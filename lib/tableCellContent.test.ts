import { describe, expect, it } from "vitest";
import { normalizeTableCell } from "@/lib/tableCellContent";

describe("normalizeTableCell", () => {
  it("maps legacy badge to a tag", () => {
    const result = normalizeTableCell({ value: "Item", badge: "Pending" });
    expect(result.text).toBe("Item");
    expect(result.tags).toEqual([{ label: "Pending", tone: "neutral" }]);
  });

  it("preserves explicit tags", () => {
    const result = normalizeTableCell({
      value: "Driver",
      tags: [
        { label: "Valid", tone: "success" },
        { label: "ADR", tone: "info" },
      ],
    });
    expect(result.tags).toHaveLength(2);
  });
});
