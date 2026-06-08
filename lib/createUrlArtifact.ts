import {
  CANVAS_ARTIFACT_WIDTH,
  DEFAULT_ARTIFACT_HEIGHT,
} from "@/lib/canvasNodeBounds";
import { useCanvasStore } from "@/lib/store";
import { classifyPastedText } from "@/lib/urlDetection";
import { fetchYoutubeMeta } from "@/lib/youtube";

function artifactPositionAtPointer(world: { x: number; y: number }): {
  x: number;
  y: number;
} {
  return {
    x: world.x - CANVAS_ARTIFACT_WIDTH / 2,
    y: world.y - DEFAULT_ARTIFACT_HEIGHT / 2,
  };
}

export interface LinkPreviewClientResult {
  title: string;
  domainLabel: string;
  faviconUrl?: string;
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

function enrichWebsiteTitle(artifactId: string, url: string): void {
  void fetchLinkPreviewClient(url).then((preview) => {
    if (!preview?.title) return;
    useCanvasStore.getState().patchWebsiteArtifactTitle(artifactId, {
      title: preview.title,
      faviconUrl: preview.faviconUrl,
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

/** Create a website or YouTube artifact from pasted/typed URL text. */
export function createUrlArtifactFromText(
  text: string,
  position: { x: number; y: number },
  opts?: { recordUndo?: boolean },
): boolean {
  const classified = classifyPastedText(text);
  if (!classified) return false;

  const spawnPosition = artifactPositionAtPointer(position);
  const undoOpts = { recordUndo: opts?.recordUndo };

  if (classified.kind === "youtube") {
    const { artifactId, versionId } = useCanvasStore
      .getState()
      .createVideoArtifactFromUrl(classified.url, {
        position: spawnPosition,
        ...undoOpts,
      });
    enrichYoutubeTitle(artifactId, classified.url, versionId);
    return true;
  }

  const { artifactId } = useCanvasStore
    .getState()
    .createWebsiteArtifactFromUrl(classified.url, spawnPosition, undoOpts);
  enrichWebsiteTitle(artifactId, classified.url);
  return true;
}
