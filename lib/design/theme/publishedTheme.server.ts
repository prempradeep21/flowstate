import fs from "fs";
import path from "path";
import type { ThemeOverrides, ThemePreset } from "@/lib/design/theme/types";

/**
 * Server-only read/write for the checked-in "published" theme file. This is
 * the local, git-committed default layer: a fresh browser with no personal
 * localStorage override boots into whatever is published here (see
 * app/layout.tsx). Writing requires a writable filesystem — works on a local
 * dev server, fails gracefully (caller handles) on read-only production
 * hosts like Vercel. Never touches lib/design/theme/presets.ts or
 * app/globals.css; those stay the immutable factory baseline.
 */

const FILE_PATH = path.join(
  process.cwd(),
  "lib/design/theme/publishedTheme.json",
);

export interface PublishedTheme {
  v: 1;
  activeDefaultId: string | null;
  defaultOverrides: ThemeOverrides | null;
  customThemes: ThemePreset[];
}

const EMPTY_PUBLISHED_THEME: PublishedTheme = {
  v: 1,
  activeDefaultId: null,
  defaultOverrides: null,
  customThemes: [],
};

// filePath is only ever overridden by tests; production callers use the default.
export function readPublishedTheme(filePath: string = FILE_PATH): PublishedTheme {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<PublishedTheme> | null;
    if (!parsed || parsed.v !== 1) return EMPTY_PUBLISHED_THEME;
    return {
      v: 1,
      activeDefaultId:
        typeof parsed.activeDefaultId === "string" ? parsed.activeDefaultId : null,
      defaultOverrides: parsed.defaultOverrides ?? null,
      customThemes: Array.isArray(parsed.customThemes) ? parsed.customThemes : [],
    };
  } catch {
    return EMPTY_PUBLISHED_THEME;
  }
}

function writePublishedTheme(data: PublishedTheme, filePath: string = FILE_PATH): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Read-modify-write wrapper for API routes. Returns `{ ok: false }` instead
 * of throwing when the filesystem is read-only (production/Vercel) — the
 * publish/save feature is local-dev-only by design; the caller ships the
 * resulting file change to production via a normal git commit + deploy.
 */
export function updatePublishedTheme(
  update: (current: PublishedTheme) => PublishedTheme,
  filePath: string = FILE_PATH,
): { ok: true; data: PublishedTheme } | { ok: false; error: string } {
  try {
    const next = update(readPublishedTheme(filePath));
    writePublishedTheme(next, filePath);
    return { ok: true, data: next };
  } catch {
    return {
      ok: false,
      error:
        "Publishing is only supported on a local dev server with a writable filesystem.",
    };
  }
}
