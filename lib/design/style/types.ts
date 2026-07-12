/**
 * Artifact style packs — types.
 *
 * A style pack is the *structural* styling dimension of the design system,
 * orthogonal to the color theme (lib/design/theme): stroke weights, solid
 * "chin" shadows, corner radii, header treatment, control chrome, and spacing
 * density. Packs resolve to CSS variables scoped under
 * `[data-artifact-style="<id>"]` (see resolveArtifactStyle.ts); the default
 * "vanilla" pack resolves to nothing so existing surfaces stay untouched.
 */

export type ArtifactStyleId = string;

/** Mode-specific surface tokens. Hexes for colors that need alpha composing,
 * literal CSS strings for shadows / border shorthands / raw color values. */
export interface ArtifactStyleSurfaceTokens {
  /** Card/surface fill (hex — emitted as RGB channels). */
  cardFill: string;
  /** Casing stroke color (hex — emitted as RGB channels). */
  stroke: string;
  /** Soft ambient drop shadow (literal box-shadow layer). */
  ambientShadow: string;
  /** Solid no-blur "chin" edge (literal box-shadow layer). */
  chinShadow: string;
  /** Header bar background (literal CSS color). */
  headerBg: string;
  /** Header bottom rule (literal CSS border shorthand). */
  headerRule: string;
  /**
   * Canvas backdrop override (hex — emitted as RGB channels on --canvas-bg
   * and --canvas-artifact-stage inside the scope). null = inherit the theme
   * backdrop; this is the disabled state for packs that don't recolor the
   * canvas.
   */
  canvasBg: string | null;
  /**
   * Canvas grid dot recolor (hex — emitted as RGB channels on --canvas-dot
   * inside the scope). The grid keeps drawing its own zoom-scaled dots, so
   * the pattern stays crisp at every viewport scale. null = inherit.
   */
  canvasDot: string | null;
  /** Offset block shadow, zero blur (literal box-shadow layer). "none"
   * disables. */
  hardShadow: string;
}

export interface ArtifactStylePreset {
  id: ArtifactStyleId;
  name: string;
  description: string;
  /**
   * Pack-scoped brand accent (light hex). When set, the pack re-declares
   * --canvas-accent (+ map/icon derivatives and --canvas-accent-deep) inside
   * its scope; dark variants are derived. Omit to inherit the active theme.
   */
  accent?: string;
  /** Casing stroke width (CSS length). */
  strokeWidth: string;
  /** Casing corner radius (CSS length). */
  radius: string;
  /** Stroke width for in-card controls (pills, chips, chart bars). */
  controlStrokeWidth: string;
  /** Stroke width for todo checkboxes. */
  checkboxStrokeWidth: string;
  /** Pill/chip corner radius. */
  pillRadius: string;
  /** Spacing density multiplier (1 = current spacing). Reserved. */
  density: number;
  /** Show the lowercase kind label in the artifact header. */
  showKindLabel: boolean;
  /** Selected-state focus ring (literal box-shadow layer; may reference vars). */
  selectedRing: string;
  /** Selected-state chin (literal box-shadow layer; may reference vars). */
  selectedChin: string;
  /** Resting card rotation (CSS angle). "0deg" disables. */
  tilt: string;
  /** Hover translate offsets ("x, y" — consumed via translate(var(--…))).
   * "0px, 0px" disables. */
  hoverLift: string;
  /** Active/press translate offsets ("x, y"). "0px, 0px" disables. */
  pressPush: string;
  light: ArtifactStyleSurfaceTokens;
  dark: ArtifactStyleSurfaceTokens;
}

/** Resolved output — CSS ready to inject; vars grouped per mode. */
export interface ResolvedArtifactStyle {
  css: string;
  lightVars: Record<string, string>;
  darkVars: Record<string, string>;
  /** True for the vanilla pack (no scope attribute / stylesheet needed). */
  isDefault: boolean;
}
