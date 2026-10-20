import type { ComponentType, ReactNode } from "react";
import type { ArtifactVariant, StudioArtifact } from "@/lib/artifactStudio/pool";
import type { ArtifactCategoryId } from "@/lib/design/theme/types";
import type { StyleTheme } from "./kit/look";
import type { FontPair } from "./fonts";

/**
 * A style family is a complete visual language for artifacts. Every artifact
 * is built from the same four slots, so a family decides each one once and
 * the shared language carries across tables, timelines, quotes and the rest.
 *
 *   Frame  — the container: surface, edge, radius, padding, elevation
 *   Header — the title row: how title, icon and meta sit together
 *   Icon   — the kind mark used inside the header
 *   Body   — the main content
 *
 * Slots resolve most-specific first: `variants[variant]` → `categories[category]`
 * → `slots`. Categories are the visual families from
 * lib/design/theme/artifactCategories.ts (data, viz, geo, media, docs, dev,
 * planning, discourse) — kinds that should read as siblings.
 */

/** How the artifact is being looked at. */
export type ChromeState = "rest" | "hover" | "selected";

export interface ArtifactRenderContext {
  item: StudioArtifact;
  /** Grid tiles are inert previews; the focus view is fully interactive. */
  interactive: boolean;
  surface: "tile" | "focus";
  chromeState: ChromeState;
  /** Which of the family's colour themes to draw with; null = its first. */
  themeId?: string | null;
}

export interface FrameSlotProps {
  ctx: ArtifactRenderContext;
  header: ReactNode;
  body: ReactNode;
}

export interface StyleSlots {
  Frame: ComponentType<FrameSlotProps>;
  Header: ComponentType<{ ctx: ArtifactRenderContext; icon: ReactNode }>;
  Icon: ComponentType<{ ctx: ArtifactRenderContext }>;
  Body: ComponentType<{ ctx: ArtifactRenderContext }>;
}

export type StyleFamilyId =
  | "current"
  | "style-b"
  | "style-c"
  | "style-d"
  | "style-e"
  | "ledger"
  | "badge"
  | "wire"
  | "capsule";

export interface ArtifactStyleFamily {
  id: StyleFamilyId;
  name: string;
  /** `placeholder` families are scaffolds waiting for a design. */
  status: "live" | "placeholder";
  summary: string;
  slots: StyleSlots;
  /**
   * The family's two fonts (styles/fonts.ts): primary for titles, headers,
   * hero figures and quotes; secondary for everything else. Bodies write
   * PRIMARY / SECONDARY, never a font of their own.
   */
  fonts: FontPair;
  /** Overrides for a whole visual family — where siblings share a language. */
  categories?: Partial<Record<ArtifactCategoryId, Partial<StyleSlots>>>;
  /** Overrides for one variant — where a kind needs its own handling. */
  variants?: Partial<Record<ArtifactVariant, Partial<StyleSlots>>>;
  /**
   * Render an artifact wholesale instead of composing slots. The Current
   * family uses it so the real canvas node chrome + ArtifactShell are shown
   * byte-for-byte, not a reassembly of them.
   */
  render?: ComponentType<{ ctx: ArtifactRenderContext }>;
  /**
   * Colour themes the family can be drawn in — the same rules, a different
   * set of colours. The first is the default; `ctx.themeId` picks another.
   */
  themes?: StyleTheme[];
  /**
   * The field the family is designed to sit on. When set, the studio paints
   * its boards in it so the cards are judged against their own ground.
   */
  backdrop?: { background: string; ink: string; muted: string };
}
