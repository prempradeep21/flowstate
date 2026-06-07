"use client";

import { useEffect, useRef } from "react";
import { focusCanvasCard } from "@/lib/canvasFocus";
import { requestCanvasFocus } from "@/lib/canvasViewportGuard";
import {
  COMPOSER_PROXIMITY_PX,
  findNearestComposerTarget,
  hitReceivePlug,
  PLUG_DRAG_THRESHOLD_PX,
  screenToWorld,
} from "@/lib/plugGeometry";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import { useCanvasStore } from "@/lib/store";

const CARD_DROP_Y_OFFSET = 30;

export function usePlugDragSession(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  const plugDrag = useCanvasStore((s) => s.plugDrag);
  const updatePlugDrag = useCanvasStore((s) => s.updatePlugDrag);
  const endPlugDrag = useCanvasStore((s) => s.endPlugDrag);
  const createBranch = useCanvasStore((s) => s.createBranch);
  const createBranchAt = useCanvasStore((s) => s.createBranchAt);
  const createRootCardWithAttachment = useCanvasStore(
    (s) => s.createRootCardWithAttachment,
  );
  const setCardComposerAttachment = useCanvasStore(
    (s) => s.setCardComposerAttachment,
  );
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!plugDrag) {
      startRef.current = null;
      return;
    }

    const onPointerMove = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewport = useCanvasStore.getState().viewport;
      const world = screenToWorld(e.clientX, e.clientY, rect, viewport);

      if (!startRef.current) {
        startRef.current = { x: e.clientX, y: e.clientY };
      }
      const dist = Math.hypot(
        e.clientX - startRef.current.x,
        e.clientY - startRef.current.y,
      );
      const didDrag =
        dist >= PLUG_DRAG_THRESHOLD_PX ||
        (useCanvasStore.getState().plugDrag?.didDrag ?? false);

      const drag = useCanvasStore.getState().plugDrag;
      if (!drag) return;

      if (drag.kind === "artifact") {
        const nearest = findNearestComposerTarget(
          world,
          container,
          viewport,
          COMPOSER_PROXIMITY_PX,
        );
        const hit = nearest ? hitReceivePlug(world, nearest) : null;
        updatePlugDrag({
          pointerWorld: world,
          didDrag,
          receiveTargetCardId: nearest?.cardId ?? null,
          hoveredReceiveSide: hit?.side ?? null,
        });
      } else {
        updatePlugDrag({ pointerWorld: world, didDrag });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewport = useCanvasStore.getState().viewport;
      const world = screenToWorld(e.clientX, e.clientY, rect, viewport);
      const drag = useCanvasStore.getState().plugDrag;
      if (!drag) return;

      if (drag.kind === "branch") {
        if (drag.didDrag) {
          createBranchAt(drag.sourceCardId, drag.fromSide, world);
        } else {
          createBranch(drag.sourceCardId, drag.fromSide);
        }
      } else if (drag.kind === "artifact") {
        const nearest = findNearestComposerTarget(
          world,
          container,
          viewport,
          COMPOSER_PROXIMITY_PX,
        );
        const hit = nearest ? hitReceivePlug(world, nearest) : null;

        if (hit) {
          setCardComposerAttachment(hit.cardId, {
            artifactId: drag.artifactId,
            versionId: drag.versionId,
          });
        } else if (drag.didDrag) {
          const { cardWidth } = RESOLVED_CANVAS_TUNING;
          const cardId = createRootCardWithAttachment(
            {
              x: world.x - cardWidth / 2,
              y: world.y - CARD_DROP_Y_OFFSET,
            },
            {
              artifactId: drag.artifactId,
              versionId: drag.versionId,
            },
          );
          if (cardId) requestCanvasFocus(() => focusCanvasCard(cardId));
        }
      }

      endPlugDrag();
      startRef.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        useCanvasStore.getState().cancelPlugDrag();
        startRef.current = null;
      }
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    plugDrag,
    containerRef,
    updatePlugDrag,
    endPlugDrag,
    createBranch,
    createBranchAt,
    createRootCardWithAttachment,
    setCardComposerAttachment,
  ]);
}
