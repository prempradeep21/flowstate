import fs from "fs";
import path from "path";
import {
  EMPTY_PUBLISHED_MODELS,
  normalizePublishedModels,
  type PublishedModels,
  type SelectableOpenRouterModel,
} from "@/lib/modelConfig/publishedModelsTypes";

/**
 * Server-only read/write for the checked-in "published" model list. Mirrors
 * lib/design/theme/publishedTheme.server.ts: a git-committed default layer that
 * the composer reads on load. Writing requires a writable filesystem — works on
 * a local dev server, fails gracefully (caller handles) on read-only hosts like
 * Vercel, where the resulting JSON change ships via a normal git commit + deploy.
 */

const FILE_PATH = path.join(
  process.cwd(),
  "lib/modelConfig/publishedModels.json",
);

// filePath is only ever overridden by tests; production callers use the default.
export function readPublishedModels(filePath: string = FILE_PATH): PublishedModels {
  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return normalizePublishedModels(JSON.parse(raw));
  } catch {
    return EMPTY_PUBLISHED_MODELS;
  }
}

function writePublishedModels(
  data: PublishedModels,
  filePath: string = FILE_PATH,
): void {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf8");
}

/**
 * Read-modify-write wrapper for the publish API route. Returns `{ ok: false }`
 * instead of throwing when the filesystem is read-only (production/Vercel).
 */
export function updatePublishedModels(
  update: (current: PublishedModels) => PublishedModels,
  filePath: string = FILE_PATH,
): { ok: true; data: PublishedModels } | { ok: false; error: string } {
  try {
    const next = normalizePublishedModels(update(readPublishedModels(filePath)));
    writePublishedModels(next, filePath);
    return { ok: true, data: next };
  } catch {
    return {
      ok: false,
      error:
        "Publishing is only supported on a local dev server with a writable filesystem.",
    };
  }
}

/**
 * Capability lookup for a published OpenRouter model id (used by the chat route
 * to avoid offering tools to a text-only model). Undefined when the id is not in
 * the published list.
 */
export function findPublishedOpenRouterModel(
  id: string,
): SelectableOpenRouterModel | undefined {
  return readPublishedModels().openrouterModels.find((m) => m.id === id);
}
