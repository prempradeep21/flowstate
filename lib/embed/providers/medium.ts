import { fetchOembedJson, oembedToProviderResult } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

function isMediumHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "medium.com" || h.endsWith(".medium.com");
}

function isMediumPostPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  if (parts[0] === "@" && parts.length >= 2) return true;
  if (parts.length >= 3 && parts[1] === "p") return true;
  return /^[a-f0-9]{12}$/i.test(parts[parts.length - 1]);
}

export const mediumProvider: EmbedProvider = {
  id: "medium",
  match(url) {
    if (!isMediumHost(url.hostname)) return false;
    return isMediumPostPath(url.pathname);
  },
  async resolve(url) {
    const endpoint = `https://medium.com/oembed?url=${encodeURIComponent(
      url.toString(),
    )}&format=json`;
    const data = await fetchOembedJson(endpoint);
    if (!data?.html) {
      throw new Error("Medium oEmbed failed");
    }
    return oembedToProviderResult(data, {
      width: 640,
      height: 480,
      title: "Medium article",
    });
  },
};
