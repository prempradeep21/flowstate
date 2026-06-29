import { validateLinkPreviewUrl } from "@/lib/linkPreview";
import { classifyPastedUrl } from "@/lib/urlDetection";

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 512 * 1024;
const MAX_PAGE_TEXT_CHARS = 24_000;
const MAX_URLS_PER_MESSAGE = 2;

export interface FetchedPageContent {
  url: string;
  title?: string;
  text?: string;
  error?: string;
}

/** URLs in prose that are safe to auto-fetch for chat context. */
export function shouldAutoFetchUrl(url: string): boolean {
  const kind = classifyPastedUrl(url);
  if (!kind) return false;
  if (kind === "youtube" || kind === "repo" || kind === "google-doc") {
    return false;
  }
  return true;
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

/** Strip tags and collapse whitespace for readable plain text. */
export function htmlToPlainText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<\/h[1-6]>/gi, "\n\n")
    .replace(/<[^>]+>/g, "");
  text = decodeHtmlEntities(text);
  return text
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function titleFromHtml(html: string): string | null {
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  );
  if (ogTitle?.[1]) return decodeHtmlEntities(ogTitle[1]);
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch?.[1]) return decodeHtmlEntities(titleMatch[1]);
  return null;
}

/** Substack embeds full post JSON in window._preloads. */
export function substackBodyFromHtml(html: string): string | null {
  const match = html.match(
    /window\._preloads\s*=\s*JSON\.parse\("([\s\S]*?)"\)\s*<\/script>/,
  );
  if (!match?.[1]) return null;
  try {
    const jsonText = JSON.parse(`"${match[1]}"`) as string;
    const data = JSON.parse(jsonText) as {
      post?: { body_html?: string; title?: string };
    };
    const bodyHtml = data.post?.body_html;
    if (typeof bodyHtml !== "string" || !bodyHtml.trim()) return null;
    return htmlToPlainText(bodyHtml);
  } catch {
    return null;
  }
}

function articleTextFromHtml(html: string): { title: string | null; text: string } {
  const substack = substackBodyFromHtml(html);
  if (substack) {
    return { title: titleFromHtml(html), text: substack };
  }

  const paragraphs = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((m) => htmlToPlainText(m[1]))
    .filter((t) => t.length > 40);
  if (paragraphs.length >= 2) {
    return { title: titleFromHtml(html), text: paragraphs.join("\n\n") };
  }

  const articleMatch = html.match(/<article[\s\S]*?<\/article>/i);
  if (articleMatch) {
    const text = htmlToPlainText(articleMatch[0]);
    if (text.length > 100) {
      return { title: titleFromHtml(html), text };
    }
  }

  const mainMatch = html.match(/<main[\s\S]*?<\/main>/i);
  if (mainMatch) {
    const text = htmlToPlainText(mainMatch[0]);
    if (text.length > 100) {
      return { title: titleFromHtml(html), text };
    }
  }

  return { title: titleFromHtml(html), text: htmlToPlainText(html) };
}

async function fetchPageHtml(url: URL): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url.toString(), {
      signal: controller.signal,
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "FlowstatePageFetch/1.0",
      },
      redirect: "follow",
    });

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return null;
    }

    const reader = res.body?.getReader();
    if (!reader) return null;

    let html = "";
    let bytes = 0;
    const decoder = new TextDecoder();

    while (bytes < MAX_HTML_BYTES) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value.byteLength;
      html += decoder.decode(value, { stream: true });
    }
    reader.cancel().catch(() => {});

    return html;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchPageContent(url: string): Promise<FetchedPageContent> {
  const parsed = validateLinkPreviewUrl(url);
  if (!parsed) {
    return { url, error: "Invalid or blocked URL." };
  }

  const html = await fetchPageHtml(parsed);
  if (!html) {
    return {
      url: parsed.toString(),
      error: "Could not download page (timeout, blocked, or non-HTML).",
    };
  }

  const { title, text } = articleTextFromHtml(html);
  const trimmed = text.slice(0, MAX_PAGE_TEXT_CHARS);
  if (trimmed.length < 80) {
    return {
      url: parsed.toString(),
      title: title ?? undefined,
      error: "Page downloaded but little readable text was extracted (paywall or JS-only content).",
    };
  }

  return {
    url: parsed.toString(),
    title: title ?? undefined,
    text: trimmed,
  };
}

export async function fetchPagesForChat(
  urls: string[],
): Promise<FetchedPageContent[]> {
  const unique = [...new Set(urls)].slice(0, MAX_URLS_PER_MESSAGE);
  return Promise.all(unique.map((url) => fetchPageContent(url)));
}

export function formatFetchedPagesContext(pages: FetchedPageContent[]): string {
  const blocks = pages
    .map((page) => {
      if (page.text) {
        const titleLine = page.title ? `Title: ${page.title}\n` : "";
        return (
          `--- Fetched page content (${page.url}) ---\n` +
          `${titleLine}\n${page.text}\n` +
          `--- End fetched content ---`
        );
      }
      return (
        `--- Could not read page (${page.url}) ---\n` +
        `${page.error ?? "Unknown error."}\n` +
        `---`
      );
    })
    .join("\n\n");

  return `\n\n${blocks}`;
}
