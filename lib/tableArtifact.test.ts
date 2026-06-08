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
});
