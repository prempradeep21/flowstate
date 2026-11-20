"use client";

import { useEffect, useRef } from "react";
import { focusCanvasCard } from "@/lib/canvasFocus";
import { requestCanvasFocus } from "@/lib/canvasViewportGuard";
import {
  COMPOSER_PROXIMITY_PX,
  findNearestComposerTarget,
  hitReceivePlug,
  measureComposerTargets,
  nearestComposerTarget,
  type MeasuredComposer,
  PLUG_DRAG_THRESHOLD_PX,
  screenToWorld,
} from "@/lib/plugGeometry";
import { RESOLVED_CANVAS_TUNING } from "@/lib/canvasTuning";
import {
  branchTargetAnchorY,
  getConnectionCardBounds,
} from "@/lib/canvasMeasure";
import {
  useCanvasStore,
  type PlugSide,
  type Viewport,
} from "@/lib/store";

/** How long measured composer boxes are reused during one plug drag. */
const COMPOSER_CACHE_MS = 250;

/**
 * Where a card dropped off a plug drag goes so its receive plug — the side
 * facing back at the source — sits on the cursor, not the card's centre.
 * Y assumes the empty-card height; settleDroppedCard corrects it once the
 * card has mounted and its real height is known.
 */
function plugDropPosition(
  world: { x: number; y: number },
  fromSide: PlugSide,
): { x: number; y: number } {
  const { cardWidth, emptyCardHeight } = RESOLVED_CANVAS_TUNING;
  return {
    x: fromSide === "left" ? world.x - cardWidth : world.x,
    y: world.y - emptyCardHeight / 2,
  };
}

/**
 * Settle a card just dropped off a plug drag. Raise it, so a drop over an
 * artifact or another card doesn't bury it underneath. Then, since the
 * receive plug's Y comes from the mounted card's DOM (question block, or the
 * composer's centre on an empty card) and the drop position can only estimate
 * it, wait for the card to paint and nudge it so the plug meets the cursor.
 */
function settleDroppedCard(cardId: string, pointerY: number) {
  useCanvasStore.getState().raiseCanvasNodes([cardId]);
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const state = useCanvasStore.getState();
      const card = state.cards[cardId];
      if (!card) return;
      const { h } = getConnectionCardBounds(card, RESOLVED_CANVAS_TUNING);
      const plugY = branchTargetAnchorY(cardId, card.position.y, h);
      const dy = pointerY - plugY;
      if (Math.abs(dy) >= 0.5) state.moveSubtree(cardId, 0, dy);
    }),
  );
}

export function usePlugDragSession(
  containerRef: React.RefObject<HTMLDivElement | null>,
) {
  // Only whether a drag is active: the drag object itself changes on every
  // pointer frame, and depending on it would tear down and re-add the window
  // listeners each frame.
  const plugActive = useCanvasStore((s) => s.plugDrag != null);
  const updatePlugDrag = useCanvasStore((s) => s.updatePlugDrag);
  const endPlugDrag = useCanvasStore((s) => s.endPlugDrag);
  const createBranch = useCanvasStore((s) => s.createBranch);
  const createBranchAt = useCanvasStore((s) => s.createBranchAt);
  const createRootCardWithAttachment = useCanvasStore(
    (s) => s.createRootCardWithAttachment,
  );
  const createRootCardWithAssetAttachment = useCanvasStore(
    (s) => s.createRootCardWithAssetAttachment,
  );
  const createRootCardWithSkillAttachment = useCanvasStore(
    (s) => s.createRootCardWithSkillAttachment,
  );
  const createRootCardWithGroupAttachment = useCanvasStore(
    (s) => s.createRootCardWithGroupAttachment,
  );
  const setCardComposerAttachment = useCanvasStore(
    (s) => s.setCardComposerAttachment,
  );
  const setCardComposerAssetAttachment = useCanvasStore(
    (s) => s.setCardComposerAssetAttachment,
  );
  const setCardComposerSkillAttachment = useCanvasStore(
    (s) => s.setCardComposerSkillAttachment,
  );
  const setCardComposerGroupAttachment = useCanvasStore(
    (s) => s.setCardComposerGroupAttachment,
  );
  const addArtifactPlugConnection = useCanvasStore(
    (s) => s.addArtifactPlugConnection,
  );
  const addAssetPlugConnection = useCanvasStore(
    (s) => s.addAssetPlugConnection,
  );
  const addSkillPlugConnection = useCanvasStore(
    (s) => s.addSkillPlugConnection,
  );
  const addGroupPlugConnection = useCanvasStore(
    (s) => s.addGroupPlugConnection,
  );
  const startRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!plugActive) {
      startRef.current = null;
      return;
    }

    // Composer boxes in world space, measured once per drag and refreshed at
    // most every COMPOSER_CACHE_MS (cards can grow or mount mid-drag). The old
    // path ran querySelectorAll + getBoundingClientRect on every composer for
    // every pointermove, forcing layout between React commits.
    let composerCache: { targets: MeasuredComposer[]; at: number } | null =
      null;
    const composerTargets = (
      container: HTMLElement,
      viewport: Viewport,
    ): MeasuredComposer[] => {
      const now = performance.now();
      if (!composerCache || now - composerCache.at > COMPOSER_CACHE_MS) {
        composerCache = {
          targets: measureComposerTargets(container, viewport),
          at: now,
        };
      }
      return composerCache.targets;
    };

    // Coalesce pointermove to one store write per animation frame.
    let pending: { clientX: number; clientY: number } | null = null;
    let raf = 0;

    const applyMove = () => {
      raf = 0;
      const move = pending;
      pending = null;
      if (!move) return;
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewport = useCanvasStore.getState().viewport;
      const world = screenToWorld(move.clientX, move.clientY, rect, viewport);

      if (!startRef.current) {
        startRef.current = { x: move.clientX, y: move.clientY };
      }
      const dist = Math.hypot(
        move.clientX - startRef.current.x,
        move.clientY - startRef.current.y,
      );
      const drag = useCanvasStore.getState().plugDrag;
      if (!drag) return;
      const didDrag = dist >= PLUG_DRAG_THRESHOLD_PX || drag.didDrag;

      if (
        drag.kind === "artifact" ||
        drag.kind === "asset" ||
        drag.kind === "skill" ||
        drag.kind === "group"
      ) {
        const nearest = nearestComposerTarget(
          world,
          composerTargets(container, viewport),
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

    const onPointerMove = (e: PointerEvent) => {
      if (!startRef.current) {
        startRef.current = { x: e.clientX, y: e.clientY };
      }
      pending = { clientX: e.clientX, clientY: e.clientY };
      if (!raf) raf = requestAnimationFrame(applyMove);
    };

    const onPointerUp = (e: PointerEvent) => {
      // Flush a move still waiting for its frame so didDrag is current: a
      // flick shorter than one frame must still count as a drag, not a click.
      if (raf) cancelAnimationFrame(raf);
      applyMove();
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const viewport = useCanvasStore.getState().viewport;
      const world = screenToWorld(e.clientX, e.clientY, rect, viewport);
      const drag = useCanvasStore.getState().plugDrag;
      if (!drag) return;

      if (drag.kind === "branch") {
        if (drag.didDrag) {
          const branchId = createBranchAt(
            drag.sourceCardId,
            drag.fromSide,
            world,
          );
          if (branchId) settleDroppedCard(branchId, world.y);
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
          addArtifactPlugConnection({
            artifactNodeId: drag.artifactNodeId,
            cardId: hit.cardId,
            fromSide: drag.fromSide,
            toSide: hit.side,
          });
        } else if (drag.didDrag) {
          const cardId = createRootCardWithAttachment(
            plugDropPosition(world, drag.fromSide),
            {
              artifactId: drag.artifactId,
              versionId: drag.versionId,
            },
          );
          if (cardId) {
            settleDroppedCard(cardId, world.y);
            addArtifactPlugConnection({
              artifactNodeId: drag.artifactNodeId,
              cardId,
              fromSide: drag.fromSide,
              toSide: drag.fromSide === "left" ? "right" : "left",
            });
            requestCanvasFocus(() => focusCanvasCard(cardId));
          }
        }
      } else if (drag.kind === "asset") {
        const nearest = findNearestComposerTarget(
          world,
          container,
          viewport,
          COMPOSER_PROXIMITY_PX,
        );
        const hit = nearest ? hitReceivePlug(world, nearest) : null;

        if (hit) {
          setCardComposerAssetAttachment(hit.cardId, {
            assetId: drag.assetId,
          });
          addAssetPlugConnection({
            assetNodeId: drag.assetNodeId,
            cardId: hit.cardId,
            fromSide: drag.fromSide,
            toSide: hit.side,
          });
        } else if (drag.didDrag) {
          const cardId = createRootCardWithAssetAttachment(
            plugDropPosition(world, drag.fromSide),
            {
              assetId: drag.assetId,
            },
          );
          if (cardId) {
            settleDroppedCard(cardId, world.y);
            addAssetPlugConnection({
              assetNodeId: drag.assetNodeId,
              cardId,
              fromSide: drag.fromSide,
              toSide: drag.fromSide === "left" ? "right" : "left",
            });
            requestCanvasFocus(() => focusCanvasCard(cardId));
          }
        }
      } else if (drag.kind === "skill") {
        const nearest = findNearestComposerTarget(
          world,
          container,
          viewport,
          COMPOSER_PROXIMITY_PX,
        );
        const hit = nearest ? hitReceivePlug(world, nearest) : null;

        if (hit) {
          setCardComposerSkillAttachment(hit.cardId, {
            skillId: drag.skillId,
          });
          addSkillPlugConnection({
            skillNodeId: drag.skillNodeId,
            cardId: hit.cardId,
            fromSide: drag.fromSide,
            toSide: hit.side,
          });
        } else if (drag.didDrag) {
          const cardId = createRootCardWithSkillAttachment(
            plugDropPosition(world, drag.fromSide),
            {
              skillId: drag.skillId,
            },
          );
          if (cardId) {
            settleDroppedCard(cardId, world.y);
            addSkillPlugConnection({
              skillNodeId: drag.skillNodeId,
              cardId,
              fromSide: drag.fromSide,
              toSide: drag.fromSide === "left" ? "right" : "left",
            });
            requestCanvasFocus(() => focusCanvasCard(cardId));
          }
        }
      } else if (drag.kind === "group") {
        const nearest = findNearestComposerTarget(
          world,
          container,
          viewport,
          COMPOSER_PROXIMITY_PX,
        );
        const hit = nearest ? hitReceivePlug(world, nearest) : null;

        if (hit) {
          setCardComposerGroupAttachment(hit.cardId, {
            groupId: drag.groupId,
          });
          addGroupPlugConnection({
            groupId: drag.groupId,
            cardId: hit.cardId,
            fromSide: drag.fromSide,
            toSide: hit.side,
          });
        } else if (drag.didDrag) {
          const cardId = createRootCardWithGroupAttachment(
            plugDropPosition(world, drag.fromSide),
            {
              groupId: drag.groupId,
            },
          );
          if (cardId) {
            settleDroppedCard(cardId, world.y);
            addGroupPlugConnection({
              groupId: drag.groupId,
              cardId,
              fromSide: drag.fromSide,
              toSide: drag.fromSide === "left" ? "right" : "left",
            });
            requestCanvasFocus(() => focusCanvasCard(cardId));
          }
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
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [
    plugActive,
    containerRef,
    updatePlugDrag,
    endPlugDrag,
    createBranch,
    createBranchAt,
    createRootCardWithAttachment,
    createRootCardWithAssetAttachment,
    createRootCardWithSkillAttachment,
    createRootCardWithGroupAttachment,
    setCardComposerAttachment,
    setCardComposerAssetAttachment,
    setCardComposerSkillAttachment,
    setCardComposerGroupAttachment,
    addArtifactPlugConnection,
    addAssetPlugConnection,
    addSkillPlugConnection,
    addGroupPlugConnection,
  ]);
}
