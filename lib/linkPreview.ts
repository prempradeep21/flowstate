import { isFrameableFromHeaders } from "@/lib/frameability";
import { domainDisplayLabel } from "@/lib/urlDetection";

const FETCH_TIMEOUT_MS = 5000;
const MAX_HTML_BYTES = 512 * 1024;

const BLOCKED_HOSTNAMES = new Set([
  "localhost",
  "127.0.0.1",
  "0.0.0.0",
  "[::1]",
  "::1",
]);

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map((p) => Number.parseInt(p, 10));
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

function isBlockedHostname(hostname: string): boolean {
  const lower = hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(lower)) return true;
  if (lower.endsWith(".localhost")) return true;
  if (isPrivateIpv4(lower)) return true;
  if (lower.startsWith("fe80:") || lower.startsWith("fc") || lower.startsWith("fd")) {
    return true;
  }
  return false;
}

export function validateLinkPreviewUrl(raw: string): URL | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname || isBlockedHostname(u.hostname)) return null;
    return u;
  } catch {
    return null;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function metaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i",
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i",
    ),
  ];
  for (const re of patterns) {
    const match = html.match(re);
    if (match?.[1]) {
      const decoded = decodeHtmlEntities(match[1]);
      if (decoded) return decoded;
    }
  }
  return null;
}

function titleFromHtml(html: string): string | null {
  const ogTitle = metaContent(html, "og:title");
  if (ogTitle) return ogTitle;
  const siteName = metaContent(html, "og:site_name");
  if (siteName) return siteName;
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch?.[1]) {
    const decoded = decodeHtmlEntities(titleMatch[1]);
    if (decoded) return decoded;
  }
  return null;
}

const PREVIEW_IMAGE_META_KEYS = [
  "og:image",
  "twitter:image",
  "twitter:image:src",
] as const;

/** Parse social preview image URL from HTML (exported for unit tests). */
export function previewImageFromHtml(html: string, baseUrl: URL): string | null {
  for (const key of PREVIEW_IMAGE_META_KEYS) {
    const raw = metaContent(html, key);
    if (!raw) continue;
    try {
      return new URL(raw, baseUrl).toString();
    } catch {
      continue;
    }
  }
  return null;
}

function faviconFromHtml(html: string, baseUrl: URL): string | null {
  const iconMatch = html.match(
    /<link[^>]+rel=["'](?:shortcut icon|icon|apple-touch-icon)["'][^>]*>/i,
  );
  if (!iconMatch) return `${baseUrl.origin}/favicon.ico`;
  const tag = iconMatch[0];
  const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
  if (!hrefMatch?.[1]) return `${baseUrl.origin}/favicon.ico`;
  try {
    return new URL(hrefMatch[1], baseUrl).toString();
  } catch {
    return `${baseUrl.origin}/favicon.ico`;
  }
}

export interface LinkPreviewResult {
  title: string;
  domainLabel: string;
  faviconUrl?: string;
  previewImageUrl?: string;
  /**
   * Whether the page can be embedded in a cross-origin iframe (derived from
   * X-Frame-Options / CSP frame-ancestors). Undefined when it could not be
   * determined (non-OK / non-HTML / fetch failure) — callers treat that as
   * "not embeddable" and fall back to a static preview card.
   */
  embeddable?: boolean;
}

export async function fetchLinkPreview(url: string): Promise<LinkPreviewResult> {
  const parsed = validateLinkPreviewUrl(url);
  if (!parsed) {
    throw new Error("Invalid URL");
  }

  const domainLabel = domainDisplayLabel(parsed.toString());
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(parsed.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "FlowstateLinkPreview/1.0",
      },
      redirect: "follow",
    });

    if (!res.ok) {
      return { title: domainLabel, domainLabel };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
      return { title: domainLabel, domainLabel };
    }

    const embeddable = isFrameableFromHeaders(res.headers);

    const reader = res.body?.getReader();
    if (!reader) {
      return { title: domainLabel, domainLabel };
    }

    let html = "";
    let bytes = 0;
    const decoder = new TextDecoder();

    while (bytes < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
      if (html.includes("</head>") || html.includes("</title>")) break;
    }
    reader.cancel().catch(() => {});

    const title = titleFromHtml(html) ?? domainLabel;
    const faviconUrl = faviconFromHtml(html, parsed) ?? undefined;
    const previewImageUrl = previewImageFromHtml(html, parsed) ?? undefined;

    return { title, domainLabel, faviconUrl, previewImageUrl, embeddable };
  } catch {
    return { title: domainLabel, domainLabel };
  } finally {
    clearTimeout(timeout);
  }
}
