import { fetchOembedJson, oembedToProviderResult } from "@/lib/embed/oembed";
import type { EmbedProvider } from "@/lib/embed/types";

function isSubstackHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  return h === "substack.com" || h.endsWith(".substack.com");
}

function isSubstackPostPath(pathname: string): boolean {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length < 2) return false;
  if (parts[0] === "p" && parts.length >= 2) return true;
  if (parts.length >= 2 && parts[1] === "p") return true;
  return false;
}

export const substackProvider: EmbedProvider = {
  id: "substack",
  match(url) {
    if (!isSubstackHost(url.hostname)) return false;
    return isSubstackPostPath(url.pathname);
  },
  async resolve(url) {
    const endpoint = `https://substack.com/oembed?url=${encodeURIComponent(
      url.toString(),
    )}&format=json`;
    const data = await fetchOembedJson(endpoint);
    if (!data?.html) {
      throw new Error("Substack oEmbed failed");
    }
    return oembedToProviderResult(data, {
      width: 640,
      height: 480,
      title: "Substack post",
    });
  },
};
