import { describe, expect, it } from "vitest";
import {
  tableCellExportText,
  tableToCsv,
  tableToHtml,
  tableToMarkdown,
  tableToGrid,
} from "@/lib/artifactExport/serializers/table";
import { chartToCsv, chartToJson } from "@/lib/artifactExport/serializers/chart";
import { calendarToIcs, todoToMarkdown } from "@/lib/artifactExport/serializers/generic";
import { getCodeVariants } from "@/lib/artifactExport/codeGenerators";
import { getExportMenuItems } from "@/lib/artifactExport/registry";

describe("table export serializers", () => {
  const data = {
    columns: [
      { key: "name", label: "Name" },
      { key: "qty", label: "Qty" },
    ],
    rows: [{ name: "Apple", qty: "3" }, { name: { value: "Banana", badge: "New" }, qty: "1" }],
  };

  it("exports grid with header row", () => {
    const grid = tableToGrid(data.columns, data.rows);
    expect(grid[0]).toEqual(["Name", "Qty"]);
    expect(grid[1]?.[0]).toBe("Apple");
    expect(grid[2]?.[0]).toContain("Banana");
  });

  it("exports CSV", () => {
    const csv = tableToCsv(data);
    expect(csv).toContain("Name,Qty");
    expect(csv).toContain("Apple,3");
  });

  it("exports markdown table", () => {
    const md = tableToMarkdown(data);
    expect(md).toContain("| Name | Qty |");
    expect(md).toContain("| Apple | 3 |");
  });

  it("exports runnable HTML", () => {
    const html = tableToHtml(data);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<table>");
    expect(html).toContain("Apple");
  });

  it("normalizes cell text with tags", () => {
    expect(tableCellExportText({ value: "Item", tags: [{ label: "Hot" }] })).toContain("Hot");
  });
});

describe("chart export serializers", () => {
  it("exports pie CSV", () => {
    const csv = chartToCsv({
      chartType: "pie",
      slices: [
        { name: "A", value: 1 },
        { name: "B", value: 2 },
      ],
    });
    expect(csv).toBe("name,value\nA,1\nB,2");
  });

  it("exports series CSV", () => {
    const csv = chartToCsv({
      chartType: "bar",
      categories: ["Jan", "Feb"],
      series: [{ name: "Sales", data: [10, 20] }],
    });
    expect(csv).toContain("category,Sales");
    expect(csv).toContain("Jan,10");
  });

  it("exports JSON", () => {
    const json = chartToJson({ chartType: "line", categories: [], series: [] });
    expect(JSON.parse(json).chartType).toBe("line");
  });
});

describe("generic export serializers", () => {
  it("exports todo markdown", () => {
    const md = todoToMarkdown({
      items: [{ id: "1", label: "Buy milk", checked: true }],
    });
    expect(md).toBe("- [x] Buy milk");
  });

  it("exports calendar ICS", () => {
    const ics = calendarToIcs(
      {
        viewYear: 2026,
        viewMonth: 5,
        highlightedDates: [],
        events: [
          {
            id: "e1",
            title: "Meet",
            startDate: "2026-06-01T10:00:00.000Z",
            endDate: "2026-06-01T11:00:00.000Z",
          },
        ],
      },
      "My calendar",
    );
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Meet");
  });
});

describe("export registry", () => {
  it("includes table spreadsheet formats", () => {
    const items = getExportMenuItems("table", {
      type: "table",
      title: "T",
      data: { columns: [], rows: [] },
    });
    const kinds = items.map((i) => i.kind);
    expect(kinds).toContain("csv");
    expect(kinds).toContain("xlsx");
    expect(kinds).toContain("google-sheets");
    expect(kinds).toContain("image-png");
  });

  it("includes code copy formats without copy-as-code menu variants for code kind", () => {
    const variants = getCodeVariants("code", {
      type: "code",
      title: "C",
      data: { files: [{ path: "a.ts", language: "typescript", content: "x" }] },
    });
    expect(variants.some((v) => v.id === "json")).toBe(true);
  });
});
