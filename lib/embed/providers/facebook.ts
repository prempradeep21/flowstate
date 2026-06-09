import { fetchOembedJson, oembedToProviderResult } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

const FACEBOOK_HOSTS = new Set([
  "facebook.com",
  "www.facebook.com",
  "m.facebook.com",
  "web.facebook.com",
  "fb.com",
  "www.fb.com",
  "fb.watch",
  "www.fb.watch",
]);

function isEmbeddableFacebookPath(pathname: string): boolean {
  if (pathname.includes("/plugins/")) return false;
  if (pathname.includes("/sharer")) return false;
  if (pathname.includes("/share")) return false;
  if (pathname === "/" || pathname === "") return false;
  return true;
}

function metaAccessToken(): string | null {
  const token = process.env.META_EMBED_ACCESS_TOKEN?.trim();
  if (token) return token;
  const appId = process.env.META_APP_ID?.trim();
  const secret = process.env.META_APP_SECRET?.trim();
  if (appId && secret) return `${appId}|${secret}`;
  return null;
}

export const facebookProvider: EmbedProvider = {
  id: "facebook",
  match(url) {
    const host = url.hostname.toLowerCase();
    if (!FACEBOOK_HOSTS.has(host)) return false;
    return isEmbeddableFacebookPath(url.pathname);
  },
  async resolve(url) {
    const pageUrl = url.toString();
    const token = metaAccessToken();
    if (token) {
      const endpoint = `https://graph.facebook.com/v21.0/oembed_post?url=${encodeURIComponent(
        pageUrl,
      )}&access_token=${encodeURIComponent(token)}`;
      const data = await fetchOembedJson(endpoint);
      if (data?.html) {
        return oembedToProviderResult(data, {
          width: 500,
          height: 500,
          title: "Facebook post",
        });
      }
    }

    const isVideo =
      url.pathname.includes("/videos/") ||
      url.hostname.toLowerCase().includes("fb.watch");
    const iframeSrc = isVideo
      ? `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(pageUrl)}&show_text=false&width=500`
      : `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(
          pageUrl,
        )}&show_text=true&width=500`;

    return {
      title: isVideo ? "Facebook video" : "Facebook post",
      embedWidth: 500,
      embedHeight: isVideo ? 281 : 500,
      iframeSrc,
    };
  },
};
