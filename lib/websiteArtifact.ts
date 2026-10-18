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
  const previewAssetId =
    typeof obj.previewAssetId === "string" && obj.previewAssetId.trim()
      ? obj.previewAssetId.trim()
      : undefined;
  const embeddable =
    typeof obj.embeddable === "boolean" ? obj.embeddable : undefined;
  const previewWidth = positiveNumber(obj.previewWidth);
  const previewHeight = positiveNumber(obj.previewHeight);
  return {
    url,
    title,
    domainLabel: domainLabel || title,
    faviconUrl,
    previewImageUrl,
    previewAssetId,
    ...(previewWidth && previewHeight ? { previewWidth, previewHeight } : {}),
    embeddable,
  };
}

function positiveNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value > 0
    ? value
    : undefined;
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
  extras?: {
    faviconUrl?: string;
    previewImageUrl?: string;
    previewWidth?: number;
    previewHeight?: number;
    embeddable?: boolean;
  },
): Extract<ArtifactPayload, { type: "website" }> {
  return {
    type: "website",
    title: domainLabel,
    data: {
      url,
      title: domainLabel,
      domainLabel,
      faviconUrl: extras?.faviconUrl,
      previewImageUrl: extras?.previewImageUrl,
      ...(extras?.previewWidth && extras?.previewHeight
        ? { previewWidth: extras.previewWidth, previewHeight: extras.previewHeight }
        : {}),
      embeddable: extras?.embeddable,
    },
  };
}

export function isWebsiteTitlePending(
  payload: Extract<ArtifactPayload, { type: "website" }>,
): boolean {
  return payload.data.title === payload.data.domainLabel;
}

/**
 * How much of a website the card can show, richest first:
 *
 * - `live` (L3) — the site allows embedding, so it renders as an interactive
 *   frame you can scroll and click.
 * - `hero` (L2) — a hero image or GIF the site publishes (og:image).
 * - `icon` (L1) — neither exists, so the card is the site's favicon, title and
 *   link on a small fixed square.
 * - `pending` — nothing resolved yet; the link-preview check may still find a
 *   hero or a frame, so the card keeps the default box rather than collapsing
 *   to a square it would have to grow back out of.
 */
export type WebsiteDisplayLevel = "live" | "hero" | "icon" | "pending";

export function websiteDisplayLevel(
  data: WebsiteArtifactData,
  opts: { settled?: boolean } = {},
): WebsiteDisplayLevel {
  if (data.embeddable === true) return "live";
  if (data.previewImageUrl) return "hero";
  if (data.embeddable === false) return "icon";
  // An unresolved `embeddable` only means "still checking" while the check is
  // actually running. Loaded from a saved canvas it is final: nothing re-runs
  // the check, so the site has neither a hero nor a frame — an L1 card.
  return opts.settled ? "icon" : "pending";
}

/**
 * Website artifacts whose link-preview check is in flight right now. Only
 * these are genuinely `pending`; see {@link websiteDisplayLevel}.
 */
const enrichingWebsites = new Set<string>();

export function markWebsiteEnriching(artifactId: string, enriching: boolean): void {
  if (enriching) enrichingWebsites.add(artifactId);
  else enrichingWebsites.delete(artifactId);
}

export function isWebsiteEnriching(artifactId: string): boolean {
  return enrichingWebsites.has(artifactId);
}

/** L1 card: a fixed square, half the width of the default website card. */
export const WEBSITE_ICON_ARTIFACT_SIZE = 280;
/** L2 card: the longest edge of the hero image itself. */
export const WEBSITE_HERO_MAX_EDGE = 560;
/** L2 card: the hero's inset inside the card body (`px-3` both sides, `pb-3`). */
export const WEBSITE_HERO_INSET = { x: 24, y: 12 };

/**
 * Node size for a website card, from what it will actually show. Returns null
 * when the generic default (live frame, pending, or a hero of unknown size)
 * applies.
 *
 * A hero's box is its image's own aspect ratio, exactly: the long edge is
 * WEBSITE_HERO_MAX_EDGE and the short edge follows, so a portrait poster stays
 * a portrait and a banner stays a banner. Nothing is cropped and nothing is
 * letterboxed. `overhead` is the card chrome around the image (header, casing
 * border), so the IMAGE rather than the node carries the ratio.
 */
export function websiteArtifactSize(
  data: WebsiteArtifactData,
  overhead: { w: number; h: number },
  opts: { settled?: boolean; within?: { w: number; h: number } } = {},
): { w: number; h: number } | null {
  const level = websiteDisplayLevel(data, opts);
  const within = opts.within;
  if (level === "icon") {
    const side = Math.min(
      WEBSITE_ICON_ARTIFACT_SIZE,
      within?.w ?? Infinity,
      within?.h ?? Infinity,
    );
    return { w: side, h: side };
  }
  if (level === "hero" && data.previewWidth && data.previewHeight) {
    const aspect = data.previewWidth / data.previewHeight;
    let imageW = aspect >= 1 ? WEBSITE_HERO_MAX_EDGE : WEBSITE_HERO_MAX_EDGE * aspect;
    let imageH = aspect >= 1 ? WEBSITE_HERO_MAX_EDGE / aspect : WEBSITE_HERO_MAX_EDGE;
    // Inside a box it may not outgrow (a saved canvas's slot), the image
    // scales down whole — both edges together, so the ratio survives.
    if (within) {
      const scale = Math.min(
        1,
        (within.w - WEBSITE_HERO_INSET.x - overhead.w) / imageW,
        (within.h - WEBSITE_HERO_INSET.y - overhead.h) / imageH,
      );
      if (scale > 0) {
        imageW *= scale;
        imageH *= scale;
      }
    }
    return {
      w: Math.round(imageW + WEBSITE_HERO_INSET.x + overhead.w),
      h: Math.round(imageH + WEBSITE_HERO_INSET.y + overhead.h),
    };
  }
  return null;
}
