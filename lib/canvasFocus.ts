import { getCardBounds } from "@/lib/canvasNodeBounds";
import { animateViewportTo } from "@/lib/motion/animateViewport";
import { viewportCenteredOnWorldPoint } from "@/lib/viewport";
import { useCanvasStore } from "@/lib/store";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Pan the viewport so a question card sits near the container center. */
export function focusCanvasCard(cardId: string): boolean {
  const state = useCanvasStore.getState();
  const card = state.cards[cardId];
  if (!card) return false;

  const container = document.querySelector("[data-canvas-container]");
  const rect = container?.getBoundingClientRect();
  if (!rect) return false;

  const { w, h } = getCardBounds(card);
  const cx = card.position.x + w / 2;
  const cy = card.position.y + h / 2;
  const vp = viewportCenteredOnWorldPoint(
    cx,
    cy,
    rect.width,
    rect.height,
    state.viewport.scale,
  );
  animateViewportTo(vp, { reducedMotion: prefersReducedMotion() });
  return true;
}
