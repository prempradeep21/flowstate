"use client";

import { ArtifactPreviewPill } from "@/components/artifacts/ArtifactPreviewPill";
import { collectCardArtifactPreviewItems } from "@/lib/cardArtifactPreviewItems";
import { payloadToArtifactKind } from "@/lib/artifactTypes";
import { resolvePreviewVersionNumber } from "@/lib/sessionArtifacts";
import type { Card } from "@/lib/store";
import { useCanvasStore } from "@/lib/store";

export { collectCardArtifactPreviewItems } from "@/lib/cardArtifactPreviewItems";

export function CardArtifactPreview({ card }: { card: Card }) {
  const sessionArtifacts = useCanvasStore((s) => s.sessionArtifacts);
  const canvasArtifactNodes = useCanvasStore((s) => s.canvasArtifactNodes);
  const cards = useCanvasStore((s) => s.cards);
  const connections = useCanvasStore((s) => s.connections);
  const cardOrder = useCanvasStore((s) => s.cardOrder);
  const items = collectCardArtifactPreviewItems(
    card,
    sessionArtifacts,
    canvasArtifactNodes,
    cards,
    connections,
    cardOrder,
  );

  if (items.length === 0) {
    if (card.outputArtifactId) {
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
          versionNumber={resolvePreviewVersionNumber(
            card,
            sessionArtifacts,
            cards,
            connections,
            cardOrder,
          )}
          artifactId=""
          status="failed"
        />
      );
    }
    return null;
  }

  if (items.length === 1) {
    const item = items[0];
    return (
      <div
        className={
          item.status === "generating"
            ? "pointer-events-none max-w-md opacity-90"
            : "max-w-md"
        }
      >
        <ArtifactPreviewPill
          kind={item.kind}
          title={item.title}
          versionNumber={item.versionNumber}
          artifactId={item.artifactId}
          versionId={item.versionId}
          nodeId={item.nodeId}
          subtitle={item.subtitle}
          status={item.status}
        />
      </div>
    );
  }

  return (
    <div className="flex max-w-md flex-col gap-2">
      {items.map((item) => (
        <div
          key={item.key}
          className={
            item.status === "generating"
              ? "pointer-events-none opacity-90"
              : undefined
          }
        >
          <ArtifactPreviewPill
            kind={item.kind}
            title={item.title}
            versionNumber={item.versionNumber}
            artifactId={item.artifactId}
            versionId={item.versionId}
            nodeId={item.nodeId}
            subtitle={item.subtitle}
            status={item.status}
            compact
          />
        </div>
      ))}
    </div>
  );
}
