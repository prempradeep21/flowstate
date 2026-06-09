const FETCH_TIMEOUT_MS = 8000;

export interface OembedJson {
  title?: string;
  html?: string;
  width?: number;
  height?: number;
  provider_name?: string;
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .trim();
}

/** Extract iframe src from oEmbed HTML fragment. */
export function extractIframeSrc(html: string): string | null {
  const match = html.match(/<iframe[^>]+src=["']([^"']+)["']/i);
  if (!match?.[1]) return null;
  return decodeHtmlEntities(match[1]);
}

export async function fetchOembedJson(endpoint: string): Promise<OembedJson | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as OembedJson;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export function oembedToProviderResult(
  data: OembedJson,
  defaults: { width: number; height: number; title: string },
): {
  title: string;
  embedWidth: number;
  embedHeight: number;
  iframeSrc?: string;
  embedHtml?: string;
} {
  const title = data.title?.trim() || defaults.title;
  const embedWidth =
    typeof data.width === "number" && data.width > 0 ? data.width : defaults.width;
  const embedHeight =
    typeof data.height === "number" && data.height > 0 ? data.height : defaults.height;
  const html = data.html?.trim();
  const iframeSrc = html ? extractIframeSrc(html) ?? undefined : undefined;
  return {
    title,
    embedWidth,
    embedHeight,
    iframeSrc,
    embedHtml: html && !iframeSrc ? html : undefined,
  };
}
