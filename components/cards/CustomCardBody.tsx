"use client";

import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { ArtifactMediaViewport } from "@/components/cards/ArtifactMediaViewport";
import { DynamicUiFrame } from "@/components/cards/custom/DynamicUiFrame";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface CustomCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function CustomCardBody({ card, isStreaming }: CustomCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "custom" ? card.artifactPayload : null;

  if (!payload) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="custom"
        title={payload.title}
        description={payload.description}
      >
        <ArtifactMediaViewport>
          <DynamicUiFrame data={payload.data} />
        </ArtifactMediaViewport>
      </ArtifactCardChrome>
    </div>
  );
}
