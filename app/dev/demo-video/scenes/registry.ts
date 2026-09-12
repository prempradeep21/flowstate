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
  disney: {
    id: "disney",
    durationMs: 36500,
    // Map tiles (WDW, zoom 10) load at the map beat; pre-seek past the
    // morph and the pin drop so tiles are cached before capture.
    warmupMs: [21800, 22300, 35000],
    settleExtraMs: {
      [Math.round((11350 / 1000) * 60)]: 1800, // echarts bar-chart morph
      [Math.round((21600 / 1000) * 60)]: 2500, // leaflet map morph
    },
  },
  freelancer: {
    id: "freelancer",
    durationMs: 34500,
    // Custom-artifact iframes (converter / clocks / invoice) paint async on
    // their morph frames; pre-seek so srcdoc content is warm before capture.
    warmupMs: [21300, 21900, 28100, 33000],
    settleExtraMs: {
      [Math.round((21200 / 1000) * 60)]: 900, // converter iframe morph
      [Math.round((21800 / 1000) * 60)]: 900, // time-zone iframe morph
      [Math.round((28000 / 1000) * 60)]: 900, // invoice iframe morph
    },
  },
  // 3s brand idents (scenes/logo) — no network content, no settle hints.
  "logo-draw": { id: "logo-draw", durationMs: 3000 },
  "logo-type": { id: "logo-type", durationMs: 3000 },
  "logo-o": { id: "logo-o", durationMs: 3000 },
  "logo-lockup": { id: "logo-lockup", durationMs: 3000 },
  "logo-nodes": { id: "logo-nodes", durationMs: 3000 },
};

export const DEFAULT_SCENE = "branching";
