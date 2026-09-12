"use client";

import { ArtifactContentStage } from "@/components/artifacts/ArtifactContentStage";
import type { ArtifactPayload, MechanismStep } from "@/lib/artifactTypes";

/**
 * A described chain of cause. Rendered as a wrapping flow rather than a graph:
 * spoken mechanisms are almost always linear, and the few that branch read
 * better as an ordered chain with labelled links than as a node-edge diagram
 * nobody can follow at canvas zoom.
 */
export function MechanismArtifactContent({
  payload,
  fill = false,
  sidebar = false,
  artifactId,
}: {
  payload: Extract<ArtifactPayload, { type: "mechanism" }>;
  fill?: boolean;
  sidebar?: boolean;
  artifactId?: string;
}) {
  const { steps, edges } = payload.data;

  const labelBetween = (from: MechanismStep, to: MechanismStep) =>
    edges.find((edge) => edge.from === from.id && edge.to === to.id)?.label;

  return (
    <ArtifactContentStage fill={fill} artifactId={artifactId}>
      <div className="artifact-mech flex h-full flex-col justify-center px-5 py-4">
        <ol className="flex flex-wrap items-stretch gap-y-3">
          {steps.map((step, index) => {
            const next = steps[index + 1];
            const link = next ? labelBetween(step, next) : undefined;
            return (
              <li key={step.id} className="flex items-stretch">
                <div className="artifact-mech-step flex max-w-[190px] flex-col justify-center rounded-canvas-sm border border-canvas-border bg-canvas-artifactStage px-3 py-2">
                  <span
                    className={`font-medium leading-snug text-canvas-ink ${
                      sidebar ? "text-canvas-caption" : "text-canvas-body"
                    }`}
                  >
                    {step.label}
                  </span>
                  {step.note ? (
                    <span className="mt-0.5 text-canvas-caption leading-snug text-canvas-muted">
                      {step.note}
                    </span>
                  ) : null}
                </div>
                {/*
                 * The connector trails its step rather than leading the next one,
                 * so a wrap breaks *after* an arrow. Leading arrows would start a
                 * continuation row pointing at nothing.
                 */}
                {next ? (
                  <div
                    className="artifact-mech-arrow flex shrink-0 flex-col items-center justify-center px-2"
                    aria-label={link ? `leads to, ${link}` : "leads to"}
                  >
                    <span aria-hidden className="artifact-mech-glyph text-canvas-muted opacity-60">
                      →
                    </span>
                    {link ? (
                      <span className="artifact-mech-link max-w-[80px] text-center text-[10px] leading-tight text-canvas-muted">
                        {link}
                      </span>
                    ) : null}
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </ArtifactContentStage>
  );
}
