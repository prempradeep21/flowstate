/**
 * Artifact style packs — types.
 *
 * A style pack is the *structural* styling dimension of the design system,
 * orthogonal to the color theme (lib/design/theme): stroke weights, solid
 * "chin" shadows, corner radii, header treatment, control chrome, and spacing
 * density. Packs resolve to CSS variables scoped under
 * `[data-artifact-style="<id>"]` (see resolveArtifactStyle.ts); the default
 * "vanilla" pack resolves to nothing so existing surfaces stay untouched.
 *
 * Color-led packs (Bento, Riso) extend the contract with an optional
 * per-category tonal palette, a chart palette (the JS seam for canvas
 * renderers), neutral-token re-declarations, and display typography.
 */

import type { ArtifactCategoryId } from "@/lib/design/theme/types";

export type ArtifactStyleId = string;

/**
 * Tonal roles for one artifact category (all hexes, one set per mode).
 * Contrast contract (guarded by stylePacks.contrast.test.ts):
 * - onSolid / onSolidMuted on solid ≥ 4.5:1
 * - ink on pale ≥ 4.5:1 (authored to clear 7:1)
 * - muted on pale ≥ 4.5:1
 * - vivid carries NO text guarantee — glyphs, chips with their own text
 *   color, chart series only.
 */
export interface ArtifactStyleCategoryTones {
  /** Strong category fill (solid cards, header chips, table heads). */
  solid: string;
  /** Primary text/icon on `solid`. */
  onSolid: string;
  /** Secondary text on `solid`. */
  onSolidMuted: string;
  /** Soft category fill (pale card surfaces, tint blocks). */
  pale: string;
  /** Primary text on `pale` (and on the neutral card, for Riso). */
  ink: string;
  /** Secondary text on `pale`. */
  muted: string;
  /** Decorative saturated ink — glyphs, outlined chips, chart series. */
  vivid: string;
}

/** Chart palette handed to ECharts / visx (they render to canvas/SVG and
 * cannot read the scoped CSS variables). */
export interface ArtifactStyleChartPalette {
  series: string[];
  ink: string;
  muted: string;
  /** Axis / grid line color (may carry alpha via rgba()). */
  grid: string;
  /** Tooltip + export background. */
  bg: string;
}

/** Display typography for headline artifacts (stat / quote / definition). */
export interface ArtifactStyleTypography {
  displayFamily: string;
  displayWeight: string;
  displayTracking: string;
  /** Upper clamp of the display numeral (the responsive clamp lives in CSS). */
  displaySize: string;
  quoteSize: string;
  eyebrowFamily: string;
  eyebrowTracking: string;
}

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
  /**
   * Fill opacity for translucent materials (0–1). Fill hexes can't carry
   * alpha (they're emitted as RGB channels), so translucency composes at
   * consumption as `rgb(var(--canvas-artifact-card-fill) / alpha)`. Omit for
   * opaque packs (CSS falls back to 1).
   */
  cardFillAlpha?: number;
  /**
   * Specular edge highlight (literal inset box-shadow layers) — the light
   * catching the top/inner rim of a glass surface. Omit to disable (CSS
   * falls back to an empty shadow).
   */
  innerHighlight?: string;
  /**
   * Per-category tonal palette. When present the resolver emits
   * `--art-cat-<category>-<role>` channel vars for every category; the pack
   * stylesheet binds them to `--art-<role>` per node via
   * `[data-artifact-category]`.
   */
  categories?: Record<ArtifactCategoryId, ArtifactStyleCategoryTones>;
  /**
   * Neutral token re-declarations inside the scope (hexes → RGB channels on
   * --canvas-ink / --canvas-muted / --canvas-border / --canvas-connector).
   * Because every Tailwind `canvas-*` utility resolves through these vars,
   * this is how a pack recolors all artifact text in one move.
   */
  surfaceCard?: string;
  surfaceInk?: string;
  surfaceMuted?: string;
  surfaceBorder?: string;
  canvasConnector?: string;
  /** Chart palette for the JS renderers. */
  chart?: ArtifactStyleChartPalette;
  /** Timeline / calendar event colors (cycled by index). */
  timeline?: readonly string[];
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
  /**
   * Backdrop material filter (literal CSS filter list, e.g.
   * "blur(20px) saturate(1.7)"), mode-independent. When set, the pack emits
   * --canvas-artifact-backdrop-filter and the scoped stylesheet applies it
   * on exactly one element per node (casing-level — never nested). Omit for
   * non-glass packs.
   */
  backdropFilter?: string;
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
  /** Display typography (mode-independent). Omit to keep renderer defaults. */
  typography?: ArtifactStyleTypography;
  /** Three swatch hexes for the settings-popover preview chip. */
  previewSwatches?: readonly [string, string, string];
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
