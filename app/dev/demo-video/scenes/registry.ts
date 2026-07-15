/** Scene registry for the demo-video pipeline. Each scene is a self-contained
 *  deterministic timeline rendered by its own app shell; the capture script
 *  reads durations (and settle hints) from here via a static import. */

export interface SceneSpec {
  id: string;
  durationMs: number;
  /** Frames (60fps) that need an extra fixed settle wait during capture,
   *  e.g. wall-clock mount animations (echarts) or opaque iframes (street view). */
  settleExtraMs?: Record<number, number>;
  /** Timestamps the capture script pre-seeks to before recording, waiting for
   *  network-dependent content (map tiles, iframes) to load into cache. */
  warmupMs?: number[];
}

export const SCENES: Record<string, SceneSpec> = {
  branching: {
    id: "branching",
    durationMs: 15000,
  },
  assets: {
    id: "assets",
    durationMs: 36000,
    // Filled in as the assets timeline lands (map/streetview/chart morphs).
    warmupMs: [],
    settleExtraMs: {},
  },
  // 3s brand idents (scenes/logo) — no network content, no settle hints.
  "logo-draw": { id: "logo-draw", durationMs: 3000 },
  "logo-type": { id: "logo-type", durationMs: 3000 },
  "logo-o": { id: "logo-o", durationMs: 3000 },
  "logo-lockup": { id: "logo-lockup", durationMs: 3000 },
  "logo-nodes": { id: "logo-nodes", durationMs: 3000 },
};

export const DEFAULT_SCENE = "branching";
