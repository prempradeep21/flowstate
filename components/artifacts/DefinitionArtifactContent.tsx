"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload } from "@/lib/artifactTypes";

/** Jargon, and the gloss that followed it. */
export function DefinitionArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "definition" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { term, gloss, example, speaker } = payload.data;

  return (
    <ArtifactContentStage fill={fill} artifactId={artifactId}>
      <dl className="artifact-def flex h-full flex-col justify-center gap-2 px-5 py-4">
        <dt
          className={`artifact-def-term font-semibold leading-tight text-canvas-ink ${
            sidebar ? "text-canvas-body" : "text-[19px]"
          }`}
        >
          {term}
        </dt>
        <dd className="artifact-def-gloss text-canvas-body leading-snug text-canvas-ink/80">
          {gloss}
        </dd>
        {example ? (
          <dd className="artifact-def-example border-l-2 border-canvas-secondary/40 pl-3 text-canvas-caption italic leading-snug text-canvas-muted">
            {example}
          </dd>
        ) : null}
        {speaker ? (
          <dd className="artifact-def-speaker text-canvas-caption text-canvas-muted opacity-70">
            {speaker}
          </dd>
        ) : null}
      </dl>
    </ArtifactContentStage>
  );
}
