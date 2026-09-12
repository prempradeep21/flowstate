// SSRF guard for user-supplied MCP server URLs (server-only: uses node:dns).
//
// Per the MCP spec security best practices: HTTPS-only, resolve the hostname
// and reject private/reserved ranges (cloud metadata, RFC1918, loopback,
// link-local, CGNAT, IPv6 ULA/link-local), and re-validate on every redirect
// hop. Residual DNS-rebinding TOCTOU between validation and the SDK's own
// fetch is accepted for V1.

import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isDesktopApp } from "@/lib/supabase/environment";

function isPrivateIpv4(ip: string): boolean {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) {
    return true; // malformed — treat as unsafe
  }
  const [a, b] = parts as [number, number, number, number];
  if (a === 0 || a === 10 || a === 127) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  if (a === 169 && b === 254) return true; // link-local incl. 169.254.169.254
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 192 && b === 0) return true; // 192.0.0.0/24 special-purpose
  if (a === 198 && (b === 18 || b === 19)) return true; // benchmarking
  if (a >= 224) return true; // multicast + reserved
  return false;
}

export function isPrivateIp(ip: string): boolean {
  const version = isIP(ip);
  if (version === 4) return isPrivateIpv4(ip);
  if (version !== 6) return true;
  const lower = ip.toLowerCase();
  if (lower === "::" || lower === "::1") return true;
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIpv4(mapped[1]!);
  if (lower.startsWith("fc") || lower.startsWith("fd")) return true; // ULA fc00::/7
  if (/^fe[89ab]/.test(lower)) return true; // link-local fe80::/10
  return false;
}

function isLocalhostName(hostname: string): boolean {
  return (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  );
}

/**
 * Validate a user-supplied MCP endpoint URL. Throws with a user-facing
 * message on rejection; returns the parsed URL when safe.
 */
export async function assertSafeMcpUrl(raw: string): Promise<URL> {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Invalid URL.");
  }

  const localhostAllowed = isDesktopApp() || process.env.NODE_ENV === "development";
  if (url.protocol === "http:") {
    if (!(localhostAllowed && isLocalhostName(url.hostname))) {
      throw new Error("MCP server URLs must use https://");
    }
  } else if (url.protocol !== "https:") {
    throw new Error("MCP server URLs must use https://");
  }
  if (url.username || url.password) {
    throw new Error("Credentials in the URL are not allowed.");
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  if (isLocalhostName(url.hostname)) {
    if (!localhostAllowed) throw new Error("Localhost MCP servers are only available in the desktop app.");
    return url;
  }
  if (isIP(hostname)) {
    if (isPrivateIp(hostname)) throw new Error("This address is not reachable from Flowstate.");
    return url;
  }

  let addresses;
  try {
    addresses = await lookup(hostname, { all: true, verbatim: true });
  } catch {
    throw new Error(`Could not resolve host "${hostname}".`);
  }
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error("This address is not reachable from Flowstate.");
  }
  return url;
}

const MAX_REDIRECTS = 3;

/**
 * fetch wrapper for MCP transports: follows redirects manually so every hop
 * is re-validated against the SSRF rules above.
 */
export const guardedFetch: typeof fetch = async (input, init) => {
  let currentUrl = typeof input === "string" || input instanceof URL ? String(input) : input.url;
  let currentInit = init;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeMcpUrl(currentUrl);
    const res = await fetch(currentUrl, { ...currentInit, redirect: "manual" });
    if (res.status < 300 || res.status >= 400) return res;
    const location = res.headers.get("location");
    if (!location) return res;
    currentUrl = new URL(location, currentUrl).toString();
    // Per fetch semantics, 303 (and 301/302 for POST) switch to GET.
    if (res.status === 303 || ((res.status === 301 || res.status === 302) && currentInit?.method === "POST")) {
      currentInit = { ...currentInit, method: "GET", body: undefined };
    }
  }
  throw new Error("Too many redirects from MCP server.");
};
