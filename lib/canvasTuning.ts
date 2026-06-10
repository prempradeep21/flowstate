/**

 * DEV_TUNING — runtime canvas layout parameters for the canvas-fixes experiment.

 * Delete this module when tuning overlay is removed.

 *

 * Default numeric values mirror lib/canvasNodeBounds.ts (no import — avoids cycle).

 */

export interface CanvasTuning {

  followUpGap: number;

  cardWidth: number;

  branchHorizontalGap: number;

  branchCardWidth: number;

  emptyCardHeight: number;

  fallbackCardHeight: number;

  artifactSpawnGapX: number;

  groupBoundsPadding: number;

  linkBranchCardWidth: boolean;

  repairLateralBandsOnTune: boolean;

  useDeltaShiftOnResize: boolean;

  rootCardsOnlyDraggable: boolean;

}



export interface ResolvedCanvasTuning {

  followUpGap: number;

  cardWidth: number;

  branchHorizontalGap: number;

  branchCardWidth: number;

  emptyCardHeight: number;

  fallbackCardHeight: number;

  artifactSpawnGapX: number;

  groupBoundsPadding: number;

  linkBranchCardWidth: boolean;

  repairLateralBandsOnTune: boolean;

  useDeltaShiftOnResize: boolean;

  rootCardsOnlyDraggable: boolean;

}



export const DEFAULT_CANVAS_TUNING: CanvasTuning = {

  followUpGap: 40,

  cardWidth: 420,

  branchHorizontalGap: 420,

  branchCardWidth: 420,

  emptyCardHeight: 80,

  fallbackCardHeight: 240,

  artifactSpawnGapX: 24,

  groupBoundsPadding: 24,

  linkBranchCardWidth: true,

  repairLateralBandsOnTune: false,

  useDeltaShiftOnResize: true,

  rootCardsOnlyDraggable: true,

};



export function resolveTuning(tuning: CanvasTuning): ResolvedCanvasTuning {
  const branchCardWidth = tuning.linkBranchCardWidth
    ? tuning.cardWidth
    : tuning.branchCardWidth;
  return {
    ...tuning,
    branchCardWidth,
  };
}

/** Resolved production layout constants (playground tuning values baked in). */
export const RESOLVED_CANVAS_TUNING = resolveTuning(DEFAULT_CANVAS_TUNING);

