import { matchEmbedProvider } from "@/lib/embed/registry";
import type { EmbedResolveResult } from "@/lib/embed/types";
import { fetchLinkPreview } from "@/lib/linkPreview";
import { domainDisplayLabel, normalizeHttpUrl } from "@/lib/urlDetection";

async function linkPreviewFallback(
  url: string,
): Promise<NonNullable<EmbedResolveResult["fallback"]>> {
  try {
    const preview = await fetchLinkPreview(url);
    return {
      domainLabel: preview.domainLabel,
      faviconUrl: preview.faviconUrl,
      previewImageUrl: preview.previewImageUrl,
    };
  } catch {
    return { domainLabel: domainDisplayLabel(url) };
  }
}

export async function resolveEmbedUrl(rawUrl: string): Promise<EmbedResolveResult | null> {
  const normalized = normalizeHttpUrl(rawUrl);
  if (!normalized) return null;

  const provider = matchEmbedProvider(normalized);
  if (!provider) return null;

  const url = new URL(normalized);
  const fallback = await linkPreviewFallback(normalized);

  try {
    const result = await provider.resolve(url);
    if (!result.iframeSrc && !result.embedHtml) {
      throw new Error("No embed content");
    }
    return {
      provider: provider.id,
      url: normalized,
      title: result.title,
      embedWidth: result.embedWidth,
      embedHeight: result.embedHeight,
      iframeSrc: result.iframeSrc,
      embedHtml: result.embedHtml,
      status: "ready",
      fallback,
    };
  } catch {
    return {
      provider: provider.id,
      url: normalized,
      title: fallback.domainLabel,
      embedWidth: 520,
      embedHeight: 400,
      status: "failed",
      fallback,
    };
  }
}
