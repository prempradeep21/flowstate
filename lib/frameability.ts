/**
 * Detect whether a page can be embedded in a cross-origin <iframe>, based on the
 * response headers a browser would enforce. This must run server-side because a
 * browser will not expose these headers to cross-origin script.
 *
 * Rules (conservative — when in doubt, treat as NOT frameable):
 * - `X-Frame-Options: DENY` or `SAMEORIGIN` → not frameable.
 * - CSP `frame-ancestors` directive present → frameable only when it explicitly
 *   contains a wildcard `*`. Anything else (`'none'`, `'self'`, specific origins)
 *   is treated as not frameable, since our canvas origin is not in the allow-list.
 * - No blocking header → frameable.
 */

function xFrameOptionsBlocks(value: string | null): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  // Some servers send a comma/space separated or duplicated value; any DENY or
  // SAMEORIGIN token means a cross-origin frame is refused.
  return lower.includes("deny") || lower.includes("sameorigin");
}

function extractFrameAncestors(csp: string): string | null {
  // Directives are separated by ";"; find the frame-ancestors one.
  for (const directive of csp.split(";")) {
    const trimmed = directive.trim();
    if (/^frame-ancestors\b/i.test(trimmed)) {
      return trimmed.replace(/^frame-ancestors\b/i, "").trim().toLowerCase();
    }
  }
  return null;
}

function cspBlocks(value: string | null): boolean {
  if (!value) return false;
  const ancestors = extractFrameAncestors(value);
  if (ancestors === null) return false; // no frame-ancestors directive → not restricted by CSP
  if (ancestors === "" || ancestors.includes("'none'")) return true;
  // Frameable only if a wildcard is present; a bare "*" or "https://*" etc.
  const sources = ancestors.split(/\s+/).filter(Boolean);
  const hasWildcard = sources.some((s) => s === "*" || s.startsWith("*") || s.includes("://*"));
  return !hasWildcard;
}

/** Returns true when the page appears embeddable in a cross-origin iframe. */
export function isFrameableFromHeaders(headers: Headers): boolean {
  if (xFrameOptionsBlocks(headers.get("x-frame-options"))) return false;
  if (cspBlocks(headers.get("content-security-policy"))) return false;
  return true;
}
