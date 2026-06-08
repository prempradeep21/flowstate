/** Shared YouTube URL parsing and metadata helpers. */

export function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url.trim());
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.slice(1).split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/").filter(Boolean);
      const idx = parts.findIndex(
        (p) => p === "shorts" || p === "embed" || p === "v",
      );
      if (idx !== -1 && parts[idx + 1]) {
        return parts[idx + 1];
      }
    }
  } catch {
    return null;
  }
  return null;
}

export function isYoutubeUrl(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  return parseYoutubeId(trimmed) !== null;
}

export function youtubeEmbedUrl(url: string): string | null {
  const id = parseYoutubeId(url);
  return id ? `https://www.youtube.com/embed/${id}` : null;
}

export function youtubeThumbUrl(id: string): string {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

export interface YoutubeMeta {
  title: string;
  thumb: string;
}

/**
 * Fetch a video's title and thumbnail via YouTube's public oEmbed endpoint.
 * Falls back to a generic title and the derived thumbnail on any failure
 * (network, CORS, non-200, or unparseable response).
 */
export async function fetchYoutubeMeta(url: string): Promise<YoutubeMeta> {
  const id = parseYoutubeId(url);
  const fallback: YoutubeMeta = {
    title: "YouTube video",
    thumb: id ? youtubeThumbUrl(id) : "",
  };
  try {
    const endpoint = `https://www.youtube.com/oembed?url=${encodeURIComponent(
      url,
    )}&format=json`;
    const res = await fetch(endpoint);
    if (!res.ok) return fallback;
    const data = (await res.json()) as {
      title?: string;
      thumbnail_url?: string;
    };
    return {
      title: data.title?.trim() || fallback.title,
      thumb: data.thumbnail_url || fallback.thumb,
    };
  } catch {
    return fallback;
  }
}
