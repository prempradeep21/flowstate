import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, describe, expect, it } from "vitest";
import {
  readPublishedTheme,
  updatePublishedTheme,
} from "@/lib/design/theme/publishedTheme.server";
import { getThemePreset } from "@/lib/design/theme/presets";
import type { ThemePreset } from "@/lib/design/theme/types";

function tempFilePath(): string {
  return path.join(os.tmpdir(), `flowstate-published-theme-test-${Date.now()}-${Math.random()}.json`);
}

const testFiles: string[] = [];

afterEach(() => {
  while (testFiles.length) {
    const file = testFiles.pop()!;
    try {
      fs.unlinkSync(file);
    } catch {
      // already removed
    }
  }
});

describe("readPublishedTheme", () => {
  it("returns safe defaults when the file does not exist", () => {
    const file = tempFilePath();
    const result = readPublishedTheme(file);
    expect(result).toEqual({
      v: 1,
      activeDefaultId: null,
      defaultOverrides: null,
      customThemes: [],
    });
  });

  it("returns safe defaults on malformed JSON", () => {
    const file = tempFilePath();
    testFiles.push(file);
    fs.writeFileSync(file, "{ not valid json", "utf8");
    const result = readPublishedTheme(file);
    expect(result.activeDefaultId).toBeNull();
    expect(result.customThemes).toEqual([]);
  });

  it("returns safe defaults when the version does not match", () => {
    const file = tempFilePath();
    testFiles.push(file);
    fs.writeFileSync(file, JSON.stringify({ v: 2, activeDefaultId: "ember" }), "utf8");
    const result = readPublishedTheme(file);
    expect(result.activeDefaultId).toBeNull();
  });
});

describe("updatePublishedTheme", () => {
  it("read-modify-writes and round-trips through readPublishedTheme", () => {
    const file = tempFilePath();
    testFiles.push(file);

    const customTheme: ThemePreset = {
      id: "custom:sunset-ab12cd",
      name: "Sunset",
      description: "Saved from Flowstate.",
      primary: "#FF7043",
      secondary: "#FFA726",
      tertiary: "#8D6E63",
      categories: {
        data: "#FF7043",
        viz: "#FFA726",
        geo: "#8D6E63",
        media: "#EF5350",
        docs: "#FFCA28",
        dev: "#78909C",
        planning: "#EC407A",
      },
    };

    const result = updatePublishedTheme(
      (current) => ({
        ...current,
        activeDefaultId: customTheme.id,
        defaultOverrides: {},
        customThemes: [...current.customThemes, customTheme],
      }),
      file,
    );

    expect(result.ok).toBe(true);
    const reloaded = readPublishedTheme(file);
    expect(reloaded.activeDefaultId).toBe(customTheme.id);
    expect(reloaded.customThemes).toHaveLength(1);
    expect(reloaded.customThemes[0].name).toBe("Sunset");
  });

  it("resolves a custom theme id via getThemePreset once loaded", () => {
    const file = tempFilePath();
    testFiles.push(file);

    const customTheme: ThemePreset = {
      id: "custom:midnight-99xy",
      name: "Midnight",
      description: "Saved theme.",
      primary: "#1E293B",
      secondary: "#334155",
      tertiary: "#0EA5E9",
      categories: {
        data: "#1E293B",
        viz: "#0EA5E9",
        geo: "#334155",
        media: "#EF4444",
        docs: "#F59E0B",
        dev: "#64748B",
        planning: "#EC4899",
      },
    };

    updatePublishedTheme(
      (current) => ({ ...current, customThemes: [...current.customThemes, customTheme] }),
      file,
    );

    const published = readPublishedTheme(file);
    const resolved = getThemePreset("custom:midnight-99xy", published.customThemes);
    expect(resolved.name).toBe("Midnight");
    expect(resolved.primary).toBe("#1E293B");
  });

  it("unpublishes a custom theme when it is deleted while active", () => {
    const file = tempFilePath();
    testFiles.push(file);

    const customTheme: ThemePreset = {
      id: "custom:dusk-11zz",
      name: "Dusk",
      description: "Saved theme.",
      primary: "#7C3AED",
      secondary: "#A855F7",
      tertiary: "#F472B6",
      categories: {
        data: "#7C3AED",
        viz: "#A855F7",
        geo: "#22C55E",
        media: "#F43F5E",
        docs: "#F59E0B",
        dev: "#64748B",
        planning: "#F472B6",
      },
    };

    updatePublishedTheme(
      (current) => ({
        ...current,
        activeDefaultId: customTheme.id,
        defaultOverrides: {},
        customThemes: [customTheme],
      }),
      file,
    );

    // Simulate the DELETE route's behavior.
    updatePublishedTheme(
      (current) => ({
        ...current,
        activeDefaultId:
          current.activeDefaultId === customTheme.id ? null : current.activeDefaultId,
        defaultOverrides:
          current.activeDefaultId === customTheme.id ? null : current.defaultOverrides,
        customThemes: current.customThemes.filter((t) => t.id !== customTheme.id),
      }),
      file,
    );

    const result = readPublishedTheme(file);
    expect(result.activeDefaultId).toBeNull();
    expect(result.customThemes).toHaveLength(0);
  });

  it("never touches the built-in Flowstate preset", () => {
    const flowstate = getThemePreset("flowstate");
    expect(flowstate.primary).toBe("#2066EB");
    expect(flowstate.name).toBe("Flowstate");
  });
});
