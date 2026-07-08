import { describe, expect, it } from "vitest";
import {
  parseCsvPreview,
  parseJsonPreview,
  resolvePreviewKind,
} from "@/lib/documentPreview";
import type { CanvasAsset } from "@/lib/store";

function asset(
  overrides: Partial<CanvasAsset> & Pick<CanvasAsset, "name" | "kind">,
): CanvasAsset {
  return {
    id: "a1",
    canvasId: "c1",
    ownerId: "u1",
    mimeType: "",
    sizeBytes: 100,
    storagePath: "path",
    publicUrl: "https://example.com/file",
    createdAt: 0,
    ...overrides,
  };
}

describe("resolvePreviewKind", () => {
  it("routes PDF documents to pdf renderer", () => {
    expect(
      resolvePreviewKind(
        asset({ name: "report.pdf", kind: "document", mimeType: "application/pdf" }),
      ),
    ).toBe("pdf");
  });

  it("routes HTML code files to html renderer", () => {
    expect(
      resolvePreviewKind(
        asset({ name: "index.html", kind: "code", mimeType: "text/html" }),
      ),
    ).toBe("html");
  });

  it("routes CSV documents to csv renderer", () => {
    expect(
      resolvePreviewKind(
        asset({ name: "data.csv", kind: "document", mimeType: "text/csv" }),
      ),
    ).toBe("csv");
  });

  it("routes TypeScript code to code renderer", () => {
    expect(
      resolvePreviewKind(
        asset({ name: "app.ts", kind: "code", mimeType: "text/plain" }),
      ),
    ).toBe("code");
  });

  it("routes office kinds to office renderer", () => {
    expect(
      resolvePreviewKind(
        asset({
          name: "deck.pptx",
          kind: "presentation",
          mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        }),
      ),
    ).toBe("office");
  });
});

describe("parseCsvPreview", () => {
  it("parses comma-separated rows with quoted fields", () => {
    const data = parseCsvPreview('name,age\n"Alice, Jr.",30\nBob,25');
    expect(data.totalRows).toBe(3);
    expect(data.totalCols).toBe(2);
    expect(data.rows[0]).toEqual(["name", "age"]);
    expect(data.rows[1]).toEqual(["Alice, Jr.", "30"]);
    expect(data.rows[2]).toEqual(["Bob", "25"]);
  });

  it("caps preview rows and columns", () => {
    const rows = Array.from({ length: 30 }, (_, i) => `c${i},v${i}`).join("\n");
    const data = parseCsvPreview(rows);
    expect(data.totalRows).toBe(30);
    expect(data.rows.length).toBe(24);
  });
});

describe("parseJsonPreview", () => {
  it("pretty-prints valid JSON", () => {
    const result = parseJsonPreview('{"a":1,"b":[2,3]}');
    expect(result.valid).toBe(true);
    if (result.valid) {
      expect(result.pretty).toContain('"a": 1');
      expect(result.pretty).toContain('"b"');
    }
  });

  it("returns error details for invalid JSON", () => {
    const result = parseJsonPreview("{not json");
    expect(result.valid).toBe(false);
    if (!result.valid) {
      expect(result.message.length).toBeGreaterThan(0);
      expect(result.raw).toContain("{not json");
    }
  });
});
