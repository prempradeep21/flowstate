import { describe, expect, it } from "vitest";
import { tableAccentColor, tableAccentStyles } from "@/lib/tableAccentColor";

describe("tableAccentColor", () => {
  it("returns stable colors for the same seed", () => {
    expect(tableAccentColor("art_abc123")).toBe(tableAccentColor("art_abc123"));
  });

  it("returns different colors for different seeds", () => {
    const a = tableAccentColor("art_one");
    const b = tableAccentColor("art_two");
    expect(a).not.toBe(b);
  });

  it("exposes css variables via tableAccentStyles", () => {
    const styles = tableAccentStyles("art_test");
    expect(styles["--table-accent"]).toMatch(/^#[0-9A-Fa-f]{6}$/);
    expect(styles["--table-accent-soft"]).toContain("rgba");
  });
});
