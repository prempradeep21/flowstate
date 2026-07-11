/**
 * Canvas pie menu (hold Z) — pure geometry and sector configuration.
 *
 * Four 90° wedges centered on compass directions. Selection is angular:
 * once the pointer leaves the dead zone, the nearest sector arms; distance
 * beyond the threshold never changes the pick.
 */

export type PieSectorId = "north" | "east" | "south" | "west";

export interface PieSectorConfig {
  id: PieSectorId;
  /** Pill label. */
  label: string;
  /** Keyboard accelerator hint rendered as [Q] / [T]; null for placeholders. */
  shortcut: string | null;
  /** Placeholders render muted and never arm. */
  enabled: boolean;
  /** Unit direction from menu center toward the pill. */
  dir: { x: number; y: number };
  /** Stagger order — clockwise from top (N → E → S → W). */
  clockwiseIndex: number;
}

/** Pointer must travel this far from the spawn point before a sector arms. */
export const PIE_DEAD_ZONE_PX = 24;

/** Radial distance from menu center to each pill's center. */
export const PIE_PILL_DISTANCE_PX = 110;

/** Approximate half-extent of a pill; used for edge clamping. */
export const PIE_EDGE_MARGIN_X = PIE_PILL_DISTANCE_PX + 110;
export const PIE_EDGE_MARGIN_Y = PIE_PILL_DISTANCE_PX + 28;

export const PIE_SECTORS: readonly PieSectorConfig[] = [
  {
    id: "north",
    label: "Add question",
    shortcut: "Q",
    enabled: true,
    dir: { x: 0, y: -1 },
    clockwiseIndex: 0,
  },
  {
    id: "east",
    label: "Sticky note",
    shortcut: "S",
    enabled: true,
    dir: { x: 1, y: 0 },
    clockwiseIndex: 1,
  },
  {
    id: "south",
    label: "Coming soon",
    shortcut: null,
    enabled: false,
    dir: { x: 0, y: 1 },
    clockwiseIndex: 2,
  },
  {
    id: "west",
    label: "Add text",
    shortcut: "T",
    enabled: true,
    dir: { x: -1, y: 0 },
    clockwiseIndex: 3,
  },
] as const;

/**
 * Map a pointer offset from the menu center to a sector id, or null while
 * inside the dead zone. Wedges are 90°, centered on each compass direction.
 */
export function angleToSector(dx: number, dy: number): PieSectorId | null {
  if (Math.hypot(dx, dy) < PIE_DEAD_ZONE_PX) return null;
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI; // -180..180, 0 = east
  if (deg >= -135 && deg < -45) return "north";
  if (deg >= -45 && deg < 45) return "east";
  if (deg >= 45 && deg < 135) return "south";
  return "west";
}

/** Rotation (degrees) of the center-ring direction notch per sector. */
export const PIE_SECTOR_ANGLE_DEG: Record<PieSectorId, number> = {
  north: 0,
  east: 90,
  south: 180,
  west: 270,
};

/**
 * Clamp the menu center so all pills stay inside the container. Sector math
 * stays anchored to the clamped center (forgiving with 90° wedges).
 */
export function clampPieCenter(
  x: number,
  y: number,
  rect: { left: number; top: number; right: number; bottom: number },
): { x: number; y: number } {
  const minX = rect.left + PIE_EDGE_MARGIN_X;
  const maxX = rect.right - PIE_EDGE_MARGIN_X;
  const minY = rect.top + PIE_EDGE_MARGIN_Y;
  const maxY = rect.bottom - PIE_EDGE_MARGIN_Y;
  return {
    // When the container is narrower than twice the margin, fall back to its middle.
    x: minX > maxX ? (rect.left + rect.right) / 2 : Math.min(maxX, Math.max(minX, x)),
    y: minY > maxY ? (rect.top + rect.bottom) / 2 : Math.min(maxY, Math.max(minY, y)),
  };
}
