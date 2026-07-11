"use client";

import { ArtifactAttachmentPill } from "@/components/artifacts/ArtifactAttachmentPill";
import { SkillAttachmentPill } from "@/components/SkillAttachmentPill";
import { getQuestionAttachedImages } from "@/lib/questionAttachments";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
} from "@/lib/sessionArtifacts";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

export function QuestionAttachments({ card }: { card: Card }) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasAssets = useCanvasStore((s) => s.canvasAssets);
  const canvasSkills = useCanvasStore((s) => s.canvasSkills);

  const images = getQuestionAttachedImages(card);
  const hasArtifacts = (card.attachedArtifacts?.length ?? 0) > 0;
  const hasAssets = (card.attachedAssets?.length ?? 0) > 0;
  const hasSkills = (card.attachedSkills?.length ?? 0) > 0;
  const hasFiles = (card.pendingFiles?.length ?? 0) > 0;

  if (!images.length && !hasArtifacts && !hasAssets && !hasSkills && !hasFiles) {
    return null;
  }

  return (
    <div className="mb-3 flex min-w-0 flex-col gap-2">
      {card.attachedArtifacts?.map((ref) => {
        const art = sessionArtifacts[ref.artifactId];
        if (!art) return null;
        const ver =
          getVersionById(art, ref.versionId) ?? getLatestVersion(art);
        if (!ver) return null;
        return (
          <ArtifactAttachmentPill
            key={ref.artifactId}
            kind={art.kind}
            title={artifactDisplayTitle(art, ver)}
            versionNumber={ver.number}
          />
        );
      })}
      {card.attachedAssets?.map((ref) => {
        const asset = canvasAssets[ref.assetId];
        if (!asset) return null;
        return (
          <span
            key={ref.assetId}
            className="inline-flex max-w-full items-center self-start rounded-canvas border border-canvas-border px-2 py-1 text-canvas-caption text-canvas-muted"
          >
            <span className="truncate">{asset.name}</span>
          </span>
        );
      })}
      {card.attachedSkills?.map((ref) => {
        const skill = canvasSkills[ref.skillId];
        if (!skill) return null;
        return (
          <SkillAttachmentPill key={ref.skillId} title={skill.title} />
        );
      })}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((img, i) => (
            <a
              key={`${img.thumb}-${i}`}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              className="relative h-16 w-16 shrink-0 overflow-hidden rounded-canvas border border-canvas-border bg-black/[0.03]"
              onPointerDown={(e) => e.stopPropagation()}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.thumb}
                alt={img.alt || "Attached image"}
                className="h-full w-full object-cover"
              />
            </a>
          ))}
        </div>
      )}
      {card.pendingFiles?.map((file, i) => (
        <span
          key={`${file.name}-${i}`}
          className="inline-flex max-w-full items-center self-start rounded-canvas border border-canvas-border px-2 py-1 text-canvas-caption text-canvas-muted"
        >
          <span className="truncate">{file.name}</span>
        </span>
      ))}
    </div>
  );
}
