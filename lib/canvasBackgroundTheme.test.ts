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

  it("blocks sky, network, and rising sun in light theme", () => {
    expect(isBackgroundAllowedForTheme("sky", "light")).toBe(false);
    expect(isBackgroundAllowedForTheme("network", "light")).toBe(false);
    expect(isBackgroundAllowedForTheme("rising-sun", "light")).toBe(false);
  });

  it("allows all backgrounds in dark theme", () => {
    expect(isBackgroundAllowedForTheme("grid", "dark")).toBe(true);
    expect(isBackgroundAllowedForTheme("sky", "dark")).toBe(true);
    expect(isBackgroundAllowedForTheme("network", "dark")).toBe(true);
    expect(isBackgroundAllowedForTheme("rising-sun", "dark")).toBe(true);
  });

  it("falls back to grid when background is invalid for theme", () => {
    expect(resolveBackgroundForTheme("sky", "light")).toBe("grid");
    expect(resolveBackgroundForTheme("network", "light")).toBe("grid");
    expect(resolveBackgroundForTheme("sky", "dark")).toBe("sky");
  });
});
