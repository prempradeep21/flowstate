"use client";

import { ArtifactPreviewPill } from "@/components/artifacts/ArtifactPreviewPill";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { resolveArtifactPreviewStatus } from "@/lib/materializeCardArtifact";
import {
  artifactDisplayTitle,
  getLatestVersion,
  getVersionById,
} from "@/lib/sessionArtifacts";
import { todoCompletionLabel } from "@/lib/todoArtifact";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

export function CardArtifactPreview({ card }: { card: Card }) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const previewStatus = resolveArtifactPreviewStatus(card);

  if (card.outputArtifactId) {
    const art = sessionArtifacts[card.outputArtifactId];
    if (!art) {
      const kind = card.artifactPayload
        ? payloadToArtifactKind(card.artifactPayload)
        : "custom";
      const title =
        card.artifactPayload?.title ??
        card.question.slice(0, 48) ??
        "Artifact";
      return (
        <ArtifactPreviewPill
          kind={kind}
          title={title}
          versionNumber={1}
          artifactId=""
          status="failed"
        />
      );
    }
    const ver =
      (card.outputArtifactVersionId &&
        getVersionById(art, card.outputArtifactVersionId)) ||
      getLatestVersion(art);
    if (!ver) return null;
    const todoSubtitle =
      art.kind === "todo" && ver.payload.type === "todo"
        ? todoCompletionLabel(ver.payload.data.items)
        : undefined;
    return (
      <ArtifactPreviewPill
        kind={art.kind}
        title={artifactDisplayTitle(art, ver)}
        versionNumber={ver.number}
        artifactId={art.id}
        versionId={ver.id}
        subtitle={
          todoSubtitle
            ? `Version ${ver.number} · ${todoSubtitle}`
            : undefined
        }
        status={previewStatus}
      />
    );
  }

  if (card.artifactPayload && card.status !== "empty") {
    const kind = payloadToArtifactKind(card.artifactPayload);
    const title =
      kind === "code" && card.artifactPayload.type === "code"
        ? card.artifactPayload.data.files[0]?.path ?? card.artifactPayload.title
        : card.artifactPayload.title;
    return (
      <div
        className={
          previewStatus === "generating" ? "pointer-events-none max-w-md opacity-90" : "max-w-md"
        }
      >
        <ArtifactPreviewPill
          kind={kind}
          title={title}
          versionNumber={1}
          artifactId=""
          status={previewStatus}
        />
      </div>
    );
  }

  if (
    card.images &&
    card.images.length > 0 &&
    (card.responseType === "image" || card.responseType === "images")
  ) {
    if (card.outputArtifactId) {
      const art = sessionArtifacts[card.outputArtifactId];
      if (art) {
        const ver = getLatestVersion(art);
        if (!ver) return null;
        return (
          <ArtifactPreviewPill
            kind="images"
            title={artifactDisplayTitle(art, ver)}
            versionNumber={ver.number}
            artifactId={art.id}
            versionId={ver.id}
            status={previewStatus}
          />
        );
      }
    }
    return (
      <div
        className={
          previewStatus === "generating" ? "pointer-events-none max-w-md opacity-90" : "max-w-md"
        }
      >
        <ArtifactPreviewPill
          kind="images"
          title="Images"
          versionNumber={1}
          artifactId=""
          status={previewStatus}
        />
      </div>
    );
  }

  return null;
}
