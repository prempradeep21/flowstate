import { describe, expect, it } from "vitest";
import { normalizeTableCell } from "@/lib/tableCellContent";

describe("normalizeTableCell", () => {
  it("formats country codes and flags in cell text", () => {
    const result = normalizeTableCell("us USA");
    expect(result.text).toBe("🇺🇸 USA");
  });

  it("reads only the value of an object cell — never its tags", () => {
    const result = normalizeTableCell({
      value: "Driver",
      tags: [{ label: "Valid", tone: "success" }],
      badge: "ADR",
    });
    expect(result).toEqual({ text: "Driver" });
  });
});
