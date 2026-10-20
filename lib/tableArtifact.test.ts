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

  it("lifts legacy tags into a plain-text Note column", () => {
    const data = normalizeTableArtifactData({
      columns: [
        { key: "series", label: "Series" },
        { key: "pref", label: "Pref" },
      ],
      rows: [
        { series: { value: "B-1", tags: [{ label: "Priced below B", tone: "warning" }] }, pref: "$1.6M" },
        { series: "E", pref: { value: "$1,499.9M", tags: [{ label: "Largest" }] } },
        { series: "F", pref: "$1,003.3M" },
      ],
    });
    expect(data.columns.map((c) => c.label)).toEqual(["Series", "Pref", "Note"]);
    expect(data.rows[0]).toEqual({ series: "B-1", pref: "$1.6M", note: "Priced below B" });
    expect(data.rows[1]).toEqual({ series: "E", pref: "$1,499.9M", note: "Largest" });
    expect(data.rows[2]).toEqual({ series: "F", pref: "$1,003.3M" });
  });

  it("turns a tag-only status cell into its text and drops echoing tags", () => {
    const data = normalizeTableArtifactData({
      columns: [
        { key: "role", label: "Role" },
        { key: "status", label: "Status" },
      ],
      rows: [
        { role: "Lead", status: { tags: [{ label: "Attached" }] } },
        { role: "Elder", status: { value: "Offer out", badge: "offer out" } },
      ],
    });
    expect(data.columns).toHaveLength(2);
    expect(data.rows).toEqual([
      { role: "Lead", status: "Attached" },
      { role: "Elder", status: "Offer out" },
    ]);
  });

  it("merges lifted tags into an existing Notes column", () => {
    const data = normalizeTableArtifactData({
      columns: [
        { key: "q", label: "Quarter" },
        { key: "n", label: "Notes" },
      ],
      rows: [{ q: "Q2", n: { value: "down 37%", tags: [{ label: "COVID" }] } }],
    });
    expect(data.columns).toHaveLength(2);
    expect(data.rows[0]).toEqual({ q: "Q2", n: "down 37% · COVID" });
  });
});
