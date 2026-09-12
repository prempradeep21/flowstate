"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";

/**
 * A line worth keeping. Sized so the quote itself is the loudest thing on the
 * card — attribution is deliberately quiet, because the point of a pull-quote
 * is that you hear it again, not that you look up who said it.
 */
export function QuoteArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "quote" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { text, speaker, timestamp, context } = payload.data;

  return (
    <ArtifactContentStage fill={fill} artifactId={artifactId}>
      <figure className="artifact-quote flex h-full flex-col justify-center gap-3 px-5 py-4">
        <blockquote
          className={`artifact-quote-body relative pl-5 font-medium leading-snug text-canvas-ink ${
            sidebar ? "text-[15px]" : "text-[22px]"
          }`}
        >
          <span
            aria-hidden
            className="artifact-quote-rule absolute left-0 top-0 h-full w-[3px] rounded-full bg-canvas-secondary/60"
          />
          {text}
        </blockquote>
        <figcaption className="artifact-quote-caption flex flex-wrap items-baseline gap-x-2 gap-y-1 pl-5 text-canvas-caption text-canvas-muted">
          {speaker ? <span className="artifact-quote-speaker font-medium">{speaker}</span> : null}
          {timestamp ? (
            <span className="tabular-nums opacity-70">{timestamp}</span>
          ) : null}
          {context ? (
            <span className="basis-full opacity-70">{context}</span>
          ) : null}
        </figcaption>
      </figure>
    </ArtifactContentStage>
  );
}
