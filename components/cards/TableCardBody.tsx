"use client";

import { ArtifactCardChrome } from "@/components/cards/ArtifactCardChrome";
import { ArtifactTable } from "@/components/artifacts/ArtifactTable";
import { TextCardBody } from "@/components/cards/TextCardBody";
import type { Card } from "@/lib/store";

interface TableCardBodyProps {
  card: Card;
  isStreaming?: boolean;
}

export function TableCardBody({ card, isStreaming }: TableCardBodyProps) {
  const payload =
    card.artifactPayload?.type === "table" ? card.artifactPayload : null;

  if (!payload) {
    return <TextCardBody card={card} isStreaming={isStreaming} />;
  }

  const { columns, rows } = payload.data;

  return (
    <div className="flex flex-col gap-3">
      {card.answer.trim() && (
        <TextCardBody card={card} isStreaming={isStreaming} />
      )}
      <ArtifactCardChrome
        type="table"
        title={payload.title}
        description={payload.description}
      >
        <div className="overflow-hidden rounded-lg border border-canvas-border">
          <ArtifactTable columns={columns} rows={rows} />
        </div>
      </ArtifactCardChrome>
    </div>
  );
}
