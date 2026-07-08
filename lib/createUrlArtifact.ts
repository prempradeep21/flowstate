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
import {
  fetchGoogleConnectionGate,
  googleFileImportBlockedMessage,
} from "@/lib/google/fileImportClient";
import { createGoogleWorkspacePayload } from "@/lib/googleWorkspaceArtifact";
import { parseGoogleDriveUrl } from "@/lib/google/parseDriveUrl";
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
  embeddable?: boolean;
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
  const applyPreview = (preview: LinkPreviewClientResult | null): boolean => {
    if (!preview?.title) return false;
    useCanvasStore.getState().patchWebsiteArtifactTitle(artifactId, {
      title: preview.title,
      faviconUrl: preview.faviconUrl,
      previewImageUrl: preview.previewImageUrl,
      embeddable: preview.embeddable ?? false,
    });
    return true;
  };

  void fetchLinkPreviewClient(url).then((preview) => {
    if (applyPreview(preview)) return;
    window.setTimeout(() => {
      void fetchLinkPreviewClient(url).then(applyPreview);
    }, 2000);
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

interface GoogleFileImportResult {
  fileId: string;
  fileKind: string;
  title: string;
  mimeType?: string;
  url: string;
  extractedText?: string;
  extractedTextLength?: number;
  truncated?: boolean;
  status?: string;
  needsConnect?: boolean;
  needsAccess?: boolean;
  error?: string;
}

async function fetchGoogleFileImport(
  url: string,
  fileId?: string,
): Promise<GoogleFileImportResult | null> {
  try {
    const params = new URLSearchParams({ url });
    if (fileId) params.set("fileId", fileId);
    const res = await fetch(`/api/google/files?${params.toString()}`);
    const body = (await res.json()) as GoogleFileImportResult;
    if (body.needsConnect) {
      return {
        ...body,
        fileId: body.fileId ?? fileId ?? "",
        url,
        needsConnect: true,
      };
    }
    if (body.needsAccess) {
      return {
        ...body,
        fileId: body.fileId ?? fileId ?? "",
        url,
        needsAccess: true,
        error: body.error,
      };
    }
    if (!res.ok) {
      return {
        ...body,
        fileId: body.fileId ?? fileId ?? "",
        url,
        error: body.error,
      } as GoogleFileImportResult;
    }
    return body;
  } catch {
    return null;
  }
}

function enrichGoogleWorkspaceArtifact(
  artifactId: string,
  url: string,
  fileId: string,
): void {
  void fetchGoogleConnectionGate().then((gate) => {
    const state = useCanvasStore.getState();
    if (!gate.signedIn || !gate.connected) {
      state.patchGoogleWorkspaceArtifact(artifactId, {
        status: "needs_connect",
        errorMessage: googleFileImportBlockedMessage(gate),
      });
      return;
    }

    void fetchGoogleFileImport(url, fileId).then((result) => {
      if (!result) {
        state.patchGoogleWorkspaceArtifact(artifactId, {
          status: "failed",
          errorMessage: "Could not import this file.",
        });
        return;
      }

      if (result.needsConnect) {
        state.patchGoogleWorkspaceArtifact(artifactId, {
          status: "needs_connect",
          errorMessage: "Connect Google to import content from this file.",
        });
        return;
      }

      if (result.needsAccess) {
        state.patchGoogleWorkspaceArtifact(artifactId, {
          status: "needs_access",
          errorMessage:
            "Grant Drive access to import text for AI context.",
        });
        return;
      }

      if (result.error && result.status !== "ready") {
        state.patchGoogleWorkspaceArtifact(artifactId, {
          status: "failed",
          errorMessage: result.error,
        });
        return;
      }

      state.patchGoogleWorkspaceArtifact(artifactId, {
        title: result.title,
        mimeType: result.mimeType,
        status: "ready",
        extractedText: result.extractedText,
        extractedTextLength:
          result.extractedTextLength ?? result.extractedText?.length,
        truncated: result.truncated,
        errorMessage: undefined,
      });
    });
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

  if (classified.kind === "google-doc") {
    const parsed = parseGoogleDriveUrl(classified.url);
    const payload = createGoogleWorkspacePayload(parsed);
    if (!payload) return false;
    const { artifactId } = useCanvasStore
      .getState()
      .createGoogleWorkspaceArtifactFromUrl(classified.url, {
        position: artifactPositionAtPointer(position),
        ...undoOpts,
      });
    enrichGoogleWorkspaceArtifact(artifactId, classified.url, payload.data.fileId);
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

  if (classified.kind === "image") {
    return false;
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
