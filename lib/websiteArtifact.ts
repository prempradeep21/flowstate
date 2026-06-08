import type { ArtifactPayload, WebsiteArtifactData } from "@/lib/artifactTypes";

/** Source card id for user-initiated website artifacts (no chat turn). */
export const MANUAL_WEBSITE_SOURCE_CARD_ID = "__manual__";

export function normalizeWebsiteArtifactData(data: unknown): WebsiteArtifactData {
  const obj =
    data && typeof data === "object" ? (data as Record<string, unknown>) : {};
  const url = typeof obj.url === "string" ? obj.url.trim() : "";
  const domainLabel =
    typeof obj.domainLabel === "string" ? obj.domainLabel.trim() : "";
  const title =
    typeof obj.title === "string" && obj.title.trim()
      ? obj.title.trim()
      : domainLabel || "Website";
  const faviconUrl =
    typeof obj.faviconUrl === "string" && obj.faviconUrl.trim()
      ? obj.faviconUrl.trim()
      : undefined;
  const previewImageUrl =
    typeof obj.previewImageUrl === "string" && obj.previewImageUrl.trim()
      ? obj.previewImageUrl.trim()
      : undefined;
  return { url, title, domainLabel: domainLabel || title, faviconUrl, previewImageUrl };
}

export function normalizeWebsitePayload(
  payload: Extract<ArtifactPayload, { type: "website" }>,
): Extract<ArtifactPayload, { type: "website" }> {
  const data = normalizeWebsiteArtifactData(payload.data);
  return {
    ...payload,
    title: payload.title?.trim() || data.title,
    data,
  };
}

export function createWebsitePayload(
  url: string,
  domainLabel: string,
): Extract<ArtifactPayload, { type: "website" }> {
  return {
    type: "website",
    title: domainLabel,
    data: {
      url,
      title: domainLabel,
      domainLabel,
    },
  };
}

export function isWebsiteTitlePending(
  payload: Extract<ArtifactPayload, { type: "website" }>,
): boolean {
  return payload.data.title === payload.data.domainLabel;
}
