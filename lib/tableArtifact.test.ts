import { describe, expect, it } from "vitest";
import { normalizeTableArtifactData } from "@/lib/tableArtifact";

describe("normalizeTableArtifactData", () => {
  it("returns empty columns and rows when data is missing", () => {
    expect(normalizeTableArtifactData(undefined)).toEqual({
      columns: [],
      rows: [],
    });
    expect(normalizeTableArtifactData({})).toEqual({
      columns: [],
      rows: [],
    });
  });

  it("preserves valid columns and rows", () => {
    expect(
      normalizeTableArtifactData({
        columns: [{ key: "name", label: "Name" }],
        rows: [{ name: "Widget" }],
      }),
    ).toEqual({
      columns: [{ key: "name", label: "Name" }],
      rows: [{ name: "Widget" }],
    });
  });

  it("drops invalid column entries", () => {
    expect(
      normalizeTableArtifactData({
        columns: [{ key: "", label: "Bad" }, { key: "ok", label: "OK" }],
        rows: [],
      }),
    ).toEqual({
      columns: [{ key: "ok", label: "OK" }],
      rows: [],
    });
  });

  it("deduplicates column keys within a table", () => {
    expect(
      normalizeTableArtifactData({
        columns: [
          { key: "forex", label: "Forex" },
          { key: "copies", label: "Copies" },
          { key: "forex", label: "Forex (again)" },
          { key: "copies", label: "Copies (again)" },
        ],
        rows: [
          {
            forex: "USD",
            copies: "Passport",
          },
        ],
      }),
    ).toEqual({
      columns: [
        { key: "forex", label: "Forex" },
        { key: "copies", label: "Copies" },
        { key: "forex_2", label: "Forex (again)" },
        { key: "copies_2", label: "Copies (again)" },
      ],
      rows: [
        {
          forex: "USD",
          copies: "Passport",
          forex_2: "USD",
          copies_2: "Passport",
        },
      ],
    });
  });

  it("keeps same slug on different tables independent", () => {
    const travel = normalizeTableArtifactData({
      columns: [{ key: "forex", label: "Forex" }],
      rows: [{ forex: "EUR" }],
    });
    const budget = normalizeTableArtifactData({
      columns: [{ key: "forex", label: "Forex" }],
      rows: [{ forex: "GBP" }],
    });

    expect(travel.columns[0]?.key).toBe("forex");
    expect(budget.columns[0]?.key).toBe("forex");
    expect(travel.rows[0]?.forex).toBe("EUR");
    expect(budget.rows[0]?.forex).toBe("GBP");
  });
});
