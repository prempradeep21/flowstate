import { buildPipelineCanvas } from "@/lib/sampleCanvases/pipeline/buildPipelineCanvas";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  LONG_NOON_SEED,
  LONG_NOON_STANDALONE,
  LONG_NOON_ZONES,
  LONG_NOON_ZONE_X,
} from "@/lib/sampleCanvases/theLongNoon/data";

/**
 * "The Long Noon" — a fictional tidally-locked-planet sci-fi as a filmmaker
 * production canvas, and the invented-world counterpart to viennaExchange. A
 * `kind:"project"` canvas built with the `filmmaker-canvas` skill; geometry comes
 * from `../pipeline`. Content, and the real-vs-invented line, live in ./data.ts.
 */
export function buildTheLongNoonCanvas(): CanvasSnapshot {
  return buildPipelineCanvas({
    idPrefix: "longnoon",
    seed: LONG_NOON_SEED,
    seedPosition: { x: -1500, y: -220 },
    zoneX: LONG_NOON_ZONE_X,
    zones: LONG_NOON_ZONES,
    standalone: LONG_NOON_STANDALONE,
    accentIndex: 1,
    canvasTheme: "dark",
    openingScale: 0.3,
  });
}
