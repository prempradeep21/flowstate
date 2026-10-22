"use client";

import type { CSSProperties } from "react";
import {
  DraftBoundary,
  hasRenderableContent,
} from "@/components/artifacts/GeneratingArtifactContent";
import {
  DISPLAY,
  D,
  PAD,
  SURFACE_FILL,
  frostSurfaceOf,
} from "@/components/artifactStyles/styleD/tokens";
import type { ArtifactRenderContext } from "@/components/artifactStyles/types";
import { useArtifactDraftStore } from "@/lib/artifactDrafts";
import { generatingArtifactLabel } from "@/lib/artifactWorkingTitle";
import { payloadToArtifactKind, type ArtifactKind } from "@/lib/artifactTypes";
import type { SessionArtifact } from "@/lib/sessionArtifacts";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";
import { FrostCard, frostItemOf, frostVariantOf } from "./FrostArtifactNode";

/**
 * Frost while an artifact is being written (audit 5.1). The frost card stands
 * at its final size from the first frame; the light sweeps across it, the
 * headline says what is in the works ("Cooking up a table") until the model's
 * own title streams in and takes its place, and a lime dot breathes where
 * the ⋯ will be. The moment the streamed draft can be
 * drawn, the real Frost body takes over and fills in as it streams.
 */

const BAR_WIDTHS: Record<string, number[]> = {
  chart: [100],
  table: [92, 84, 88, 76, 90],
  todo: [72, 58, 84, 46, 66],
  timeline: [100],
  code: [38, 64, 52, 80, 30, 58],
  default: [86, 64, 78],
};

function Bars({ kind }: { kind: ArtifactKind }) {
  if (kind === "chart") {
    return (
      <div className="mt-auto flex h-[46%] items-end gap-3" aria-hidden>
        {[42, 64, 52, 80, 58, 70, 36].map((h, i) => (
          <span key={i} className="frost-skel-bar flex-1" style={{ height: `${h}%`, borderRadius: 12 }} />
        ))}
      </div>
    );
  }
  const widths = BAR_WIDTHS[kind] ?? BAR_WIDTHS.default!;
  return (
    <div className="mt-7 flex flex-col gap-3.5" aria-hidden>
      {widths.map((w, i) => (
        <span key={i} className="frost-skel-bar h-[18px]" style={{ width: `${w}%` }} />
      ))}
    </div>
  );
}

export function FrostSkeletonBody({ kind, title }: { kind: ArtifactKind; title: string }) {
  const named = Boolean(title.trim());
  const headline = named ? title.trim() : generatingArtifactLabel(kind);
  return (
    <div
      className="frost-skeleton relative flex min-h-0 flex-1 flex-col overflow-hidden"
      style={{ padding: PAD }}
      aria-busy
      aria-label={named ? `Generating ${headline}` : headline}
    >
      <p
        className="max-w-[80%]"
        data-frost-working-label={named ? undefined : ""}
        style={{
          ...DISPLAY,
          fontSize: 30,
          lineHeight: 1.12,
          letterSpacing: "-0.02em",
          color: named ? D.ink : D.muted,
          margin: 0,
        }}
      >
        {headline}
      </p>
      <Bars kind={kind} />
      <span className="frost-gen-dot" aria-hidden />
      <span className="frost-sheen-sweep" aria-hidden />
    </div>
  );
}

function draftArtifact(nodeId: string, kind: ArtifactKind, title: string, payload: SessionArtifact["versions"][number]["payload"]): SessionArtifact {
  return {
    id: `draft:${nodeId}`,
    title,
    kind,
    latestVersionId: "draft",
    versions: [{ id: "draft", number: 1, payload, createdAt: 0, sourceCardId: "" }],
  };
}

export function FrostGenerating({
  nodeId,
  kind,
  title,
  sourceCard,
  size,
}: {
  nodeId: string;
  kind: ArtifactKind;
  title: string;
  sourceCard?: Card;
  size: { w: number; h: number };
}) {
  const mode = useCanvasStore((s) => s.canvasTheme);
  const draft = useArtifactDraftStore((s) => s.drafts[nodeId]);
  const cardPayload =
    sourceCard?.artifactPayload && payloadToArtifactKind(sourceCard.artifactPayload) === kind
      ? sourceCard.artifactPayload
      : undefined;
  const payload = draft ?? cardPayload;
  // The streamed title once known, else "" — FrostSkeletonBody labels the
  // unnamed state itself; the drawn body gets the working label as its name.
  const shownTitle = payload?.title?.trim() || title.trim();
  const bodyTitle = shownTitle || generatingArtifactLabel(kind);

  const skeletonCtx: ArtifactRenderContext = {
    item: {
      ...frostItemOf(nodeId, draftArtifact(nodeId, kind, shownTitle, { type: "table", title: shownTitle, data: { columns: [], rows: [] } }), { type: "table", title: shownTitle, data: { columns: [], rows: [] } }, size),
      // A skeleton is always the plain frost card — the hero colour arrives with the body.
      variant: "custom",
    },
    interactive: false,
    surface: "focus",
    chromeState: "rest",
    mode,
  };
  const skeleton = <FrostCard ctx={skeletonCtx} body={<FrostSkeletonBody kind={kind} title={shownTitle} />} />;

  if (!payload || !hasRenderableContent(payload)) return skeleton;

  const art = draftArtifact(nodeId, kind, bodyTitle, payload);
  const ctx: ArtifactRenderContext = {
    item: frostItemOf(nodeId, art, payload, size),
    interactive: false,
    surface: "focus",
    chromeState: "rest",
    mode,
  };
  return (
    <DraftBoundary resetKey={payload} fallback={skeleton}>
      <FrostCard ctx={ctx} className="frost-streaming" />
    </DraftBoundary>
  );
}

/**
 * Gesture-time stand-in (audit 5.6): the card's own surface — frost, or the
 * flat lime / ink / sage of a hero kind — at the Frost radius with a cheap
 * contact shadow, and the title in the primary font. No gradients-on-blur,
 * nothing measured.
 */
export function frostPlaceholderStyle(art: SessionArtifact | undefined): {
  style: CSSProperties;
  color: string;
} {
  const latest = art?.versions.find((v) => v.id === art.latestVersionId)?.payload;
  const surface = latest ? frostSurfaceOf(frostVariantOf(latest)) : "frost";
  if (surface === "frost") return { style: {}, color: D.ink };
  return {
    style: { background: SURFACE_FILL[surface] },
    color: surface === "lime" ? D.limeInk : D.white,
  };
}
