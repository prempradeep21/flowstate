import { fetchOembedJson, oembedToProviderResult } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

const REDDIT_HOSTS = new Set([
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "new.reddit.com",
]);

function isRedditPostPath(pathname: string): boolean {
  return /\/comments\/[a-z0-9]+\//i.test(pathname);
}

export const redditProvider: EmbedProvider = {
  id: "reddit",
  match(url) {
    if (!REDDIT_HOSTS.has(url.hostname.toLowerCase())) return false;
    return isRedditPostPath(url.pathname);
  },
  async resolve(url) {
    const endpoint = `https://www.reddit.com/oembed?url=${encodeURIComponent(
      url.toString(),
    )}&format=json`;
    const data = await fetchOembedJson(endpoint);
    if (!data?.html) {
      throw new Error("Reddit oEmbed failed");
    }
    return oembedToProviderResult(data, {
      width: 640,
      height: 480,
      title: "Reddit post",
    });
  },
};
