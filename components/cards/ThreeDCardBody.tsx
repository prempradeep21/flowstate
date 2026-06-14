"use client";

import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { ArtifactMediaViewport } from "@/components/cards/ArtifactMediaViewport";
import { TextCardBody } from "@/components/cards/TextCardBody";
import { ThreeDModelViewer } from "@/components/artifacts/ThreeDModelViewer";
import type { Card } from "@/lib/store";

interface ThreeDCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function ThreeDCardBody({ card, isStreaming }: ThreeDCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "3d" ? card.artifactPayload : null;

  if (!payload) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  const { modelUrl, format = "glb" } = payload.data;

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="3d"
        title={payload.title}
        description={payload.description}
      >
        <ArtifactMediaViewport className="bg-canvas-stageDark">
          <ThreeDModelViewer
            modelUrl={modelUrl}
            format={format}
            interactive
            className="min-h-[200px]"
          />
          <span className="absolute bottom-2 right-2 rounded bg-black/50 px-1.5 py-0.5 text-canvas-micro uppercase text-white/70">
            {format}
          </span>
        </ArtifactMediaViewport>
      </ArtifactCardChrome>
    </div>
  );
}
