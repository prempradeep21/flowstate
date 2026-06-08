import { clientToWorld } from "@/lib/canvasCoordinates";
import { CANVAS_TEXT_LABEL_FONT_SIZE } from "@/lib/store";

const LABEL_SPAWN_GAP_PX = 8;

/** World position for a text label spawned beside a card at the selection's vertical center. */
export function computeSelectionTextLabelPosition(
  cardRect: DOMRect,
  selectionRect: DOMRect,
  viewport: { x: number; y: number; scale: number },
): { x: number; y: number } | null {
  const container = document.querySelector<HTMLElement>("[data-canvas-container]");
  if (!container) return null;
  const containerRect = container.getBoundingClientRect();
  const clientX = cardRect.right + LABEL_SPAWN_GAP_PX;
  const clientY = selectionRect.top + selectionRect.height / 2;
  const { worldX, worldY } = clientToWorld(
    clientX,
    clientY,
    containerRect,
    viewport,
  );
  return {
    x: worldX,
    y: worldY - CANVAS_TEXT_LABEL_FONT_SIZE / 2,
  };
}
