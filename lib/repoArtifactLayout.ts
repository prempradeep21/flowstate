/** Hub-and-spoke layout for canvas repo artifacts — single source of truth. */

export const REPO_ARTIFACT_WIDTH = 1080;
/** Minimum canvas height; grows with spoke content. */
export const REPO_ARTIFACT_MIN_HEIGHT = 400;
/** Legacy default — use {@link computeRepoArtifactHeight} when spokes are measured. */
export const REPO_ARTIFACT_HEIGHT = 760;

export const REPO_SPOKE_WIDTH = 300;
export const REPO_SPOKE_MAX_HEIGHT = 500;
/** Measured header band (icon + title + dismiss). */
export const REPO_SPOKE_HEADER_HEIGHT = 41;
export const REPO_SPOKE_BODY_MAX_HEIGHT =
  REPO_SPOKE_MAX_HEIGHT - REPO_SPOKE_HEADER_HEIGHT;
export const REPO_SPOKE_GAP = 12;
export const REPO_LEFT_X = 24;
export const REPO_RIGHT_X = 756;
export const REPO_COLUMN_TOP = 28;
export const REPO_ARTIFACT_BOTTOM_PAD = 28;

/** Hub appears alone while fetch runs. */
export const REPO_HUB_HOLD_MS = 1000;
/** Delay after connectors before first widget. */
export const REPO_WIDGETS_AFTER_CONNECTORS_MS = 280;
export const REPO_SPOKE_STAGGER_MS = 120;

/** Taller hub — room for stars/forks + collapse CTA (1.5× grab area for drag). */
export const REPO_HUB = { cx: 540, cy: 380, w: 252, h: 288 };

/** Collapsed canvas bounds — wraps the hub with light padding. */
export const REPO_COLLAPSED_PADDING = 12;
export const REPO_COLLAPSED_WIDTH = REPO_HUB.w + REPO_COLLAPSED_PADDING * 2;
export const REPO_COLLAPSED_HEIGHT = REPO_HUB.h + REPO_COLLAPSED_PADDING * 2;

/** Collapsed artifact size from measured hub dimensions (ResizeObserver in RepoArtifactContent). */
export function computeRepoCollapsedSize(
  hubW: number,
  hubH: number,
): { w: number; h: number } {
  return {
    w: hubW + REPO_COLLAPSED_PADDING * 2,
    h: hubH + REPO_COLLAPSED_PADDING * 2,
  };
}

/** Pointer target for dragging the repo artifact on canvas (hub only). */
export const REPO_DRAG_HANDLE_ATTR = "data-repo-drag-handle";

export type RepoHubLayout = typeof REPO_HUB;

export function repoHubForBounds(
  width: number,
  height: number,
  collapsed: boolean,
): RepoHubLayout {
  if (collapsed) {
    return {
      cx: width / 2,
      cy: height / 2,
      w: REPO_HUB.w,
      h: REPO_HUB.h,
    };
  }
  return {
    cx: REPO_HUB.cx,
    cy: height / 2,
    w: REPO_HUB.w,
    h: REPO_HUB.h,
  };
}

/** Keep hub world position stable when toggling collapsed ↔ expanded. */
export function repoCollapsePositionDelta(
  collapsed: boolean,
  currentW: number,
  currentH: number,
  targetH: number,
  collapsedW = REPO_COLLAPSED_WIDTH,
  collapsedH = REPO_COLLAPSED_HEIGHT,
): { dx: number; dy: number } {
  const expandedHubCy = targetH / 2;
  if (collapsed) {
    return {
      dx: REPO_HUB.cx - collapsedW / 2,
      dy: expandedHubCy - collapsedH / 2,
    };
  }
  return {
    dx: currentW / 2 - REPO_HUB.cx,
    dy: currentH / 2 - expandedHubCy,
  };
}

export type RepoSpokeId =
  | "overview"
  | "fileStructure"
  | "media"
  | "preview"
  | "techDetails"
  | "builtBy";

export interface RepoSpokeDefinition {
  id: RepoSpokeId;
  title: string;
  hubSide: "left" | "right";
}

export interface RepoSpokeLayout extends RepoSpokeDefinition {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** Seed heights before first ResizeObserver pass. */
/** Conservative estimates until ResizeObserver reports real card heights. */
export const REPO_SPOKE_DEFAULT_HEIGHTS: Record<RepoSpokeId, number> = {
  overview: 320,
  fileStructure: 380,
  media: 280,
  preview: 180,
  techDetails: 420,
  builtBy: 360,
};

/** Spoke definitions — media omitted when README has no large screenshots. */
export function getRepoSpokeDefinitions(hasDisplayableMedia: boolean): RepoSpokeDefinition[] {
  const left: RepoSpokeDefinition[] = [
    { id: "overview", title: "Overview", hubSide: "left" },
    { id: "fileStructure", title: "Files", hubSide: "left" },
  ];
  if (hasDisplayableMedia) {
    left.push({ id: "media", title: "Media", hubSide: "left" });
  }
  const right: RepoSpokeDefinition[] = [
    { id: "preview", title: "Preview", hubSide: "right" },
    { id: "techDetails", title: "Tech details", hubSide: "right" },
    { id: "builtBy", title: "Built by", hubSide: "right" },
  ];
  return [...left, ...right];
}

/** Stack spokes per column using measured card heights. */
export function positionRepoSpokes(
  definitions: RepoSpokeDefinition[],
  heights: Partial<Record<RepoSpokeId, number>>,
): RepoSpokeLayout[] {
  let leftY = REPO_COLUMN_TOP;
  let rightY = REPO_COLUMN_TOP;

  return definitions.map((def) => {
    const h = heights[def.id] ?? REPO_SPOKE_DEFAULT_HEIGHTS[def.id];
    const x = def.hubSide === "left" ? REPO_LEFT_X : REPO_RIGHT_X;
    const y = def.hubSide === "left" ? leftY : rightY;
    if (def.hubSide === "left") leftY += h + REPO_SPOKE_GAP;
    else rightY += h + REPO_SPOKE_GAP;
    return { ...def, x, y, w: REPO_SPOKE_WIDTH, h };
  });
}

export function buildRepoSpokes(hasDisplayableMedia: boolean): RepoSpokeLayout[] {
  return positionRepoSpokes(getRepoSpokeDefinitions(hasDisplayableMedia), {});
}

/** Canvas height from stacked spokes and centered hub. */
export function computeRepoArtifactHeight(
  definitions: RepoSpokeDefinition[],
  heights: Partial<Record<RepoSpokeId, number>> = {},
): number {
  const spokes = positionRepoSpokes(definitions, heights);
  const spokeBottom = spokes.reduce((max, s) => Math.max(max, s.y + s.h), 0);
  const hubSpan = REPO_HUB.h + REPO_ARTIFACT_BOTTOM_PAD * 2;

  return Math.max(
    REPO_ARTIFACT_MIN_HEIGHT,
    spokeBottom + REPO_ARTIFACT_BOTTOM_PAD,
    hubSpan,
  );
}

/** Default spoke list (media shown) — used where explorer data is unavailable. */
export const REPO_SPOKES: RepoSpokeLayout[] = buildRepoSpokes(true);

export type RepoRevealPhase = "hub" | "connectors" | "widgets";
