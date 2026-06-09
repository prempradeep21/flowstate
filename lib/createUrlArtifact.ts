import {
  CANVAS_ARTIFACT_WIDTH,
  DEFAULT_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_HEIGHT,
  REPO_ARTIFACT_WIDTH,
} from "@/lib/canvasNodeBounds";
import {
  EMBED_LOADING_HEIGHT,
  EMBED_LOADING_WIDTH,
} from "@/lib/embedArtifact";
import { matchEmbedProviderId } from "@/lib/embed/registry";
import type { EmbedResolveResult } from "@/lib/embed/types";
import { useCanvasStore } from "@/lib/store";
import { classifyPastedText } from "@/lib/urlDetection";
import { fetchYoutubeMeta } from "@/lib/youtube";

function artifactPositionAtPointer(
  world: { x: number; y: number },
  width = CANVAS_ARTIFACT_WIDTH,
  height = DEFAULT_ARTIFACT_HEIGHT,
): {
  x: number;
  y: number;
} {
  return {
    x: world.x - width / 2,
    y: world.y - height / 2,
  };
}

export interface LinkPreviewClientResult {
  title: string;
  domainLabel: string;
  faviconUrl?: string;
  previewImageUrl?: string;
}

export async function fetchLinkPreviewClient(
  url: string,
): Promise<LinkPreviewClientResult | null> {
  try {
    const res = await fetch(
      `/api/link-preview?url=${encodeURIComponent(url)}`,
    );
    if (!res.ok) return null;
    return (await res.json()) as LinkPreviewClientResult;
  } catch {
    return null;
  }
}

export async function fetchEmbedClient(
  url: string,
): Promise<EmbedResolveResult | null> {
  try {
    const res = await fetch(`/api/embed?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    return (await res.json()) as EmbedResolveResult;
  } catch {
    return null;
  }
}

function enrichWebsiteTitle(artifactId: string, url: string): void {
  void fetchLinkPreviewClient(url).then((preview) => {
    if (!preview?.title) return;
    useCanvasStore.getState().patchWebsiteArtifactTitle(artifactId, {
      title: preview.title,
      faviconUrl: preview.faviconUrl,
      previewImageUrl: preview.previewImageUrl,
    });
  });
}

function enrichYoutubeTitle(
  artifactId: string,
  url: string,
  versionId: string,
): void {
  void fetchYoutubeMeta(url).then((meta) => {
    const state = useCanvasStore.getState();
    const art = state.sessionArtifacts[artifactId];
    if (!art) return;
    const ver = art.versions.find((v) => v.id === versionId);
    if (!ver || ver.payload.type !== "images") return;
    const item = ver.payload.data.items[0];
    if (!item || item.kind !== "youtube") return;
    state.patchYoutubeArtifactTitle(artifactId, versionId, {
      title: meta.title,
      thumb: meta.thumb,
    });
  });
}

function applyEmbedResult(
  artifactId: string,
  versionId: string,
  result: EmbedResolveResult,
): void {
  useCanvasStore.getState().patchEmbedArtifact(artifactId, versionId, result);
}

function enrichEmbed(artifactId: string, versionId: string, url: string): void {
  void fetchEmbedClient(url).then((result) => {
    if (!result) {
      const provider = matchEmbedProviderId(url) ?? "reddit";
      applyEmbedResult(artifactId, versionId, {
        provider,
        url,
        title: url,
        embedWidth: EMBED_LOADING_WIDTH,
        embedHeight: EMBED_LOADING_HEIGHT,
        status: "failed",
        fallback: { domainLabel: url },
      });
      return;
    }
    applyEmbedResult(artifactId, versionId, result);
  });
}

/** Create a website, embed, or YouTube artifact from pasted/typed URL text. */
export function createUrlArtifactFromText(
  text: string,
  position: { x: number; y: number },
  opts?: { recordUndo?: boolean },
): boolean {
  const classified = classifyPastedText(text);
  if (!classified) return false;

  const undoOpts = { recordUndo: opts?.recordUndo };

  if (classified.kind === "youtube") {
    const { artifactId, versionId } = useCanvasStore
      .getState()
      .createVideoArtifactFromUrl(classified.url, {
        position: artifactPositionAtPointer(position),
        ...undoOpts,
      });
    enrichYoutubeTitle(artifactId, classified.url, versionId);
    return true;
  }

  if (classified.kind === "repo") {
    useCanvasStore.getState().createRepoArtifactFromUrl(classified.url, {
      position: artifactPositionAtPointer(
        position,
        REPO_ARTIFACT_WIDTH,
        REPO_ARTIFACT_HEIGHT,
      ),
      ...undoOpts,
    });
    return true;
  }

  if (classified.kind === "embed") {
    const { artifactId, versionId } = useCanvasStore
      .getState()
      .createEmbedArtifactFromUrl(classified.url, {
        position: artifactPositionAtPointer(
          position,
          EMBED_LOADING_WIDTH,
          EMBED_LOADING_HEIGHT,
        ),
        ...undoOpts,
      });
    enrichEmbed(artifactId, versionId, classified.url);
    return true;
  }

  const spawnPosition = artifactPositionAtPointer(position);
  const { artifactId } = useCanvasStore
    .getState()
    .createWebsiteArtifactFromUrl(classified.url, spawnPosition, undoOpts);
  enrichWebsiteTitle(artifactId, classified.url);
  return true;
}

/** Re-fetch embed metadata for retry from the artifact UI. */
export function retryEmbedArtifact(
  artifactId: string,
  versionId: string,
  url: string,
): void {
  useCanvasStore.getState().patchEmbedArtifact(artifactId, versionId, {
    status: "loading",
  });
  void fetchEmbedClient(url).then((result) => {
    if (!result) {
      const provider = matchEmbedProviderId(url) ?? "reddit";
      applyEmbedResult(artifactId, versionId, {
        provider,
        url,
        title: url,
        embedWidth: EMBED_LOADING_WIDTH,
        embedHeight: EMBED_LOADING_HEIGHT,
        status: "failed",
        fallback: { domainLabel: url },
      });
      return;
    }
    applyEmbedResult(artifactId, versionId, result);
  });
}
