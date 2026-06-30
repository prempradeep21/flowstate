import { fetchLinkPreviewClient } from "@/lib/createUrlArtifact";
import { getLatestVersion } from "@/lib/sessionArtifacts";
import { useCanvasStore } from "@/lib/store";

/** Fetch og:image / screenshot previews for playground website artifacts. */
export function enrichPlaygroundWebsiteArtifacts(): void {
  const state = useCanvasStore.getState();
  for (const art of Object.values(state.sessionArtifacts)) {
    const ver = getLatestVersion(art);
    if (!ver || ver.payload.type !== "website") continue;
    const { url, previewImageUrl } = ver.payload.data;
    if (previewImageUrl && !previewImageUrl.includes("microlink.io")) continue;

    void fetchLinkPreviewClient(url).then((preview) => {
      if (!preview) return;
      useCanvasStore.getState().patchWebsiteArtifactTitle(art.id, {
        title: preview.title || ver.payload.data.title,
        faviconUrl: preview.faviconUrl,
        previewImageUrl: preview.previewImageUrl,
      });
    });
  }
}
