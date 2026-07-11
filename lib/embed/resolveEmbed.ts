import { matchEmbedProvider } from "@/lib/embed/registry";
import { parseTwitterScreenName } from "@/lib/embed/providers/twitter";
import type { EmbedResolveResult } from "@/lib/embed/types";
import { fetchLinkPreview } from "@/lib/linkPreview";
import { fetchPageScreenshot } from "@/lib/pageScreenshot";
import { domainDisplayLabel, normalizeHttpUrl } from "@/lib/urlDetection";

async function linkPreviewFallback(
  url: string,
): Promise<NonNullable<EmbedResolveResult["fallback"]>> {
  try {
    const preview = await fetchLinkPreview(url);
    let previewImageUrl = preview.previewImageUrl;
    if (!previewImageUrl) {
      previewImageUrl = (await fetchPageScreenshot(url)) ?? undefined;
    }
    return {
      domainLabel: preview.domainLabel,
      faviconUrl: preview.faviconUrl,
      previewImageUrl,
    };
  } catch {
    const screenshotUrl = await fetchPageScreenshot(url);
    return {
      domainLabel: domainDisplayLabel(url),
      previewImageUrl: screenshotUrl ?? undefined,
    };
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
    let title = fallback.domainLabel;
    if (provider.id === "twitter") {
      const screenName = parseTwitterScreenName(url);
      if (screenName) title = `@${screenName} on X`;
    }
    return {
      provider: provider.id,
      url: normalized,
      title,
      embedWidth: 520,
      embedHeight: 400,
      status: "failed",
      fallback,
    };
  }
}
