"use client";

import { ArtifactPreviewPill } from "@/components/artifacts/ArtifactPreviewPill";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
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
  if (card.outputArtifactId) {
    const art = sessionArtifacts[card.outputArtifactId];
    if (!art) return null;
    const ver =
      (card.outputArtifactVersionId &&
        getVersionById(art, card.outputArtifactVersionId)) ||
      getLatestVersion(art);
    if (!ver) return null;
    const generating =
      card.status === "streaming" || card.status === "thinking";
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
        generating={generating && !card.outputArtifactVersionId}
      />
    );
  }

  if (card.artifactPayload && card.status !== "empty") {
    const kind = payloadToArtifactKind(card.artifactPayload);
    const title =
      kind === "code" && card.artifactPayload.type === "code"
        ? card.artifactPayload.data.files[0]?.path ?? card.artifactPayload.title
        : card.artifactPayload.title;
    const generating =
      card.status === "streaming" || card.status === "thinking";
    if (card.outputArtifactId) {
      const art = sessionArtifacts[card.outputArtifactId];
      if (art) {
        const ver = getLatestVersion(art);
        if (!ver) return null;
        return (
          <ArtifactPreviewPill
            kind={art.kind}
            title={artifactDisplayTitle(art, ver)}
            versionNumber={ver.number}
            artifactId={art.id}
            versionId={ver.id}
            generating={generating}
          />
        );
      }
    }
    return (
      <div className="pointer-events-none max-w-md opacity-90">
        <ArtifactPreviewPill
          kind={kind}
          title={title}
          versionNumber={1}
          artifactId=""
          generating
        />
      </div>
    );
  }

  if (
    card.images &&
    card.images.length > 0 &&
    (card.responseType === "image" || card.responseType === "images")
  ) {
    const generating =
      !card.outputArtifactId &&
      (card.status === "streaming" || card.status === "thinking");
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
            generating={generating}
          />
        );
      }
    }
    return (
      <div className="pointer-events-none max-w-md opacity-90">
        <ArtifactPreviewPill
          kind="images"
          title="Images"
          versionNumber={1}
          artifactId=""
          generating
        />
      </div>
    );
  }

  return null;
}
