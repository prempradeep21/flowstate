"use client";

import type { ComponentType, ReactNode } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import type { ArtifactVariant } from "@/lib/artifactStudio/pool";
import type { FontPair } from "../fonts";
import type { ArtifactRenderContext, ArtifactStyleFamily, FrameSlotProps, StyleFamilyId, StyleSlots } from "../types";
import { AreaBody, BarBody, GaugeBody, LineBody, PieBody, StatBody } from "./charts";
import { CalendarBody, CodeBody, EpisodeBody, LinkGroupBody, MechanismBody, TableBody, TimelineBody, TodoBody } from "./lists";
import { LookContext, themeStyle, type Look, type StyleTheme } from "./look";
import { AudioBody, ImagesBody, InsetBody, VideoBody, WebsiteBody } from "./media";
import { ClaimBody, DefinitionBody, QuoteBody, StandaloneStickyBody, StickyBody } from "./text";

/**
 * Builds a themed family from its Look, its three themes, and the frame and
 * header that make it itself. Every body comes from the kit unless the family
 * overrides it; the kit bodies read the Look from context and the theme from
 * the CSS variables the root sets.
 */

export interface KitFamilySpec {
  id: StyleFamilyId;
  name: string;
  summary: string;
  look: Look;
  /** Default primary / secondary fonts — the Look writes PRIMARY / SECONDARY. */
  fonts: FontPair;
  themes: [StyleTheme, StyleTheme, StyleTheme];
  Frame: ComponentType<FrameSlotProps & { theme: StyleTheme }>;
  Header: ComponentType<{ ctx: ArtifactRenderContext; icon: ReactNode; theme: StyleTheme }>;
  Icon?: ComponentType<{ ctx: ArtifactRenderContext }>;
  /** Variant bodies (or frames) the family draws its own way. */
  variants?: Partial<Record<ArtifactVariant, Partial<StyleSlots>>>;
  /** Sticky notes: keep the family's frame and header (default) or let the note stand alone, carrying its own title. */
  bareNotes?: boolean;
}

export function resolveTheme(family: ArtifactStyleFamily, ctx: ArtifactRenderContext): StyleTheme | null {
  const themes = family.themes;
  if (!themes?.length) return null;
  return themes.find((t) => t.id === ctx.themeId) ?? themes[0]!;
}

export const KIT_VARIANTS: Partial<Record<ArtifactVariant, Partial<StyleSlots>>> = {
  table: { Body: TableBody },
  "chart:bar": { Body: BarBody },
  "chart:line": { Body: LineBody },
  "chart:area": { Body: AreaBody },
  "chart:pie": { Body: PieBody },
  "chart:gauge": { Body: GaugeBody },
  stat: { Body: StatBody },
  mechanism: { Body: MechanismBody },
  timeline: { Body: TimelineBody },
  calendar: { Body: CalendarBody },
  todo: { Body: TodoBody },
  images: { Body: ImagesBody },
  video: { Body: VideoBody },
  audio: { Body: AudioBody },
  website: { Body: WebsiteBody },
  episode: { Body: EpisodeBody },
  linkgroup: { Body: LinkGroupBody },
  quote: { Body: QuoteBody },
  claim: { Body: ClaimBody },
  definition: { Body: DefinitionBody },
  code: { Body: CodeBody },
  stickynote: { Body: StickyBody },
};

/** The kind glyph in the current ink — families colour it through `color`. */
export function KindGlyph({ ctx, className = "h-4 w-4" }: { ctx: ArtifactRenderContext; className?: string }) {
  const kind = ctx.item.variant === "video" ? "video" : ctx.item.kind;
  return <ArtifactTypeIcon kind={kind} className={className} />;
}

/** The note frame when notes stand alone: context and the selection state only. */
function BareNoteFrame({ ctx, body, look }: FrameSlotProps & { look: Look }) {
  const state =
    ctx.chromeState === "selected"
      ? { outline: `3px solid var(--k-accent)`, outlineOffset: 4, borderRadius: look.radius }
      : ctx.chromeState === "hover"
        ? { boxShadow: "0 16px 32px -16px rgba(0,0,0,0.4)", borderRadius: look.radius }
        : {};
  return (
    <div className="flex h-full flex-col" style={state}>
      {body}
    </div>
  );
}

export function makeKitFamily(spec: KitFamilySpec): ArtifactStyleFamily {
  const { look, themes } = spec;
  const family: ArtifactStyleFamily = {
    id: spec.id,
    name: spec.name,
    status: "live",
    summary: spec.summary,
    fonts: spec.fonts,
    themes,
    backdrop: { background: themes[0].vars.field, ink: themes[0].vars.ink === "#FFFFFF" || themes[0].vars.field.startsWith("#0") || themes[0].vars.field.startsWith("#1") ? "#F5F5F2" : themes[0].vars.ink, muted: "rgba(127,127,127,0.9)" },
    slots: {
      Frame: () => null,
      Header: () => null,
      Icon: spec.Icon ?? (({ ctx }) => <KindGlyph ctx={ctx} />),
      Body: InsetBody,
    },
    variants: { ...KIT_VARIANTS, ...spec.variants },
  };

  const Root = ({ ctx, children }: { ctx: ArtifactRenderContext; children: ReactNode }) => {
    const theme = resolveTheme(family, ctx)!;
    return (
      <LookContext.Provider value={look}>
        <div className="h-full w-full" style={{ ...themeStyle(theme.vars, ctx.item.category), fontFamily: look.font.body, color: "var(--k-ink)" }}>
          {children}
        </div>
      </LookContext.Provider>
    );
  };

  const FamilyFrame = spec.Frame;
  const FamilyHeader = spec.Header;

  const Frame: StyleSlots["Frame"] = (props) => {
    const theme = resolveTheme(family, props.ctx)!;
    return (
      <Root ctx={props.ctx}>
        <FamilyFrame {...props} theme={theme} />
      </Root>
    );
  };
  Frame.displayName = `${family.id}.Frame`;
  family.slots.Frame = Frame;
  const Header: StyleSlots["Header"] = ({ ctx, icon }) => {
    const theme = resolveTheme(family, ctx)!;
    return <FamilyHeader ctx={ctx} icon={icon} theme={theme} />;
  };
  Header.displayName = `${family.id}.Header`;
  family.slots.Header = Header;

  if (spec.bareNotes) {
    family.variants!.stickynote = {
      ...family.variants!.stickynote,
      // No header, so the note carries the title itself.
      Body: StandaloneStickyBody,
      Frame: (props) => (
        <Root ctx={props.ctx}>
          <BareNoteFrame {...props} look={look} />
        </Root>
      ),
      Header: () => null,
    };
  }

  return family;
}

/** Shadow + outline per chrome state, for frames that don't want to decide it twice. */
export function chromeShadow(ctx: ArtifactRenderContext, rest: string, hover: string, selectedColor: string, radius: number) {
  if (ctx.chromeState === "selected") return { boxShadow: hover, outline: `3px solid ${selectedColor}`, outlineOffset: 4, borderRadius: radius };
  if (ctx.chromeState === "hover") return { boxShadow: hover };
  return { boxShadow: rest };
}

export { InsetBody } from "./media";
export { FlushBody } from "./media";
