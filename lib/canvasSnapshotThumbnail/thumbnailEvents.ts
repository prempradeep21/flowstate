import type { CanvasSnapshotThumbnail } from "@/lib/canvasSnapshotThumbnail/snapshotThumbnailPersistence";

/**
 * A capture can finish uploading after the user has already gone back Home
 * (the image is taken first, the upload trails it). Home listens here so the
 * card swaps to the fresh image without a refetch.
 */
type Listener = (canvasId: string, thumbnail: CanvasSnapshotThumbnail | null) => void;

const listeners = new Set<Listener>();

export function onCanvasSnapshotThumbnailChanged(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitCanvasSnapshotThumbnailChanged(
  canvasId: string,
  thumbnail: CanvasSnapshotThumbnail | null,
): void {
  for (const listener of listeners) listener(canvasId, thumbnail);
}
