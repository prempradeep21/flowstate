import type { EmbedProvider } from "@/lib/embed/types";

const FIGMA_HOSTS = new Set(["figma.com", "www.figma.com"]);

function isFigmaEmbedPath(pathname: string): boolean {
  return /^\/(file|design|proto|board|slides)\//i.test(pathname);
}

export const figmaProvider: EmbedProvider = {
  id: "figma",
  match(url) {
    if (!FIGMA_HOSTS.has(url.hostname.toLowerCase())) return false;
    return isFigmaEmbedPath(url.pathname);
  },
  async resolve(url) {
    const embedUrl = `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(
      url.toString(),
    )}`;
    return {
      title: "Figma design",
      embedWidth: 800,
      embedHeight: 450,
      iframeSrc: embedUrl,
    };
  },
};
