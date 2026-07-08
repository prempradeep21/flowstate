"use client";

import type { ReactNode } from "react";
import { ArtifactTypeIcon } from "@/components/artifacts/ArtifactTypeIcon";
import { LandingArtifactPreview } from "@/components/landing-page/shared/LandingArtifactPreview";
import {
  landingHeroCatalogEntry,
  type LandingHeroFloat,
} from "@/lib/landingCanvasHero";
import type { ArtifactKind } from "@/lib/artifactTypes";

function FloatChrome({
  title,
  kindLabel,
  artifactKind,
  width,
  children,
  className = "",
}: {
  title: string;
  kindLabel: string;
  artifactKind?: ArtifactKind | "video";
  width: number;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`pointer-events-none absolute z-10 overflow-hidden rounded-canvas border border-canvas-border/80 bg-canvas-card/92 shadow-artifact backdrop-blur-[2px] ${className}`}
      style={{ width, maxWidth: `min(${width}px, 42vw)` }}
    >
      <div className="flex items-center gap-2 border-b border-canvas-border/60 px-2.5 py-1.5">
        {artifactKind ? (
          <ArtifactTypeIcon
            kind={artifactKind}
            className="h-3.5 w-3.5 shrink-0 text-canvas-accent"
          />
        ) : (
          <span className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-canvas-accent/15 text-[9px] font-bold text-canvas-accent">
            Q
          </span>
        )}
        <span className="min-w-0 truncate text-canvas-micro font-medium text-canvas-ink">
          {title}
        </span>
        <span className="ml-auto shrink-0 text-[9px] font-semibold uppercase tracking-[0.12em] text-canvas-muted/80">
          {kindLabel}
        </span>
      </div>
      {children}
    </div>
  );
}

function QuestionFloat({
  question,
  answer,
  width,
  className,
}: {
  question: string;
  answer: string;
  width: number;
  className: string;
}) {
  return (
    <FloatChrome
      title={question}
      kindLabel="Question"
      width={width}
      className={className}
    >
      <div className="px-2.5 py-2">
        <p className="line-clamp-3 text-canvas-micro leading-snug text-canvas-muted">
          {answer}
        </p>
      </div>
    </FloatChrome>
  );
}

export function LandingFloatingNode({ float }: { float: LandingHeroFloat }) {
  if (float.kind === "question") {
    return (
      <QuestionFloat
        question={float.question}
        answer={float.answer}
        width={float.width}
        className={float.className}
      />
    );
  }

  const entry = landingHeroCatalogEntry(float.catalogId);
  const title =
    entry.payload?.title ?? entry.name;

  return (
    <FloatChrome
      title={title}
      kindLabel={float.kindLabel}
      artifactKind={float.artifactKind}
      width={float.width}
      className={float.className}
    >
      <div className="overflow-hidden [&>div]:rounded-none [&>div]:border-0 [&>div]:shadow-none">
        <LandingArtifactPreview
          entry={entry}
          previewHeight={float.previewHeight}
        />
      </div>
    </FloatChrome>
  );
}
