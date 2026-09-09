"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload, ClaimSide } from "@/lib/artifactTypes";

/**
 * Two sides of a disagreement, and deliberately nothing else. There is no
 * verdict field and no winner styling: who was right is a judgement the
 * transcript does not contain, so the card carries only what was said. The
 * two blocks are weighted identically for the same reason.
 */
function Side({
  side,
  role,
  accentClass,
  sidebar,
  kind,
}: {
  side: ClaimSide;
  role: string;
  accentClass: string;
  sidebar: boolean;
  kind: "proposition" | "counter";
}) {
  if (!side.text) return null;
  return (
    <div
      className={`artifact-claim-side flex-1 border-l-2 pl-3 ${accentClass}`}
      data-claim-side={kind}
    >
      <p className="artifact-claim-role mb-1 text-canvas-caption font-medium uppercase tracking-wide text-canvas-muted">
        {role}
      </p>
      <p
        className={`leading-snug text-canvas-ink ${
          sidebar ? "text-canvas-caption" : "text-canvas-body"
        }`}
      >
        {side.text}
      </p>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-2 text-canvas-caption text-canvas-muted">
        {side.speaker ? <span className="font-medium">{side.speaker}</span> : null}
        {side.timestamp ? (
          <span className="tabular-nums opacity-70">{side.timestamp}</span>
        ) : null}
      </p>
    </div>
  );
}

export function ClaimArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "claim" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { topic, proposition, counter } = payload.data;

  return (
    <ArtifactContentStage fill={fill} artifactId={artifactId}>
      <div className="artifact-claim flex h-full flex-col gap-3 px-5 py-4">
        {topic ? (
          <p className="artifact-claim-topic text-canvas-body font-medium leading-snug text-canvas-ink">
            {topic}
          </p>
        ) : null}
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <Side
            side={proposition}
            role="Proposed"
            accentClass="border-canvas-accent/60"
            sidebar={sidebar}
            kind="proposition"
          />
          <Side
            side={counter}
            role="Countered"
            accentClass="border-canvas-tertiary/60"
            sidebar={sidebar}
            kind="counter"
          />
        </div>
      </div>
    </ArtifactContentStage>
  );
}
