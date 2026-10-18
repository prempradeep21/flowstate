import { describe, expect, it } from "vitest";
import {
  TABLE_COLUMN_MAX_PERCENT,
  TABLE_NARROW_COLUMN_MAX_PERCENT,
  computeTableColumnWidths,
  computeTableColumnFitSpecs,
  computeTableIntrinsicSize,
  fitTableColumnWidthsPx,
} from "@/lib/tableColumnWidths";

describe("computeTableColumnWidths", () => {
  it("shrinks id columns relative to email columns", () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "email", label: "Email" },
    ];
    const rows = [
      {
        id: "D-0001",
        email: "jan.kowalski@fleety.pl",
      },
      {
        id: "D-0002",
        email: "maria.nowak@fleety.pl",
      },
    ];
    const widths = computeTableColumnWidths(columns, rows);
    const id = widths.find((w) => w.key === "id");
    const email = widths.find((w) => w.key === "email");
    expect(id).toBeDefined();
    expect(email).toBeDefined();
    expect(id!.percent).toBeLessThan(email!.percent);
  });

  it("enables wrap on very long content", () => {
    const columns = [
      { key: "notes", label: "Notes" },
      { key: "id", label: "ID" },
    ];
    const rows = [
      {
        id: "1",
        notes:
          "This is an extremely long note that should force wrapping because it exceeds the maximum allowed column width percentage for comfortable viewing.",
      },
    ];
    const widths = computeTableColumnWidths(columns, rows);
    const notes = widths.find((w) => w.key === "notes");
    expect(notes!.wrap).toBe(true);
  });

  it("sums to approximately 100 percent", () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },
    ];
    const rows = [
      { id: "1", name: "Alpha", status: "Active" },
      { id: "2", name: "Beta", status: "Pending" },
    ];
    const widths = computeTableColumnWidths(columns, rows);
    const total = widths.reduce((sum, w) => sum + w.percent, 0);
    expect(total).toBeGreaterThan(99);
    expect(total).toBeLessThan(101);
  });

  it("does not narrow category columns with short descriptive values", () => {
    const columns = [
      { key: "category", label: "Category" },
      { key: "previous", label: "Previous Method" },
      { key: "current", label: "Current Method" },
    ];
    const rows = [
      { category: "Camera", previous: "Film", current: "Digital" },
      { category: "Motion Picture", previous: "Reels", current: "Streaming" },
      { category: "Designing", previous: "Paper", current: "CAD" },
      { category: "Music Production", previous: "Tape", current: "DAW" },
    ];
    const widths = computeTableColumnWidths(columns, rows);
    const category = widths.find((w) => w.key === "category");
    expect(category).toBeDefined();
    expect(category!.percent).toBeGreaterThan(TABLE_NARROW_COLUMN_MAX_PERCENT);
  });

  it("computes intrinsic size from columns and rows", () => {
    const columns = [
      { key: "id", label: "ID" },
      { key: "name", label: "Name" },
    ];
    const rows = [
      { id: "1", name: "Alpha" },
      { id: "2", name: "Beta" },
      { id: "3", name: "Gamma" },
    ];
    const size = computeTableIntrinsicSize(columns, rows);
    expect(size.widthPx).toBeGreaterThanOrEqual(192);
    expect(size.heightPx).toBeGreaterThan(100);
  });
});

describe("fitTableColumnWidthsPx", () => {
  const columns = [
    { key: "rank", label: "#" },
    { key: "name", label: "Name" },
    { key: "notes", label: "Notes" },
  ];
  const rows = [
    {
      rank: "1",
      name: "Ministry of Crab",
      notes: "Famous Colombo seafood restaurant in an old Dutch hospital building",
    },
    { rank: "2", name: "Nuga Gama", notes: "Village-style Sri Lankan rice and curry" },
  ];
  const specs = computeTableColumnFitSpecs(columns, rows);
  const idealTotal = specs.reduce((sum, s) => sum + s.idealPx, 0);
  const minTotal = specs.reduce((sum, s) => sum + s.minPx, 0);
  const sum = (ws: number[]) => ws.reduce((a, b) => a + b, 0);

  it("keeps each column's min at or below its ideal", () => {
    for (const s of specs) expect(s.minPx).toBeLessThanOrEqual(s.idealPx);
    expect(minTotal).toBeLessThan(idealTotal);
  });

  it("fills a wider node exactly, stretching text columns but not narrow ones", () => {
    const widths = fitTableColumnWidthsPx(specs, idealTotal + 300);
    expect(sum(widths)).toBe(idealTotal + 300);
    expect(widths[0]).toBe(Math.round(specs[0]!.idealPx));
    expect(widths[1]!).toBeGreaterThan(specs[1]!.idealPx);
    expect(widths[2]!).toBeGreaterThan(specs[2]!.idealPx);
  });

  it("shrinks the column with the most slack first", () => {
    const widths = fitTableColumnWidthsPx(specs, (idealTotal + minTotal) / 2);
    expect(sum(widths)).toBe(Math.round((idealTotal + minTotal) / 2));
    const lost = widths.map((w, i) => specs[i]!.idealPx - w);
    // The long Notes column gives up more than the short Name column.
    expect(lost[2]!).toBeGreaterThan(lost[1]!);
    widths.forEach((w, i) => expect(w).toBeGreaterThanOrEqual(Math.floor(specs[i]!.minPx)));
  });

  it("holds every column at its min below that, so the table scrolls", () => {
    const widths = fitTableColumnWidthsPx(specs, minTotal - 100);
    expect(widths).toEqual(specs.map((s) => Math.round(s.minPx)));
    expect(sum(widths)).toBeGreaterThan(minTotal - 100);
  });

  it("keeps a dragged column at its pinned width and fits the rest around it", () => {
    const widths = fitTableColumnWidthsPx(specs, idealTotal, [undefined, 300]);
    expect(widths[1]).toBe(300);
    expect(sum(widths)).toBe(idealTotal);
  });
});
