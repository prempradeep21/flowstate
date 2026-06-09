import { fetchOembedJson, oembedToProviderResult } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

const INSTAGRAM_HOSTS = new Set([
  "instagram.com",
  "www.instagram.com",
]);

export function parseInstagramShortcode(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) return null;
  const kind = parts[0];
  if (kind !== "p" && kind !== "reel" && kind !== "tv") return null;
  const code = parts[1]?.split("?")[0];
  return code && /^[A-Za-z0-9_-]+$/.test(code) ? code : null;
}

function metaAccessToken(): string | null {
  const token = process.env.META_EMBED_ACCESS_TOKEN?.trim();
  if (token) return token;
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  if (appId && secret) return `${appId}|${secret}`;
  return null;
}

export const instagramProvider: EmbedProvider = {
  id: "instagram",
  match(url) {
    if (!INSTAGRAM_HOSTS.has(url.hostname.toLowerCase())) return false;
    return parseInstagramShortcode(url) !== null;
  },
  async resolve(url) {
    const shortcode = parseInstagramShortcode(url);
    if (!shortcode) throw new Error("Invalid Instagram URL");

    const token = metaAccessToken();
    if (token) {
      const endpoint = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(
        url.toString(),
      )}&access_token=${encodeURIComponent(token)}&omitscript=true`;
      const data = await fetchOembedJson(endpoint);
      if (data?.html) {
        return oembedToProviderResult(data, {
          width: 540,
          height: 600,
          title: "Instagram post",
        });
      }
    }

    const pathKind = url.pathname.split("/").filter(Boolean)[0] ?? "p";
    return {
      title: "Instagram post",
      embedWidth: 540,
      embedHeight: 600,
      iframeSrc: `https://www.instagram.com/${pathKind}/${shortcode}/embed/captioned`,
    };
  },
};
