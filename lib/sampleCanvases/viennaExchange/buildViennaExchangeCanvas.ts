import { buildPipelineCanvas } from "@/lib/sampleCanvases/pipeline/buildPipelineCanvas";
import type { CanvasSnapshot } from "@/lib/canvasSnapshot";
import {
  VIENNA_SEED,
  VIENNA_STANDALONE,
  VIENNA_ZONES,
  VIENNA_ZONE_X,
} from "@/lib/sampleCanvases/viennaExchange/data";

/**
 * "The Vienna Exchange" — a fictional 1961 Cold War spy thriller as a filmmaker
 * production canvas. A `kind:"project"` canvas built with the `filmmaker-canvas`
 * skill; geometry and assembly come from `../pipeline`. Content, and the
 * real-vs-invented line, live in ./data.ts.
 */
export function buildViennaExchangeCanvas(): CanvasSnapshot {
  return buildPipelineCanvas({
    idPrefix: "vienna",
    seed: VIENNA_SEED,
    seedPosition: { x: -1500, y: -220 },
    zoneX: VIENNA_ZONE_X,
    zones: VIENNA_ZONES,
    standalone: VIENNA_STANDALONE,
    accentIndex: 4,
    canvasTheme: "dark",
    openingScale: 0.3,
  });
}
