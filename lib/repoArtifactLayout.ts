/** Hub-and-spoke layout for canvas repo artifacts — single source of truth. */

export const REPO_ARTIFACT_WIDTH = 1080;
export const REPO_ARTIFACT_HEIGHT = 760;

/** Hub appears alone while fetch runs. */
export const REPO_HUB_HOLD_MS = 1000;
/** Delay after connectors before first widget. */
export const REPO_WIDGETS_AFTER_CONNECTORS_MS = 280;
export const REPO_SPOKE_STAGGER_MS = 120;

export const REPO_HUB = { cx: 540, cy: 380, w: 168, h: 148 };

export type RepoSpokeId =
  | "overview"
  | "media"
  | "preview"
  | "techDetails"
  | "builtBy"
  | "fileStructure";

export interface RepoSpokeLayout {
  id: RepoSpokeId;
  title: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hubSide: "left" | "right";
}

/** Six spokes — sized for ~2× information density vs initial prototype. */
export const REPO_SPOKES: RepoSpokeLayout[] = [
  { id: "overview", title: "Overview", x: 24, y: 28, w: 300, h: 228, hubSide: "left" },
  { id: "fileStructure", title: "Files", x: 24, y: 276, w: 300, h: 168, hubSide: "left" },
  { id: "media", title: "Media", x: 24, y: 464, w: 300, h: 168, hubSide: "left" },
  { id: "preview", title: "Preview", x: 756, y: 28, w: 300, h: 148, hubSide: "right" },
  { id: "techDetails", title: "Tech details", x: 756, y: 196, w: 300, h: 228, hubSide: "right" },
  { id: "builtBy", title: "Built by", x: 756, y: 444, w: 300, h: 188, hubSide: "right" },
];

export type RepoRevealPhase = "hub" | "connectors" | "widgets";
