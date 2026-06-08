import { describe, expect, it } from "vitest";
import {
  TABLE_COLUMN_MAX_PERCENT,
  computeTableColumnWidths,
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
});
