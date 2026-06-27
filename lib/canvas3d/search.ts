import {
  CANVAS_3D_CATALOG,
  type Canvas3DCatalogEntry,
  type Canvas3DFormat,
} from "@/lib/canvas3d/catalog";

export interface Canvas3DSearchResult {
  id: string;
  title: string;
  modelUrl: string;
  format: Canvas3DFormat;
  animated: boolean;
  license: string;
  source: string;
  sourceUrl: string;
}

export interface SearchCanvas3DOptions {
  query?: string;
  offset?: number;
  limit?: number;
}

export interface SearchCanvas3DResponse {
  results: Canvas3DSearchResult[];
  totalCount: number;
  offset: number;
  limit: number;
}

function normalizeQuery(raw: string | undefined): string {
  return raw?.trim().toLowerCase() ?? "";
}

function entryMatchesQuery(entry: Canvas3DCatalogEntry, query: string): boolean {
  if (!query) return true;
  const haystack = [entry.title, ...entry.tags, entry.source]
    .join(" ")
    .toLowerCase();
  return query.split(/\s+/).every((token) => haystack.includes(token));
}

function toSearchResult(entry: Canvas3DCatalogEntry): Canvas3DSearchResult {
  return {
    id: entry.id,
    title: entry.title,
    modelUrl: entry.modelUrl,
    format: entry.format,
    animated: entry.animated,
    license: entry.license,
    source: entry.source,
    sourceUrl: entry.sourceUrl,
  };
}

export function searchCanvas3DCatalog(
  options: SearchCanvas3DOptions = {},
): SearchCanvas3DResponse {
  const query = normalizeQuery(options.query);
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.min(48, Math.max(1, options.limit ?? 24));

  const filtered = CANVAS_3D_CATALOG.filter((entry) =>
    entryMatchesQuery(entry, query),
  ).map(toSearchResult);

  return {
    results: filtered.slice(offset, offset + limit),
    totalCount: filtered.length,
    offset,
    limit,
  };
}
