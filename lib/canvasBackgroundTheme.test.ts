import { describe, expect, it } from "vitest";
import {
  isBackgroundAllowedForTheme,
  resolveBackgroundForTheme,
} from "@/lib/canvasBackgroundTheme";

describe("canvasBackgroundTheme", () => {
  it("allows dot grid and ambient in light theme", () => {
    expect(isBackgroundAllowedForTheme("grid", "light")).toBe(true);
    expect(isBackgroundAllowedForTheme("ambient-gradient", "light")).toBe(true);
  });

  it("allows dot grid and ambient in dark theme", () => {
    expect(isBackgroundAllowedForTheme("grid", "dark")).toBe(true);
    expect(isBackgroundAllowedForTheme("ambient-gradient", "dark")).toBe(true);
  });

  it("falls back to grid for removed or unknown backgrounds", () => {
    expect(resolveBackgroundForTheme("sky" as "grid", "light")).toBe("grid");
    expect(resolveBackgroundForTheme("network" as "grid", "dark")).toBe("grid");
    expect(resolveBackgroundForTheme("rising-sun" as "grid", "dark")).toBe("grid");
  });
});
