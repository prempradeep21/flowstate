import type { ComponentType, ReactNode } from "react";
import type { ArtifactVariant, StudioArtifact } from "@/lib/artifactStudio/pool";
import type { ArtifactPayload } from "@/lib/artifactTypes";
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

/**
 * Where a Q&A card is in its turn. The live card passes through all four:
 * an empty composer the user types into, the question alone while the
 * answer is being thought about, the answer arriving, and the finished card.
 * Only the focus view sets it; tiles always show the finished card.
 */
export type QaState = "typing" | "thinking" | "answering" | "done";

/**
 * Light or dark. Every family draws both: the same rules and geometry, a
 * second complete set of colours. Only the artifacts and the board they sit
 * on change — the studio's own chrome never does.
 */
export type StudioMode = "light" | "dark";

export interface ArtifactRenderContext {
  item: StudioArtifact;
  /** Grid tiles are inert previews; the focus view is fully interactive. */
  interactive: boolean;
  surface: "tile" | "focus";
  chromeState: ChromeState;
  /** Which of the family's colour themes to draw with; null = its first. */
  themeId?: string | null;
  /** Light (default) or dark — see {@link StudioMode}. */
  mode?: StudioMode;
  /** A Q&A card's point in its turn; undefined = done. See {@link QaState}. */
  qaState?: QaState;
  /**
   * What has been typed into the empty card's composer so far (`typing`
   * only). Empty or undefined shows the placeholder.
   */
  composerDraft?: string;
  /**
   * Set where the empty card is live (the sample canvas): the composer
   * reports what is typed and sends the question. Families that draw their
   * own composer leave input to the host; Current's real one uses these.
   */
  onComposerDraft?: (draft: string) => void;
  onComposerSubmit?: (question: string) => void;
  /**
   * Set where a family's bodies are drawn on the real canvas (the Frost style
   * pack, components/frost): the live, interactive artifact content that
   * bodies which inset it (`InsetBody`) show instead of a read-only preview.
   */
  liveBody?: ReactNode;
  /** Canvas only: persists an edit a body makes in place (a todo check). */
  onPayloadChange?: (payload: ArtifactPayload) => void;
  /** Canvas only: the real ⋯ menu — version switching, extra rows, removal. */
  canvasMenu?: CanvasMenuActions;
  /** Canvas only: frame a group on the canvas (an episode's chapter rows). */
  focusGroup?: (groupId: string) => void;
}

/** What the ⋯ menu does on the canvas (the studio keeps its local preview). */
export interface CanvasMenuActions {
  activeVersionId: string;
  onVersionChange: (versionId: string) => void;
  onRemove?: () => void;
  /** Rows above Version / Export (Rename, Edit). Receives the menu's close. */
  extraRows?: (close: () => void) => ReactNode;
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
  | "style-c"
  | "style-d"
  | "style-e"
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
   * The empty Q&A card — the composer the user types a question into,
   * before there is a card to frame. Drawn alone, without Frame or Header,
   * in the family's language. Families that render wholesale handle the
   * typing state inside `render` instead.
   */
  Composer?: ComponentType<{ ctx: ArtifactRenderContext }>;
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
  backdrop?: Backdrop;
  /** The same ground in dark mode. Families with `themes` derive it from the theme instead. */
  darkBackdrop?: Backdrop;
  /**
   * Which artifacts hug their content: the height (design px) a card is
   * never drawn shorter than, or null to draw it in its fixed canvas box.
   * A hugging card grows to show everything it holds — nothing is clamped.
   * Families without one hug only Q&A and mechanism cards.
   */
  hug?: (item: StudioArtifact) => number | null;
}

export interface Backdrop {
  background: string;
  ink: string;
  muted: string;
}
