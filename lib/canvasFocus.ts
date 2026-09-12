import { getCardBounds } from "@/lib/canvasNodeBounds";
import { animateViewportTo } from "@/lib/motion/animateViewport";
import {
  viewportCenteredOnWorldPoint,
  viewportFramedOnWorldRect,
} from "@/lib/viewport";
import { useCanvasStore } from "@/lib/store";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Frame a world rect and animate the camera onto it.
 *
 * Takes the rect structurally rather than importing WorldRect from
 * canvasArtifacts — that module imports this one, so the type import would
 * close an import cycle.
 */
export function focusCanvasWorldRect(
  rect: { x: number; y: number; w: number; h: number },
  opts?: { sound?: boolean; minScale?: number; maxScale?: number },
): boolean {
  const container = document.querySelector("[data-canvas-container]");
  const domRect = container?.getBoundingClientRect();
  if (!domRect) return false;

  const vp = viewportFramedOnWorldRect(rect, domRect.width, domRect.height, {
    minScale: opts?.minScale ?? 0.1,
    maxScale: opts?.maxScale ?? 3,
  });
  animateViewportTo(vp, { reducedMotion: prefersReducedMotion() });

  if (opts?.sound && typeof window !== "undefined") {
    void import("@/lib/sounds/engine").then(({ playSound }) => {
      void playSound("artifact-focus");
    });
  }

  return true;
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
