import { fetchOembedJson } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

const TWITTER_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
  "mobile.x.com",
]);

export function parseTweetId(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIdx = parts.findIndex((p) => p === "status");
  if (statusIdx === -1 || !parts[statusIdx + 1]) return null;
  const id = parts[statusIdx + 1].split("?")[0];
  return /^[0-9]+$/.test(id) ? id : null;
}

export const twitterProvider: EmbedProvider = {
  id: "twitter",
  match(url) {
    if (!TWITTER_HOSTS.has(url.hostname.toLowerCase())) return false;
    return parseTweetId(url) !== null;
  },
  async resolve(url) {
    const tweetId = parseTweetId(url);
    if (!tweetId) throw new Error("Invalid tweet URL");

    // Twitter oEmbed returns a blockquote + widgets.js, not an iframe. Rendering
    // that HTML without the external script only shows unstyled quote text.
    // Always use the official embed iframe for the full tweet card UI.
    let title = "Post on X";
    let embedHeight = 420;

    const oembedEndpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
      url.toString(),
    )}&omit_script=1&dnt=true&hide_thread=true`;
    const data = await fetchOembedJson(oembedEndpoint);
    if (data?.title?.trim()) {
      title = data.title.trim();
    }
    if (typeof data?.height === "number" && data.height > 0) {
      embedHeight = Math.max(280, Math.min(900, data.height));
    }

    return {
      title,
      embedWidth: 550,
      embedHeight,
      iframeSrc: `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true`,
    };
  },
};
