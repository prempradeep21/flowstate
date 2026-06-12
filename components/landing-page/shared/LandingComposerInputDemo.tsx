"use client";

import { ArtifactAttachmentPill } from "@/components/artifacts/ArtifactAttachmentPill";
import { SkillAttachmentPill } from "@/components/SkillAttachmentPill";
import type { LandingComposerInput } from "@/lib/landingComposerInputs";

function noop() {}

export function LandingComposerInputDemo({ input }: { input: LandingComposerInput }) {
  switch (input.demo) {
    case "image":
      return (
        <div className="flex gap-2 rounded-canvas border border-canvas-border bg-canvas-card px-3 py-2">
          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-canvas-xs bg-canvas-artifactStage">
            <div className="flex h-full w-full items-center justify-center bg-canvas-accent/10 text-canvas-micro text-canvas-muted">
              img
            </div>
          </div>
          <span className="self-center text-canvas-compact text-canvas-muted">
            {input.sampleImageAlt}
          </span>
        </div>
      );
    case "file":
    case "drive":
    case "asset":
      return (
        <span className="inline-flex max-w-full items-center rounded-canvas border border-canvas-border bg-canvas-bg px-2 py-1 text-canvas-compact text-canvas-ink">
          <span className="truncate">{input.sampleFileName}</span>
        </span>
      );
    case "artifact":
      return (
        <ArtifactAttachmentPill
          kind={input.artifactKind ?? "table"}
          title={input.sampleTitle ?? "Artifact"}
          versionNumber={2}
        />
      );
    case "skill":
      return (
        <SkillAttachmentPill title={input.sampleTitle ?? "Skill"} onRemove={noop} />
      );
    case "plug":
      return (
        <div className="flex items-center gap-2 text-canvas-compact text-canvas-muted">
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-canvas-accent" />
          <span>artifact</span>
          <span aria-hidden>→</span>
          <span className="rounded-canvas border border-canvas-border bg-canvas-card px-2 py-0.5 text-canvas-ink">
            your question
          </span>
        </div>
      );
    default:
      return null;
  }
}
