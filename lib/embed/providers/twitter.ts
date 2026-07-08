import { fetchOembedJson, oembedToProviderResult } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

const TWITTER_HOSTS = new Set([
  "twitter.com",
  "www.twitter.com",
  "mobile.twitter.com",
  "x.com",
  "www.x.com",
  "mobile.x.com",
]);

const PROFILE_PATH_BLOCKLIST = new Set([
  "status",
  "i",
  "intent",
  "search",
  "hashtag",
  "home",
  "explore",
  "notifications",
  "messages",
  "settings",
  "compose",
]);

export function parseTweetId(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  const statusIdx = parts.findIndex((p) => p === "status");
  if (statusIdx === -1 || !parts[statusIdx + 1]) return null;
  const id = parts[statusIdx + 1].split("?")[0];
  return /^[0-9]+$/.test(id) ? id : null;
}

/** Profile URLs like https://x.com/elonmusk (not /status/…). */
export function parseTwitterScreenName(url: URL): string | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 1) return null;
  const screenName = parts[0].split("?")[0];
  if (!screenName || PROFILE_PATH_BLOCKLIST.has(screenName.toLowerCase())) {
    return null;
  }
  if (!/^[A-Za-z0-9_]{1,15}$/.test(screenName)) return null;
  return screenName;
}

function tweetTitleFromOembed(
  data: Awaited<ReturnType<typeof fetchOembedJson>>,
): string {
  if (data?.title?.trim()) return data.title.trim();
  const author = (data as { author_name?: string } | null)?.author_name?.trim();
  if (author) return `${author} on X`;
  return "Post on X";
}

export const twitterProvider: EmbedProvider = {
  id: "twitter",
  match(url) {
    if (!TWITTER_HOSTS.has(url.hostname.toLowerCase())) return false;
    return parseTweetId(url) !== null || parseTwitterScreenName(url) !== null;
  },
  async resolve(url) {
    const tweetId = parseTweetId(url);
    if (tweetId) {
      const oembedEndpoint = `https://publish.twitter.com/oembed?url=${encodeURIComponent(
        url.toString(),
      )}&omit_script=1&dnt=true&hide_thread=true`;
      const data = await fetchOembedJson(oembedEndpoint);
      const title = tweetTitleFromOembed(data);

      if (data?.html) {
        const fromOembed = oembedToProviderResult(data, {
          width: 550,
          height: 420,
          title,
        });
        return {
          ...fromOembed,
          title,
          iframeSrc:
            fromOembed.iframeSrc ??
            `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true`,
        };
      }

      let embedHeight = 420;
      if (typeof data?.height === "number" && data.height > 0) {
        embedHeight = Math.max(280, Math.min(900, data.height));
      }

      return {
        title,
        embedWidth: 550,
        embedHeight,
        iframeSrc: `https://platform.twitter.com/embed/Tweet.html?id=${tweetId}&dnt=true`,
      };
    }

    const screenName = parseTwitterScreenName(url);
    if (!screenName) throw new Error("Invalid X/Twitter URL");

    // Timeline embeds are unreliable; surface static fallback card instead.
    throw new Error(`X profile timeline embed unavailable for @${screenName}`);
  },
};
