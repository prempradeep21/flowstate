import type { ArtifactPayload, EmbedArtifactData } from "@/lib/artifactTypes";
import type { EmbedProviderId } from "@/lib/embed/types";
import { domainDisplayLabel } from "@/lib/urlDetection";

export const MANUAL_EMBED_SOURCE_CARD_ID = "__manual_embed__";

export const EMBED_LOADING_WIDTH = 520;
export const EMBED_LOADING_HEIGHT = 400;

export function normalizeEmbedArtifactData(data: unknown): EmbedArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const url = typeof obj.url === "string" ? obj.url.trim() : "";
  const provider =
    typeof obj.provider === "string" ? (obj.provider as EmbedProviderId) : "reddit";
  const domainLabel =
    typeof obj.domainLabel === "string" && obj.domainLabel.trim()
      ? obj.domainLabel.trim()
      : domainDisplayLabel(url || "https://example.com");
  const title =
    typeof obj.title === "string" && obj.title.trim()
      ? obj.title.trim()
      : domainLabel;
  const embedWidth =
    typeof obj.embedWidth === "number" && obj.embedWidth > 0
      ? obj.embedWidth
      : EMBED_LOADING_WIDTH;
  const embedHeight =
    typeof obj.embedHeight === "number" && obj.embedHeight > 0
      ? obj.embedHeight
      : EMBED_LOADING_HEIGHT;
  const iframeSrc =
    typeof obj.iframeSrc === "string" && obj.iframeSrc.trim()
      ? obj.iframeSrc.trim()
      : undefined;
  const embedHtml =
    typeof obj.embedHtml === "string" && obj.embedHtml.trim()
      ? obj.embedHtml.trim()
      : undefined;
  const status =
    obj.status === "ready" || obj.status === "failed" || obj.status === "loading"
      ? obj.status
      : "loading";

  const fallbackRaw =
    obj.fallback && typeof obj.fallback === "object"
      ? (obj.fallback as Record<string, unknown>)
      : null;
  const fallback = fallbackRaw
    ? {
        domainLabel:
          typeof fallbackRaw.domainLabel === "string"
            ? fallbackRaw.domainLabel
            : domainLabel,
        faviconUrl:
          typeof fallbackRaw.faviconUrl === "string"
            ? fallbackRaw.faviconUrl
            : undefined,
        previewImageUrl:
          typeof fallbackRaw.previewImageUrl === "string"
            ? fallbackRaw.previewImageUrl
            : undefined,
      }
    : undefined;

  return {
    url,
    provider,
    title,
    domainLabel,
    embedWidth,
    embedHeight,
    iframeSrc,
    embedHtml,
    status,
    fallback,
  };
}

export function normalizeEmbedPayload(
  payload: Extract<ArtifactPayload, { type: "embed" }>,
): Extract<ArtifactPayload, { type: "embed" }> {
  const data = normalizeEmbedArtifactData(payload.data);
  return {
    ...payload,
    title: payload.title?.trim() || data.title,
    data,
  };
}

export function createEmbedPayload(
  url: string,
  provider: EmbedProviderId,
): Extract<ArtifactPayload, { type: "embed" }> {
  const domainLabel = domainDisplayLabel(url);
  return {
    type: "embed",
    title: domainLabel,
    data: {
      url,
      provider,
      title: domainLabel,
      domainLabel,
      embedWidth: EMBED_LOADING_WIDTH,
      embedHeight: EMBED_LOADING_HEIGHT,
      status: "loading",
    },
  };
}

export function isEmbedTitlePending(
  payload: Extract<ArtifactPayload, { type: "embed" }>,
): boolean {
  return payload.data.title === payload.data.domainLabel && payload.data.status === "loading";
}
