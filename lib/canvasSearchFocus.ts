import { getCanvasAssetBounds } from "@/lib/canvasAssetBounds";
import { findCanvasNodeByArtifactId } from "@/lib/canvasArtifacts";
import { focusCanvasWorldRect } from "@/lib/canvasFocus";
import { getArtifactBounds, getCardBounds } from "@/lib/canvasNodeBounds";
import type { CanvasSearchEntry } from "@/lib/canvasSearch";
import { estimateTextLabelBounds } from "@/lib/canvasTextLabelBounds";
import { useCanvasStore } from "@/lib/store";

/**
 * Search never zooms past 100% — it only ever zooms out to fit something large,
 * or in up to actual size for something small. The default maxScale of 3 makes a
 * short text label or a small asset slam to 3x, which reads as a lurch rather
 * than a reveal. One cap for every kind keeps the motion consistent.
 */
const SEARCH_FOCUS_MAX_SCALE = 1;

/**
 * Move the camera onto a search result and select it.
 *
 * Deliberately does NOT route through requestCanvasFocus: that guard swallows
 * focus for 3s after any pan/zoom, and the user will have just been panning
 * around the canvas before reaching for search. A result click is user-initiated
 * and must always move the camera.
 */
export function focusSearchResult(entry: CanvasSearchEntry): boolean {
  const state = useCanvasStore.getState();
  if (state.viewMode !== "canvas") state.setViewMode("canvas");

  const target = entry.target;

  switch (target.type) {
    case "artifact": {
      const node = findCanvasNodeByArtifactId(
        state.canvasArtifactNodes,
        target.artifactId,
      );
      if (!node) return false;
      state.selectCanvasArtifact(node.id);
      const artifact = state.sessionArtifacts[node.artifactId];
      const { w, h } = getArtifactBounds(node, artifact);
      return focusRect(node.position, w, h);
    }

    case "card": {
      const card = state.cards[target.cardId];
      if (!card) return false;
      const { w, h } = getCardBounds(card);
      return focusRect(card.position, w, h);
    }

    case "assetNode": {
      const node = state.canvasAssetNodes[target.nodeId];
      if (!node) return false;
      state.selectCanvasAsset(node.id);
      const asset = state.canvasAssets[node.assetId];
      const { w, h } = getCanvasAssetBounds(node, asset);
      return focusRect(node.position, w, h);
    }

    case "label": {
      const label = state.canvasTextLabels[target.labelId];
      if (!label) return false;
      state.selectCanvasTextLabel(label.id);
      const { w, h } = estimateTextLabelBounds(label);
      return focusRect(label.position, w, h);
    }
  }
}

function focusRect(
  position: { x: number; y: number },
  w: number,
  h: number,
): boolean {
  return focusCanvasWorldRect(
    { x: position.x, y: position.y, w, h },
    { sound: true, maxScale: SEARCH_FOCUS_MAX_SCALE },
  );
}
