export type GiphySearchCategory = "gif" | "sticker";

export interface GiphyResult {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  width: number;
  height: number;
  aspectRatio: number;
  category: GiphySearchCategory;
}

interface GiphyImageRendition {
  url?: string;
  width?: string;
  height?: string;
}

interface GiphyGifObject {
  id: string;
  title?: string;
  images?: {
    fixed_height?: GiphyImageRendition;
    fixed_height_still?: GiphyImageRendition;
    downsized?: GiphyImageRendition;
    preview_gif?: GiphyImageRendition;
  };
}

interface GiphyListResponse {
  data?: GiphyGifObject[];
  pagination?: { total_count?: number; count?: number; offset?: number };
}

function pickAnimatedUrl(images: GiphyGifObject["images"]): string | null {
  return (
    images?.fixed_height?.url ??
    images?.downsized?.url ??
    images?.preview_gif?.url ??
    null
  );
}

function pickPreviewUrl(images: GiphyGifObject["images"]): string | null {
  return (
    images?.fixed_height_still?.url ??
    images?.fixed_height?.url ??
    images?.downsized?.url ??
    null
  );
}

function normalizeGiphyItem(
  item: GiphyGifObject,
  category: GiphySearchCategory,
): GiphyResult | null {
  const url = pickAnimatedUrl(item.images);
  if (!url) return null;

  const previewUrl = pickPreviewUrl(item.images) ?? url;
  const width = Number(item.images?.fixed_height?.width ?? 200);
  const height = Number(item.images?.fixed_height?.height ?? 200);
  const safeWidth = Number.isFinite(width) && width > 0 ? width : 200;
  const safeHeight = Number.isFinite(height) && height > 0 ? height : 200;

  return {
    id: item.id,
    title: item.title?.trim() || "GIF",
    url,
    previewUrl,
    width: safeWidth,
    height: safeHeight,
    aspectRatio: safeWidth / safeHeight,
    category,
  };
}

export interface SearchGiphyOptions {
  query?: string;
  category?: GiphySearchCategory;
  offset?: number;
  limit?: number;
}

export interface SearchGiphyResponse {
  results: GiphyResult[];
  totalCount: number;
  offset: number;
  limit: number;
}

export async function searchGiphy(
  apiKey: string,
  options: SearchGiphyOptions = {},
): Promise<SearchGiphyResponse> {
  const category = options.category ?? "gif";
  const offset = Math.max(0, options.offset ?? 0);
  const limit = Math.min(24, Math.max(1, options.limit ?? 24));
  const query = options.query?.trim() ?? "";

  const resource = category === "sticker" ? "stickers" : "gifs";
  const endpoint = query
    ? `https://api.giphy.com/v1/${resource}/search`
    : `https://api.giphy.com/v1/${resource}/trending`;

  const url = new URL(endpoint);
  url.searchParams.set("api_key", apiKey);
  url.searchParams.set("limit", String(limit));
  url.searchParams.set("offset", String(offset));
  url.searchParams.set("rating", "g");
  url.searchParams.set("lang", "en");
  if (query) url.searchParams.set("q", query);

  const res = await fetch(url.toString(), { next: { revalidate: 300 } });
  if (!res.ok) {
    throw new Error(`Giphy API error (${res.status})`);
  }

  const body = (await res.json()) as GiphyListResponse;
  const results = (body.data ?? [])
    .map((item) => normalizeGiphyItem(item, category))
    .filter((item): item is GiphyResult => item !== null);

  return {
    results,
    totalCount: body.pagination?.total_count ?? results.length,
    offset,
    limit,
  };
}
