import type { ArtifactPayload } from "@/lib/artifactTypes";
import { createCatalogAudioPayload } from "@/lib/audioArtifact";
import { createWebsitePayload } from "@/lib/websiteArtifact";

/**
 * Authoring helpers and content types shared by filmmaker pipeline canvases.
 *
 * Every node is an artifact (the pipeline canvases mount no asset/skill file
 * nodes — scripts ship as `code`, briefs as stickies). Sticky-note payloads are
 * placed manually, so they carry `manualSticky`.
 */

export interface ArtifactSpec {
  key: string;
  payload: ArtifactPayload;
  /** Sticky notes are attributed to the manual placement source card. */
  manualSticky?: boolean;
}

/** A vertical stack of nodes, optionally headed by a small label. */
export interface Column {
  key: string;
  label?: string;
  items: ArtifactSpec[];
}

/** A pipeline phase — a titled zone of columns. */
export interface Zone {
  key: string;
  title: string;
  subtitle: string;
  columns: Column[];
}

export type StickyColor = "turbo" | "violet" | "haiti" | "chalk";

/** A sticky-note annotation. */
export function sticky(
  key: string,
  title: string,
  text: string,
  colorId: StickyColor,
): ArtifactSpec {
  return {
    key,
    manualSticky: true,
    payload: { type: "stickynote", title, data: { text, colorId } },
  };
}

/** A sourced fact worth calling out. */
export function highlight(key: string, text: string): ArtifactSpec {
  return sticky(key, "Highlight", text, "chalk");
}

/** A question the reader can pose to the canvas AI. Text starts with "Ask:". */
export function askPrompt(key: string, question: string): ArtifactSpec {
  return sticky(key, "Try asking", `Ask: ${question}`, "violet");
}

/** One verified YouTube film — all-youtube items render as a video tile. */
export function film(key: string, id: string, title: string): ArtifactSpec {
  return {
    key,
    payload: {
      type: "images",
      title,
      data: {
        items: [
          {
            kind: "youtube",
            url: `https://www.youtube.com/watch?v=${id}`,
            thumb: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
            title,
          },
        ],
      },
    },
  };
}

/**
 * A website card. `previewImageUrl` and `embeddable` are REQUIRED at authoring
 * time — nothing enriches a builder-authored website artifact at render time, so
 * an unresolved card ships as a dead "No preview image" tile. `realTitle` must be
 * the site's real page title (the UI reads the domain-label default as "pending").
 */
export function site(
  key: string,
  url: string,
  domainLabel: string,
  realTitle: string,
  previewImageUrl: string,
  embeddable: boolean,
): ArtifactSpec {
  const payload = createWebsitePayload(url, domainLabel, {
    previewImageUrl,
    embeddable,
  });
  payload.title = realTitle;
  payload.data.title = realTitle;
  return { key, payload };
}

/** A synthetic-waveform audio track (tone reference, score sketch, VO take). */
export function track(
  key: string,
  title: string,
  seconds: number,
  seed: number,
): ArtifactSpec {
  return { key, payload: createCatalogAudioPayload(title, seconds * 1000, seed) };
}

/** An image grid (moodboard, storyboard, concept/reference wall). */
export function imageGrid(
  key: string,
  title: string,
  items: { url: string; alt: string }[],
): ArtifactSpec {
  return {
    key,
    payload: {
      type: "images",
      title,
      data: { items: items.map((it) => ({ kind: "image", url: it.url, alt: it.alt })) },
    },
  };
}

/** Wrap a bespoke payload (chart/table/map/etc.) as a spec. */
export function artifact(key: string, payload: ArtifactPayload): ArtifactSpec {
  return { key, payload };
}
