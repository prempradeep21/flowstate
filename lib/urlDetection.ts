import { matchEmbedProvider } from "@/lib/embed/registry";
import { parseGoogleDriveUrl } from "@/lib/google/parseDriveUrl";
import { parseGithubRepoUrl } from "@/lib/github/parseRepoUrl";
import { isYoutubeUrl } from "@/lib/youtube";

const URL_SCHEME_RE = /^https?:\/\//i;

/** Trim, add https:// when missing, validate with URL. */
export function normalizeHttpUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  const withScheme = URL_SCHEME_RE.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    return u.toString();
  } catch {
    return null;
  }
}

/** Return URL if entire trimmed text is a single http(s) URL. */
export function extractUrlFromText(text: string): string | null {
  const trimmed = text.trim();
  if (!trimmed || /\s/.test(trimmed)) return null;
  return normalizeHttpUrl(trimmed);
}

const URL_IN_TEXT_RE = /https?:\/\/[^\s<>"')\]]+/gi;

/** Extract http(s) URLs embedded in a longer message (deduped, order preserved). */
export function extractUrlsFromText(text: string): string[] {
  const matches = text.match(URL_IN_TEXT_RE) ?? [];
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const raw of matches) {
    const trimmed = raw.replace(/[.,;:!?)]+$/, "");
    const normalized = normalizeHttpUrl(trimmed);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    urls.push(normalized);
  }
  return urls;
}

/** Hostname minus www and TLD → title-case fallback (e.g. github.com → Github). */
export function domainDisplayLabel(url: string): string {
  try {
    const u = new URL(url);
    let host = u.hostname.toLowerCase();
    if (host.startsWith("www.")) {
      host = host.slice(4);
    }
    const parts = host.split(".");
    if (parts.length >= 2) {
      const label = parts[parts.length - 2];
      if (label) {
        return label.charAt(0).toUpperCase() + label.slice(1);
      }
    }
    return host || "Website";
  } catch {
    return "Website";
  }
}

export type PastedUrlKind = "youtube" | "website" | "repo" | "embed" | "google-doc";

/** Classify a normalized URL for artifact routing. */
export function classifyPastedUrl(url: string): PastedUrlKind | null {
  const normalized = normalizeHttpUrl(url);
  if (!normalized) return null;
  if (isYoutubeUrl(normalized)) return "youtube";
  if (parseGithubRepoUrl(normalized)) return "repo";
  if (parseGoogleDriveUrl(normalized)) return "google-doc";
  if (matchEmbedProvider(normalized)) return "embed";
  return "website";
}

/** Extract and classify URL from clipboard/pasted text. */
export function classifyPastedText(text: string): {
  url: string;
  kind: PastedUrlKind;
} | null {
  const url = extractUrlFromText(text);
  if (!url) return null;
  const kind = classifyPastedUrl(url);
  if (!kind) return null;
  return { url, kind };
}
